import React from 'react';
import { PublicGameState } from '@plus-minus/shared';
import { useGameStore } from '../../store/gameStore';
import clsx from 'clsx';

interface ScoreboardProps {
  gameState: PublicGameState;
  myPlayerId: string;
  className?: string;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  gameState,
  myPlayerId,
  className,
}) => {
  const { showScoreboard, toggleScoreboard } = useGameStore();

  const sortedPlayers = [...gameState.players].sort(
    (a, b) => b.totalScore - a.totalScore,
  );

  const lastRound =
    gameState.roundResults[gameState.roundResults.length - 1] ?? null;

  return (
    <div className={clsx('glass-card p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-display font-bold text-white text-sm">Scoreboard</h3>
          <p className="text-white/40 text-xs">
            Target: <span className="text-pm-gold-400 font-bold">{gameState.settings.targetScore}</span>
          </p>
        </div>
        <button
          onClick={toggleScoreboard}
          className="text-white/40 hover:text-white/80 text-xs transition-colors"
        >
          {showScoreboard ? 'Hide History' : 'Show History'}
        </button>
      </div>

      {/* Current scores */}
      <div className="space-y-1.5">
        {sortedPlayers.map((player, rank) => {
          const isMe = player.id === myPlayerId;
          const bid = gameState.bids.find((b) => b.playerId === player.id);
          const roundScore = lastRound?.scores.find((s) => s.playerId === player.id);
          const isLeading = rank === 0;

          return (
            <div
              key={player.id}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-xl transition-all',
                isMe ? 'bg-pm-green-500/10 border border-pm-green-500/20' : 'bg-white/5',
                isLeading && 'ring-1 ring-pm-gold-500/30',
              )}
            >
              {/* Rank */}
              <span className={clsx(
                'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                rank === 0 ? 'bg-pm-gold-500 text-pm-dark-900' :
                rank === 1 ? 'bg-slate-400 text-pm-dark-900' :
                rank === 2 ? 'bg-amber-700 text-white' : 'bg-white/10 text-white/50',
              )}>
                {rank + 1}
              </span>

              {/* Player name */}
              <span className={clsx(
                'flex-1 text-sm font-medium truncate',
                isMe ? 'text-pm-green-300' : 'text-white/80',
              )}>
                {player.username}
                {isMe && <span className="text-white/30 text-xs ml-1">(you)</span>}
              </span>

              {/* Tricks this round */}
              {gameState.phase === 'PLAYING' || gameState.phase === 'TRICK_COMPLETE' ? (
                <span className="text-white/50 text-xs">
                  {player.tricksWon}T
                </span>
              ) : null}

              {/* Bid */}
              {bid && (
                <span className="text-white/40 text-xs">
                  bid:{bid.declaredPoints}
                </span>
              )}

              {/* Total score */}
              <span className={clsx(
                'text-sm font-bold tabular-nums',
                player.totalScore > 0 ? 'text-pm-green-400' :
                player.totalScore < 0 ? 'text-red-400' : 'text-white/60',
              )}>
                {player.totalScore > 0 ? '+' : ''}{player.totalScore}
              </span>
            </div>
          );
        })}
      </div>

      {/* Round history */}
      {showScoreboard && gameState.roundResults.length > 0 && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-white/40 text-xs mb-2 font-medium">Round History</p>
          <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
            {gameState.roundResults.map((round) => (
              <div key={round.roundNumber} className="bg-white/5 rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white/50 text-xs">Round {round.roundNumber}</span>
                  <span className="text-xs" style={{ color: round.powerColor === 'HEARTS' || round.powerColor === 'DIAMONDS' ? '#f87171' : '#94a3b8' }}>
                    Power: {round.powerColor}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {round.scores.map((s) => {
                    const player = gameState.players.find((p) => p.id === s.playerId);
                    return (
                      <div key={s.playerId} className="text-center">
                        <div className="text-white/40 text-xs truncate">{player?.username?.slice(0, 4)}</div>
                        <div className={clsx(
                          'text-xs font-bold',
                          s.roundScore > 0 ? 'text-pm-green-400' : 'text-red-400',
                        )}>
                          {s.roundScore > 0 ? '+' : ''}{s.roundScore}
                        </div>
                        <div className="text-white/30 text-xs">{s.actual}/{s.declared}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
