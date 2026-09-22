import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/db.js';
import { initRedis } from './config/redis.js';
import { initSocket } from './socket/gateway.js';
import { startSweeper } from './services/sweeper.js';
import { seedDatabase } from './seed.js';
import { Movie } from './models/Movie.js';

import showRoutes from './routes/showRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: true, // Allow any local dev origin
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    name: 'CineReserve API',
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use(errorHandler);

// Bootstrap Server
async function startServer() {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Auto-seed if database is brand new
    const movieCount = await Movie.countDocuments();
    if (movieCount === 0) {
      console.log('[Bootstrap] No existing movie records found. Running initial database seed...');
      await seedDatabase();
    }

    // 3. Initialize Redis client & Keyspace subscriptions
    await initRedis();

    // 4. Initialize Socket.io Gateway
    initSocket(server, CLIENT_ORIGIN);

    // 5. Start Lock & Hold Sweeper
    startSweeper();

    // 6. Listen on Port
    server.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 CineReserve Express API & Socket.io Server`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🌐 Client Origin: ${CLIENT_ORIGIN}`);
      console.log(`⏱️  Seat Hold Lock TTL: ${process.env.SEAT_LOCK_TTL_SECONDS || 300}s`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('[Bootstrap] Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
