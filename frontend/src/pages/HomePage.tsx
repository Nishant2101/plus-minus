import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthForm } from '../components/auth/AuthForm';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { socketService } from '../services/socket';
import clsx from 'clsx';

const SUIT_SYMBOLS = ['♠', '♥', '♦', '♣'];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, username, clearAuth } = useAuthStore();
  const { addNotification, isConnected } = useGameStore();

  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const [joinMode, setJoinMode] = useState<'create' | 'join' | null>(null);

  const handleCreateRoom = () => {
    if (!isAuthenticated) {
      setJoinMode('create');
      setShowAuth(true);
      return;
    }
    navigate('/room/create');
  };

  const handleJoinRoom = () => {
    if (!isAuthenticated) {
      setJoinMode('join');
      setShowAuth(true);
      return;
    }
    if (roomCodeInput.trim().length === 6) {
      navigate(`/room/join/${roomCodeInput.trim().toUpperCase()}`);
    } else {
      addNotification({ message: 'Enter a 6-character room code', type: 'error' });
    }
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    if (joinMode === 'create') navigate('/room/create');
    else if (joinMode === 'join' && roomCodeInput.trim().length === 6) {
      navigate(`/room/join/${roomCodeInput.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Animated background suits */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {SUIT_SYMBOLS.map((suit, i) => (
          <div
            key={i}
            className={clsx(
              'absolute text-8xl font-bold select-none animate-float opacity-5',
              i % 2 === 0 ? 'text-white' : 'text-red-500',
            )}
            style={{
              left: `${15 + i * 22}%`,
              top: `${10 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${4 + i}s`,
            }}
          >
            {suit}
          </div>
        ))}
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🃏</span>
          <span className="font-display font-black text-xl text-gradient">Plus Minus</span>
        </div>

        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-2 h-2 rounded-full',
            isConnected ? 'bg-pm-green-400' : 'bg-red-400',
          )} title={isConnected ? 'Connected' : 'Connecting...'} />

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="text-white/60 text-sm hidden sm:block">
                👤 {username}
              </span>
              <button
                onClick={() => clearAuth()}
                className="btn-secondary btn-sm text-xs"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="btn-secondary btn-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pm-green-500/10 border border-pm-green-500/30 mb-6">
            <span className="w-2 h-2 rounded-full bg-pm-green-400 animate-pulse" />
            <span className="text-pm-green-300 text-sm font-semibold">
              Real-time Multiplayer
            </span>
          </div>

          <h1 className="font-display text-6xl sm:text-7xl font-black mb-4 leading-tight">
            <span className="text-white">Plus</span>{' '}
            <span className="text-gradient">Minus</span>
          </h1>

          <p className="text-white/50 text-xl leading-relaxed mb-2">
            The strategic card game of Power Colors and trick-taking.
          </p>
          <p className="text-white/30 text-base">
            4 players · Real-time · Private rooms
          </p>
        </div>

        {/* Action cards */}
        <div className="grid sm:grid-cols-2 gap-4 w-full max-w-lg mb-8">
          {/* Create room */}
          <button
            id="btn-create-room"
            onClick={handleCreateRoom}
            className="glass-card p-6 text-left hover:bg-white/10 transition-all duration-300 group hover:scale-[1.02] cursor-pointer"
          >
            <div className="text-3xl mb-3 group-hover:animate-bounce-subtle">🏠</div>
            <h3 className="font-display font-bold text-white text-lg mb-1">
              Create Room
            </h3>
            <p className="text-white/40 text-sm">
              Start a private room and invite up to 3 friends
            </p>
            <div className="mt-4 inline-flex items-center gap-1 text-pm-green-400 text-sm font-semibold">
              Create →
            </div>
          </button>

          {/* Join room */}
          <div className="glass-card p-6 flex flex-col">
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="font-display font-bold text-white text-lg mb-1">
              Join Room
            </h3>
            <p className="text-white/40 text-sm mb-4">
              Enter a 6-character room code to join
            </p>
            <div className="flex gap-2 mt-auto">
              <input
                id="input-room-code"
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                placeholder="AB7K92"
                className="input-field flex-1 text-center font-display font-bold tracking-widest text-lg py-2"
                maxLength={6}
              />
              <button
                id="btn-join-room"
                onClick={handleJoinRoom}
                className="btn-primary"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-6 max-w-lg w-full text-center">
          {[
            { icon: '🎯', label: 'Power Colors' },
            { icon: '🏆', label: 'Trick-taking' },
            { icon: '📊', label: 'Live Scoring' },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1">
              <span className="text-2xl">{f.icon}</span>
              <span className="text-white/40 text-xs">{f.label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowAuth(false)}
          />
          <div className="relative glass-card p-8 w-full max-w-sm animate-slide-up">
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors text-xl"
            >
              ✕
            </button>
            <h2 className="font-display font-bold text-white text-2xl mb-6 text-center">
              Get Started
            </h2>
            <AuthForm onSuccess={handleAuthSuccess} />
          </div>
        </div>
      )}
    </div>
  );
};
