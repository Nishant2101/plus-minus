import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { RoomPage } from './pages/RoomPage';
import { GamePage } from './pages/GamePage';
import { NotificationToast } from './components/ui/NotificationToast';
import { useSocket } from './hooks/useSocket';
import { useAuthStore } from './store/authStore';
import { useGameStore } from './store/gameStore';
import { socketService } from './services/socket';

const App: React.FC = () => {
  // Initialize socket connection
  useSocket();

  const { isAuthenticated, userId, token } = useAuthStore();
  const { roomCode, playerId, gameState } = useGameStore();

  // Attempt reconnection on mount if stored session
  useEffect(() => {
    if (isAuthenticated && userId && roomCode && playerId) {
      // Small delay to let socket connect first
      const timer = setTimeout(() => {
        if (socketService.isConnected()) {
          socketService.reconnectGame(roomCode, playerId);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/room/create" element={<RoomPage />} />
        <Route path="/room/join/:code" element={<RoomPage />} />
        <Route path="/join/:code" element={<RoomPage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <NotificationToast />
    </>
  );
};

export default App;
