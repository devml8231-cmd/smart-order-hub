import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import config from './config';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger from './utils/logger';

const app: Application = express();

// =============================================
// Security Middleware
// =============================================

// Helmet - Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.cors.origin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// =============================================
// Middleware
// =============================================

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    })
  );
}

// =============================================
// Routes
// =============================================

// API version prefix
app.use(`/api/${config.apiVersion}`, routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Food Pre-Order Backend API',
    version: config.apiVersion,
    documentation: `/api/${config.apiVersion}/health`,
  });
});

// =============================================
// Error Handling
// =============================================

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
