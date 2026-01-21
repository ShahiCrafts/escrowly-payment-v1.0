const { User, Transaction, AuditLog, Notification, SystemSetting, SuspensionAppeal } = require('../models');
const { paymentService, auditService, notificationService, trustService } = require('../services');
const emailService = require('../services/email.service');
const { emitKYCVerified, emitNotification } = require('../socket');

const getAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [userStats, transactionStats, statusDistribution, recentTransactions, dailyTrendStats] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            new: {
              $sum: { $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, 1, 0] }
            }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            recent: {
              $sum: { $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, 1, 0] }
            },
            totalVolume: { $sum: '$amount' },
            recentVolume: {
              $sum: { $cond: [{ $gte: ['$createdAt', thirtyDaysAgo] }, '$amount', 0] }
            }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Transaction.find()
        .populate('buyer', 'email')
        .populate('seller', 'email')
        .sort({ createdAt: -1 })
        .limit(10),
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            volume: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const dailyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dayTrend = dailyTrendStats.find(t => t._id === date);
      dailyTrends.push({
        date,
        volume: dayTrend?.volume || 0,
        count: dayTrend?.count || 0
      });
    }

    res.json({
      analytics: {
        users: userStats[0] || { total: 0, new: 0 },
        transactions: transactionStats[0] || { total: 0, recent: 0, totalVolume: 0, recentVolume: 0 },
        statusDistribution,
        recentTransactions,
        dailyTrends
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password -mfa -security -emailVerification -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -mfa.secret -mfa.backupCodes -emailVerification -passwordResetToken -passwordResetExpires');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password -mfa -security');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await AuditLog.log({
      userId: req.user._id,
      action: 'user_role_updated',
      category: 'admin',
      status: 'success',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { targetUserId: req.params.id, newRole: role }
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const suspendUser = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ message: 'Suspension reason is required' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended: true, suspensionReason: reason },
      { new: true }
    ).select('-password -mfa -security');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send suspension notification email
    if (user.email) {
      emailService.sendEmail(
        user.email,
        'Account Suspended - Escrowly',
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Account Suspended</h2>
          <p>Dear ${user.profile?.firstName || 'User'},</p>
          <p>Your Escrowly account has been suspended due to the following reason:</p>
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <strong>${reason}</strong>
          </div>
          <h3>How to Appeal</h3>
          <p>If you believe this suspension was made in error, you can submit an appeal:</p>
          <ol>
            <li>Log in to your account (you'll see a suspension notice)</li>
            <li>Click "Submit Appeal"</li>
            <li>Provide evidence or explanation for why you believe the suspension should be lifted</li>
          </ol>
          <p>Our team will review your appeal within 48-72 hours.</p>
          <p style="color: #666; margin-top: 30px;">
            If you have any questions, please contact our support team at support@escrowly.com
          </p>
        </div>`
      ).catch(err => console.error('Failed to send suspension email:', err));
    }

    await AuditLog.log({
      userId: req.user._id,
      action: 'user_suspended',
      category: 'admin',
      status: 'success',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { targetUserId: req.params.id, reason }
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unsuspendUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isSuspended: false, suspensionReason: null },
      { new: true }
    ).select('-password -mfa -security');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await AuditLog.log({
      userId: req.user._id,
      action: 'user_unsuspended',
      category: 'admin',
      status: 'success',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { targetUserId: req.params.id }
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const transactions = await Transaction.find(filter)
      .populate('buyer', 'email profile')
      .populate('seller', 'email profile')
      .sort({ createdAt: -1 });

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resolveDispute = async (req, res) => {
  try {
    const { action, resolution } = req.body;

    if (!['release_seller', 'refund_buyer'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'disputed') {
      return res.status(400).json({ message: 'Transaction is not in dispute' });
    }

    if (action === 'release_seller') {
      await paymentService.transferToSeller(transaction);
    } else {
      await paymentService.refundBuyer(transaction);
    }

    transaction.dispute.status = 'resolved';
    transaction.dispute.resolution = resolution;
    transaction.dispute.resolvedBy = req.user._id;
    transaction.dispute.resolvedAt = new Date();
    await transaction.save();

    // Update trust scores based on dispute outcome
    if (action === 'release_seller') {
      // Seller won, Buyer lost
      await trustService.updateTrustScore(transaction.buyer, 'DISPUTED_LOST');
    } else {
      // Buyer won, Seller lost
      if (transaction.seller) {
        await trustService.updateTrustScore(transaction.seller, 'DISPUTED_LOST');
      }
    }

    await transaction.populate(['buyer', 'seller']);

    const buyerOutcome = action === 'refund_buyer'
      ? 'The funds have been refunded to your account.'
      : 'The funds have been released to the seller.';
    const sellerOutcome = action === 'release_seller'
      ? 'The funds have been released to your account.'
      : 'The funds have been refunded to the buyer.';

    // Notify buyer
    await notificationService.notifyTransaction(
      transaction.buyer,
      'Dispute Resolved',
      `The dispute for "${transaction.title}" has been resolved. ${buyerOutcome}`,
      'dispute',
      { transactionId: transaction._id }
    );

    // Notify seller
    if (transaction.seller) {
      await notificationService.notifyTransaction(
        transaction.seller,
        'Dispute Resolved',
        `The dispute for "${transaction.title}" has been resolved. ${sellerOutcome}`,
        'dispute',
        { transactionId: transaction._id }
      );
    }

    // Send email notifications (fire and forget)
    if (transaction.buyer?.email) {
      emailService.sendEmail(
        transaction.buyer.email,
        'Dispute Resolved - Escrowly',
        `<h2>Dispute Resolved</h2>
        <p>The dispute for <strong>${transaction.title}</strong> has been resolved.</p>
        <p>${buyerOutcome}</p>
        <p>Resolution: ${resolution}</p>`
      ).catch(err => console.error('Failed to send buyer dispute email:', err));
    }

    if (transaction.seller?.email) {
      emailService.sendEmail(
        transaction.seller.email,
        'Dispute Resolved - Escrowly',
        `<h2>Dispute Resolved</h2>
        <p>The dispute for <strong>${transaction.title}</strong> has been resolved.</p>
        <p>${sellerOutcome}</p>
        <p>Resolution: ${resolution}</p>`
      ).catch(err => console.error('Failed to send seller dispute email:', err));
    }

    await AuditLog.log({
      userId: req.user._id,
      action: 'dispute_resolved',
      category: 'admin',
      status: 'success',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { transactionId: req.params.id, action, resolution }
    });

    res.json({ transaction });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const result = await auditService.getAuditLogs(req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.find();
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    res.json({ settings: settingsMap });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const updatePromises = Object.entries(settings).map(([key, value]) =>
      SystemSetting.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true }
      )
    );

    await Promise.all(updatePromises);

    await AuditLog.log({
      userId: req.user._id,
      action: 'system_settings_updated',
      category: 'admin',
      status: 'success',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { keys: Object.keys(settings) }
    });

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAppeals = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const appeals = await SuspensionAppeal.find(filter)
      .populate('user', 'email profile isSuspended suspensionReason')
      .populate('adminResponse.respondedBy', 'email profile')
      .sort({ createdAt: -1 });

    res.json({ appeals });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reviewAppeal = async (req, res) => {
  try {
    const { action, message } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const appeal = await SuspensionAppeal.findById(req.params.id).populate('user');

    if (!appeal) {
      return res.status(404).json({ message: 'Appeal not found' });
    }

    if (!['pending', 'under_review'].includes(appeal.status)) {
      return res.status(400).json({ message: 'Appeal has already been processed' });
    }

    const defaultMessage = action === 'approve'
      ? 'Appeal approved. Your account has been unsuspended.'
      : 'After reviewing your appeal, we have decided to maintain the suspension based on our policies.';

    const finalMessage = message || defaultMessage;

    appeal.status = action === 'approve' ? 'approved' : 'rejected';
    appeal.adminResponse = {
      message: finalMessage,
      respondedBy: req.user._id,
      respondedAt: new Date()
    };
    await appeal.save();

    // If approved, unsuspend the user
    if (action === 'approve') {
      await User.findByIdAndUpdate(appeal.user._id, {
        isSuspended: false,
        suspensionReason: null
      });
    }

    // Send email notification
    if (appeal.user.email) {
      const emailSubject = action === 'approve'
        ? 'Appeal Approved - Account Unsuspended'
        : 'Appeal Decision - Escrowly';

      const emailContent = action === 'approve'
        ? `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Appeal Approved</h2>
            <p>Dear ${appeal.user.profile?.firstName || 'User'},</p>
            <p>Good news! Your appeal has been reviewed and approved. Your account has been unsuspended.</p>
            <p><strong>Admin Response:</strong> ${finalMessage}</p>
            <p>You can now log in and use all Escrowly features normally.</p>
            <p>Please ensure you comply with our terms of service to avoid future suspensions.</p>
          </div>`
        : `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Appeal Rejected</h2>
            <p>Dear ${appeal.user.profile?.firstName || 'User'},</p>
            <p>After careful review, your appeal has been rejected and your account remains suspended.</p>
            <p><strong>Reason:</strong> ${finalMessage}</p>
            <p>If you have additional evidence to submit, you may contact our support team at support@escrowly.com.</p>
          </div>`;

      emailService.sendEmail(appeal.user.email, emailSubject, emailContent)
        .catch(err => console.error('Failed to send appeal decision email:', err));
    }

    await AuditLog.log({
      userId: req.user._id,
      action: action === 'approve' ? 'appeal_approved' : 'appeal_rejected',
      category: 'admin',
      status: 'success',
      ip: req.ip,
      userAgent: req.get('user-agent'),
      metadata: { appealId: req.params.id, userId: appeal.user._id.toString(), action }
    });

    res.json({ appeal, message: `Appeal ${action === 'approve' ? 'approved' : 'rejected'} successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getKYCApplications = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const filter = { 'kyc.status': status };

    const users = await User.find(filter)
      .select('email profile kyc.status kyc.submittedAt kyc.fullName kyc.documentType')
      .sort({ 'kyc.submittedAt': -1 });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getKYCDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('email profile kyc');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyKYC = async (req, res) => {
  try {
    const { action, reason } = req.body;
    const adminId = req.user._id;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.kyc.status !== 'pending') {
      return res.status(400).json({ message: 'KYC is not in pending status' });
    }

    const status = action === 'approve' ? 'verified' : 'rejected';
    user.kyc.status = status;
    user.kyc.rejectionReason = action === 'reject' ? reason : undefined;
    user.kyc.verifiedAt = new Date();

    await user.save();

    // Log the action
    await AuditLog.log({
      userId: adminId,
      action: `kyc_${status}`,
      category: 'admin',
      status: 'success',
      metadata: { targetUserId: user._id, reason },
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Notify User via Socket & Internal Notification
    const kycTitle = status === 'verified' ? 'Identity Verified' : 'Identity Verification Update';
    const kycMessage = status === 'verified'
      ? 'Your identity verification has been approved! You now have full access to all features.'
      : `Your identity verification was rejected. Reason: ${reason}`;

    // Create internal notification
    const notification = await Notification.createNotification(
      user._id,
      kycTitle,
      kycMessage,
      'security',
      { status, reason, type: 'kyc' }
    );

    // Emit via Socket
    emitNotification(user._id, notification);
    emitKYCVerified(user._id, status, { reason });

    // Send Email notification
    if (user.email) {
      emailService.sendKYCStatusUpdateEmail(user.email, user.profile?.firstName || user.kyc.fullName, status, reason)
        .catch(err => console.error('Failed to send KYC email:', err));
    }

    res.json({ message: `KYC ${status} successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAnalytics,
  getUsers,
  getUser,
  updateUserRole,
  suspendUser,
  unsuspendUser,
  getTransactions,
  resolveDispute,
  getAuditLogs,
  getSettings,
  updateSettings,
  getAppeals,
  reviewAppeal,
  getKYCApplications,
  getKYCDetails,
  verifyKYC
};
