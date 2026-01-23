const { User, Notification, AuditLog, SuspensionAppeal } = require('../models');
const { encrypt } = require('../utils/crypto');
const cloudinary = require('../config/cloudinary');
const emailService = require('../services/email.service');
const { emitKYCSubmitted } = require('../socket');
const limitService = require('../services/limit.service');
const notificationService = require('../services/notification.service');

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

    // Update notification preferences
    if (req.body.notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...req.body.notificationPreferences
      };
    }

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

const submitAppeal = async (req, res) => {
  try {
    const { reason } = req.body;
    let evidence = [];

    // Parse text evidence if sent as JSON string or handle if array
    if (req.body.evidence) {
      try {
        if (typeof req.body.evidence === 'string') {
          evidence = JSON.parse(req.body.evidence);
        } else if (Array.isArray(req.body.evidence)) {
          evidence = req.body.evidence;
        }
      } catch (e) {
        console.error('Failed to parse evidence:', e);
      }
    }

    // Process uploaded files
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        evidence.push({
          type: file.mimetype.startsWith('image/') ? 'image' : 'document',
          content: file.path,
          description: file.originalname
        });
      });
    }

    if (!req.user.isSuspended) {
      return res.status(400).json({ message: 'User is not suspended' });
    }

    const existingAppeal = await SuspensionAppeal.findOne({
      user: req.user._id,
      status: { $in: ['pending', 'under_review'] }
    });

    if (existingAppeal) {
      return res.status(400).json({ message: 'You already have a pending appeal' });
    }

    const appeal = await SuspensionAppeal.create({
      user: req.user._id,
      reason,
      evidence,
      suspensionReason: req.user.suspensionReason
    });

    await AuditLog.log({
      userId: req.user._id,
      action: 'appeal_submitted',
      category: 'user',
      status: 'success',
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    await notificationService.notifyAdmins(
      'New Suspension Appeal',
      `User ${req.user.email} has submitted an appeal regarding their account suspension.`,
      'info',
      { actionUrl: '/admin/appeals' }
    );

    res.status(201).json({ appeal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyAppeal = async (req, res) => {
  try {
    const appeal = await SuspensionAppeal.findOne({
      user: req.user._id
    }).sort({ createdAt: -1 });

    res.json({ appeal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitKYC = async (req, res) => {
  try {
    const {
      documentType, fullName, idNumber, gender, maritalStatus, dobAd, dobBs, panNumber, socialMediaId,
      fatherName, motherName, grandfatherName, spouseName,
      permStreet, permWard, permMunicipality, permDistrict, permProvince, permCountry,
      currStreet, currWard, currMunicipality, currDistrict, currProvince, currCountry,
      education, occupation, employerName, position, yearlyIncome, incomeSource,
      pepStatus, beneficialOwner, residenceStatus
    } = req.body;

    const user = req.user;

    if (!documentType || !fullName || !idNumber) {
      return res.status(400).json({ message: 'Primary fields (Document Type, Full Name, ID Number) are required' });
    }

    if (user.kyc?.status === 'verified') {
      return res.status(400).json({ message: 'Identity already verified' });
    }

    if (user.kyc?.status === 'pending') {
      return res.status(400).json({ message: 'Verification already in progress' });
    }

    if (!req.files || !req.files.idFront || !req.files.idBack) {
      return res.status(400).json({ message: 'Identification documents (Front and Back) are required' });
    }

    const documents = [];

    if (req.files.idFront?.[0]) {
      documents.push({
        url: req.files.idFront[0].path,
        publicId: req.files.idFront[0].filename,
        type: 'front'
      });
    }

    if (req.files.idBack?.[0]) {
      documents.push({
        url: req.files.idBack[0].path,
        publicId: req.files.idBack[0].filename,
        type: 'back'
      });
    }

    if (req.files.selfie?.[0]) {
      documents.push({
        url: req.files.selfie[0].path,
        publicId: req.files.selfie[0].filename,
        type: 'selfie'
      });
    }

    user.kyc = {
      status: 'pending',
      documentType,
      fullName,
      idNumber,
      gender,
      maritalStatus,
      dob: {
        ad: dobAd ? new Date(dobAd) : null,
        bs: dobBs
      },
      panNumber,
      socialMediaId,
      familyDetails: {
        fatherName,
        motherName,
        grandfatherName,
        spouseName
      },
      permanentAddress: {
        street: permStreet,
        ward: permWard,
        municipality: permMunicipality,
        district: permDistrict,
        province: permProvince,
        country: permCountry || 'Nepal'
      },
      currentAddress: {
        street: currStreet,
        ward: currWard,
        municipality: currMunicipality,
        district: currDistrict,
        province: currProvince,
        country: currCountry || 'Nepal'
      },
      education,
      occupation,
      employerName,
      position,
      yearlyIncome,
      incomeSource,
      pepStatus: pepStatus === 'true' || pepStatus === true,
      beneficialOwner: beneficialOwner === 'true' || beneficialOwner === true,
      residenceStatus,
      documents,
      submittedAt: new Date()
    };

    await user.save();

    await AuditLog.log({
      userId: user._id,
      action: 'kyc_submitted',
      category: 'user',
      status: 'success',
      data: { documentType, fullName },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Send confirmation email to user
    emailService.sendKYCSubmissionEmail(user.email, user.profile?.firstName || user.kyc.fullName)
      .catch(err => console.error('Failed to send KYC submission email:', err));

    // Notify Admins via Socket and Persistence
    emitKYCSubmitted({
      userId: user._id,
      fullName: user.kyc.fullName,
      documentType: user.kyc.documentType,
      submittedAt: user.kyc.submittedAt
    });

    await notificationService.notifyAdmins(
      'New KYC Submission',
      `User ${user.kyc.fullName} (${user.email}) has submitted KYC documents for review.`,
      'info',
      { actionUrl: '/admin/kyc' }
    );

    res.json({ user: user.toJSON(), message: 'KYC submitted successfully. Verification is now in progress.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelKYC = async (req, res) => {
  try {
    const user = req.user;

    if (user.kyc?.status !== 'pending') {
      return res.status(400).json({ message: 'No pending verification to cancel' });
    }

    // Optional: Delete uploaded documents from Cloudinary
    if (user.kyc.documents && user.kyc.documents.length > 0) {
      for (const doc of user.kyc.documents) {
        if (doc.publicId) {
          await cloudinary.uploader.destroy(doc.publicId).catch(err => console.error('Failed to delete KYC doc:', err));
        }
      }
    }

    user.kyc = {
      status: 'not_started'
    };

    await user.save();

    await AuditLog.log({
      userId: user._id,
      action: 'kyc_cancelled',
      category: 'user',
      status: 'success',
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json({ user: user.toJSON(), message: 'Verification process cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTransactionLimits = async (req, res) => {
  try {
    const stats = await limitService.getUsageStats(req.user);
    res.json(stats);
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
  removeProfilePicture,
  submitAppeal,
  getMyAppeal,
  submitKYC,
  cancelKYC,
  getTransactionLimits
};
