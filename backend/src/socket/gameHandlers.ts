import { Server as SocketServer, Socket } from 'socket.io';
import { z } from 'zod';
import {
  SOCKET_EVENTS,
  GameSettings,
  Suit,
  C2S_CreateRoom,
  C2S_JoinRoom,
  C2S_DeclarePower,
  C2S_DeclarePoints,
  C2S_PlayCard,
  C2S_UpdateSettings,
  C2S_Reconnect,
  S2C_CardsDealt,
  S2C_PowerDeclarationStarted,
  S2C_TurnChanged,
} from '@plus-minus/shared';
import {
  createRoom,
  joinRoom,
  getRoom,
  reconnectPlayer,
  handlePlayerDisconnect,
  destroyRoom,
  buildPublicGameState,
  buildRoomInfo,
} from '../services/RoomService';
import { verifyToken } from '../services/AuthService';
import { logger } from '../config/logger';
import { config } from '../config';

// Zod validation schemas
const CreateRoomSchema = z.object({
  username: z.string().min(2).max(20),
  settings: z.object({
    targetScore: z.number().int().min(1).optional(),
    numberOfPlayers: z.literal(4).optional(),
  }).optional(),
});

const JoinRoomSchema = z.object({
  roomCode: z.string().length(6).toUpperCase(),
  username: z.string().min(2).max(20),
  playerId: z.string().optional(),
});

const DeclarePowerSchema = z.object({
  suit: z.enum(['SPADES', 'HEARTS', 'DIAMONDS', 'CLUBS']),
});

const DeclarePointsSchema = z.object({
  points: z.number().int().min(0).max(13),
});

const PlayCardSchema = z.object({
  cardId: z.string().min(1).max(20),
});

const UpdateSettingsSchema = z.object({
  settings: z.object({
    targetScore: z.number().int().min(1).optional(),
  }),
});

// Socket session data
interface SocketData {
  playerId: string;
  username: string;
  roomCode: string | null;
}

// Power declaration phase timeout handles
const powerDeclarationTimers = new Map<string, NodeJS.Timeout>();
// Round completion countdown auto-start handles
const roundCompletionTimers = new Map<string, NodeJS.Timeout>();

