import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { X } from 'lucide-react';
import clsx from 'clsx';

export const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useGameStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={clsx(
            'glass-dark rounded-2xl px-5 py-3 shadow-2xl flex items-start gap-3',
            'animate-slide-in-right pointer-events-auto',
            {
              'border-l-4 border-pm-green-500': notif.type === 'success',
              'border-l-4 border-blue-500': notif.type === 'info',
              'border-l-4 border-red-500': notif.type === 'error',
              'border-l-4 border-pm-gold-500': notif.type === 'warning',
            },
          )}
        >
          <p className="text-sm text-white/90 flex-1">{notif.message}</p>
          <button
            onClick={() => removeNotification(notif.id)}
            className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0 mt-0.5"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
