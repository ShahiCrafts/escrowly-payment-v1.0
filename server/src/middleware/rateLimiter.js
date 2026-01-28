const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false
  });
};

const generalLimiter = createRateLimiter(
  60 * 1000,
  100,
  'Too many requests, please try again later'
);

const authWindowMin = parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES) || 5;
const authMaxAttempts = parseInt(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS) || 20;
const loginWindowMin = parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MINUTES) || 15;
const loginMaxAttempts = parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS) || 10;

const authLimiter = createRateLimiter(
  authWindowMin * 60 * 1000,
  authMaxAttempts,
  `Too many requests, please try again in ${authWindowMin} minutes`
);

const loginLimiter = createRateLimiter(
  loginWindowMin * 60 * 1000,
  loginMaxAttempts,
  `Too many login attempts from this IP, please try again in ${loginWindowMin} minutes`
);

const passwordResetLimiter = createRateLimiter(
  60 * 60 * 1000,
  3,
  'Too many password reset attempts, please try again later'
);

const apiLimiter = createRateLimiter(
  60 * 1000,
  1000,
  'API rate limit exceeded'
);

module.exports = {
  generalLimiter,
  authLimiter,
  loginLimiter,
  passwordResetLimiter,
  apiLimiter
};
