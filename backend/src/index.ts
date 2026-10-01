import express from 'express';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

import { config } from './config';
import { logger } from './config/logger';
import { connectMongoDB } from './config/database';
import { connectRedis } from './config/redis';
import { registerSocketHandlers } from './socket/gameHandlers';
import authRouter from './routes/auth';
import gamesRouter from './routes/games';

async function bootstrap() {
  // Connect to databases
  await connectMongoDB();
  await connectRedis();

  const app = express();
  const httpServer = createServer(app);

  // ──────────────────────────────────────────────────────────
  // MIDDLEWARE
  // ──────────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: false, // Allow Socket.IO in development
  }));

  app.use(cors({
    origin: config.isDev ? true : config.clientUrl,
    credentials: true,
  }));

  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // ──────────────────────────────────────────────────────────
  // ROUTES
  // ──────────────────────────────────────────────────────────
  app.use('/api/auth', authRouter);
  app.use('/api/games', gamesRouter);

  app.get('/api/health', (_, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: config.nodeEnv,
    });
  });

  // ──────────────────────────────────────────────────────────
  // SOCKET.IO
  // ──────────────────────────────────────────────────────────
  const io = new SocketServer(httpServer, {
    cors: {
      origin: config.isDev ? true : config.clientUrl,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  registerSocketHandlers(io);

  // ──────────────────────────────────────────────────────────
  // START
  // ──────────────────────────────────────────────────────────
  httpServer.listen(config.port, () => {
    logger.info(`🚀 Plus Minus server running on port ${config.port}`);
    logger.info(`   Client URL: ${config.clientUrl}`);
    logger.info(`   Environment: ${config.nodeEnv}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received — shutting down gracefully');
    httpServer.close(() => process.exit(0));
  });
}

bootstrap().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});