export function registerSocketHandlers(io: SocketServer): void {
  io.on('connection', (socket: Socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    const session: SocketData = {
      playerId: '',
      username: '',
      roomCode: null,
    };

    // ────────────────────────────────────────────────────────
    // AUTHENTICATE
    // ────────────────────────────────────────────────────────
    function extractUser(): { userId: string; username: string } | null {
      const token = socket.handshake.auth?.token;
      if (!token) return null;
      try {
        const payload = verifyToken(token);
        return { userId: payload.userId, username: payload.username };
      } catch {
        return null;
      }
    }

    function emitError(code: string, message: string): void {
      socket.emit(SOCKET_EVENTS.ERROR, { code, message });
    }

    function validate<T>(schema: z.ZodSchema<T>, data: unknown): T | null {
      const result = schema.safeParse(data);
      if (!result.success) {
        emitError('VALIDATION_ERROR', result.error.issues.map((i) => i.message).join(', '));
        return null;
      }
      return result.data;
    }

    // ────────────────────────────────────────────────────────
    // CREATE ROOM
    // ────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.CREATE_ROOM, (data: C2S_CreateRoom) => {
      try {
        const validated = validate(CreateRoomSchema, data);
        if (!validated) return;

        const user = extractUser();
        const playerId = user?.userId ?? `guest_${socket.id}`;
        const username = user?.username ?? validated.username;

        session.playerId = playerId;
        session.username = username;

        const { roomCode, engine } = createRoom(
          playerId,
          username,
          socket.id,
          validated.settings as Partial<GameSettings>,
        );

        session.roomCode = roomCode;
        socket.join(roomCode);

        const roomInfo = buildRoomInfo(engine);
        socket.emit(SOCKET_EVENTS.ROOM_CREATED, {
          roomCode,
          playerId,
          roomInfo,
        });

        logger.info(`Room ${roomCode} created by ${username}`);
      } catch (error: any) {
        emitError('CREATE_ROOM_ERROR', error.message);
      }
    });

    // ────────────────────────────────────────────────────────
    // JOIN ROOM
    // ────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (data: C2S_JoinRoom) => {
      try {
        const validated = validate(JoinRoomSchema, data);
        if (!validated) return;

        const user = extractUser();
        const playerId = user?.userId ?? validated.playerId ?? `guest_${socket.id}`;
        const username = user?.username ?? validated.username;

        session.playerId = playerId;
        session.username = username;

        const roomCode = validated.roomCode.toUpperCase();
        const engine = joinRoom(roomCode, playerId, username, socket.id);
        session.roomCode = roomCode;

        socket.join(roomCode);

        const roomInfo = buildRoomInfo(engine);
        const publicState = buildPublicGameState(engine);
        const playerState = engine.getPlayerState(playerId);

        socket.emit(SOCKET_EVENTS.ROOM_JOINED, { roomCode, playerId, roomInfo });
        socket.to(roomCode).emit(SOCKET_EVENTS.PLAYER_JOINED, {
          player: engine.getPublicPlayerInfo().find((p) => p.id === playerId),
          roomInfo,
        });

        // If game is already in progress, send the re-joining player full game state
        if (publicState.phase !== 'WAITING_FOR_PLAYERS') {
          socket.emit(SOCKET_EVENTS.GAME_STARTED, { gameState: publicState });
          if (playerState?.hand && playerState.hand.length > 0) {
            socket.emit(
              playerState.hand.length > 5
                ? SOCKET_EVENTS.REMAINING_CARDS_DEALT
                : SOCKET_EVENTS.CARDS_DEALT,
              {
                yourHand: playerState.hand,
                gameState: publicState,
              },
            );
          }
          if (publicState.phase === 'POWER_DECLARATION') {
            const eligibilities = engine.getPlayerEligibilities(playerId);
            socket.emit(SOCKET_EVENTS.POWER_DECLARATION_STARTED, {
              eligibleSuits: eligibilities,
              deadline: publicState.declarationDeadline,
              gameState: publicState,
            });
          }
          if (publicState.phase === 'PLAYING' && publicState.currentPlayerId === playerId) {
            const legalCards = engine.getLegalCardsForPlayer(playerId);
            socket.emit(SOCKET_EVENTS.LEGAL_CARDS, { legalCards });
          }
        }

        logger.info(`${username} joined/reconnected to room ${roomCode}`);
      } catch (error: any) {
        emitError('JOIN_ROOM_ERROR', error.message);
      }
    });

    // ────────────────────────────────────────────────────────
    // SET READY
    // ────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.SET_READY, (data: { ready: boolean; roomCode?: string; playerId?: string }) => {
      try {
        const roomCode = session.roomCode || data?.roomCode;
        const playerId = session.playerId || data?.playerId;

        if (!roomCode) return emitError('NO_ROOM', 'Not in a room');
        const engine = getRoom(roomCode);
        if (!engine) return emitError('ROOM_NOT_FOUND', 'Room not found');

        session.roomCode = roomCode;
        if (playerId) session.playerId = playerId;

        const targetPlayerId = session.playerId;
        if (!targetPlayerId) return emitError('NO_PLAYER', 'Player ID not resolved');

        const readyState = typeof data?.ready === 'boolean' ? data.ready : true;
        engine.setPlayerReady(targetPlayerId, readyState);
        const roomInfo = buildRoomInfo(engine);

        io.to(roomCode).emit(SOCKET_EVENTS.PLAYER_READY, {
          playerId: targetPlayerId,
          ready: readyState,
          roomInfo,
        });

        logger.info(`Player ${targetPlayerId} in room ${roomCode} set ready: ${readyState}`);
      } catch (error: any) {
        logger.error(`SET_READY error: ${error.message}`);
        emitError('SET_READY_ERROR', error.message);
      }
    });

    // ────────────────────────────────────────────────────────
    // UPDATE SETTINGS (host only)
    // ────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.UPDATE_SETTINGS, (data: C2S_UpdateSettings) => {
      try {
        const validated = validate(UpdateSettingsSchema, data);
        if (!validated) return;
        if (!session.roomCode) return emitError('NO_ROOM', 'Not in a room');

        const engine = getRoom(session.roomCode);
        if (!engine) return emitError('ROOM_NOT_FOUND', 'Room not found');

        const state = engine.getState();
        const hostPlayer = Array.from(state.players.values()).find((p) => p.isHost);
        if (hostPlayer?.id !== session.playerId) {
          return emitError('NOT_HOST', 'Only the host can change settings');
        }

        engine.updateSettings(validated.settings as Partial<GameSettings>);
        const settings = engine.getState().settings;

        io.to(session.roomCode).emit(SOCKET_EVENTS.SETTINGS_UPDATED, { settings });
      } catch (error: any) {
        emitError('SETTINGS_ERROR', error.message);
      }
    });

    // ────────────────────────────────────────────────────────
    // START GAME (host only)
    // ────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.START_GAME, () => {
      try {
        if (!session.roomCode) return emitError('NO_ROOM', 'Not in a room');
        const engine = getRoom(session.roomCode);
        if (!engine) return emitError('ROOM_NOT_FOUND', 'Room not found');

        const state = engine.getState();
        const hostPlayer = Array.from(state.players.values()).find((p) => p.isHost);
        if (hostPlayer?.id !== session.playerId) {
          return emitError('NOT_HOST', 'Only the host can start the game');
        }

        if (engine.getPhase() === 'WAITING_FOR_PLAYERS') {
          engine.startGame();

          const publicState = buildPublicGameState(engine);
          io.to(session.roomCode).emit(SOCKET_EVENTS.GAME_STARTED, { gameState: publicState });

          // Send each player their private hand
          sendPrivateHands(io, engine, session.roomCode, 'initial');

          // Start power declaration phase
          startPowerDeclarationPhase(io, engine, session.roomCode);
        } else if (engine.getPhase() === 'ROUND_COMPLETE' || engine.getPhase() === 'GAME_COMPLETE') {
          advanceToNextRoundOrGame(io, session.roomCode);
        }

      } catch (error: any) {
        emitError('START_GAME_ERROR', error.message);
      }
    });

    // ────────────────────────────────────────────────────────
    // START NEXT ROUND (host only or skip timer)
    // ────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.START_NEXT_ROUND, () => {
      try {
        if (!session.roomCode) return emitError('NO_ROOM', 'Not in a room');
        const engine = getRoom(session.roomCode);
        if (!engine) return emitError('ROOM_NOT_FOUND', 'Room not found');

        const state = engine.getState();
        const hostPlayer = Array.from(state.players.values()).find((p) => p.isHost);
        if (hostPlayer?.id !== session.playerId) {
          return emitError('NOT_HOST', 'Only the host can start the next round');
        }

        advanceToNextRoundOrGame(io, session.roomCode);
      } catch (error: any) {
        emitError('START_NEXT_ROUND_ERROR', error.message);
      }
    });

    // ────────────────────────────────────────────────────────
    // DECLARE POWER COLOR
    // ────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.DECLARE_POWER, (data: C2S_DeclarePower) => {
      try {
        const validated = validate(DeclarePowerSchema, data);
        if (!validated) return;
        if (!session.roomCode) return emitError('NO_ROOM', 'Not in a room');

        const engine = getRoom(session.roomCode);
        if (!engine) return emitError('ROOM_NOT_FOUND', 'Room not found');

        const declaration = engine.declarePower(session.playerId, validated.suit as Suit);
        const publicState = buildPublicGameState(engine);

        io.to(session.roomCode).emit(SOCKET_EVENTS.POWER_DECLARED, {
          declaration: { playerId: session.playerId, suit: validated.suit },
          gameState: publicState,
        });

        // Power is declared! Finalize immediately and deal remaining cards
        finalizePowerDeclaration(io, engine, session.roomCode);

      } catch (error: any) {
        emitError('DECLARE_POWER_ERROR', error.message);
      }
    });

    // ────────────────────────────────────────────────────────
    // PASS POWER COLOR
    // ────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.PASS_POWER, () => {
      try {
        if (!session.roomCode) return emitError('NO_ROOM', 'Not in a room');
        const engine = getRoom(session.roomCode);
        if (!engine) return emitError('ROOM_NOT_FOUND', 'Room not found');

        const result = engine.passPower(session.playerId);
        const publicState = buildPublicGameState(engine);

        if (result.allPassed) {
          // All 4 players passed on power color — default to Spades and deal remaining cards
          finalizePowerDeclaration(io, engine, session.roomCode);
        } else {
          io.to(session.roomCode).emit(SOCKET_EVENTS.POWER_PASSED, {
            playerId: session.playerId,
            nextPlayerId: result.nextPlayerId,
            gameState: publicState,
          });
          io.to(session.roomCode).emit(SOCKET_EVENTS.POWER_TURN_CHANGED, {
            currentPowerTurnPlayerId: result.nextPlayerId!,
            gameState: publicState,
          });
        }
      } catch (error: any) {
        emitError('PASS_POWER_ERROR', error.message);
      }
    });

    // ────────────────────────────────────────────────────────
    // DECLARE POINTS
    // ────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.DECLARE_POINTS, (data: C2S_DeclarePoints) => {
      try {
        const validated = validate(DeclarePointsSchema, data);
        if (!validated) return;
        if (!session.roomCode) return emitError('NO_ROOM', 'Not in a room');

        const engine = getRoom(session.roomCode);
        if (!engine) return emitError('ROOM_NOT_FOUND', 'Room not found');

        const bid = engine.declarePoints(session.playerId, validated.points);
        const publicState = buildPublicGameState(engine);

        io.to(session.roomCode).emit(SOCKET_EVENTS.POINTS_DECLARED, {
          playerId: session.playerId,
          points: validated.points,
          gameState: publicState,
        });

        // If game moved to PLAYING phase, emit turn changed
        if (engine.getPhase() === 'PLAYING') {
          emitTurnChanged(io, engine, session.roomCode);
        }

      } catch (error: any) {
        emitError('DECLARE_POINTS_ERROR', error.message);
      }
    });

    // ────────────────────────────────────────────────────────
    // PLAY CARD
    // ────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.PLAY_CARD, (data: C2S_PlayCard) => {
      try {
        const validated = validate(PlayCardSchema, data);
        if (!validated) return;
        if (!session.roomCode) return emitError('NO_ROOM', 'Not in a room');

        const engine = getRoom(session.roomCode);
        if (!engine) return emitError('ROOM_NOT_FOUND', 'Room not found');

        const { trick, trickComplete } = engine.playCard(session.playerId, validated.cardId);
        const publicState = buildPublicGameState(engine);

        io.to(session.roomCode).emit(SOCKET_EVENTS.CARD_PLAYED, {
          playerId: session.playerId,
          card: trick.cards.find((c) => c.playerId === session.playerId)!.card,
          gameState: publicState,
        });

        if (trickComplete) {
          io.to(session.roomCode).emit(SOCKET_EVENTS.TRICK_COMPLETED, {
            trick,
            winnerId: trick.winnerId,
            gameState: publicState,
          });

          const phase = engine.getPhase();

          if (phase === 'ROUND_COMPLETE') {
            const nextStartsAt = Date.now() + 10000;
            engine.getState().nextPhaseDeadline = nextStartsAt;
            const updatedPublicState = buildPublicGameState(engine);
            io.to(session.roomCode).emit(SOCKET_EVENTS.ROUND_COMPLETED, {
              results: engine.getState().roundResults[engine.getState().roundResults.length - 1],
              gameState: updatedPublicState,
              nextRoundStartsIn: 10,
              nextRoundStartsAt: nextStartsAt,
            });

            scheduleNextRoundOrGame(io, session.roomCode, 10000);
          } else if (phase === 'GAME_COMPLETE') {
            const finalState = engine.getState();
            const nextStartsAt = Date.now() + 10000;
            finalState.nextPhaseDeadline = nextStartsAt;
            const updatedPublicState = buildPublicGameState(engine);
            const players = engine.getPublicPlayerInfo();
            const winner = players.reduce((a, b) => a.totalScore > b.totalScore ? a : b);
            io.to(session.roomCode).emit(SOCKET_EVENTS.GAME_COMPLETED, {
              winner,
              finalScores: finalState.roundResults.flatMap((r) => r.scores),
              gameState: updatedPublicState,
              nextGameStartsIn: 10,
              nextGameStartsAt: nextStartsAt,
            });

            scheduleNextRoundOrGame(io, session.roomCode, 10000);
          } else if (phase === 'PLAYING') {
            // Next trick
            emitTurnChanged(io, engine, session.roomCode);
          }
        } else {
          // Advance turn
          emitTurnChanged(io, engine, session.roomCode);
        }

      } catch (error: any) {
        emitError('PLAY_CARD_ERROR', error.message);
      }
    });

    // ────────────────────────────────────────────────────────
    // RECONNECT
    // ────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.RECONNECT_GAME, (data: C2S_Reconnect) => {
      try {
        if (!data.roomCode || !data.playerId) {
          return emitError('RECONNECT_ERROR', 'Missing room code or player ID');
        }

        const roomCode = data.roomCode.toUpperCase();
        const engine = reconnectPlayer(roomCode, data.playerId, socket.id);

        if (!engine) {
          return emitError('RECONNECT_ERROR', 'Could not reconnect: room or player not found');
        }

        session.playerId = data.playerId;
        session.roomCode = roomCode;
        const playerState = engine.getPlayerState(data.playerId);
        session.username = playerState?.username ?? '';

        socket.join(roomCode);

        const publicState = buildPublicGameState(engine);
        const playerInfo = engine.getPlayerState(data.playerId);

        const roomInfo = buildRoomInfo(engine);

        // Always emit ROOM_JOINED so lobby / room state is refreshed
        socket.emit(SOCKET_EVENTS.ROOM_JOINED, { roomCode, playerId: data.playerId, roomInfo });

        if (publicState.phase !== 'WAITING_FOR_PLAYERS') {
          socket.emit(SOCKET_EVENTS.GAME_STARTED, { gameState: publicState });

          // Send reconnected player their private state
          const cardsEvent = (playerInfo?.hand.length ?? 0) > 5
            ? SOCKET_EVENTS.REMAINING_CARDS_DEALT
            : SOCKET_EVENTS.CARDS_DEALT;

          socket.emit(cardsEvent, {
            yourHand: playerInfo?.hand ?? [],
            gameState: publicState,
          });

          if (publicState.phase === 'POWER_DECLARATION') {
            const eligibilities = engine.getPlayerEligibilities(data.playerId);
            socket.emit(SOCKET_EVENTS.POWER_DECLARATION_STARTED, {
              eligibleSuits: eligibilities,
              deadline: publicState.declarationDeadline,
              gameState: publicState,
            });
          }

          // If it's their turn, send legal cards
          if (engine.getState().currentPlayerId === data.playerId) {
            const legalCards = engine.getLegalCardsForPlayer(data.playerId);
            socket.emit(SOCKET_EVENTS.LEGAL_CARDS, { legalCards });
          }
        }

        // Notify others
        socket.to(roomCode).emit(SOCKET_EVENTS.PLAYER_RECONNECTED, {
          playerId: data.playerId,
          gameState: publicState,
        });

      } catch (error: any) {
        emitError('RECONNECT_ERROR', error.message);
      }
    });

    // ────────────────────────────────────────────────────────
    // LEAVE ROOM
    // ────────────────────────────────────────────────────────
    socket.on(SOCKET_EVENTS.LEAVE_ROOM, () => {
      handleLeave(socket, io, session);
    });

    // ────────────────────────────────────────────────────────
    // DISCONNECT
    // ────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
      if (session.roomCode && session.playerId) {
        handlePlayerDisconnect(session.roomCode, session.playerId);

        const engine = getRoom(session.roomCode);
        if (engine) {
          const publicState = buildPublicGameState(engine);
          socket.to(session.roomCode).emit(SOCKET_EVENTS.PLAYER_DISCONNECTED, {
            playerId: session.playerId,
            gameState: publicState,
          });

          // If room is now empty, schedule cleanup
          if (engine.getConnectedPlayerCount() === 0) {
            scheduleRoomCleanup(session.roomCode);
          }
        }
      }
    });
  });
}

