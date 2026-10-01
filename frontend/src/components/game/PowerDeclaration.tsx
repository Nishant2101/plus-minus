import React, { useState, useEffect } from 'react';
import { SuitEligibility, Suit, PublicGameState, Card } from '@plus-minus/shared';
import { PlayingCard } from '../ui/PlayingCard';
import { socketService } from '../../services/socket';
import { suitSymbol, suitName, isRedSuit, sortHand } from '../../utils/cardUtils';
import clsx from 'clsx';

interface PowerDeclarationProps {
  eligibilities: SuitEligibility[];
  myHand: Card[];
  gameState: PublicGameState;
  myPlayerId: string;
  deadline?: number;
}

export const PowerDeclaration: React.FC<PowerDeclarationProps> = ({
  eligibilities,
  myHand,
  gameState,
  myPlayerId,
  deadline,
}) => {
  const [selectedSuit, setSelectedSuit] = useState<Suit | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const currentTurnId = gameState.currentPowerTurnPlayerId;
  const isMyTurn = currentTurnId === myPlayerId;
  const currentTurnPlayer = gameState.players.find((p) => p.id === currentTurnId);
  const passedIds = gameState.powerPassedPlayerIds ?? [];
  const hasPassed = passedIds.includes(myPlayerId);

  // Check if this player already declared
  const myDeclaration = gameState.powerDeclarations.find(
    (d) => d.playerId === myPlayerId,
  );

  // Countdown timer
  useEffect(() => {
    if (!deadline) return;
    const update = () => {
      const remaining = Math.max(0, deadline - Date.now());
      setTimeLeft(Math.ceil(remaining / 1000));
    };
    update();
    const interval = setInterval(update, 500);
    return () => clearInterval(interval);
  }, [deadline]);

  const hasEligibleSuit = eligibilities.some((e) => e.eligible);

  const handleDeclare = () => {
    if (!selectedSuit || !isMyTurn) return;
    socketService.declarePower(selectedSuit);
  };

  const handlePass = () => {
    if (!isMyTurn) return;
    socketService.passPower();
  };

  const suitsOrder: Suit[] = ['SPADES', 'HEARTS', 'CLUBS', 'DIAMONDS'];
  const sortedCards = sortHand(myHand.slice(0, 5));

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pm-gold-500/20 border border-pm-gold-500/30 mb-3">
            <span className="text-pm-gold-400 text-sm font-semibold">Phase 1</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
            Power Color Declaration
          </h1>
          <p className="text-white/60 text-base">
            First player chooses Power Color or passes to next player. If all pass, Spades ♠ is default.
          </p>

          {/* Turn banner */}
          <div className="mt-4">
            {isMyTurn ? (
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-pm-green-500/20 border border-pm-green-500/40 text-pm-green-300 font-bold text-sm sm:text-base animate-pulse">
                <span>⭐</span> YOUR TURN: Choose Power Color or Pass
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-white/10 border border-white/20 text-white/80 font-medium text-sm sm:text-base">
                <span className="animate-spin text-pm-gold-400">⏳</span> Waiting for <strong className="text-pm-gold-400 font-bold">{currentTurnPlayer?.username ?? 'active player'}</strong> to choose or pass...
              </div>
            )}
          </div>

          {timeLeft !== null && (
            <div className={clsx(
              'mt-2 text-xl font-bold font-display',
              timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-white/40',
            )}>
              {timeLeft}s
            </div>
          )}
        </div>

        {/* Players Turn & Pass Progression */}
        <div className="glass-card p-4 mb-6">
          <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3 text-center">
            Turn Order
          </p>
          <div className="grid grid-cols-4 gap-2">
            {gameState.players.map((p) => {
              const isTurn = p.id === currentTurnId;
              const hasPlayerPassed = passedIds.includes(p.id);
              const hasPlayerDeclared = gameState.powerDeclarations.some((d) => d.playerId === p.id);

              return (
                <div
                  key={p.id}
                  className={clsx(
                    'p-2.5 rounded-xl text-center border transition-all',
                    isTurn
                      ? 'bg-pm-green-500/20 border-pm-green-500 shadow-lg scale-105'
                      : hasPlayerPassed
                      ? 'bg-white/5 border-white/10 opacity-50'
                      : hasPlayerDeclared
                      ? 'bg-pm-gold-500/20 border-pm-gold-500'
                      : 'bg-white/5 border-white/10',
                  )}
                >
                  <p className="font-semibold text-xs sm:text-sm truncate text-white">
                    {p.username}
                  </p>
                  <span className={clsx(
                    'text-[11px] font-bold block mt-1',
                    isTurn
                      ? 'text-pm-green-400 animate-pulse'
                      : hasPlayerPassed
                      ? 'text-white/40'
                      : hasPlayerDeclared
                      ? 'text-pm-gold-400'
                      : 'text-white/30',
                  )}>
                    {isTurn ? 'Choosing...' : hasPlayerPassed ? 'Passed' : hasPlayerDeclared ? 'Declared' : 'Waiting'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* My 5 cards (sorted and combined by color/suit) */}
        <div className="glass-card p-5 mb-6">
          <p className="text-white/50 text-xs uppercase tracking-wider font-semibold mb-3 text-center">
            Your First 5 Cards (Sorted by Color & Rank)
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {sortedCards.map((card) => (
              <PlayingCard
                key={card.id}
                card={card}
                size="md"
                className="flex-shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Action Panel */}
        {isMyTurn ? (
          <>
            <div className="glass-card p-5 mb-4">
              <p className="text-white/60 text-sm font-semibold mb-4 text-center">
                Select an eligible suit to declare Power Color, or pass:
              </p>

              <div className="grid grid-cols-2 gap-3">
                {suitsOrder.map((suit) => {
                  const elig = eligibilities.find((e) => e.suit === suit);
                  if (!elig) return null;
                  const red = isRedSuit(suit);
                  const isSelected = selectedSuit === suit;

                  return (
                    <button
                      key={suit}
                      id={`suit-btn-${suit.toLowerCase()}`}
                      disabled={!elig.eligible}
                      onClick={() => setSelectedSuit(isSelected ? null : suit)}
                      className={clsx(
                        'relative p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 text-left',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-pm-dark-800',
                        elig.eligible
                          ? isSelected
                            ? 'border-pm-green-400 bg-pm-green-500/10 shadow-lg glow-green'
                            : red
                            ? 'border-red-500/40 bg-red-500/10 hover:bg-red-500/20 hover:border-red-500/70 cursor-pointer'
                            : 'border-slate-500/40 bg-slate-500/10 hover:bg-slate-500/20 hover:border-slate-400/70 cursor-pointer'
                          : 'border-white/10 bg-white/5 opacity-40 cursor-not-allowed',
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={clsx(
                            'text-3xl sm:text-4xl leading-none',
                            red ? 'text-red-500' : 'text-slate-200',
                          )}>
                            {suitSymbol(suit)}
                          </span>
                          <p className={clsx(
                            'font-bold text-sm sm:text-base mt-1',
                            red ? 'text-red-300' : 'text-slate-200',
                          )}>
                            {suitName(suit)}
                          </p>
                        </div>

                        <div className="text-right">
                          {elig.eligible ? (
                            <>
                              <span className="block text-pm-green-400 font-bold text-base sm:text-lg">{elig.points} pts</span>
                              <span className="text-pm-green-400 text-xs font-semibold">✓ Eligible</span>
                            </>
                          ) : (
                            <>
                              <span className="block text-white/30 font-bold text-base sm:text-lg">{elig.points} pts</span>
                              <span className="text-white/30 text-xs">Need 4+ pts</span>
                            </>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-pm-green-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                id="btn-pass-power"
                onClick={handlePass}
                className="btn-secondary btn-lg flex-1 font-bold text-base"
              >
                Pass to Next Player
              </button>

              <button
                id="btn-declare-power"
                onClick={handleDeclare}
                disabled={!selectedSuit}
                className={clsx(
                  'btn-primary btn-lg flex-1 font-bold text-base',
                  !selectedSuit && 'opacity-50 cursor-not-allowed',
                )}
              >
                {selectedSuit
                  ? `Declare ${suitSymbol(selectedSuit)} ${suitName(selectedSuit)}`
                  : 'Select a Suit'}
              </button>
            </div>
          </>
        ) : (
          <div className="glass-card p-6 text-center">
            {hasPassed ? (
              <div className="text-white/50">
                <span className="text-2xl block mb-2">⏭️</span>
                <p className="font-semibold text-base">You passed</p>
                <p className="text-xs text-white/40 mt-1">Waiting for other players to declare or pass...</p>
              </div>
            ) : myDeclaration ? (
              <div className="text-pm-green-400">
                <span className="text-3xl block mb-2">{suitSymbol(myDeclaration.suit)}</span>
                <p className="font-bold text-lg">You declared {suitName(myDeclaration.suit)}!</p>
              </div>
            ) : (
              <div className="text-white/60">
                <span className="text-2xl block mb-2">⏳</span>
                <p className="font-semibold text-base">
                  Waiting for <strong className="text-white">{currentTurnPlayer?.username ?? 'player'}</strong>...
                </p>
                <p className="text-xs text-white/40 mt-1">
                  If they pass, turn will pass to the next player. If all pass, Spades ♠ will be default.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
