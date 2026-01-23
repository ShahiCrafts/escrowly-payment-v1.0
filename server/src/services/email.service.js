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

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

const baseEmailTemplate = (content, title, color = '#3b82f6') => `
  <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #f1f5f9; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
    <div style="background: ${color}; padding: 32px 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Escrowly</h1>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="color: #0f172a; margin: 0 0 24px 0; font-size: 18px; font-weight: 700;">${title}</h2>
      <div style="color: #475569; font-size: 15px; line-height: 1.6;">
        ${content}
      </div>
      <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          &copy; ${new Date().getFullYear()} Escrowly. All rights reserved.<br>
          Secure Online Transactions Professionals.
        </p>
      </div>
    </div>
  </div>
`;

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
  const content = `
    <p>Please verify your email address to activate your Escrowly account.</p>
    <div style="margin: 32px 0;">
      <a href="${verifyUrl}" style="background: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Verify Email Address</a>
    </div>
    <p>Or use this verification code:</p>
    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: 700; color: #1e293b; letter-spacing: 4px;">
      ${token}
    </div>
    <p style="margin-top: 24px; font-size: 13px; color: #94a3b8;">This link expires in 24 hours.</p>
  `;
  return sendEmail(email, 'Verify Your Email - Escrowly', baseEmailTemplate(content, 'Email Verification'));
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${clientUrl}/auth/reset-password?token=${token}`;
  const content = `
    <p>You requested a password reset for your Escrowly account.</p>
    <div style="margin: 32px 0;">
      <a href="${resetUrl}" style="background: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Reset Password</a>
    </div>
    <p>If you didn't request this, please ignore this email. No changes will be made to your account.</p>
    <p style="margin-top: 24px; font-size: 13px; color: #94a3b8;">This link expires in 1 hour.</p>
  `;
  return sendEmail(email, 'Password Reset - Escrowly', baseEmailTemplate(content, 'Password Reset'));
};

const sendMfaOtpEmail = async (email, otp) => {
  const content = `
    <p>Your login verification code is:</p>
    <div style="background: #f8fafc; padding: 16px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: 700; color: #1e293b; letter-spacing: 4px; margin: 24px 0;">
      ${otp}
    </div>
    <p>This code expires in 10 minutes.</p>
    <p style="margin-top: 24px; font-size: 13px; color: #ef4444;">If you didn't request this, please secure your account immediately.</p>
  `;
  return sendEmail(email, 'Login Verification Code - Escrowly', baseEmailTemplate(content, 'Login Verification'));
};

const sendKYCSubmissionEmail = async (email, name) => {
  const content = `
    <p>Hello ${name},</p>
    <p>We've received your identity verification documents. Our compliance team is currently reviewing your submission.</p>
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; font-weight: 600; color: #1e40af;">Status: Under Review</p>
    </div>
    <p>The review process typically takes 48-72 hours. You'll receive a notification as soon as your status is updated.</p>
  `;
  return sendEmail(email, 'KYC Documents Received - Escrowly', baseEmailTemplate(content, 'Identity Verification In Progress'));
};

const sendKYCStatusUpdateEmail = async (email, name, status, reason = null) => {
  const isApproved = status === 'verified';
  const color = isApproved ? '#16a34a' : '#dc2626';
  const title = isApproved ? 'Verification Approved' : 'Verification Rejected';

  const content = isApproved
    ? `<p>Hello ${name},</p>
       <p>Great news! Your identity verification has been <strong>approved</strong>. Your account limits have been increased, and you now have full access to all features.</p>
       <div style="margin: 32px 0;">
         <a href="${clientUrl}/dashboard" style="background: #16a34a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Go to Dashboard</a>
       </div>`
    : `<p>Hello ${name},</p>
       <p>We were unable to verify your identity at this time.</p>
       <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0;">
         <p style="margin: 0; font-weight: 600; color: #991b1b;">Reason: ${reason || 'Documents were unclear or did not match the provided information.'}</p>
       </div>
       <p>Please log in and re-submit your documents in accordance with the feedback above.</p>
       <div style="margin: 32px 0;">
         <a href="${clientUrl}/dashboard/settings" style="background: #dc2626; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Update Documents</a>
       </div>`;

  return sendEmail(email, `Identity Verification ${isApproved ? 'Approved' : 'Rejected'} - Escrowly`, baseEmailTemplate(content, title, color));
};

const sendTransactionNotification = async (email, subject, message) => {
  const content = `
    <p>${message}</p>
    <div style="margin: 32px 0;">
      <a href="${clientUrl}/dashboard/transactions" style="background: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">View Transaction</a>
    </div>
  `;
  return sendEmail(email, subject, baseEmailTemplate(content, 'Transaction Update'));
};

const sendFundsReleasedNotification = async (email, amount, transactionTitle) => {
  const content = `
    <p>Funds for your transaction <strong>"${transactionTitle}"</strong> have been released.</p>
    <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; font-weight: 600; color: #166534;">Amount Released: Rs. ${amount.toLocaleString()}</p>
    </div>
    <p>The funds should be available in your balance shortly.</p>
  `;
  return sendEmail(email, 'Funds Released - Escrowly', baseEmailTemplate(content, 'Payment Received', '#16a34a'));
};

const sendDisputeNotification = async (email, transactionTitle, reason) => {
  const content = `
    <p>A dispute has been opened for the transaction <strong>"${transactionTitle}"</strong>.</p>
    <div style="background: #fff7ed; border-left: 4px solid #f97316; padding: 16px; margin: 24px 0;">
      <p style="margin: 0; font-weight: 600; color: #9a3412;">Reason: ${reason}</p>
    </div>
    <p>Please log in to the dashboard to respond to the dispute.</p>
  `;
  return sendEmail(email, 'Dispute Opened - Escrowly', baseEmailTemplate(content, 'Transaction Disputed', '#f97316'));
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
  sendDisputeNotification
};
