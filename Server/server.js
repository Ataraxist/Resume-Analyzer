import express, { json } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import config from './config/config.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import { connectDB } from './data/db.js';

// Import routers
import oNetRouter from './routes/oNetRouter.js';
import uploadRouter from './routes/uploadRouter.js';
// import authRouter from './routes/authRouter.js';
// import dataRouter from './routes/dataRouter.js';

const app = express();

// Connect to the Mongo DB on server start
connectDB();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/upload', limiter); // Apply rate limiting to upload routes

// CORS configuration
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true,
}));

// Body parsing middleware
app.use(json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.server.environment,
  });
});

// API routes
app.use('/api/job', (req, res, next) => {
  console.log('🤝 Incoming request for Job Titles!');
  oNetRouter(req, res, next);
});

app.use('/api/upload', (req, res, next) => {
  console.log('📜 Incoming resume upload!');
  uploadRouter(req, res, next);
});

// Legacy routes (for backward compatibility)
app.use('/job', (req, res, next) => {
  console.log('🤝 Incoming request for Job Titles! (Legacy)');
  oNetRouter(req, res, next);
});

app.use('/upload', (req, res, next) => {
  console.log('📜 Incoming resume upload! (Legacy)');
  uploadRouter(req, res, next);
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  console.log(`🔒 404 Response Sent for: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Global error handler
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(config.server.port, () => {
  console.log(`
🚀 Server is running!
📍 Port: ${config.server.port}
🌍 Environment: ${config.server.environment}
🕐 Started at: ${new Date().toISOString()}
  `);
});

export default app;