// ──────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────

/**
 * Sends each player their private hand over their individual socket.
 */
function sendPrivateHands(
  io: SocketServer,
  engine: ReturnType<typeof getRoom>,
  roomCode: string,
  type: 'initial' | 'remaining',
): void {
  if (!engine) return;
  const state = engine.getState();
  const publicState = buildPublicGameState(engine);

  for (const [playerId, player] of state.players) {
    const eventName =
      type === 'initial' ? SOCKET_EVENTS.CARDS_DEALT : SOCKET_EVENTS.REMAINING_CARDS_DEALT;

    // Find the socket for this player
    const playerSockets = io.sockets.sockets;
    const playerSocket = Array.from(playerSockets.values()).find(
      (s) => s.id === player.socketId,
    );

    if (playerSocket) {
      playerSocket.emit(eventName, {
        yourHand: player.hand,
        gameState: publicState,
      });
    }
  }
}

/**
 * Starts the power declaration phase — sends eligibilities to each player
 * and sets a server-side timeout to finalize if nobody declares.
 */
function startPowerDeclarationPhase(
  io: SocketServer,
  engine: ReturnType<typeof getRoom>,
  roomCode: string,
): void {
  if (!engine) return;
  const state = engine.getState();
  const publicState = buildPublicGameState(engine);

  // Send each player their eligibilities privately
  for (const [playerId, player] of state.players) {
    const eligibilities = engine.getPlayerEligibilities(playerId);
    const playerSocket = Array.from(io.sockets.sockets.values()).find(
      (s) => s.id === player.socketId,
    );
    if (playerSocket) {
      playerSocket.emit(SOCKET_EVENTS.POWER_DECLARATION_STARTED, {
        eligibleSuits: eligibilities,
        deadline: state.declarationDeadline,
        gameState: publicState,
      });
    }
  }

  // Set server-side timeout
  const timeout = setTimeout(() => {
    const currentEngine = getRoom(roomCode);
    if (!currentEngine || currentEngine.getPhase() !== 'POWER_DECLARATION') return;

    finalizePowerDeclaration(io, currentEngine, roomCode);
  }, config.powerDeclarationTimeoutMs);

  powerDeclarationTimers.set(roomCode, timeout);
}

