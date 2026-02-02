import app from './app';
import config from './config';
import logger from './utils/logger';

const PORT = config.port;

/**
 * Start the Express server
 */
const startServer = (): void => {
  try {
    const server = app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════╗
║   Smart Food Pre-Order Backend Server                ║
║                                                       ║
║   Environment: ${config.nodeEnv.padEnd(37)}║
║   Port:        ${PORT.toString().padEnd(37)}║
║   API Version: ${config.apiVersion.padEnd(37)}║
║                                                       ║
║   API Base:    http://localhost:${PORT}/api/${config.apiVersion.padEnd(10)}║
║   Health:      http://localhost:${PORT}/api/${config.apiVersion}/health${' '.padEnd(4)}║
║                                                       ║
║   Status:      🚀 Server is running!                  ║
╚═══════════════════════════════════════════════════════╝
      `);
    });

    // Handle graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} signal received: closing HTTP server`);
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection:', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
