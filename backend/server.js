require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');

// Suppress noisy Mongoose warnings
const mongoose = require('mongoose');
mongoose.set('strictQuery', false);

// Route files
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const withdrawalRoutes = require('./routes/withdrawal');
const nftRoutes = require('./routes/nft');
const adminRoutes = require('./routes/admin');

const app = express();

// Trust proxy (required for Render/reverse proxy — fixes rate-limit & IP detection)
app.set('trust proxy', 1);

// ─── Body Parsing (MUST be before other middleware) ───────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'https://futuremintnft.vercel.app',
    ].filter(Boolean);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed) || origin === allowed)) {
      return callback(null, true);
    }
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Request Timeout — prevent slow requests from blocking server ─────────────
app.use((req, res, next) => {
  // 30 second timeout per request
  req.setTimeout(30000, () => {
    if (!res.headersSent) {
      res.status(408).json({ success: false, message: 'Request timeout. Please try again.' });
    }
  });
  next();
});

// ─── Rate Limiting (scaled for high traffic) ──────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                   // 300 requests per 15 min per IP (was 100)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  skip: (req) => req.path === '/api/health', // Don't rate-limit health checks
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,                    // 20 auth attempts per 15 min per IP (was 10)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});

// Separate limiter for OTP verification (stricter — prevent brute force)
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,  // 5 minutes
  max: 10,                    // 10 OTP attempts per 5 min
  message: { success: false, message: 'Too many OTP attempts. Wait 5 minutes.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/verify-otp', otpLimiter);
app.use('/api/auth/login-verify-otp', otpLimiter);

// Admin login — more generous limit (admin might retry from multiple devices)
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many login attempts. Wait 15 minutes.' },
});
app.use('/api/admin/login', adminLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/admin', adminRoutes);

// Health check (lightweight — for monitoring)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState; // 1 = connected
  res.status(dbState === 1 ? 200 : 503).json({
    success: dbState === 1,
    message: dbState === 1 ? 'FutureMint NFT API is running' : 'Database not connected',
    timestamp: new Date(),
    uptime: Math.floor(process.uptime()),
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler — catch all unhandled route errors ──────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  
  // MongoDB specific errors
  if (err.name === 'MongoServerError' && err.code === 11000) {
    return res.status(409).json({ success: false, message: 'Duplicate entry. This data already exists.' });
  }
  if (err.name === 'MongoTimeoutError' || err.message?.includes('buffering timed out')) {
    return res.status(503).json({ success: false, message: 'Server busy. Please try again in a moment.' });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages[0] || 'Validation error' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ─── Seed essential collections if empty (after DB reset) ─────────────────────
const seedDefaults = async () => {
  try {
    const NFTConfig = require('./models/NFTConfig');
    const existing = await NFTConfig.findOne();
    if (!existing) {
      await NFTConfig.create({
        totalMinted: 0,
        currentPrice: 0.01,
        signupBonusAmount: 100,
        totalSupply: 2100000,
        priceRanges: [
          { from: 0, to: 50000, price: 0.01 },
          { from: 50000, to: 100000, price: 0.02 },
          { from: 100000, to: 150000, price: 0.04 },
          { from: 150000, to: 200000, price: 0.08 },
          { from: 200000, to: 250000, price: 0.16 },
          { from: 250000, to: 300000, price: 0.32 },
          { from: 300000, to: 350000, price: 0.64 },
          { from: 350000, to: 400000, price: 1.28 },
          { from: 400000, to: 450000, price: 2.56 },
          { from: 450000, to: 500000, price: 5.12 },
          { from: 500000, to: 2100000, price: 10.24 },
        ],
      });
      console.log('   ✅ NFTConfig seeded with defaults');
    }
  } catch (err) {
    console.error('   ⚠️ NFTConfig seed failed (non-fatal):', err.message);
  }
};

// ─── Prevent crash on unhandled errors ────────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  console.error(err.stack);
  // Don't exit — let the server keep running
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
  // Don't exit — let the server keep running
});

// ─── Graceful shutdown (Railway sends SIGTERM before stopping) ────────────────
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Gracefully shutting down...');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  } catch (_) {}
  process.exit(0);
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

const start = async () => {
  try {
    await connectDB();
    await seedDefaults();
    connectRedis();
    app.listen(PORT, HOST, () => {
      console.log(`\n🚀 FutureMint API running on ${HOST}:${PORT}\n`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Frontend: ${process.env.FRONTEND_URL || 'not set'}\n`);
    });
  } catch (err) {
    console.error('STARTUP FAILED:', err);
    process.exit(1);
  }
};

start();
