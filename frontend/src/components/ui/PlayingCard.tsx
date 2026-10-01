import React from 'react';
import { Card } from '@plus-minus/shared';
import { suitSymbol, isRedSuit } from '../../utils/cardUtils';
import clsx from 'clsx';

interface PlayingCardProps {
  card: Card;
  isSelected?: boolean;
  isPlayable?: boolean;
  isDisabled?: boolean;
  isPlayed?: boolean;
  isFaceDown?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  onClick?: (card: Card) => void;
  className?: string;
}

const sizeClasses = {
  xs: 'w-10 h-14 text-xs',
  sm: 'w-14 h-20 text-sm',
  md: 'w-20 h-28 text-base',
  lg: 'w-24 h-36 text-lg',
};

const rankFontSize = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
};

const suitFontSize = {
  xs: 'text-base',
  sm: 'text-xl',
  md: 'text-3xl',
  lg: 'text-4xl',
};

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  isSelected = false,
  isPlayable = false,
  isDisabled = false,
  isPlayed = false,
  isFaceDown = false,
  size = 'md',
  onClick,
  className,
}) => {
  const red = isRedSuit(card.suit);
  const symbol = suitSymbol(card.suit);

  const handleClick = () => {
    if (!isDisabled && onClick) onClick(card);
  };

  if (isFaceDown) {
    return (
      <div
        className={clsx(
          'playing-card rounded-xl select-none cursor-default',
          sizeClasses[size],
          className,
        )}
        style={{
          background: 'linear-gradient(135deg, #1e3a5f 0%, #0d2040 50%, #162d52 100%)',
          border: '2px solid rgba(100,130,180,0.3)',
        }}
      >
        {/* Card back pattern */}
        <div className="w-full h-full flex items-center justify-center opacity-30">
          <div className="grid grid-cols-3 gap-0.5 p-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="text-blue-300 text-xs">♦</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`card-${card.id}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !isDisabled ? 0 : undefined}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      onClick={handleClick}
      className={clsx(
        'playing-card rounded-xl',
        sizeClasses[size],
        {
          'card-selected': isSelected,
          'card-playable': isPlayable && !isDisabled,
          'card-disabled': isDisabled,
          'card-played': isPlayed,
        },
        className,
      )}
      style={{
        background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
        boxShadow: isSelected
          ? '0 12px 30px rgba(34,197,94,0.35), 0 4px 10px rgba(0,0,0,0.2)'
          : isPlayable
          ? '0 0 18px rgba(34,197,94,0.4), 0 4px 10px rgba(0,0,0,0.15)'
          : '0 4px 10px rgba(0,0,0,0.15)',
      }}
    >
      {/* Top-left rank & suit */}
      <div
        className={clsx(
          'absolute top-1 left-1.5 flex flex-col items-center leading-none font-bold',
          rankFontSize[size],
          red ? 'text-red-600' : 'text-gray-900',
        )}
      >
        <span>{card.rank}</span>
        <span className={clsx('leading-tight', suitFontSize[size] === 'text-4xl' ? 'text-lg' : 'text-xs')}>
          {symbol}
        </span>
      </div>

      {/* Center suit symbol */}
      <div
        className={clsx(
          'absolute inset-0 flex items-center justify-center font-bold',
          suitFontSize[size],
          red ? 'text-red-500' : 'text-gray-800',
        )}
        style={{ opacity: 0.85 }}
      >
        {symbol}
      </div>

      {/* Bottom-right rank & suit (rotated) */}
      <div
        className={clsx(
          'absolute bottom-1 right-1.5 flex flex-col items-center leading-none font-bold rotate-180',
          rankFontSize[size],
          red ? 'text-red-600' : 'text-gray-900',
        )}
      >
        <span>{card.rank}</span>
        <span className="text-xs leading-tight">{symbol}</span>
      </div>

      {/* Playable indicator glow */}
      {isPlayable && !isDisabled && (
        <div className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ boxShadow: 'inset 0 0 8px rgba(34,197,94,0.3)' }}
        />
      )}
    </div>
  );
};
