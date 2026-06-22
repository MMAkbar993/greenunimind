import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import connectDB from './config/database.js';
import { seedAchievements } from './controllers/achievementController.js';
import path from 'path';
import { fileURLToPath } from 'url';

const requiredEnv = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'];
const missing = requiredEnv.filter((k) => !process.env[k]?.trim());
if (missing.length) {
  console.error('Missing required env vars:', missing.join(', '));
  console.error('Set them in Vercel: Project → Settings → Environment Variables');
  if (!process.env.VERCEL) {
    process.exit(1);
  }
}
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import stripeConnectRoutes from './routes/stripeConnectRoutes.js';
import messagingRoutes from './routes/messagingRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import lectureRoutes from './routes/lectureRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import impactRoutes from './routes/impactRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import revenueRoutes from './routes/revenueRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import oauthRoutes from './routes/oauthRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import subCategoryRoutes from './routes/subCategoryRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

const app = express();

let achievementsSeeded = false;

const ensureDb = async (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  try {
    await connectDB();
    if (!achievementsSeeded) {
      achievementsSeeded = true;
      seedAchievements().catch((err) => console.warn('Achievement seed:', err?.message || err));
    }
    next();
  } catch (err) {
    console.error('Database middleware error:', err.message);
    res.status(503).json({ success: false, message: 'Database unavailable' });
  }
};

// ─── Trust proxy (required for rate limiting behind reverse proxies / Vercel) ───
if (isProduction) {
  app.set('trust proxy', 1);
}

// ─── CORS CONFIGURATION ────────────────────────────────────────────────────────
// Build allowed origins based on environment.
// In production only explicitly trusted domains are permitted.
// In development, localhost variants are included for convenience.
const normalizeOrigin = (origin) => (origin || '').replace(/\/+$/, '');

const buildAllowedOrigins = () => {
  const origins = [];

  if (!isProduction) {
    origins.push(
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:8081',
      'http://localhost:8080',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:8080',
    );
  }

  origins.push(
    'https://green-uni-mindforntend.vercel.app',
    'https://green-uni-mindfrontend.vercel.app',
    'https://www.greenunimind.com',
  );

  if (process.env.CLIENT_URL) {
    process.env.CLIENT_URL.split(',').forEach((u) => {
      const trimmed = u.trim().replace(/\/+$/, '');
      if (trimmed) origins.push(trimmed);
    });
  }

  return [...new Set(origins)];
};

const allowedOrigins = buildAllowedOrigins();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server requests (no Origin header) only in development.
    // In production, requests without an Origin header are blocked for
    // authenticated endpoints (the browser always sends Origin on CORS requests).
    if (!origin) {
      return callback(null, !isProduction);
    }
    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalized)) {
      return callback(null, normalized);
    }
    // Vercel preview deployments (e.g. green-uni-mindforntend-xxx.vercel.app)
    if (/^https:\/\/green-uni-mind[a-z0-9-]*\.vercel\.app$/i.test(normalized)) {
      return callback(null, normalized);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Refresh-Token',
    'X-Requested-With',
    'X-Request-Timestamp',
    'X-Request-Nonce',
    'X-Request-Signature',
    // RTK Query / fetch sends these on some GETs to bypass HTTP caches
    'Cache-Control',
    'Pragma',
    'Expires',
  ],
  exposedHeaders: [
    'RateLimit-Limit',
    'RateLimit-Remaining',
    'RateLimit-Reset',
    'Retry-After',
  ],
  maxAge: 86400,
}));

app.use(ensureDb);

// ─── RATE LIMITING ──────────────────────────────────────────────────────────────
// All limits are configurable via environment variables.
// Key function: uses authenticated user ID when available, falls back to IP.
const userOrIpKey = (req) => {
  if (req.user?.id) return `user_${req.user.id}`;
  return ipKeyGenerator(req.ip);
};

const skipPreflight = (req) => req.method === 'OPTIONS';

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '200', 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  skip: skipPreflight,
});

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '15', 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
  skipSuccessfulRequests: true,
  skip: skipPreflight,
});

const aiLimiter = rateLimit({
  windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.AI_RATE_LIMIT_MAX || '20', 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  message: { success: false, message: 'AI request limit reached. Please wait before trying again.' },
  skip: skipPreflight,
});

const paymentLimiter = rateLimit({
  windowMs: parseInt(process.env.PAYMENT_RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.PAYMENT_RATE_LIMIT_MAX || '30', 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  message: { success: false, message: 'Too many payment requests. Please try again later.' },
  skip: skipPreflight,
});

const uploadLimiter = rateLimit({
  windowMs: parseInt(process.env.UPLOAD_RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '30', 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: userOrIpKey,
  message: { success: false, message: 'Upload limit reached. Please try again later.' },
  skip: skipPreflight,
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
app.use('/api/ai/', aiLimiter);
app.use('/api/payments/', paymentLimiter);
app.use('/api/lectures/', uploadLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(mongoSanitize());
app.use(hpp());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── ROUTES ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/stripe-connect', stripeConnectRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lectures', lectureRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/sub-category', subCategoryRoutes);

app.post('/api/errors', (req, res) => {
  console.error('Client error report:', req.body);
  res.json({ success: true });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'GreenUniMind API is running.' });
});
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'GreenUniMind API is running.' });
});

export default app;

const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  connectDB()
    .then(() => seedAchievements().catch((err) => console.warn('Achievement seed:', err?.message || err)))
    .catch((err) => console.error('Startup DB error:', err.message));
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}
