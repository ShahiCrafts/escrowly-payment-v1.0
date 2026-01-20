const express = require('express');
const passport = require('passport');
const router = express.Router();
const { authController } = require('../controllers');
const { authenticate, authLimiter, passwordResetLimiter, conditionalCaptcha, validators } = require('../middleware');

router.post('/register', authLimiter, validators.registerValidation, authController.register);

router.post('/login', authLimiter, conditionalCaptcha, validators.loginValidation, authController.login);

router.post('/refresh', authController.refresh);

router.post('/logout', authController.logout);

router.post('/logout-all', authenticate, authController.logoutAll);

router.get('/me', authenticate, authController.getMe);
router.delete('/account', authenticate, authController.deleteAccount);

router.post('/verify-email', authController.verifyEmail);

router.post('/resend-verification', authenticate, authController.resendVerification);

router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);

router.post('/reset-password', passwordResetLimiter, validators.resetPasswordValidation, authController.resetPassword);

router.post('/change-password', authenticate, validators.changePasswordValidation, authController.changePassword);

router.post('/mfa/setup', authenticate, authController.setupMfa);

router.post('/mfa/enable', authenticate, authController.enableMfa);

router.post('/mfa/disable', authenticate, authController.disableMfa);

router.post('/mfa/backup-codes', authenticate, authController.getBackupCodes);

router.post('/mfa/regenerate-backup-codes', authenticate, authController.getBackupCodes);

router.get('/sessions', authenticate, authController.getSessions);

router.delete('/sessions/:sessionId', authenticate, authController.revokeSession);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth_failed` }),
  authController.googleCallback
);

module.exports = router;
