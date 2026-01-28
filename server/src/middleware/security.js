const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const csrf = require('csurf');
const xss = require('xss');

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/", "https://js.stripe.com"],
      imgSrc: ["'self'", 'data:', 'https:', 'res.cloudinary.com'],
      connectSrc: ["'self'", 'https://api.stripe.com', 'https://www.google.com/recaptcha/', 'res.cloudinary.com'],
      frameSrc: ["'self'", 'https://js.stripe.com', 'https://www.google.com/recaptcha/', 'https://hooks.stripe.com'],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false
});

const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized key: ${key}`);
  }
});

const preventParameterPollution = hpp({
  whitelist: ['status', 'sort', 'page', 'limit']
});

const xssClean = (req, res, next) => {
  // Skip XSS cleaning for OAuth callbacks as it mangles the 'code' parameter (contains slashes)
  if (req.path === '/api/auth/google/callback') {
    return next();
  }

  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }
  next();
};

const sanitizeObject = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = xss(obj[key]);
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
};

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  next();
};

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    signed: true
  },
  value: (req) => req.headers['x-csrf-token']
});

module.exports = {
  helmetConfig,
  sanitizeInput,
  preventParameterPollution,
  xssClean,
  securityHeaders,
  csrfProtection
};
