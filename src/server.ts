import { createServer } from 'http';
import app from './app';
import { initSocketIO } from './socket/socketHandler';
import connectDB from './config/database';
import logger from './middleware/logger';
import { config } from './config/config';

const PORT = config.port || 8080;

const server = createServer(app);

// Initialize Socket.IO
const io = initSocketIO(server);

// Connect to MongoDB
connectDB();

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`🔗 API: http://localhost:${PORT}/api`);
  logger.info(`📡 Socket.IO: ws://localhost:${PORT}`);
  logger.info(`🌍 Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export { io };
