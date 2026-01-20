const { authService, mfaService } = require('../services');
const { AuditLog } = require('../models');

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const register = async (req, res) => {
  try {
    const result = await authService.register(
      req.body,
      req.ip,
      req.get('user-agent')
    );

    setRefreshTokenCookie(res, result.refreshToken);

    res.status(201).json({
      user: result.user,
      token: result.token
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, mfaToken } = req.body;

    const result = await authService.login(
      email,
      password,
      mfaToken,
      req.ip,
      req.get('user-agent')
    );

    if (result.mfaRequired) {
      return res.status(200).json({
        mfaRequired: true,
        mfaMethod: result.mfaMethod
      });
    }

    if (result.passwordExpired) {
      return res.status(200).json({
        passwordExpired: true,
        message: result.message
      });
    }

    setRefreshTokenCookie(res, result.refreshToken);

    res.json({
      user: result.user,
      token: result.token
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const result = await authService.refreshAccessToken(
      refreshToken,
      req.ip,
      req.get('user-agent')
    );

    setRefreshTokenCookie(res, result.refreshToken);

    res.json({ token: result.token });
  } catch (error) {
    res.clearCookie('refreshToken');
    res.status(401).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    await authService.logout(refreshToken, req.ip);

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logoutAll = async (req, res) => {
  try {
    await authService.logoutAll(req.user._id, req.ip);

    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    res.json({ user: req.user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const result = await authService.verifyEmail(
      token,
      req.ip,
      req.get('user-agent')
    );

    setRefreshTokenCookie(res, result.refreshToken);

    res.json({
      user: result.user,
      token: result.token
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const resendVerification = async (req, res) => {
  try {
    const result = await authService.resendVerification(req.user._id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const result = await authService.forgotPassword(
      req.body.email,
      req.ip,
      req.get('user-agent')
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const result = await authService.resetPassword(
      token,
      password,
      req.ip,
      req.get('user-agent')
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePassword(
      req.user._id,
      currentPassword,
      newPassword,
      req.ip,
      req.get('user-agent')
    );

    res.clearCookie('refreshToken');
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const setupMfa = async (req, res) => {
  try {
    const result = await mfaService.setupMfa(req.user);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const enableMfa = async (req, res) => {
  try {
    const { token } = req.body;
    const result = await mfaService.enableMfa(req.user, token);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    await AuditLog.logSecurity('mfa_enabled', req.user._id, 'success', req, {});

    res.json({ backupCodes: result.backupCodes });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const disableMfa = async (req, res) => {
  try {
    const { password } = req.body;

    const isValid = await req.user.comparePassword(password);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    await mfaService.disableMfa(req.user);
    await AuditLog.logSecurity('mfa_disabled', req.user._id, 'success', req, {});

    res.json({ message: 'MFA disabled' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getBackupCodes = async (req, res) => {
  try {
    const { password } = req.body;

    const isValid = await req.user.comparePassword(password);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const result = await mfaService.regenerateBackupCodes(req.user);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getSessions = async (req, res) => {
  try {
    const sessions = await authService.getSessions(req.user._id);
    res.json({ sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const revokeSession = async (req, res) => {
  try {
    const result = await authService.revokeSession(
      req.user._id,
      req.params.sessionId,
      req.ip
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const result = await authService.deleteAccount(
      req.user._id,
      req.ip,
      req.get('user-agent')
    );
    res.clearCookie('refreshToken');
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    const { generateAccessToken, generateRefreshToken } = require('../utils/tokens');
    const { RefreshToken } = require('../models');

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await RefreshToken.createToken(user, refreshToken, req.ip, req.get('user-agent'));

    setRefreshTokenCookie(res, refreshToken);

    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${accessToken}`);
  } catch (error) {
    res.redirect(`${process.env.CLIENT_URL}/auth/login?error=oauth_failed`);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  setupMfa,
  enableMfa,
  disableMfa,
  getBackupCodes,
  getSessions,
  revokeSession,
  deleteAccount,
  googleCallback
};
