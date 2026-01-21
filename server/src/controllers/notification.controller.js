const Notification = require('../models/Notification');

/**
 * Get user notifications
 * GET /api/notifications
 */
exports.getNotifications = async (req, res) => {
    try {
        console.log(`[NOTIFY API] getNotifications for user: ${req.user.id}`);
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments({ user: req.user.id });
        const unreadCount = await Notification.countDocuments({
            user: req.user.id,
            read: false
        });

        console.log(`[NOTIFY API] Returning ${notifications.length} notifications, unread: ${unreadCount}`);

        res.json({
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            unreadCount
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get unread count
 * GET /api/notifications/unread-count
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            user: req.user.id,
            read: false
        });
        console.log(`[NOTIFY API] getUnreadCount for user ${req.user.id}: ${count}`);
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Mark all notifications as read
 * POST /api/notifications/mark-all-read
 */
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, read: false },
            { read: true }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
