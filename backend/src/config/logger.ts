import winston from 'winston';
import { config } from '../config';

export const logger = winston.createLogger({
  level: config.isDev ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize({ all: config.isDev }),
    winston.format.printf(({ timestamp, level, message, ...rest }) => {
      const extra = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
      return `[${timestamp}] ${level}: ${message}${extra}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});
