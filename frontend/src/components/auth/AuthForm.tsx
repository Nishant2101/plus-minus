import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useGameStore } from '../../store/gameStore';
import clsx from 'clsx';

interface AuthFormProps {
  onSuccess?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'guest' | 'login' | 'register'>('guest');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setAuth } = useAuthStore();
  const { addNotification } = useGameStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return setError('Username is required');
    setLoading(true);
    setError('');

    try {
      let res: Response;
      let body: { username?: string; email?: string; password?: string; usernameOrEmail?: string };

      if (mode === 'guest') {
        res = await fetch('/api/auth/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim() }),
        });
      } else if (mode === 'login') {
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernameOrEmail: username.trim(), password }),
        });
      } else {
        res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');

      setAuth(data.token, data.userId, data.username);
      addNotification({ message: `Welcome, ${data.username}!`, type: 'success' });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-6">
        {(['guest', 'login', 'register'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(''); }}
            className={clsx(
              'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
              mode === m
                ? 'bg-pm-green-600 text-white shadow'
                : 'text-white/50 hover:text-white',
            )}
          >
            {m === 'guest' ? '👤 Guest' : m === 'login' ? '🔑 Login' : '✨ Register'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white/60 text-sm mb-1.5">
            {mode === 'login' ? 'Username or Email' : 'Username'}
          </label>
          <input
            id="auth-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={mode === 'guest' ? 'Pick a display name' : 'Your username'}
            className="input-field"
            maxLength={20}
          />
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-white/60 text-sm mb-1.5">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="input-field"
            />
          </div>
        )}

        {(mode === 'login' || mode === 'register') && (
          <div>
            <label className="block text-white/60 text-sm mb-1.5">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
            />
          </div>
        )}

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <button
          id="btn-auth-submit"
          type="submit"
          disabled={loading}
          className="btn-primary w-full btn-lg"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Loading...
            </span>
          ) : mode === 'guest' ? 'Play as Guest' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};
