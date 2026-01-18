const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

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

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${clientUrl}/auth/verify-email?token=${token}`;
  const html = `
    <h1>Email Verification</h1>
    <p>Please verify your email by clicking the link below:</p>
    <a href="${verifyUrl}">Verify Email</a>
    <p>Or use this code: <strong>${token}</strong></p>
    <p>This link expires in 24 hours.</p>
  `;
  return sendEmail(email, 'Verify Your Email - Escrowly', html);
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${clientUrl}/auth/reset-password?token=${token}`;
  const html = `
    <h1>Password Reset</h1>
    <p>You requested a password reset. Click the link below:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>This link expires in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  return sendEmail(email, 'Password Reset - Escrowly', html);
};

const sendMfaOtpEmail = async (email, otp) => {
  const html = `
    <h1>Login Verification Code</h1>
    <p>Your verification code is: <strong>${otp}</strong></p>
    <p>This code expires in 10 minutes.</p>
    <p>If you didn't request this, please secure your account immediately.</p>
  `;
  return sendEmail(email, 'Login Verification Code - Escrowly', html);
};

const sendTransactionNotification = async (email, subject, message) => {
  const html = `
    <h1>${subject}</h1>
    <p>${message}</p>
    <p><a href="${clientUrl}/dashboard">View Dashboard</a></p>
  `;
  return sendEmail(email, `${subject} - Escrowly`, html);
};

const sendNewLoginAlert = async (email, ip, userAgent) => {
  const html = `
    <h1>New Login Detected</h1>
    <p>A new login to your account was detected:</p>
    <ul>
      <li>IP Address: ${ip}</li>
      <li>Device: ${userAgent}</li>
      <li>Time: ${new Date().toISOString()}</li>
    </ul>
    <p>If this wasn't you, please change your password immediately.</p>
  `;
  return sendEmail(email, 'New Login Alert - Escrowly', html);
};

const sendDisputeNotification = async (email, transactionTitle, role) => {
  const html = `
    <h1>Dispute Raised</h1>
    <p>A dispute has been raised on the transaction: <strong>${transactionTitle}</strong></p>
    <p>You are the ${role} in this transaction.</p>
    <p>Our team will review the case and contact both parties.</p>
    <p><a href="${clientUrl}/dashboard">View Details</a></p>
  `;
  return sendEmail(email, 'Dispute Raised - Escrowly', html);
};

const sendFundsReleasedNotification = async (email, transactionTitle, amount, currency) => {
  const html = `
    <h1>Funds Released</h1>
    <p>Funds have been released for transaction: <strong>${transactionTitle}</strong></p>
    <p>Amount: ${amount} ${currency.toUpperCase()}</p>
    <p>The funds will be transferred to your connected account.</p>
    <p><a href="${clientUrl}/dashboard">View Dashboard</a></p>
  `;
  return sendEmail(email, 'Funds Released - Escrowly', html);
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendMfaOtpEmail,
  sendTransactionNotification,
  sendNewLoginAlert,
  sendDisputeNotification,
  sendFundsReleasedNotification
};
