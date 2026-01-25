const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const authTemplates = require('../templates/auth.templates');
const transactionTemplates = require('../templates/transaction.templates');

let transporter = null;
let emailConfigured = false;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  emailConfigured = true;
} else {
  console.warn('WARNING: SMTP not configured. Emails will be logged to console instead of sent.');
}

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const sendEmail = async (to, subject, html) => {
  if (!emailConfigured) {
    logger.info(`[DEV EMAIL] To: ${to}`);
    logger.info(`[DEV EMAIL] Subject: ${subject}`);
    logger.info(`[DEV EMAIL] Body: ${html.replace(/<[^>]*>/g, ' ').substring(0, 200)}...`);
    return { messageId: 'dev-mode-email' };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@escrowly.com',
      to,
      subject,
      html
    });
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Email send error:', error);
    throw error;
  }
};

const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${clientUrl}/auth/verify-email?token=${token}`;
  const html = authTemplates.verification(email, token, verifyUrl);
  return sendEmail(email, 'Verify Your Email - Escrowly', html);
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${clientUrl}/auth/reset-password?token=${token}`;
  const html = authTemplates.passwordReset(email, token, resetUrl);
  return sendEmail(email, 'Password Reset - Escrowly', html);
};

const sendMfaOtpEmail = async (email, otp) => {
  const html = authTemplates.mfaOtp(email, otp);
  return sendEmail(email, 'Login Verification Code - Escrowly', html);
};

const sendKYCSubmissionEmail = async (email, name) => {
  const html = transactionTemplates.kycReceived(name);
  return sendEmail(email, 'KYC Documents Received - Escrowly', html);
};

const sendKYCStatusUpdateEmail = async (email, name, status, reason = null) => {
  const html = transactionTemplates.kycStatus(name, status, reason);
  const isApproved = status === 'verified';
  return sendEmail(email, `Identity Verification ${isApproved ? 'Approved' : 'Rejected'} - Escrowly`, html);
};

const sendTransactionNotification = async (email, subject, message) => {
  const html = transactionTemplates.transactionUpdate(subject, message);
  return sendEmail(email, subject, html);
};

const sendFundsReleasedNotification = async (email, amount, transactionTitle) => {
  const html = transactionTemplates.fundsReleased(amount, transactionTitle);
  return sendEmail(email, 'Funds Released - Escrowly', html);
};

const sendDisputeNotification = async (email, transactionTitle, reason) => {
  const html = transactionTemplates.disputeOpened(transactionTitle, reason);
  return sendEmail(email, 'Dispute Opened - Escrowly', html);
};

const sendNewLoginAlert = async (email, ip, deviceInfo) => {
  const html = authTemplates.newLogin(email, ip, deviceInfo);
  return sendEmail(email, 'Security Alert: New Device Login - Escrowly', html);
};

const sendSecurityBreachAlert = async (email) => {
  const html = authTemplates.securityBreach(email);
  return sendEmail(email, 'Critical Security Alert - Escrowly', html);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendMfaOtpEmail,
  sendKYCSubmissionEmail,
  sendKYCStatusUpdateEmail,
  sendTransactionNotification,
  sendFundsReleasedNotification,
  sendDisputeNotification,
  sendNewLoginAlert,
  sendSecurityBreachAlert
};