/**
 * Finalizes power declaration (called either by timeout or when all players have declared).
 */
function finalizePowerDeclaration(
  io: SocketServer,
  engine: ReturnType<typeof getRoom>,
  roomCode: string,
): void {
  if (!engine) return;
  if (engine.getPhase() !== 'POWER_DECLARATION') return;

  // Clear timeout
  const timer = powerDeclarationTimers.get(roomCode);
  if (timer) {
    clearTimeout(timer);
    powerDeclarationTimers.delete(roomCode);
  }

  try {
    const { powerColor, wasDefault } = engine.finalizePowerDeclaration();
    const publicState = buildPublicGameState(engine);

    io.to(roomCode).emit(SOCKET_EVENTS.POWER_DECLARATION_FINISHED, {
      powerColor,
      declaredBy: engine.getState().powerDeclaredBy,
      wasDefault,
      gameState: publicState,
    });

    // Send remaining cards to each player
    sendPrivateHands(io, engine, roomCode, 'remaining');

    // Emit point declaration started
    const newPublicState = buildPublicGameState(engine);
    io.to(roomCode).emit(SOCKET_EVENTS.POINT_DECLARATION_STARTED, {
      deadline: engine.getState().bidDeadline,
      gameState: newPublicState,
    });

  } catch (error: any) {
    logger.error('Error finalizing power declaration', { error: error.message });
  }
}

