import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PublicGameState,
  RoomInfo,
  Card,
  SuitEligibility,
  Suit,
  GamePhase,
  PublicPlayerInfo,
  Trick,
  RoundResult,
} from '@plus-minus/shared';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  duration?: number;
}

interface GameStore {
  // Connection
  isConnected: boolean;
  isConnecting: boolean;

  // Room state
  roomCode: string | null;
  roomInfo: RoomInfo | null;
  playerId: string | null;

  // Game state (public)
  gameState: PublicGameState | null;

  // Private player state
  myHand: Card[];
  legalCards: Card[];
  myEligibleSuits: SuitEligibility[];

  // UI state
  selectedCardId: string | null;
  notifications: Notification[];
  showScoreboard: boolean;
  showGameLog: boolean;
  powerDeclarationPhaseComplete: boolean;

  // Actions
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setRoom: (roomCode: string, playerId: string, roomInfo: RoomInfo) => void;
  setRoomInfo: (roomInfo: RoomInfo) => void;
  setGameState: (gameState: PublicGameState) => void;
  setMyHand: (hand: Card[]) => void;
  setLegalCards: (cards: Card[]) => void;
  setEligibleSuits: (suits: SuitEligibility[]) => void;
  selectCard: (cardId: string | null) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  toggleScoreboard: () => void;
  toggleGameLog: () => void;
  setPowerDeclarationComplete: (complete: boolean) => void;
  reset: () => void;
}

const initialState = {
  isConnected: false,
  isConnecting: false,
  roomCode: null,
  roomInfo: null,
  playerId: null,
  gameState: null,
  myHand: [],
  legalCards: [],
  myEligibleSuits: [],
  selectedCardId: null,
  notifications: [],
  showScoreboard: false,
  showGameLog: true,
  powerDeclarationPhaseComplete: false,
};

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setConnected: (isConnected) => set({ isConnected }),
      setConnecting: (isConnecting) => set({ isConnecting }),

      setRoom: (roomCode, playerId, roomInfo) =>
        set({ roomCode, playerId, roomInfo }),

      setRoomInfo: (roomInfo) => set({ roomInfo }),

      setGameState: (gameState) => set({ gameState }),

      setMyHand: (myHand) => set({ myHand }),

      setLegalCards: (legalCards) => set({ legalCards }),

      setEligibleSuits: (myEligibleSuits) => set({ myEligibleSuits }),

      selectCard: (selectedCardId) => set({ selectedCardId }),

      addNotification: (notification) => {
        const id = `notif_${Date.now()}_${Math.random()}`;
        const newNotif: Notification = { ...notification, id };
        set((state) => ({
          notifications: [...state.notifications.slice(-4), newNotif],
        }));
        // Auto-remove
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }));
        }, notification.duration ?? 4000);
      },

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      toggleScoreboard: () =>
        set((state) => ({ showScoreboard: !state.showScoreboard })),

      toggleGameLog: () =>
        set((state) => ({ showGameLog: !state.showGameLog })),

      setPowerDeclarationComplete: (powerDeclarationPhaseComplete) =>
        set({ powerDeclarationPhaseComplete }),

      reset: () => set(initialState),
    }),
    {
      name: 'plus-minus-game',
      partialize: (state) => ({
        roomCode: state.roomCode,
        playerId: state.playerId,
      }),
    },
  ),
);
