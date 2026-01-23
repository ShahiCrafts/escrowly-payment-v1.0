const jwt = require('jsonwebtoken');

const DEV_ACCESS_SECRET = 'dev-access-secret-key-min-32-chars!!';
const DEV_REFRESH_SECRET = 'dev-refresh-secret-key-min-32-chars!';

let warnedAboutSecrets = false;

const getSecrets = () => {
  let accessSecret = process.env.JWT_ACCESS_SECRET;
  let refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!accessSecret || !refreshSecret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in production');
    }
    if (!warnedAboutSecrets) {
      console.warn('WARNING: Using default JWT secrets for development. Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in .env for production.');
      warnedAboutSecrets = true;
    }
    accessSecret = accessSecret || DEV_ACCESS_SECRET;
    refreshSecret = refreshSecret || DEV_REFRESH_SECRET;
  }

  return { accessSecret, refreshSecret };
};

const generateAccessToken = (userId, expiresIn) => {
  const { accessSecret } = getSecrets();
  return jwt.sign(
    { userId },
    accessSecret,
    { expiresIn: expiresIn ? `${expiresIn}m` : (process.env.JWT_ACCESS_EXPIRES_IN || '15m') }
  );
};

const generateRefreshToken = (userId) => {
  const { refreshSecret } = getSecrets();
  return jwt.sign(
    { userId },
    refreshSecret,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

const verifyAccessToken = (token) => {
  const { accessSecret } = getSecrets();
  return jwt.verify(token, accessSecret);
};

const verifyRefreshToken = (token) => {
  const { refreshSecret } = getSecrets();
  return jwt.verify(token, refreshSecret);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
