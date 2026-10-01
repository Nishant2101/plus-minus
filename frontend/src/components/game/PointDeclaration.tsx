import React, { useState } from 'react';
import { PublicGameState, Card, Suit } from '@plus-minus/shared';
import { socketService } from '../../services/socket';
import { PlayingCard } from '../ui/PlayingCard';
import { groupHandBySuit, suitSymbol, suitName, isRedSuit } from '../../utils/cardUtils';
import clsx from 'clsx';

interface PointDeclarationProps {
  gameState: PublicGameState;
  myPlayerId: string;
  myHand: Card[];
}

const SUITS_DISPLAY_ORDER: Suit[] = ['SPADES', 'HEARTS', 'CLUBS', 'DIAMONDS'];

export const PointDeclaration: React.FC<PointDeclarationProps> = ({
  gameState,
  myPlayerId,
  myHand,
}) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const myBid = gameState.bids.find((b) => b.playerId === myPlayerId);
  const suitGroups = groupHandBySuit(myHand);

  const handleDeclare = () => {
    if (selected === null) return;
    socketService.declarePoints(selected);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pm-gold-500/20 border border-pm-gold-500/30 mb-2">
            <span className="text-pm-gold-400 text-sm font-semibold">Phase 2</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-1">
            Point Declaration
          </h1>
          <p className="text-white/60 text-sm sm:text-base">
            All 13 cards drawn! Review your hand below and estimate how many tricks you will win.
          </p>
        </div>

        {/* Power color banner */}
        {gameState.powerColor && (
          <div className={clsx(
            'flex items-center justify-between p-3 sm:p-4 rounded-2xl border-2 mb-5 shadow-lg',
            isRedSuit(gameState.powerColor)
              ? 'border-red-500/40 bg-red-500/10'
              : 'border-slate-500/40 bg-slate-500/10',
          )}>
            <div className="flex items-center gap-3">
              <span className={clsx('text-4xl', isRedSuit(gameState.powerColor) ? 'text-red-500' : 'text-slate-200')}>
                {suitSymbol(gameState.powerColor)}
              </span>
              <div>
                <p className="text-white/40 text-[11px] uppercase tracking-wider font-semibold">Power Color</p>
                <p className="text-white font-black text-lg capitalize tracking-wide">
                  {gameState.powerColor.toLowerCase()}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-white/30 text-xs">Declared by</p>
              <p className="text-pm-gold-400 text-sm font-bold">
                {gameState.powerDeclaredBy
                  ? (gameState.players.find((p) => p.id === gameState.powerDeclaredBy)?.username ?? 'Player')
                  : 'Default (All Passed)'}
              </p>
            </div>
          </div>
        )}

        {/* 13 Cards Arranged and Combined by Suit/Color */}
        <div className="glass-card p-4 sm:p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/60 text-xs sm:text-sm uppercase tracking-wider font-semibold">
              Your 13 Cards (Arranged by Color & Suit)
            </p>
            <span className="text-white/40 text-xs font-medium">
              {myHand.length} cards total
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SUITS_DISPLAY_ORDER.map((suit) => {
              const cards = suitGroups[suit] || [];
              const red = isRedSuit(suit);
              const isPower = gameState.powerColor === suit;

              return (
                <div
                  key={suit}
                  className={clsx(
                    'p-3 rounded-xl border transition-all',
                    isPower
                      ? 'bg-pm-gold-500/10 border-pm-gold-500/50 shadow-md'
                      : 'bg-white/5 border-white/10',
                  )}
                >
                  {/* Suit group header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className={clsx(
                      'font-bold text-sm flex items-center gap-1.5',
                      red ? 'text-red-400' : 'text-slate-300',
                    )}>
                      <span className="text-base">{suitSymbol(suit)}</span>
                      {suitName(suit)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-semibold">
                      {cards.length}
                    </span>
                  </div>

                  {/* Cards in this suit */}
                  {cards.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {cards.map((card) => (
                        <div key={card.id} className="transform hover:scale-105 transition-transform">
                          <PlayingCard card={card} size="sm" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-white/20 text-xs italic py-2">None</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Point Declaration Form */}
        {!myBid && !submitted ? (
          <div className="glass-card p-5 sm:p-6 mb-5">
            <p className="text-white/70 text-sm font-semibold text-center mb-4">
              Select how many tricks you declare to win (0–13):
            </p>

            {/* Trick selection grid */}
            <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 mb-5">
              {Array.from({ length: 14 }, (_, i) => i).map((n) => (
                <button
                  key={n}
                  id={`bid-btn-${n}`}
                  onClick={() => setSelected(n === selected ? null : n)}
                  className={clsx(
                    'aspect-square rounded-xl font-black text-base sm:text-lg transition-all duration-150 border',
                    selected === n
                      ? 'bg-pm-green-500 text-white border-pm-green-400 shadow-lg scale-110'
                      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/15 hover:text-white',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              id="btn-submit-bid"
              onClick={handleDeclare}
              disabled={selected === null}
              className={clsx(
                'btn-primary btn-lg w-full font-bold text-base sm:text-lg',
                selected === null && 'opacity-50 cursor-not-allowed',
              )}
            >
              {selected !== null ? `Declare ${selected} Tricks` : 'Select a Number of Tricks (0–13)'}
            </button>
          </div>
        ) : (
          <div className="glass-card p-6 text-center mb-5">
            <div className="text-5xl font-display font-black text-pm-green-400 mb-1">
              {myBid?.declaredPoints ?? selected}
            </div>
            <p className="text-white/70 font-bold text-base mb-1">Tricks Declared</p>
            <p className="text-white/40 text-xs">Waiting for other players to finish their point declarations...</p>
          </div>
        )}

        {/* Players declaration status */}
        <div className="glass-card p-4">
          <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3 text-center">
            Player Declarations ({gameState.bids.length}/{gameState.players.length})
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {gameState.players.map((p) => {
              const bid = gameState.bids.find((b) => b.playerId === p.id);
              const isMe = p.id === myPlayerId;
              return (
                <div
                  key={p.id}
                  className={clsx(
                    'p-2.5 rounded-xl border flex items-center justify-between',
                    isMe ? 'bg-pm-green-500/10 border-pm-green-500/30' : 'bg-white/5 border-white/10',
                  )}
                >
                  <span className={clsx('text-xs sm:text-sm font-semibold truncate', isMe ? 'text-pm-green-300' : 'text-white/80')}>
                    {p.username} {isMe && '(You)'}
                  </span>
                  {bid !== undefined ? (
                    <span className="text-pm-gold-400 font-bold text-sm px-2 py-0.5 rounded-md bg-pm-gold-500/10">
                      {bid.declaredPoints} pts
                    </span>
                  ) : (
                    <span className="text-white/30 text-xs italic animate-pulse">thinking...</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
