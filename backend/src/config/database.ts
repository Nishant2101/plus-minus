import mongoose from 'mongoose';
import { config } from './index';
import { logger } from './logger';

export async function connectMongoDB(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri);
    logger.info('✅ MongoDB connected');
  } catch (error) {
    logger.error('❌ MongoDB connection failed', { error });
    // Don't crash — game can still work without persistent history
  }
}

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error', { err });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});
