const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const DEV_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

let warnedAboutKey = false;

const getEncryptionKey = () => {
  let key = process.env.ENCRYPTION_KEY;

  if (!key || key.length !== 64) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes) in production');
    }
    if (!warnedAboutKey) {
      console.warn('WARNING: Using default ENCRYPTION_KEY for development. Set ENCRYPTION_KEY in .env for production.');
      warnedAboutKey = true;
    }
    key = DEV_ENCRYPTION_KEY;
  }

  return Buffer.from(key, 'hex');
};

const encrypt = (text) => {
  if (!text) return null;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

const decrypt = (encryptedText) => {
  try {
    if (!encryptedText) return null;

    const parts = encryptedText.split(':');
    if (parts.length !== 3) return null;

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    return null; // Return null instead of throwing to prevent server crash during serialization
  }
};

const hashSHA256 = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i] % 10];
  }
  return otp;
};

module.exports = {
  encrypt,
  decrypt,
  hashSHA256,
  generateSecureToken,
  generateOTP
};
