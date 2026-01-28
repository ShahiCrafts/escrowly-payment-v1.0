const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const {
  helmetConfig,
  sanitizeInput,
  preventParameterPollution,
  xssClean,
  securityHeaders,
  apiLimiter,
  checkMaintenanceMode,
  csrfProtection
} = require('./middleware');
const {
  authRoutes,
  userRoutes,
  escrowRoutes,
  paymentRoutes,
  messageRoutes,
  adminRoutes,
  notificationRoutes
} = require('./routes');
const logger = require('./utils/logger');

const app = express();
// const LOCAL_IP = 'http://192.168.1.5:5173';

app.set('trust proxy', 1);

app.use(helmetConfig);
app.use(securityHeaders);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

// app.use(cors({
//     origin: (origin, callback) => {
//         // allow requests with no origin like mobile apps or curl
//         if (!origin) return callback(null, true);

//         const allowedOrigins = [
//             'http://localhost:5173',
//             'http://127.0.0.1:5173',
//             'http://localhost:3000',
//             'https://www.projecthubnepal.app',
//             'https://projecthubnepal.app',
//             LOCAL_IP
//         ];

//         // Allow all local network IPs dynamically
//         if (origin.startsWith('http://172.26.') || origin.startsWith('http://192.168.')) {
//             return callback(null, true);
//         }

//         if (allowedOrigins.includes(origin)) {
//             return callback(null, true);
//         } else {
//             return callback(new Error('CORS not allowed for this origin'), false);
//         }
//     },
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'x-CSRF-token'],
// }));

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use(sanitizeInput);
app.use(preventParameterPollution);
app.use(xssClean);

app.use(passport.initialize());

app.use('/uploads', express.static('uploads'));

app.use('/api', apiLimiter);
app.use(checkMaintenanceMode);

app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use('/api/auth', authRoutes);
app.use(csrfProtection);

app.use('/api/escrow', escrowRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({
      message: 'Invalid CSRF token. Please refresh the page.'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  if (err.code === 11000) {
    return res.status(400).json({ message: 'Duplicate entry' });
  }

  res.status(500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

module.exports = app;
