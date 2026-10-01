import mongoose, { Schema, Document } from 'mongoose';
import { Suit, GameSettings } from '@plus-minus/shared';

export interface IGameHistory extends Document {
  roomCode: string;
  gameType: string;
  players: Array<{
    userId: string;
    username: string;
    finalScore: number;
    isWinner: boolean;
    tricksWon: number;
  }>;
  settings: GameSettings;
  rounds: Array<{
    roundNumber: number;
    powerColor: Suit;
    powerDeclaredBy: string | null;
    scores: Array<{
      playerId: string;
      declared: number;
      actual: number;
      roundScore: number;
    }>;
  }>;
  winner: string;
  startedAt: Date;
  completedAt: Date;
  durationSeconds: number;
}

const gameHistorySchema = new Schema<IGameHistory>(
  {
    roomCode: { type: String, required: true, index: true },
    gameType: { type: String, default: 'plus-minus' },
    players: [
      {
        userId: String,
        username: String,
        finalScore: Number,
        isWinner: Boolean,
        tricksWon: Number,
      },
    ],
    settings: { type: Schema.Types.Mixed },
    rounds: [
      {
        roundNumber: Number,
        powerColor: String,
        powerDeclaredBy: String,
        scores: [
          {
            playerId: String,
            declared: Number,
            actual: Number,
            roundScore: Number,
          },
        ],
      },
    ],
    winner: String,
    startedAt: Date,
    completedAt: Date,
    durationSeconds: Number,
  },
  { timestamps: true },
);

export const GameHistoryModel = mongoose.model<IGameHistory>(
  'GameHistory',
  gameHistorySchema,
);
