import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Config {
  nodeEnv: string;
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  clientBaseUrl: string;
  clientUrlPrefix: string;
  frontendUrl: string;
  socketCorsOrigin: string;
  sessionSecret: string;
  sessionExpiration: number;
  qrSize: number;
  qrBgColor: string;
  qrFgColor: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
  logLevel: string;
  logDir: string;
  adminEmail: string;
  adminPassword: string;
  adminUsername: string;
}

export const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8080'),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/phantom_droid',
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'default-jwt-refresh-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  clientBaseUrl: process.env.CLIENT_BASE_URL || 'http://localhost:5173',
  clientUrlPrefix: process.env.CLIENT_URL_PREFIX || '/c/',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  socketCorsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET || 'default-session-secret-change-me',
  sessionExpiration: parseInt(process.env.SESSION_EXPIRATION || '3600'),
  qrSize: parseInt(process.env.QR_SIZE || '256'),
  qrBgColor: process.env.QR_BG_COLOR || '#ffffff',
  qrFgColor: process.env.QR_FG_COLOR || '#000000',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || 'logs',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@phantomdroid.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
};
