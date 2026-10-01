import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@plus-minus/shared';
import { socketService } from '../services/socket';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';

export function useSocket(): Socket | null {
  const socketRef = useRef<Socket | null>(null);
  const { token } = useAuthStore();
  const {
    setConnected, setConnecting,
    setRoom, setRoomInfo, setGameState,
    setMyHand, setLegalCards, setEligibleSuits,
    addNotification, setPowerDeclarationComplete,
    reset,
  } = useGameStore();

  useEffect(() => {
    setConnecting(true);
    const socket = socketService.connect(token ?? undefined);
    socketRef.current = socket;

    // ── Connection ──
    socket.on(SOCKET_EVENTS.CONNECT, () => {
      setConnected(true);
      setConnecting(false);
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      setConnected(false);
    });

    socket.on('connect_error', () => {
      setConnecting(false);
      setConnected(false);
    });

    // ── Room Events ──
    socket.on(SOCKET_EVENTS.ROOM_CREATED, (data) => {
      setRoom(data.roomCode, data.playerId, data.roomInfo);
      addNotification({ message: `Room ${data.roomCode} created!`, type: 'success' });
      // Update browser URL so host refreshing stays in this room instead of re-creating!
      window.history.replaceState(null, '', `/room/join/${data.roomCode}`);
    });

    socket.on(SOCKET_EVENTS.ROOM_JOINED, (data) => {
      setRoom(data.roomCode, data.playerId, data.roomInfo);
      addNotification({ message: `Joined room ${data.roomCode}`, type: 'success' });
      window.history.replaceState(null, '', `/room/join/${data.roomCode}`);
    });

    socket.on(SOCKET_EVENTS.PLAYER_JOINED, (data) => {
      setRoomInfo(data.roomInfo);
      addNotification({ message: `${data.player.username} joined the room`, type: 'info' });
    });

    socket.on(SOCKET_EVENTS.PLAYER_LEFT, (data) => {
      setRoomInfo(data.roomInfo);
    });

    socket.on(SOCKET_EVENTS.PLAYER_READY, (data: { playerId: string; ready: boolean; roomInfo?: any }) => {
      if (data.roomInfo) {
        setRoomInfo(data.roomInfo);
      } else {
        useGameStore.setState((s) => {
          if (!s.roomInfo) return s;
          const updatedPlayers = s.roomInfo.players.map((p) =>
            p.id === data.playerId
              ? { ...p, status: data.ready ? ('READY' as const) : ('CONNECTED' as const) }
              : p,
          );
          return { roomInfo: { ...s.roomInfo, players: updatedPlayers } };
        });
      }
    });

    socket.on(SOCKET_EVENTS.SETTINGS_UPDATED, (data) => {
      useGameStore.setState((s) => ({
        roomInfo: s.roomInfo ? { ...s.roomInfo, settings: data.settings } : null,
      }));
    });

    // ── Game Events ──
    socket.on(SOCKET_EVENTS.GAME_STARTED, (data) => {
      setGameState(data.gameState);
      addNotification({ message: '🎮 Game started!', type: 'success', duration: 3000 });
    });

    socket.on(SOCKET_EVENTS.CARDS_DEALT, (data) => {
      setMyHand(data.yourHand);
      setGameState(data.gameState);
    });

    socket.on(SOCKET_EVENTS.POWER_DECLARATION_STARTED, (data) => {
      setEligibleSuits(data.eligibleSuits);
      setGameState(data.gameState);
      setPowerDeclarationComplete(false);
    });

    socket.on(SOCKET_EVENTS.POWER_DECLARED, (data) => {
      setGameState(data.gameState);
    });

    socket.on(SOCKET_EVENTS.POWER_PASSED, (data) => {
      setGameState(data.gameState);
      const player = data.gameState.players.find((p: any) => p.id === data.playerId);
      addNotification({ message: `${player?.username ?? 'Player'} passed on Power Color`, type: 'info' });
    });

    socket.on(SOCKET_EVENTS.POWER_TURN_CHANGED, (data) => {
      setGameState(data.gameState);
    });

    socket.on(SOCKET_EVENTS.POWER_DECLARATION_FINISHED, (data) => {
      setGameState(data.gameState);
      setPowerDeclarationComplete(true);
      const msg = data.wasDefault
        ? `⚠️ No declaration — default Power Color: ♠ SPADES`
        : `✨ Power Color: ${data.powerColor} declared!`;
      addNotification({ message: msg, type: 'info', duration: 5000 });
    });

    socket.on(SOCKET_EVENTS.REMAINING_CARDS_DEALT, (data) => {
      setMyHand(data.yourHand);
      setGameState(data.gameState);
    });

    socket.on(SOCKET_EVENTS.POINT_DECLARATION_STARTED, (data) => {
      setGameState(data.gameState);
    });

    socket.on(SOCKET_EVENTS.POINTS_DECLARED, (data) => {
      setGameState(data.gameState);
    });

    socket.on(SOCKET_EVENTS.TURN_CHANGED, (data) => {
      setGameState(data.gameState);
      setLegalCards([]);
    });

    socket.on(SOCKET_EVENTS.LEGAL_CARDS, (data) => {
      setLegalCards(data.legalCards);
    });

    socket.on(SOCKET_EVENTS.CARD_PLAYED, (data) => {
      setGameState(data.gameState);
      // Remove played card from local hand
      useGameStore.setState((s) => ({
        myHand: s.myHand.filter((c) => c.id !== data.card.id),
        selectedCardId: null,
      }));
    });

    socket.on(SOCKET_EVENTS.TRICK_COMPLETED, (data) => {
      setGameState(data.gameState);
      const state = useGameStore.getState();
      const winner = data.gameState.players.find(
        (p: { id: string }) => p.id === data.winnerId,
      );
      addNotification({
        message: `🏆 ${winner?.username ?? 'Unknown'} won the trick!`,
        type: 'info',
        duration: 3000,
      });
    });

    socket.on(SOCKET_EVENTS.ROUND_COMPLETED, (data) => {
      setGameState(data.gameState);
      addNotification({ message: '📊 Round complete! Check the scoreboard.', type: 'success', duration: 5000 });
    });

    socket.on(SOCKET_EVENTS.GAME_COMPLETED, (data) => {
      setGameState(data.gameState);
      addNotification({
        message: `🎉 Game over! ${data.winner.username} wins!`,
        type: 'success',
        duration: 10000,
      });
    });

    socket.on(SOCKET_EVENTS.PLAYER_DISCONNECTED, (data) => {
      setGameState(data.gameState);
      const player = data.gameState.players.find(
        (p: { id: string }) => p.id === data.playerId,
      );
      addNotification({
        message: `⚠️ ${player?.username ?? 'A player'} disconnected`,
        type: 'warning',
      });
    });

    socket.on(SOCKET_EVENTS.PLAYER_RECONNECTED, (data) => {
      setGameState(data.gameState);
      const player = data.gameState.players.find(
        (p: { id: string }) => p.id === data.playerId,
      );
      addNotification({
        message: `✅ ${player?.username ?? 'A player'} reconnected`,
        type: 'success',
      });
    });

    socket.on(SOCKET_EVENTS.ERROR, (data) => {
      addNotification({ message: `❌ ${data.message}`, type: 'error', duration: 5000 });
    });

    return () => {
      socket.removeAllListeners();
    };
  }, [token]);

  return socketRef.current;
}
