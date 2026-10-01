import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { UserModel } from '../models/User';
import { logger } from '../config/logger';

export interface TokenPayload {
  userId: string;
  username: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerUser(
  username: string,
  email: string,
  password: string,
): Promise<{ token: string; userId: string; username: string }> {
  const existing = await UserModel.findOne({
    $or: [{ username }, { email: email.toLowerCase() }],
  });

  if (existing) {
    throw new Error('Username or email already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await UserModel.create({ username, email, passwordHash });
  const token = generateToken({ userId: user._id.toString(), username });

  return { token, userId: user._id.toString(), username };
}

export async function loginUser(
  usernameOrEmail: string,
  password: string,
): Promise<{ token: string; userId: string; username: string }> {
  const user = await UserModel.findOne({
    $or: [
      { username: usernameOrEmail },
      { email: usernameOrEmail.toLowerCase() },
    ],
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken({ userId: user._id.toString(), username: user.username });
  return { token, userId: user._id.toString(), username: user.username };
}

/**
 * Guest login — no DB record, just generates a token.
 * Useful for quick play without registration.
 */
export function guestLogin(username: string): { token: string; userId: string; username: string } {
  const userId = `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const token = generateToken({ userId, username });
  return { token, userId, username };
}
