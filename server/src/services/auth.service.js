const https = require('https');
const { User, RefreshToken, AuditLog, SystemSetting, Transaction, Notification, Message, SuspensionAppeal } = require('../models');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokens');
const { generateSecureToken, generateOTP, hashSHA256 } = require('../utils/crypto');
const { encrypt } = require('../utils/crypto');
const emailService = require('./email.service');
const notificationService = require('./notification.service');
const mfaService = require('./mfa.service');
const logger = require('../utils/logger');

const checkPasswordBreached = async (password) => {
  const hash = hashSHA256(password).toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  return new Promise((resolve) => {
    https.get(`https://api.pwnedpasswords.com/range/${prefix}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const lines = data.split('\n');
        for (const line of lines) {
          const [hashSuffix] = line.split(':');
          if (hashSuffix.trim() === suffix) {
            resolve(true);
            return;
          }
        }
        resolve(false);
      });
    }).on('error', () => {
      resolve(false);
    });
  });
};

const register = async (userData, ip, userAgent) => {
  const { email, password, firstName, lastName, phone } = userData;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new Error('Email already registered');
  }

  const isBreached = await checkPasswordBreached(password);
  if (isBreached) {
    throw new Error('This password has been found in data breaches. Please choose a different password.');
  }

  const verificationToken = generateOTP(6);
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = await User.create({
    email: email.toLowerCase(),
    password,
    profile: {
      firstName: firstName,
      lastName: lastName,
      phoneNumber: phone || ''
    },
    role: 'user',
    emailVerification: {
      token: hashSHA256(verificationToken),
      expiresAt: verificationExpires
    }
  });

  await notificationService.notifySecurity(user, 'Verify Your Email', 'Registration verification code', {
    isCritical: true,
    skipInApp: true,
    sendFn: 'sendVerificationEmail',
    args: [verificationToken]
  });

  await AuditLog.logAuth('user_registered', user._id, 'success', { ip, get: () => userAgent }, { email });

  const setting = await SystemSetting.findOne({ key: 'sessionTimeoutMinutes' });
  const sessionTimeout = setting?.value || 15;
  const accessToken = generateAccessToken(user._id, sessionTimeout);
  const refreshToken = generateRefreshToken(user._id);

  await RefreshToken.createToken(user, refreshToken, ip, userAgent);

  return {
    user: user.toJSON(),
    token: accessToken,
    refreshToken
  };
};

const login = async (email, password, mfaToken, ip, userAgent) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    await AuditLog.logAuth('login_failed', null, 'failure', { ip, get: () => userAgent }, { email, reason: 'user_not_found' });
    throw new Error('Invalid credentials');
  }

  // Fetch security settings
  const settingsList = await SystemSetting.find({ key: { $in: ['maxLoginAttempts', 'lockoutDurationMinutes', 'sessionTimeoutMinutes'] } });
  const settings = settingsList.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
  const maxAttempts = settings.maxLoginAttempts || 5;
  const lockoutDuration = settings.lockoutDurationMinutes || 30;
  const sessionTimeout = settings.sessionTimeoutMinutes || 15;

  if (user.isLocked()) {
    const lockoutRemaining = Math.ceil((user.security.lockoutUntil - Date.now()) / 60000);
    await AuditLog.logAuth('login_blocked', user._id, 'failure', { ip, get: () => userAgent }, { reason: 'account_locked' });
    throw new Error(`Account locked. Try again in ${lockoutRemaining} minutes.`);
  }

  // if (user.isSuspended) {
  //   await AuditLog.logAuth('login_blocked', user._id, 'failure', { ip, get: () => userAgent }, { reason: 'account_suspended' });
  //   throw new Error('Account suspended');
  // }

  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    user.security.failedLoginAttempts += 1;
    if (user.security.failedLoginAttempts >= maxAttempts) {
      user.security.lockoutUntil = new Date(Date.now() + lockoutDuration * 60 * 1000);
    }
    await user.save();

    await AuditLog.logAuth('login_failed', user._id, 'failure', { ip, get: () => userAgent }, { reason: 'invalid_password', attempts: user.security.failedLoginAttempts });
    throw new Error('Invalid credentials');
  }

  if (user.mfa.enabled) {
    if (!mfaToken) {
      if (user.mfa.method === 'email') {
        const { otp, hash, expiresAt } = mfaService.generateEmailOtp();
        user.mfa.emailOtp = { code: hash, expiresAt };
        await user.save();
        await notificationService.notifySecurity(user, 'Login Verification', 'MFA OTP code', {
          isCritical: true,
          sendFn: 'sendMfaOtpEmail',
          args: [otp]
        });
      }
      return { mfaRequired: true, mfaMethod: user.mfa.method };
    }

    const mfaResult = await mfaService.verifyMfaToken(user, mfaToken);
    if (!mfaResult.valid) {
      await AuditLog.logAuth('mfa_failed', user._id, 'failure', { ip, get: () => userAgent }, { method: user.mfa.method });
      throw new Error('Invalid MFA token');
    }
    await AuditLog.logAuth('mfa_verified', user._id, 'success', { ip, get: () => userAgent }, { method: mfaResult.method });
  }

  if (!user.isEmailVerified) {
    await resendVerification(user._id);
    throw new Error('Your email is not verified. A new verification link has been sent to your email.');
  }

  if (user.isPasswordExpired()) {
    return {
      passwordExpired: true,
      message: 'Your password has expired. Please change your password.'
    };
  }

  await user.resetFailedAttempts();

  const isNewIp = user.security.lastLoginIp && user.security.lastLoginIp !== ip;

  user.security.lastLogin = new Date();
  user.security.lastLoginIp = ip;
  await user.save();

  if (isNewIp) {
    await notificationService.notifySecurity(user, 'New Login Detected', `A new login from IP ${ip} was detected.`, {
      sendFn: 'sendNewLoginAlert',
      args: [ip, userAgent]
    });
  }

  await AuditLog.logAuth('user_login', user._id, 'success', { ip, get: () => userAgent }, {});

  const accessToken = generateAccessToken(user._id, sessionTimeout);
  const refreshToken = generateRefreshToken(user._id);

  await RefreshToken.createToken(user, refreshToken, ip, userAgent);

  return {
    user: user.toJSON(),
    token: accessToken,
    refreshToken
  };
};

const refreshAccessToken = async (refreshToken, ip, userAgent) => {
  const tokenDoc = await RefreshToken.findByToken(refreshToken);

  if (!tokenDoc || !tokenDoc.isActive) {
    if (tokenDoc && tokenDoc.revokedAt) {
      await RefreshToken.revokeAllUserTokens(tokenDoc.user, ip);
      logger.warn('Refresh token reuse detected', { userId: tokenDoc.user });
    }
    throw new Error('Invalid refresh token');
  }

  const user = await User.findById(tokenDoc.user);
  if (!user || user.isSuspended) {
    throw new Error('User not found or suspended');
  }

  tokenDoc.revokedAt = new Date();
  tokenDoc.revokedByIp = ip;
  await tokenDoc.save();

  const setting = await SystemSetting.findOne({ key: 'sessionTimeoutMinutes' });
  const sessionTimeout = setting?.value || 15;
  const newAccessToken = generateAccessToken(user._id, sessionTimeout);
  const newRefreshToken = generateRefreshToken(user._id);

  const newTokenDoc = await RefreshToken.createToken(user, newRefreshToken, ip, userAgent);
  tokenDoc.replacedByTokenHash = newTokenDoc.tokenHash;
  await tokenDoc.save();

  return {
    token: newAccessToken,
    refreshToken: newRefreshToken
  };
};

const logout = async (refreshToken, ip) => {
  if (refreshToken) {
    await RefreshToken.revokeToken(refreshToken, ip);
  }
};

const logoutAll = async (userId, ip) => {
  await RefreshToken.revokeAllUserTokens(userId, ip);
  await AuditLog.logAuth('logout_all', userId, 'success', { ip, get: () => '' }, {});
};

const verifyEmail = async (token, ip, userAgent) => {
  const tokenHash = hashSHA256(token);

  const user = await User.findOne({
    'emailVerification.token': tokenHash,
    'emailVerification.expiresAt': { $gt: new Date() }
  });

  if (!user) {
    throw new Error('Invalid or expired verification token');
  }

  user.isEmailVerified = true;
  user.emailVerification = undefined;
  await user.save();

  await AuditLog.logAuth('email_verified', user._id, 'success', { ip, get: () => userAgent }, {});

  const setting = await SystemSetting.findOne({ key: 'sessionTimeoutMinutes' });
  const sessionTimeout = setting?.value || 15;
  const accessToken = generateAccessToken(user._id, sessionTimeout);
  const refreshToken = generateRefreshToken(user._id);

  await RefreshToken.createToken(user, refreshToken, ip, userAgent);

  return {
    user: user.toJSON(),
    token: accessToken,
    refreshToken
  };
};

const resendVerification = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  if (user.isEmailVerified) {
    throw new Error('Email already verified');
  }

  const verificationToken = generateOTP(6);
  user.emailVerification = {
    token: hashSHA256(verificationToken),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  };
  await user.save();

  await notificationService.notifySecurity(user, 'Verify Your Email', 'Verification code resent', {
    isCritical: true,
    skipInApp: true,
    sendFn: 'sendVerificationEmail',
    args: [verificationToken]
  });

  return { message: 'Verification email sent' };
};

const forgotPassword = async (email, ip, userAgent) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return { message: 'If the email exists, a reset link will be sent' };
  }

  const resetToken = generateSecureToken();
  user.passwordResetToken = hashSHA256(resetToken);
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  await notificationService.notifySecurity(user, 'Password Reset', 'Password reset link sent', {
    isCritical: true,
    sendFn: 'sendPasswordResetEmail',
    args: [resetToken]
  });
  await AuditLog.logAuth('password_reset_requested', user._id, 'success', { ip, get: () => userAgent }, {});

  return { message: 'If the email exists, a reset link will be sent' };
};

const resetPassword = async (token, newPassword, ip, userAgent) => {
  const tokenHash = hashSHA256(token);

  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  const isBreached = await checkPasswordBreached(newPassword);
  if (isBreached) {
    throw new Error('This password has been found in data breaches. Please choose a different password.');
  }

  const isInHistory = await user.isPasswordInHistory(newPassword);
  if (isInHistory) {
    throw new Error('Cannot reuse recent passwords');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.security.mustChangePassword = false;
  await user.save();

  await RefreshToken.revokeAllUserTokens(user._id, ip);
  await AuditLog.logAuth('password_reset', user._id, 'success', { ip, get: () => userAgent }, {});

  return { message: 'Password reset successful' };
};

const changePassword = async (userId, currentPassword, newPassword, ip, userAgent) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  const isValid = await user.comparePassword(currentPassword);
  if (!isValid) {
    await AuditLog.logAuth('password_change_failed', userId, 'failure', { ip, get: () => userAgent }, { reason: 'invalid_current_password' });
    throw new Error('Current password is incorrect');
  }

  const isBreached = await checkPasswordBreached(newPassword);
  if (isBreached) {
    throw new Error('This password has been found in data breaches. Please choose a different password.');
  }

  const isInHistory = await user.isPasswordInHistory(newPassword);
  if (isInHistory) {
    throw new Error('Cannot reuse recent passwords');
  }

  user.password = newPassword;
  user.security.mustChangePassword = false;
  await user.save();

  await RefreshToken.revokeAllUserTokens(user._id, ip);
  await AuditLog.logAuth('password_changed', userId, 'success', { ip, get: () => userAgent }, {});

  return { message: 'Password changed successfully' };
};

const getSessions = async (userId) => {
  const sessions = await RefreshToken.getActiveSessions(userId);
  return sessions.map(s => ({
    id: s._id,
    userAgent: s.userAgent,
    ipAddress: s.createdByIp,
    createdAt: s.createdAt
  }));
};

const revokeSession = async (userId, sessionId, ip) => {
  const session = await RefreshToken.findOne({ _id: sessionId, user: userId });

  if (!session) {
    throw new Error('Session not found');
  }

  session.revokedAt = new Date();
  session.revokedByIp = ip;
  await session.save();

  return { message: 'Session revoked' };
};

const deleteAccount = async (userId, ip, userAgent) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Define active statuses that block deletion
  const activeStatuses = ['accepted', 'funded', 'delivered', 'disputed'];

  // Check if user has any active transactions as buyer or seller
  const activeTransactions = await Transaction.findOne({
    $and: [
      {
        $or: [
          { buyer: userId },
          { seller: userId }
        ]
      },
      { status: { $in: activeStatuses } }
    ]
  });

  if (activeTransactions) {
    throw new Error('Cannot delete account while you have active transactions. Please complete or cancel them first.');
  }

  // Erase User data and related records
  await RefreshToken.deleteMany({ user: userId });
  await Notification.deleteMany({ userId: userId });
  await Message.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] });
  await SuspensionAppeal.deleteMany({ user: userId });

  // We keep AuditLogs for security/compliance but they are naturally linked to a deleted ID
  await AuditLog.logAuth('account_deleted', userId, 'success', { ip, get: () => userAgent }, { email: user.email });

  await User.findByIdAndDelete(userId);

  return { message: 'Account deleted successfully' };
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  logoutAll,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  getSessions,
  revokeSession,
  deleteAccount,
  checkPasswordBreached
};
