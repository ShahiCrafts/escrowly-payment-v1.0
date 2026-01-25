const { Notification, User } = require('../models');
const emailService = require('./email.service');
const logger = require('../utils/logger');
const { emitNotification } = require('../socket');

/**
 * Centralized service to handle all notifications (in-app and email)
 * and respect user preferences.
 */
class NotificationService {
    /**
     * Send a transaction-related notification
     * @param {ObjectId|Object} user - User ID or User object
     * @param {String} title - Notification title
     * @param {String} message - Notification message
     * @param {String} type - Notification type (payment, dispute, transaction, etc.)
     * @param {Object} metadata - Optional metadata (transactionId, actionUrl)
     * @param {Object} emailOptions - Optional email overrides (subject, template function)
     */
    async notifyTransaction(user, title, message, type = 'transaction', metadata = {}, emailOptions = {}) {
        try {
            const userObj = await this._getUser(user);
            if (!userObj) return;

            console.log(`[NOTIFY DEBUG] Notifying transaction to ${userObj.email}: ${title}`);

            // 1. Create In-App Notification (If preferred)
            if (userObj.notificationPreferences?.inAppNotifications !== false && !emailOptions.skipInApp) {
                const notification = await Notification.createNotification(userObj._id, title, message, type, metadata);
                // Emit via Socket for real-time
                emitNotification(userObj._id, notification);
            }

            // 2. Send Email Notification (If preferred)
            if (userObj.notificationPreferences?.emailTransactions !== false) {
                const subject = emailOptions.subject || title;
                if (emailOptions.sendFn && typeof emailService[emailOptions.sendFn] === 'function') {
                    await emailService[emailOptions.sendFn](userObj.email, ...emailOptions.args);
                } else {
                    await emailService.sendTransactionNotification(userObj.email, subject, message);
                }
            }
        } catch (error) {
            logger.error('Failed to send transaction notification:', error);
        }
    }

    /**
     * Send a security-related notification
     * @param {ObjectId|Object} user - User ID or User object
     * @param {String} title - Notification title
     * @param {String} message - Notification message
     * @param {Object} emailOptions - Required email options (template function, data)
     */
    async notifySecurity(user, title, message, emailOptions = {}, metadata = {}) {
        try {
            const userObj = await this._getUser(user);
            if (!userObj) return;

            console.log(`[NOTIFY DEBUG] Notifying security to ${userObj.email}: ${title}`);

            // 1. Create In-App Notification (If preferred)
            if (userObj.notificationPreferences?.inAppNotifications !== false && !emailOptions.skipInApp) {
                const notification = await Notification.createNotification(userObj._id, title, message, 'security', metadata);
                // Emit via Socket for real-time
                console.log(`[NOTIFY DEBUG] Calling emitNotification for security: ${userObj._id}`);
                emitNotification(userObj._id, notification);
            }

            // 2. Send Email Notification (If preferred)
            // Note: Critical security emails (MFA, Reset) usually bypass preferences, 
            // but alerts like "New Login" should respect them.
            if (userObj.notificationPreferences?.emailSecurity !== false || emailOptions.isCritical) {
                if (emailOptions.sendFn && typeof emailService[emailOptions.sendFn] === 'function') {
                    await emailService[emailOptions.sendFn](userObj.email, ...emailOptions.args);
                } else {
                    await emailService.sendEmail(userObj.email, title, message);
                }
            }
        } catch (error) {
            logger.error('Failed to send security notification:', error);
        }
    }

    /**
     * Send a message-related notification
     */
    async notifyMessage(recipient, senderName, transactionTitle, metadata = {}) {
        try {
            const recipientObj = await this._getUser(recipient);
            if (!recipientObj) return;

            console.log(`[NOTIFY DEBUG] Notifying message to ${recipientObj.email} from ${senderName}`);

            const title = 'New Message';
            const message = `New message from ${senderName} regarding "${transactionTitle}"`;

            // 1. Create In-App Notification (If preferred)
            if (recipientObj.notificationPreferences?.inAppNotifications !== false) {
                const notification = await Notification.createNotification(recipientObj._id, title, message, 'message', metadata);
                // Emit via Socket for real-time
                console.log(`[NOTIFY DEBUG] Calling emitNotification for message: ${recipientObj._id}`);
                emitNotification(recipientObj._id, notification);
            }

            // 2. Send Email (Optionally, if we add a preference for this later)
            // Currently, pushMessages in User model might be used for this logic if we implement email-for-messages
        } catch (error) {
            logger.error('Failed to send message notification:', error);
        }
    }

    /**
     * Notify all admins of a critical system event
     * @param {String} title - Notification title
     * @param {String} message - Notification message
     * @param {String} type - Notification type (payment, dispute, info, etc.)
     * @param {Object} metadata - Optional metadata
     */
    async notifyAdmins(title, message, type = 'info', metadata = {}) {
        try {
            // Find all admins
            const admins = await User.find({ role: 'admin' }).select('_id notificationPreferences');

            if (!admins.length) return;

            console.log(`[NOTIFY DEBUG] Notifying ${admins.length} admins: ${title}`);

            await Promise.all(admins.map(async (admin) => {
                // Determine if we should record this notification based on preferences (if applicable)
                // For admins, we generally assume they want system alerts, but we can respect 'inAppNotifications'
                if (admin.notificationPreferences?.inAppNotifications !== false) {
                    const notification = await Notification.createNotification(admin._id, title, message, type, metadata);
                    emitNotification(admin._id, notification);
                }
            }));
        } catch (error) {
            logger.error('Failed to notify admins:', error);
        }
    }

    /**
     * Internal helper to ensure we have a user object with preferences
     */
    async _getUser(user) {
        if (user && typeof user === 'object' && user.notificationPreferences) {
            return user;
        }
        return await User.findById(user);
    }
}

module.exports = new NotificationService();
