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
    // Allow requests with no origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'https://futuremintnft.vercel.app',
    ].filter(Boolean);
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed) || origin === allowed)) {
      return callback(null, true);
    }
    // Also allow any vercel preview deployments
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for now — tighten in production later
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/withdrawal', withdrawalRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'FutureMint NFT API is running', timestamp: new Date() });
});

// Debug: test POST body parsing
app.post('/api/test-body', (req, res) => {
  res.status(200).json({
    body: req.body,
    headers: {
      contentType: req.headers['content-type'],
      contentLength: req.headers['content-length'],
    },
    bodyKeys: Object.keys(req.body || {}),
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
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
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Required for Railway/Docker — binds to all interfaces

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
