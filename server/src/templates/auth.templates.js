const baseLayout = require('./layout');

const authTemplates = {
    verification: (email, token, verifyUrl) => {
        const content = `
            <p>Welcome to Escrowly! Please verify your email address to activate your account.</p>
            <div style="text-align: center;">
                <a href="${verifyUrl}" class="btn">Verify Email Address</a>
            </div>
            <p>Or use this verification code:</p>
            <div class="otp-box">${token}</div>
            <p style="font-size: 13px; color: #94a3b8;">This link expires in 24 hours.</p>
        `;
        return baseLayout(content, 'Verify Your Email Address', '#3b82f6');
    },

    passwordReset: (email, token, resetUrl) => {
        const content = `
            <p>You requested a password reset for your Escrowly account.</p>
            <div style="text-align: center;">
                <a href="${resetUrl}" class="btn">Reset Password</a>
            </div>
            <p>If you didn't request this, please ignore this email. No changes will be made to your account.</p>
            <p style="font-size: 13px; color: #94a3b8;">This link expires in 1 hour.</p>
        `;
        return baseLayout(content, 'Password Reset Request', '#3b82f6');
    },

    mfaOtp: (email, otp) => {
        const content = `
            <p>Your login verification code is:</p>
            <div class="otp-box">${otp}</div>
            <p>This code expires in 10 minutes.</p>
            <p class="alert-box alert-danger">If you didn't request this, please secure your account immediately.</p>
        `;
        return baseLayout(content, 'Login Verification Code', '#3b82f6');
    },

    newLogin: (email, ip, deviceInfo) => {
        const content = `
            <p>A new login was detected for your account from an unrecognized device or location.</p>
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 8px 0; font-size: 14px;"><strong>Device:</strong> ${deviceInfo}</p>
                <p style="margin: 0; font-size: 14px;"><strong>IP Address:</strong> ${ip}</p>
            </div>
            <p>If this was you, you can safely ignore this email. If this was not you, please <strong>change your password</strong> immediately.</p>
        `;
        return baseLayout(content, 'New Device Login Detected', '#f59e0b');
    },

    securityBreach: (email) => {
        const content = `
            <div class="alert-box alert-danger">
                <strong>CRITICAL SECURITY ALERT</strong>
                <p>We detected an unauthorized attempt to access your account using an old session. For your protection, we have logged you out of all devices.</p>
            </div>
            <p>Please log in again and update your password immediately to ensure your account remains secure.</p>
        `;
        return baseLayout(content, 'Unauthorized Session Detected', '#dc2626');
    }
};

module.exports = authTemplates;
