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

const authLimiter = createRateLimiter(
  15 * 60 * 1,
  5,
  'Too many authentication attempts, please try again later'
);

const strictAuthLimiter = createRateLimiter(
  60 * 60 * 1000,
  3,
  'Too many failed attempts, please try again in an hour'
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
  strictAuthLimiter,
  passwordResetLimiter,
  apiLimiter
};
