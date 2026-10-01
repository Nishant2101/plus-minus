import React, { useState } from 'react';
import { RoomInfo } from '@plus-minus/shared';
import { socketService } from '../../services/socket';
import { useGameStore } from '../../store/gameStore';
import { useAuthStore } from '../../store/authStore';
import { copyToClipboard, generateRoomLink } from '../../utils/cardUtils';
import { Copy, Check, Play, Users, Settings } from 'lucide-react';
import clsx from 'clsx';

interface LobbyProps {
  roomCode: string;
  roomInfo: RoomInfo;
  playerId: string;
}

const TARGET_OPTIONS = [21, 31, 51, 101];

export const Lobby: React.FC<LobbyProps> = ({ roomCode, roomInfo, playerId }) => {
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customTarget, setCustomTarget] = useState<string>('');
  const { addNotification } = useGameStore();

  const me = roomInfo.players.find((p) => p.id === playerId);
  const isHost = me?.isHost ?? false;
  const isReady = me?.status === 'READY';
  const playersReady = roomInfo.players.filter((p) => p.status === 'READY').length;
  const canStart =
    isHost &&
    roomInfo.players.length === roomInfo.settings.numberOfPlayers &&
    playersReady === roomInfo.settings.numberOfPlayers;

  const handleCopyCode = async () => {
    await copyToClipboard(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    await copyToClipboard(generateRoomLink(roomCode));
    addNotification({ message: 'Room link copied!', type: 'success', duration: 2000 });
  };

  const handleToggleReady = () => {
    socketService.setReady(!isReady, roomCode, playerId);
  };

  const handleStartGame = () => {
    socketService.startGame();
  };

  const handleTargetChange = (target: number) => {
    socketService.updateSettings({ targetScore: target });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-pm-green-500/20 border border-pm-green-500/30 mb-4">
            <span className="text-3xl">🃏</span>
          </div>
          <h1 className="font-display text-4xl font-black text-white mb-1">
            Plus Minus
          </h1>
          <p className="text-white/50">Game Lobby</p>
        </div>

        {/* Room code */}
        <div className="glass-card p-6 mb-4">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-3 text-center">
            Room Code
          </p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="font-display text-5xl font-black text-white tracking-widest">
              {roomCode}
            </span>
            <button
              id="btn-copy-code"
              onClick={handleCopyCode}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              {copied ? <Check size={18} className="text-pm-green-400" /> : <Copy size={18} className="text-white/60" />}
            </button>
          </div>
          <button
            onClick={handleCopyLink}
            className="btn-secondary btn-sm w-full text-sm"
          >
            Copy Invite Link
          </button>
        </div>

        {/* Players */}
        <div className="glass-card p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-white/50" />
              <span className="text-white/70 font-semibold text-sm">
                Players ({roomInfo.players.length}/{roomInfo.settings.numberOfPlayers})
              </span>
            </div>
            <span className="text-white/30 text-xs">
              {playersReady}/{roomInfo.settings.numberOfPlayers} ready
            </span>
          </div>

          <div className="space-y-2">
            {/* Filled slots */}
            {roomInfo.players.map((player) => {
              const isMe = player.id === playerId;
              const avatarColors = [
                'from-purple-600 to-indigo-600',
                'from-orange-600 to-red-600',
                'from-cyan-600 to-teal-600',
                'from-pink-600 to-rose-600',
              ];
              return (
                <div
                  key={player.id}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                    isMe ? 'bg-pm-green-500/10 border border-pm-green-500/20' : 'bg-white/5',
                  )}
                >
                  <div
                    className={clsx(
                      'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0',
                      `bg-gradient-to-br ${avatarColors[player.seatPosition % avatarColors.length]}`,
                    )}
                  >
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        'font-medium text-sm',
                        isMe ? 'text-pm-green-300' : 'text-white/80',
                      )}>
                        {player.username}
                        {isMe && <span className="text-white/30 ml-1 text-xs">(you)</span>}
                      </span>
                      {player.isHost && (
                        <span className="text-xs px-1.5 py-0.5 rounded-md bg-pm-gold-500/20 text-pm-gold-400 font-semibold">
                          HOST
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={clsx(
                    'text-xs font-semibold px-2 py-1 rounded-lg',
                    player.status === 'READY'
                      ? 'text-pm-green-400 bg-pm-green-500/10'
                      : player.status === 'DISCONNECTED'
                      ? 'text-red-400 bg-red-500/15'
                      : 'text-white/40 bg-white/5',
                  )}>
                    {player.status === 'READY' ? '✓ Ready' : player.status === 'DISCONNECTED' ? '⚡ Offline' : 'Not Ready'}
                  </div>
                </div>
              );
            })}

            {/* Empty slots */}
            {Array.from({
              length: roomInfo.settings.numberOfPlayers - roomInfo.players.length,
            }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-white/10"
              >
                <div className="w-9 h-9 rounded-full bg-white/5 border border-dashed border-white/10 flex items-center justify-center">
                  <span className="text-white/20 text-sm">?</span>
                </div>
                <span className="text-white/25 text-sm italic">Waiting for player...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        {isHost && (
          <div className="glass-card p-5 mb-4">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <Settings size={16} className="text-white/50" />
                <span className="text-white/70 font-semibold text-sm">Game Settings</span>
              </div>
              <span className="text-white/30 text-xs">{showSettings ? '▲' : '▼'}</span>
            </button>

            {showSettings && (
              <div className="mt-4 space-y-4">
                {/* Target score */}
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-2">
                    Target Score
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {TARGET_OPTIONS.map((target) => (
                      <button
                        key={target}
                        id={`target-btn-${target}`}
                        onClick={() => handleTargetChange(target)}
                        className={clsx(
                          'px-4 py-2 rounded-xl text-sm font-bold transition-all',
                          roomInfo.settings.targetScore === target
                            ? 'bg-pm-green-500 text-white'
                            : 'bg-white/10 text-white/60 hover:bg-white/20',
                        )}
                      >
                        {target}
                      </button>
                    ))}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Custom"
                        value={customTarget}
                        onChange={(e) => setCustomTarget(e.target.value)}
                        className="input-field w-24 text-sm py-2"
                      />
                      {customTarget && (
                        <button
                          onClick={() => {
                            const n = parseInt(customTarget);
                            if (n > 0) handleTargetChange(n);
                          }}
                          className="btn-secondary btn-sm text-xs"
                        >
                          Set
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Current settings summary */}
        <div className="flex items-center justify-center gap-4 text-sm text-white/40 mb-6">
          <span>Target: <strong className="text-pm-gold-400">{roomInfo.settings.targetScore}</strong></span>
          <span>•</span>
          <span>Players: <strong className="text-white/70">{roomInfo.settings.numberOfPlayers}</strong></span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {!isHost && (
            <button
              id="btn-toggle-ready"
              onClick={handleToggleReady}
              className={clsx(
                'flex-1 btn-lg font-bold',
                isReady ? 'btn-secondary' : 'btn-primary',
              )}
            >
              {isReady ? '✓ Ready' : 'Mark Ready'}
            </button>
          )}

          {isHost && (
            <button
              id="btn-start-game"
              onClick={handleStartGame}
              disabled={!canStart}
              className={clsx(
                'flex-1 btn-gold btn-lg flex items-center justify-center gap-2',
                !canStart && 'opacity-40 cursor-not-allowed',
              )}
            >
              <Play size={18} />
              {canStart ? 'Start Game' : `${roomInfo.players.length < 4 ? 'Need 4 Players' : 'Waiting for Ready'}`}
            </button>
          )}
        </div>

        {isHost && !canStart && (
          <p className="text-white/30 text-xs text-center mt-3">
            {roomInfo.players.length < roomInfo.settings.numberOfPlayers
              ? `Need ${roomInfo.settings.numberOfPlayers - roomInfo.players.length} more player(s)`
              : 'All players must be ready to start'}
          </p>
        )}
      </div>
    </div>
  );
};
