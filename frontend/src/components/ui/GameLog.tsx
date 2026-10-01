import React from 'react';
import { GameLogEntry } from '@plus-minus/shared';
import clsx from 'clsx';

interface GameLogProps {
  entries: GameLogEntry[];
  className?: string;
}

const typeStyles: Record<GameLogEntry['type'], string> = {
  info: 'text-white/60',
  action: 'text-white/80',
  system: 'text-pm-gold-400',
  score: 'text-pm-green-400',
};

export const GameLog: React.FC<GameLogProps> = ({ entries, className }) => {
  const logRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  React.useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className={clsx('glass-card p-3', className)}>
      <h3 className="font-display font-bold text-white/70 text-xs uppercase tracking-wider mb-2">
        Game Log
      </h3>
      <div
        ref={logRef}
        className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin pr-1"
      >
        {entries.length === 0 ? (
          <p className="text-white/30 text-xs italic">Game activity will appear here...</p>
        ) : (
          entries.slice(-30).map((entry) => (
            <div
              key={entry.id}
              className={clsx('text-xs leading-relaxed', typeStyles[entry.type])}
            >
              <span className="text-white/20 mr-1 text-xs">
                {new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              {entry.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