/**
 * Emits TURN_CHANGED to all in room, plus LEGAL_CARDS privately to the active player.
 */
function emitTurnChanged(
  io: SocketServer,
  engine: ReturnType<typeof getRoom>,
  roomCode: string,
): void {
  if (!engine) return;
  const state = engine.getState();
  const currentPlayerId = state.currentPlayerId;
  if (!currentPlayerId) return;

  const publicState = buildPublicGameState(engine);
  const legalCards = engine.getLegalCardsForPlayer(currentPlayerId);

  // Broadcast turn change (no legal cards in public broadcast)
  io.to(roomCode).emit(SOCKET_EVENTS.TURN_CHANGED, {
    currentPlayerId,
    legalCards: [], // empty — private
    gameState: publicState,
  });

  // Send legal cards privately to the active player
  const currentPlayer = state.players.get(currentPlayerId);
  if (currentPlayer) {
    const playerSocket = Array.from(io.sockets.sockets.values()).find(
      (s) => s.id === currentPlayer.socketId,
    );
    if (playerSocket) {
      playerSocket.emit(SOCKET_EVENTS.LEGAL_CARDS, { legalCards });
    }
  }
}

function handleLeave(
  socket: Socket,
  io: SocketServer,
  session: { playerId: string; username: string; roomCode: string | null },
): void {
  if (!session.roomCode) return;
  const engine = getRoom(session.roomCode);
  if (!engine) return;

  const phase = engine.getPhase();

  // In lobby — can fully remove
  if (phase === 'WAITING_FOR_PLAYERS') {
    engine.removePlayer(session.playerId);
    const roomInfo = buildRoomInfo(engine);
    socket.to(session.roomCode).emit(SOCKET_EVENTS.PLAYER_LEFT, {
      playerId: session.playerId,
      roomInfo,
    });
    socket.leave(session.roomCode);

    if (engine.getConnectedPlayerCount() === 0) {
      scheduleRoomCleanup(session.roomCode);
    }
  } else {
    // In game — just mark as disconnected
    handlePlayerDisconnect(session.roomCode, session.playerId);
    const publicState = buildPublicGameState(engine);
    socket.to(session.roomCode).emit(SOCKET_EVENTS.PLAYER_DISCONNECTED, {
      playerId: session.playerId,
      gameState: publicState,
    });
    socket.leave(session.roomCode);
  }

  session.roomCode = null;
}

