import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lobby } from '../components/lobby/Lobby';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../services/socket';

export const RoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { code } = useParams<{ code?: string }>();
  const { username } = useAuthStore();
  const { roomCode, roomInfo, playerId, isConnected, addNotification } = useGameStore();

  const isCreating = !code;

  useEffect(() => {
    if (!isConnected) return;
    if (!username) {
      navigate('/');
      return;
    }

    if (code) {
      // Joining or reconnecting to room with code
      if (!roomCode || roomCode !== code || !roomInfo) {
        socketService.joinRoom(code, username, playerId ?? undefined);
      }
    } else if (isCreating) {
      if (roomCode && playerId) {
        // Host refreshed or navigated: use existing room
        navigate(`/room/join/${roomCode}`, { replace: true });
      } else {
        // Create new room
        socketService.createRoom(username);
      }
    }
  }, [isConnected, username, code]);

  // Navigate to game once it starts
  const gameState = useGameStore((s) => s.gameState);
  useEffect(() => {
    if (gameState && gameState.phase !== 'WAITING_FOR_PLAYERS') {
      navigate('/game');
    }
  }, [gameState?.phase]);

  if (!roomCode || !roomInfo || !playerId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce-subtle">🃏</div>
          <p className="text-white/50">
            {isCreating ? 'Creating room...' : `Joining room ${code}...`}
          </p>
        </div>
      </div>
    );
  }

  return <Lobby roomCode={roomCode} roomInfo={roomInfo} playerId={playerId} />;
};
