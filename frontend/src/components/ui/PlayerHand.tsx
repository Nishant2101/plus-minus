import React from 'react';
import { Card } from '@plus-minus/shared';
import { PlayingCard } from './PlayingCard';
import { useGameStore } from '../../store/gameStore';
import { socketService } from '../../services/socket';
import { sortHand } from '../../utils/cardUtils';
import clsx from 'clsx';

interface PlayerHandProps {
  hand: Card[];
  legalCards: Card[];
  isMyTurn: boolean;
  className?: string;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
  hand,
  legalCards,
  isMyTurn,
  className,
}) => {
  const { selectedCardId, selectCard } = useGameStore();

  const legalCardIds = new Set(legalCards.map((c) => c.id));

  const handleCardClick = (card: Card) => {
    if (!isMyTurn) return;
    if (!legalCardIds.has(card.id)) return;

    if (selectedCardId === card.id) {
      // Second click — play the card
      socketService.playCard(card.id);
      selectCard(null);
    } else {
      selectCard(card.id);
    }
  };

  // Sort and arrange cards according to suit/color and rank
  const sortedHand = sortHand(hand);
  const cardCount = sortedHand.length;
  const maxOverlap = Math.min(38, Math.max(8, 560 / Math.max(cardCount, 1)));

  return (
    <div className={clsx('relative flex items-end justify-center', className)}>
      {/* Turn indicator */}
      {isMyTurn && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="phase-badge bg-pm-green-500/20 text-pm-green-400 border-pm-green-500/30 animate-pulse font-bold">
            ✨ YOUR TURN
          </span>
        </div>
      )}

      {/* Cards sorted and grouped by suit/color */}
      <div
        className="flex items-end justify-center relative"
        style={{
          minHeight: '140px',
          paddingTop: '40px',
        }}
      >
        {sortedHand.map((card, index) => {
          const isSelected = selectedCardId === card.id;
          const isLegal = legalCardIds.has(card.id);
          const isPlayable = isMyTurn && isLegal;
          const isDisabled = isMyTurn && !isLegal;

          // Extra separation when suit changes to combine and group same colors/suits
          const isNewSuit = index > 0 && card.suit !== sortedHand[index - 1].suit;
          const suitGap = isNewSuit ? 12 : 0;

          // Slight arc effect
          const centerIndex = (cardCount - 1) / 2;
          const rotation = (index - centerIndex) * 1.5;
          const yOffset = Math.abs(index - centerIndex) * 1.8;

          return (
            <div
              key={card.id}
              className="transition-all duration-200"
              style={{
                marginLeft: index === 0 ? 0 : `${-maxOverlap + suitGap}px`,
                transform: `rotate(${rotation}deg) translateY(${isSelected ? -22 : yOffset}px)`,
                zIndex: isSelected ? cardCount + 20 : index,
                position: 'relative',
              }}
            >
              <PlayingCard
                card={card}
                isSelected={isSelected}
                isPlayable={isPlayable}
                isDisabled={isDisabled && !isSelected}
                size="md"
                onClick={handleCardClick}
              />
            </div>
          );
        })}
      </div>

      {/* Play instruction */}
      {isMyTurn && selectedCardId && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm text-pm-green-400 animate-bounce-subtle font-semibold">
          Click again to play
        </div>
      )}
    </div>
  );
};