function scheduleRoomCleanup(roomCode: string): void {
  setTimeout(() => {
    const engine = getRoom(roomCode);
    if (engine && engine.getConnectedPlayerCount() === 0) {
      const existingTimer = roundCompletionTimers.get(roomCode);
      if (existingTimer) {
        clearTimeout(existingTimer);
        roundCompletionTimers.delete(roomCode);
      }
      destroyRoom(roomCode);
      logger.info(`Room ${roomCode} cleaned up after inactivity`);
    }
  }, 5 * 60 * 1000); // 5 minutes grace period for reconnections
}

/**
 * Schedules automatic start of next round or game after delay (default: 10 seconds).
 */
function scheduleNextRoundOrGame(io: SocketServer, roomCode: string, delayMs = 10000): void {
  const existingTimer = roundCompletionTimers.get(roomCode);
  if (existingTimer) {
    clearTimeout(existingTimer);
    roundCompletionTimers.delete(roomCode);
  }

  logger.info(`[${roomCode}] Auto-start scheduled in ${delayMs / 1000}s`);

  const timer = setTimeout(() => {
    roundCompletionTimers.delete(roomCode);
    advanceToNextRoundOrGame(io, roomCode);
  }, delayMs);

  roundCompletionTimers.set(roomCode, timer);
}

/**
 * Advances the room to the next round or starts the next game immediately.
 */
function advanceToNextRoundOrGame(io: SocketServer, roomCode: string): void {
  const existingTimer = roundCompletionTimers.get(roomCode);
  if (existingTimer) {
    clearTimeout(existingTimer);
    roundCompletionTimers.delete(roomCode);
  }

  const engine = getRoom(roomCode);
  if (!engine) return;

  const phase = engine.getPhase();
  logger.info(`[${roomCode}] Advancing from phase ${phase} to next round/game`);

  if (phase === 'ROUND_COMPLETE') {
    engine.startNextRound();
  } else if (phase === 'GAME_COMPLETE') {
    engine.startNextGame();
  } else {
    return;
  }

  const publicState = buildPublicGameState(engine);
  io.to(roomCode).emit(SOCKET_EVENTS.GAME_STARTED, { gameState: publicState });

  // Send each player their private hand (5 initial cards)
  sendPrivateHands(io, engine, roomCode, 'initial');

  // Start power declaration phase
  startPowerDeclarationPhase(io, engine, roomCode);
}
