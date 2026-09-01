import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { config } from '../config/config';

const logDir = config.logDir || 'logs';

// Custom format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    return `${timestamp} [${level.toUpperCase()}] ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ''
    } ${stack || ''}`;
  })
);

// Console format
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    return `${timestamp} [${level}] ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta) : ''
    } ${stack || ''}`;
  })
);

// Create transports
const transports: winston.transport[] = [];

// Console transport
transports.push(
  new winston.transports.Console({
    format: consoleFormat,
  })
);

// File transports in production
if (config.nodeEnv === 'production') {
  // Error log
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '30d',
    })
  );

  // Combined log
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: logFormat,
      maxSize: '20m',
      maxFiles: '30d',
    })
  );
}

const logger = winston.createLogger({
  level: config.logLevel || 'info',
  format: logFormat,
  transports,
  exitOnError: false,
});

export default logger;
