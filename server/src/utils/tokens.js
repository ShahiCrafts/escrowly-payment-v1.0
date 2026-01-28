const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const DEV_ACCESS_SECRET = 'dev-access-secret-key-min-32-chars!!';
const DEV_REFRESH_SECRET = 'dev-refresh-secret-key-min-32-chars!';

const getSecrets = () => {
  const parseKey = (key) => {
    if (!key) return null;

    // 1. Remove surrounding quotes (common in .env)
    let clean = key.trim().replace(/^["']|["']$/g, '');

    // 2. Handle literal "\n" strings (often added when keys are copied into .env)
    clean = clean.replace(/\\n/g, '\n');

    // 3. If it doesn't have headers, it might be a raw base64 string or mangled
    if (!clean.includes('-----BEGIN')) {
      // If it looks like it might be a multi-line key that lost its newlines, 
      // but still has the header text in it (unlikely with .trim() and .replace above but possible)
      return null;
    }

    return clean;
  };

  const privateKeyStr = parseKey(process.env.JWT_PRIVATE_KEY);
  const publicKeyStr = parseKey(process.env.JWT_PUBLIC_KEY);

  if (!privateKeyStr || !publicKeyStr) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be set in production');
    }
    const accessSecret = process.env.JWT_ACCESS_SECRET || DEV_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET || DEV_REFRESH_SECRET;
    return { accessSecret, refreshSecret, isRS256: false };
  }

  try {
    // Create KeyObjects to ensure jsonwebtoken handles them correctly as asymmetric keys
    const privateKey = crypto.createPrivateKey(privateKeyStr);
    const publicKey = crypto.createPublicKey(publicKeyStr);

    return { privateKey, publicKey, isRS256: true };
  } catch (error) {
    console.error('[SECURITY ERROR] Failed to create RSA KeyObjects:', error.message);
    if (process.env.NODE_ENV === 'production') throw error;

    // Fallback in dev if keys are malformed
    const accessSecret = process.env.JWT_ACCESS_SECRET || DEV_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET || DEV_REFRESH_SECRET;
    return { accessSecret, refreshSecret, isRS256: false };
  }
};

const generateAccessToken = (userId, tokenVersion, expiresIn) => {
  const secrets = getSecrets();
  const algorithm = secrets.isRS256 ? 'RS256' : 'HS256';
  const key = secrets.isRS256 ? secrets.privateKey : secrets.accessSecret;

  return jwt.sign(
    { userId, tokenVersion },
    key,
    {
      algorithm,
      expiresIn: expiresIn ? `${expiresIn}m` : (process.env.JWT_ACCESS_EXPIRES_IN || '15m')
    }
  );
};

const generateRefreshToken = (userId) => {
  const secrets = getSecrets();
  const algorithm = secrets.isRS256 ? 'RS256' : 'HS256';
  const key = secrets.isRS256 ? secrets.privateKey : secrets.refreshSecret;

  return jwt.sign(
    { userId },
    key,
    {
      algorithm,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    }
  );
};

const verifyAccessToken = (token) => {
  const secrets = getSecrets();
  const options = { algorithms: secrets.isRS256 ? ['RS256'] : ['HS256'] };
  const key = secrets.isRS256 ? secrets.publicKey : secrets.accessSecret;
  return jwt.verify(token, key, options);
};

const verifyRefreshToken = (token) => {
  const secrets = getSecrets();
  const options = { algorithms: secrets.isRS256 ? ['RS256'] : ['HS256'] };
  const key = secrets.isRS256 ? secrets.publicKey : secrets.refreshSecret;
  return jwt.verify(token, key, options);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
