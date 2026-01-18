const { User, Notification, AuditLog } = require('../models');
const { encrypt } = require('../utils/crypto');
const cloudinary = require('../config/cloudinary');

const getProfile = async (req, res) => {
  try {
    res.json({ user: req.user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;
    const user = req.user;

    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (phoneNumber !== undefined) user.profile.phoneNumber = phoneNumber;

    await user.save();

    await AuditLog.log({
      userId: user._id,
      action: 'profile_updated',
      category: 'user',
      status: 'success',
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ user: user.toJSON() });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ notification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false },
      { read: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadProfilePicture = async (req, res) => {
  try {
    console.log('Backend: uploadProfilePicture called');
    console.log('Backend: req.file:', req.file);

    if (!req.file) {
      console.log('Backend: No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = req.user;

    // If user already has an avatar, delete the old one from Cloudinary
    if (user.profile.avatar && user.profile.avatar.publicId) {
      console.log('Backend: Deleting old avatar:', user.profile.avatar.publicId);
      await cloudinary.uploader.destroy(user.profile.avatar.publicId);
    }

    user.profile.avatar = {
      url: req.file.path,
      publicId: req.file.filename
    };

    await user.save();
    console.log('Backend: User profile updated with new avatar:', user.profile.avatar);

    try {
      await AuditLog.log({
        userId: user._id,
        action: 'avatar_updated',
        category: 'user',
        status: 'success',
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
    } catch (auditError) {
      console.error('AuditLog failed:', auditError);
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error('Backend: uploadProfilePicture error:', error);
    res.status(500).json({ message: error.message });
  }
};

const removeProfilePicture = async (req, res) => {
  try {
    const user = req.user;

    if (user.profile.avatar && user.profile.avatar.publicId) {
      await cloudinary.uploader.destroy(user.profile.avatar.publicId);
    }

    user.profile.avatar = undefined;
    await user.save();

    await AuditLog.log({
      userId: user._id,
      action: 'avatar_removed',
      category: 'user',
      status: 'success',
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  uploadProfilePicture,
  removeProfilePicture
};
