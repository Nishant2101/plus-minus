import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  winRate: number;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 2,
      maxlength: 20,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const UserModel = mongoose.model<IUser>('User', userSchema);
