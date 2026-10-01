import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT ?? '3001'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/plus-minus',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000'),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX ?? '100'),
  powerDeclarationTimeoutMs: parseInt(
    process.env.POWER_DECLARATION_TIMEOUT_MS ?? '30000',
  ),
  pointDeclarationTimeoutMs: parseInt(
    process.env.POINT_DECLARATION_TIMEOUT_MS ?? '60000',
  ),
  isDev: (process.env.NODE_ENV ?? 'development') === 'development',
};
