const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { encrypt, decrypt, generateOTP, hashSHA256 } = require('../utils/crypto');

const generateTotpSecret = (email) => {
  const secret = speakeasy.generateSecret({
    name: `Escrowly:${email}`,
    issuer: 'Escrowly'
  });
  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url
  };
};

const generateQRCode = async (otpauthUrl) => {
  return QRCode.toDataURL(otpauthUrl);
};

const verifyTotp = (secret, token) => {
  const decryptedSecret = decrypt(secret) || secret;
  return speakeasy.totp.verify({
    secret: decryptedSecret,
    encoding: 'base32',
    token: token,
    window: 1
  });
};

const generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push({
      code: code,
      hash: hashSHA256(code)
    });
  }
  return codes;
};

const verifyBackupCode = (storedHashes, providedCode) => {
  const providedHash = hashSHA256(providedCode.toUpperCase());

  for (let i = 0; i < storedHashes.length; i++) {
    const decryptedHash = decrypt(storedHashes[i]) || storedHashes[i];
    if (decryptedHash === providedHash) {
      return { valid: true, index: i };
    }
  }

  return { valid: false, index: -1 };
};

const generateEmailOtp = () => {
  const otp = generateOTP(6);
  const hash = hashSHA256(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  return { otp, hash, expiresAt };
};

const verifyEmailOtp = (storedHash, providedOtp, expiresAt) => {
  if (new Date() > expiresAt) {
    return { valid: false, reason: 'expired' };
  }

  const providedHash = hashSHA256(providedOtp);
  if (providedHash !== storedHash) {
    return { valid: false, reason: 'invalid' };
  }

  return { valid: true };
};

const encryptBackupCodes = (codes) => {
  return codes.map(c => encrypt(c.hash));
};

const setupMfa = async (user) => {
  const { secret, otpauthUrl } = generateTotpSecret(user.email);
  const qrCode = await generateQRCode(otpauthUrl);

  user.mfa.secret = encrypt(secret);
  user.mfa.method = 'totp';
  await user.save();

  return { secret, qrCode };
};

const enableMfa = async (user, token) => {
  const isValid = verifyTotp(user.mfa.secret, token);

  if (!isValid) {
    return { success: false, message: 'Invalid verification code' };
  }

  const backupCodes = generateBackupCodes();

  user.mfa.enabled = true;
  user.mfa.backupCodes = encryptBackupCodes(backupCodes);
  await user.save();

  return {
    success: true,
    backupCodes: backupCodes.map(c => ({ code: c.code }))
  };
};

const disableMfa = async (user) => {
  user.mfa.enabled = false;
  user.mfa.secret = undefined;
  user.mfa.backupCodes = [];
  user.mfa.method = 'totp';
  await user.save();

  return { success: true };
};

const regenerateBackupCodes = async (user) => {
  const backupCodes = generateBackupCodes();

  user.mfa.backupCodes = encryptBackupCodes(backupCodes);
  await user.save();

  return { backupCodes: backupCodes.map(c => ({ code: c.code })) };
};

const verifyMfaToken = async (user, token) => {
  if (token.length === 8) {
    const result = verifyBackupCode(user.mfa.backupCodes, token);
    if (result.valid) {
      user.mfa.backupCodes.splice(result.index, 1);
      await user.save();
      return { valid: true, method: 'backup' };
    }
  }

  if (user.mfa.method === 'totp') {
    const isValid = verifyTotp(user.mfa.secret, token);
    return { valid: isValid, method: 'totp' };
  }

  if (user.mfa.method === 'email') {
    const result = verifyEmailOtp(
      user.mfa.emailOtp.code,
      token,
      user.mfa.emailOtp.expiresAt
    );
    if (result.valid) {
      user.mfa.emailOtp = undefined;
      await user.save();
    }
    return { valid: result.valid, method: 'email' };
  }

  return { valid: false };
};

module.exports = {
  generateTotpSecret,
  generateQRCode,
  verifyTotp,
  generateBackupCodes,
  verifyBackupCode,
  generateEmailOtp,
  verifyEmailOtp,
  setupMfa,
  enableMfa,
  disableMfa,
  regenerateBackupCodes,
  verifyMfaToken,
  encryptBackupCodes
};
