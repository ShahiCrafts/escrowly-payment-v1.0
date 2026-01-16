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
  apiLimiter
} = require('./middleware');
const {
  authRoutes,
  escrowRoutes,
  paymentRoutes,
  userRoutes,
  messageRoutes,
  adminRoutes
} = require('./routes');
const logger = require('./utils/logger');

const app = express();

app.set('trust proxy', 1);

app.use(helmetConfig);
app.use(securityHeaders);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(sanitizeInput);
app.use(preventParameterPollution);
app.use(xssClean);

app.use(passport.initialize());

app.use('/uploads', express.static('uploads'));

app.use('/api', apiLimiter);

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: 'csrf-token-placeholder' });
});

app.use('/api/auth', authRoutes);
app.use('/api/escrow', escrowRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });

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
