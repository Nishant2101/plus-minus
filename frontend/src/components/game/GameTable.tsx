import React from 'react';
import { PublicGameState, PublicPlayerInfo } from '@plus-minus/shared';
import { PlayingCard } from '../ui/PlayingCard';
import { suitSymbol, isRedSuit } from '../../utils/cardUtils';
import clsx from 'clsx';

interface PlayerSeatProps {
  player: PublicPlayerInfo;
  gameState: PublicGameState;
  position: 'top' | 'left' | 'right' | 'bottom';
  isCurrentTurn: boolean;
  isMe: boolean;
}

const PlayerSeat: React.FC<PlayerSeatProps> = ({
  player,
  gameState,
  position,
  isCurrentTurn,
  isMe,
}) => {
  // Cards played in current trick by this player
  const myTrickCard = gameState.currentTrick?.cards.find(
    (c) => c.playerId === player.id,
  );

  const bid = gameState.bids.find((b) => b.playerId === player.id);

  const avatarColors = [
    'from-purple-600 to-indigo-600',
    'from-orange-600 to-red-600',
    'from-cyan-600 to-teal-600',
    'from-pink-600 to-rose-600',
  ];
  const avatarColor = avatarColors[player.seatPosition % avatarColors.length];

  const isVertical = position === 'top' || position === 'bottom';

  return (
    <div className={clsx(
      'flex items-center gap-3',
      isVertical ? 'flex-col' : 'flex-row',
      position === 'right' && 'flex-row-reverse',
    )}>
      {/* Avatar + name */}
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <div className={clsx(
          'relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg',
          `bg-gradient-to-br ${avatarColor}`,
          'border-2 transition-all duration-300',
          isCurrentTurn
            ? 'border-pm-green-400 shadow-lg shadow-pm-green-500/30 scale-110'
            : isMe
            ? 'border-pm-green-700'
            : 'border-white/20',
        )}>
          {player.username.charAt(0).toUpperCase()}
          {isCurrentTurn && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pm-green-500 border-2 border-pm-dark-800 animate-pulse" />
          )}
          {player.status === 'DISCONNECTED' && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
              <span className="text-xs">⚡</span>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className={clsx(
            'text-xs font-semibold',
            isMe ? 'text-pm-green-300' : 'text-white/80',
          )}>
            {player.username}
            {isMe && <span className="text-white/30 ml-1">(you)</span>}
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-0.5">
            <span className="text-white/40 text-xs">{player.cardCount}🃏</span>
            {bid && (
              <span className="text-white/40 text-xs">bid:{bid.declaredPoints}</span>
            )}
            <span className={clsx(
              'text-xs font-bold',
              player.totalScore > 0 ? 'text-pm-green-400' :
              player.totalScore < 0 ? 'text-red-400' : 'text-white/50',
            )}>
              {player.totalScore > 0 ? '+' : ''}{player.totalScore}
            </span>
          </div>
        </div>
      </div>

      {/* Card played in this trick */}
      {myTrickCard && (
        <div className={clsx(
          'transition-all duration-300',
          position === 'top' && 'mt-2',
          position === 'bottom' && 'mb-2',
        )}>
          <PlayingCard
            card={myTrickCard.card}
            size="sm"
            isPlayed
          />
        </div>
      )}

      {/* Face-down card stack (if no card played yet and in game) */}
      {!myTrickCard &&
        (gameState.phase === 'PLAYING' || gameState.phase === 'TRICK_COMPLETE') &&
        player.cardCount > 0 && !isMe && (
        <div className="relative">
          {/* Stack effect */}
          {player.cardCount > 2 && (
            <div className="absolute top-0.5 left-0.5 opacity-40">
              <PlayingCard card={{ id: 'back2', rank: '2', suit: 'SPADES' }} isFaceDown size="sm" />
            </div>
          )}
          {player.cardCount > 1 && (
            <div className="absolute top-0.5 left-0.5 opacity-60">
              <PlayingCard card={{ id: 'back1', rank: '2', suit: 'SPADES' }} isFaceDown size="sm" />
            </div>
          )}
          <PlayingCard card={{ id: 'back0', rank: '2', suit: 'SPADES' }} isFaceDown size="sm" />
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────

interface GameTableProps {
  gameState: PublicGameState;
  myPlayerId: string;
}

export const GameTable: React.FC<GameTableProps> = ({ gameState, myPlayerId }) => {
  const me = gameState.players.find((p) => p.id === myPlayerId);
  const otherPlayers = gameState.players.filter((p) => p.id !== myPlayerId);

  // Assign positions: me=bottom, then top, left, right based on seat
  const getPosition = (seatOffset: number): 'top' | 'left' | 'right' => {
    const positions: Array<'top' | 'left' | 'right'> = ['top', 'left', 'right'];
    return positions[seatOffset % positions.length];
  };

  const mySeat = me?.seatPosition ?? 0;
  const positionedPlayers = otherPlayers.map((p, i) => ({
    player: p,
    position: getPosition(i) as 'top' | 'left' | 'right' | 'bottom',
  }));

  // Cards in current trick
  const trickCards = gameState.currentTrick?.cards ?? [];
  const lastTrickCards = gameState.completedTricks.length > 0
    ? gameState.completedTricks[gameState.completedTricks.length - 1].cards
    : [];

  return (
    <div className="relative w-full">
      {/* Trick info bar */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-4">
          {gameState.powerColor && (
            <div className={clsx(
              'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-bold',
              isRedSuit(gameState.powerColor)
                ? 'border-red-500/40 bg-red-500/10 text-red-400'
                : 'border-slate-400/40 bg-slate-500/10 text-slate-300',
            )}>
              <span>{suitSymbol(gameState.powerColor)}</span>
              <span className="hidden sm:inline">Power</span>
            </div>
          )}
          <div className="text-white/50 text-sm">
            Trick{' '}
            <span className="text-white font-bold">{gameState.trickNumber}</span>
            {' / '}
            <span className="text-white/50">{gameState.totalTricks}</span>
          </div>
        </div>

        <div className="text-sm">
          {gameState.currentPlayerId === myPlayerId ? (
            <span className="text-pm-green-400 font-bold animate-pulse">Your Turn ✨</span>
          ) : (
            <span className="text-white/40">
              {gameState.players.find(
                (p) => p.id === gameState.currentPlayerId,
              )?.username ?? ''}
              's turn
            </span>
          )}
        </div>
      </div>

      {/* Game table surface */}
      <div className="game-table relative w-full" style={{ minHeight: '320px', padding: '24px' }}>
        {/* Top player */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          {positionedPlayers
            .filter((p) => p.position === 'top')
            .map(({ player }) => (
              <PlayerSeat
                key={player.id}
                player={player}
                gameState={gameState}
                position="top"
                isCurrentTurn={gameState.currentPlayerId === player.id}
                isMe={false}
              />
            ))}
        </div>

        {/* Left player */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          {positionedPlayers
            .filter((p) => p.position === 'left')
            .map(({ player }) => (
              <PlayerSeat
                key={player.id}
                player={player}
                gameState={gameState}
                position="left"
                isCurrentTurn={gameState.currentPlayerId === player.id}
                isMe={false}
              />
            ))}
        </div>

        {/* Right player */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {positionedPlayers
            .filter((p) => p.position === 'right')
            .map(({ player }) => (
              <PlayerSeat
                key={player.id}
                player={player}
                gameState={gameState}
                position="right"
                isCurrentTurn={gameState.currentPlayerId === player.id}
                isMe={false}
              />
            ))}
        </div>

        {/* Center trick area */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="trick-area w-48 h-36 flex items-center justify-center">
            {trickCards.length > 0 ? (
              <div className="relative w-32 h-24">
                {trickCards.map((played, i) => {
                  const angle = (i / trickCards.length) * 360;
                  const radius = 28;
                  const x = Math.cos((angle - 90) * (Math.PI / 180)) * radius;
                  const y = Math.sin((angle - 90) * (Math.PI / 180)) * radius;
                  return (
                    <div
                      key={played.playerId}
                      className="absolute"
                      style={{
                        left: `calc(50% + ${x}px - 20px)`,
                        top: `calc(50% + ${y}px - 28px)`,
                        transform: `rotate(${(i * 90) - 15}deg)`,
                        zIndex: i,
                      }}
                    >
                      <PlayingCard card={played.card} size="sm" isPlayed />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-white/10 text-xs text-center">
                <span className="text-4xl block mb-1">🃏</span>
                Lead a card
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
