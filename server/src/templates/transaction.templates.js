const baseLayout = require('./layout');

const transactionTemplates = {
    kycStatus: (name, status, reason = null) => {
        const isApproved = status === 'verified';
        const color = isApproved ? '#16a34a' : '#dc2626';
        const title = isApproved ? 'Identity Verification Approved' : 'Identity Verification Rejected';

        const content = isApproved
            ? `
                <p>Hello ${name},</p>
                <p>Great news! Your identity verification has been <strong>approved</strong>. Your account limits have been increased, and you now have full access to all features.</p>
                <div class="alert-box alert-success">
                    Identity Verified successfully!
                </div>
            `
            : `
                <p>Hello ${name},</p>
                <p>We were unable to verify your identity at this time.</p>
                <div class="alert-box alert-danger">
                    <strong>Reason:</strong> ${reason || 'Documents were unclear or did not match the provided information.'}
                </div>
                <p>Please log in and re-submit your documents in accordance with the feedback above.</p>
            `;
        return baseLayout(content, title, color);
    },

    kycReceived: (name) => {
        const content = `
            <p>Hello ${name},</p>
            <p>We've received your identity verification documents. Our compliance team is currently reviewing your submission.</p>
            <div class="alert-box alert-info">
                <strong>Status:</strong> Under Review
            </div>
            <p>The review process typically takes 48-72 hours. You'll receive a notification as soon as your status is updated.</p>
        `;
        return baseLayout(content, 'KYC Documents Received', '#3b82f6');
    },

    transactionUpdate: (subject, message) => {
        const content = `
            <p>${message}</p>
            <div class="alert-box alert-info">
                Check your dashboard for the latest details on this transaction.
            </div>
        `;
        return baseLayout(content, subject, '#3b82f6');
    },

    fundsReleased: (amount, transactionTitle) => {
        const content = `
            <p>Funds for your transaction <strong>"${transactionTitle}"</strong> have been released.</p>
            <div class="alert-box alert-success">
                <strong>Amount Released:</strong> Rs. ${amount.toLocaleString()}
            </div>
            <p>The funds should be available in your balance shortly.</p>
        `;
        return baseLayout(content, 'Payment Received Successfully', '#16a34a');
    },

    disputeOpened: (transactionTitle, reason) => {
        const content = `
            <p>A dispute has been opened for the transaction <strong>"${transactionTitle}"</strong>.</p>
            <div class="alert-box alert-warning">
                <strong>Dispute Reason:</strong> ${reason}
            </div>
            <p>Please log in to the dashboard to respond to the dispute and provide your evidence.</p>
        `;
        return baseLayout(content, 'Transaction Under Dispute', '#f97316');
    }
};

module.exports = transactionTemplates;
