const { Transaction, User, AuditLog, Notification, Message, Agreement, SystemSetting } = require('../models');
const trustService = require('./trust.service');
const emailService = require('./email.service');
const notificationService = require('./notification.service');
const paymentService = require('./payment.service');
const limitService = require('./limit.service');
const logger = require('../utils/logger');
const { decrypt } = require('../utils/crypto');

const getDisplayName = (user) => {
  if (!user) return 'Unknown User';
  const firstName = user.profile?.firstName ? (decrypt(user.profile.firstName) || user.profile.firstName) : '';
  const email = user.email || '';
  return firstName || email;
};

const createSystemMessage = async (transactionId, content) => {
  try {
    // We use a dummy sender ID for system messages if needed,
    // but the Message model requires a sender. We'll use the platform admin or just a system flag.
    // For now, let's just make sure isSystemMessage: true is set.
    await Message.create({
      transaction: transactionId,
      sender: '000000000000000000000000', // Dummy ID for system
      content,
      isSystemMessage: true
    });
  } catch (error) {
    logger.error('Failed to create system message', { transactionId, content, error: error.message });
  }
};

const createTransaction = async (data, initiator, req) => {
  const { title, description, amount, currency, sellerEmail, buyerEmail, inspectionPeriod, milestones } = data;

  let buyer, seller, sellerEmailToStore;

  if (sellerEmail) {
    buyer = initiator;
    seller = await User.findOne({ email: sellerEmail.toLowerCase() });
    sellerEmailToStore = sellerEmail.toLowerCase();
  } else if (buyerEmail) {
    seller = initiator;
    buyer = await User.findOne({ email: buyerEmail.toLowerCase() });
    if (!buyer) {
      throw new Error('Buyer not found');
    }
  } else {
    throw new Error('Either sellerEmail or buyerEmail is required');
  }

  // Security Check: Prevent suspended users from creating transactions
  if (buyer.isSuspended) {
    throw new Error('Buyer account is suspended. Transaction cannot be created.');
  }
  if (seller && seller.isSuspended) {
    throw new Error('Seller account is suspended. Transaction cannot be created.');
  }

  // Fetch system settings
  const settingsList = await SystemSetting.find({
    key: { $in: ['minTransactionAmount', 'maxTransactionAmount', 'escrowPeriodDays'] }
  });
  const settings = settingsList.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});

  const minAmount = settings.minTransactionAmount || 10;
  const maxAmount = settings.maxTransactionAmount || 100000;
  const defaultInspectionPeriod = settings.escrowPeriodDays || 14;

  if (amount < minAmount) {
    throw new Error(`Amount must be at least NPR ${minAmount}`);
  }
  if (amount > maxAmount) {
    throw new Error(`Amount must be at most NPR ${maxAmount}`);
  }

  if (seller && seller._id.toString() === buyer._id.toString()) {
    throw new Error('Cannot create transaction with yourself');
  }

  // Validate Transaction Limits
  await limitService.validateTransactionLimits(initiator, amount);

  let processedMilestones = [];
  if (milestones && milestones.length > 0) {
    const totalMilestoneAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
    if (Math.abs(totalMilestoneAmount - amount) > 0.01) {
      throw new Error('Milestone amounts must equal total transaction amount');
    }
    processedMilestones = milestones.map(m => ({
      title: m.title,
      amount: m.amount,
      status: 'pending'
    }));
  }

  const transaction = await Transaction.create({
    title,
    description,
    amount,
    currency: currency || 'npr',
    buyer: buyer._id,
    seller: seller ? seller._id : undefined,
    sellerEmail: sellerEmailToStore,
    initiatedBy: initiator._id,
    inspectionPeriod: inspectionPeriod || defaultInspectionPeriod,
    milestones: processedMilestones
  });

  await transaction.populate([
    { path: 'buyer', select: 'email profile trustScore stripe.connectOnboarded' },
    { path: 'seller', select: 'email profile trustScore stripe.connectOnboarded' }
  ]);

  const recipientId = sellerEmail ? seller?._id : buyer._id;
  const recipientEmail = sellerEmail || buyer.email;

  if (recipientId) {
    await notificationService.notifyTransaction(
      recipientId,
      'New Transaction',
      `You have been invited to a transaction: "${title}" for ${amount} ${currency?.toUpperCase() || 'NPR'}`,
      'transaction',
      { transactionId: transaction._id },
      { subject: 'New Transaction Invitation' }
    );
  }

  await AuditLog.logTransaction('transaction_created', initiator._id, 'success', req, {
    transactionId: transaction._id,
    amount,
    currency
  });

  await createSystemMessage(transaction._id, `Transaction initiated by ${getDisplayName(initiator)}`);

  // Record usage (count increases on initiation)
  await limitService.recordUsage(initiator._id, amount);

  // Notify Admins for High Value Transactions
  if (amount >= 100000) {
    await notificationService.notifyAdmins(
      'High Value Transaction',
      `A high value transaction of ${amount} ${currency.toUpperCase()} has been initiated by ${getDisplayName(initiator)}.`,
      'info',
      { transactionId: transaction._id, actionUrl: `/admin/transactions/${transaction._id}` }
    );
  }

  return { transaction };
};

const acceptTransaction = async (transactionId, user, req) => {
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (!transaction.canBeAccepted(user._id)) {
    throw new Error('Cannot accept this transaction');
  }

  if (!transaction.seller) {
    transaction.seller = user._id;
  }

  transaction.status = 'accepted';
  await transaction.save();
  await transaction.populate([
    { path: 'buyer', select: 'email profile trustScore stripe.connectOnboarded' },
    { path: 'seller', select: 'email profile trustScore stripe.connectOnboarded' }
  ]);

  const buyerId = transaction.buyer._id || transaction.buyer;
  await notificationService.notifyTransaction(
    buyerId,
    'Transaction Accepted',
    `The seller has accepted the transaction: "${transaction.title}". You can now proceed with payment.`,
    'transaction',
    { transactionId: transaction._id }
  );

  await AuditLog.logTransaction('transaction_accepted', user._id, 'success', req, {
    transactionId: transaction._id
  });

  await createSystemMessage(transaction._id, `Transaction accepted by seller (${getDisplayName(user)})`);

  return { transaction };
};

const markAsDelivered = async (transactionId, user, req) => {
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (!transaction.canBeDelivered(user._id)) {
    throw new Error('Cannot mark this transaction as delivered');
  }

  transaction.markAsDelivered();
  await transaction.save();
  await transaction.populate([
    { path: 'buyer', select: 'email profile trustScore stripe.connectOnboarded' },
    { path: 'seller', select: 'email profile trustScore stripe.connectOnboarded' }
  ]);

  const buyerId = transaction.buyer._id || transaction.buyer;
  await notificationService.notifyTransaction(
    buyerId,
    'Delivery Marked',
    `The seller has marked "${transaction.title}" as delivered. You have ${transaction.inspectionPeriod} days to inspect and release funds.`,
    'transaction',
    { transactionId: transaction._id },
    { subject: 'Delivery Confirmation' }
  );

  await AuditLog.logTransaction('transaction_delivered', user._id, 'success', req, {
    transactionId: transaction._id,
    inspectionEndsAt: transaction.inspectionEndsAt
  });

  await createSystemMessage(transaction._id, `Escrow marked as delivered. Inspection period: ${transaction.inspectionPeriod} days.`);

  return { transaction };
};

const releaseFunds = async (transactionId, user, req) => {
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (!transaction.canBeReleased(user._id)) {
    throw new Error('Cannot release funds for this transaction');
  }

  const remainingAmount = transaction.amount - (transaction.amountReleased || 0);
  if (remainingAmount <= 0) {
    throw new Error('All funds have already been released');
  }

  await paymentService.transferToSeller(transaction, remainingAmount);

  transaction.milestones.forEach(m => {
    if (m.status !== 'released') {
      m.status = 'released';
      m.releasedAt = new Date();
    }
  });
  await transaction.save();

  // Update trust score for both parties on completion
  await trustService.updateTrustScore(transaction.seller._id || transaction.seller, 'COMPLETED', transaction.amount);
  await trustService.updateTrustScore(transaction.buyer._id || transaction.buyer, 'COMPLETED', 0);

  await transaction.populate([
    { path: 'buyer', select: 'email profile trustScore stripe.connectOnboarded' },
    { path: 'seller', select: 'email profile trustScore stripe.connectOnboarded' }
  ]);

  await AuditLog.logTransaction('funds_released', user._id, 'success', req, {
    transactionId: transaction._id,
    amount: remainingAmount
  });

  await createSystemMessage(transaction._id, `Remaining funds (${remainingAmount} ${transaction.currency.toUpperCase()}) released to seller. Transaction completed.`);

  await notificationService.notifyTransaction(
    transaction.seller._id,
    'Funds Released',
    `Remaining funds (${remainingAmount} ${transaction.currency.toUpperCase()}) for "${transaction.title}" have been released to your account.`,
    'payment',
    { transactionId: transaction._id }
  );

  return { transaction };
};

const releaseMilestone = async (transactionId, milestoneId, user, req) => {
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (!['funded', 'delivered'].includes(transaction.status)) {
    throw new Error('Transaction must be funded to release milestones');
  }

  if (transaction.buyer.toString() !== user._id.toString()) {
    throw new Error('Only buyer can release milestones');
  }

  const milestone = transaction.milestones.id(milestoneId);
  if (!milestone) {
    throw new Error('Milestone not found');
  }

  if (milestone.status === 'released') {
    throw new Error('Milestone already released');
  }

  await paymentService.transferToSeller(transaction, milestone.amount);

  milestone.status = 'released';
  milestone.releasedAt = new Date();
  await transaction.save();
  await transaction.populate([
    { path: 'buyer', select: 'email profile trustScore stripe.connectOnboarded' },
    { path: 'seller', select: 'email profile trustScore stripe.connectOnboarded' }
  ]);

  await AuditLog.logTransaction('milestone_released', user._id, 'success', req, {
    transactionId: transaction._id,
    milestoneId,
    amount: milestone.amount
  });

  await createSystemMessage(transaction._id, `Milestone "${milestone.title}" released. Amount: ${milestone.amount} ${transaction.currency.toUpperCase()}`);

  await notificationService.notifyTransaction(
    transaction.seller._id,
    'Milestone Released',
    `Milestone "${milestone.title}" (${milestone.amount} ${transaction.currency.toUpperCase()}) for "${transaction.title}" has been released to your account.`,
    'payment',
    { transactionId: transaction._id }
  );

  return { transaction };
};

const raiseDispute = async (transactionId, reason, user, req) => {
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (!transaction.canBeDisputed(user._id)) {
    throw new Error('Cannot raise dispute for this transaction');
  }

  transaction.status = 'disputed';
  transaction.dispute = {
    reason,
    raisedBy: user._id,
    status: 'open',
    createdAt: new Date()
  };
  await transaction.save();
  await transaction.populate([
    { path: 'buyer', select: 'email profile trustScore stripe.connectOnboarded' },
    { path: 'seller', select: 'email profile trustScore stripe.connectOnboarded' }
  ]);

  const otherPartyId = transaction.buyer.toString() === user._id.toString()
    ? transaction.seller
    : transaction.buyer;

  const otherPartyUser = await User.findById(otherPartyId);

  const role = otherPartyId.toString() === transaction.buyer.toString() ? 'buyer' : 'seller';
  await notificationService.notifyTransaction(
    otherPartyId,
    'Dispute Raised',
    `A dispute has been raised for "${transaction.title}". Our team will review and contact both parties.`,
    'dispute',
    { transactionId: transaction._id }
  );

  // Notify Admins
  await notificationService.notifyAdmins(
    'Dispute Raised',
    `A dispute has been raised for transaction "${transaction.title}" (ID: ${transaction._id}).`,
    'dispute',
    { transactionId: transaction._id, actionUrl: `/admin/transactions/${transaction._id}` }
  );

  await AuditLog.logTransaction('dispute_raised', user._id, 'success', req, {
    transactionId: transaction._id,
    reason
  });

  await createSystemMessage(transaction._id, `⚠️ DISPUTE RAISED by ${getDisplayName(user)}. Reason: ${reason}`);

  return { transaction };
};

const cancelTransaction = async (transactionId, reason, user, req) => {
  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (!transaction.canBeCancelled(user._id)) {
    throw new Error('Cannot cancel this transaction');
  }

  // If transaction was funded, refund the buyer
  if (['funded', 'delivered'].includes(transaction.status)) {
    logger.info('Refunding buyer due to cancellation', { transactionId: transaction._id });
    await paymentService.refundBuyer(transaction);
  } else {
    // If not funded, just mark as cancelled
    transaction.status = 'cancelled';
    transaction.cancelledAt = new Date();
    transaction.cancellationReason = reason;
    await transaction.save();
  }

  // Deduct trust score for the party that cancelled
  await trustService.updateTrustScore(user._id, 'CANCELLED');

  await transaction.populate([
    { path: 'buyer', select: 'email profile trustScore stripe.connectOnboarded' },
    { path: 'seller', select: 'email profile trustScore stripe.connectOnboarded' }
  ]);

  const otherPartyId = transaction.initiatedBy.toString() === user._id.toString()
    ? (transaction.buyer.toString() === user._id.toString() ? transaction.seller : transaction.buyer)
    : transaction.initiatedBy;

  if (otherPartyId) {
    await notificationService.notifyTransaction(
      otherPartyId,
      'Transaction Cancelled',
      `The transaction "${transaction.title}" has been cancelled.${['funded', 'delivered'].includes(transaction.status) ? ' A refund has been processed.' : ''}`,
      'transaction',
      { transactionId: transaction._id }
    );
  }

  await AuditLog.logTransaction('transaction_cancelled', user._id, 'success', req, {
    transactionId: transaction._id,
    reason,
    refunded: ['funded', 'delivered'].includes(transaction.status)
  });

  await createSystemMessage(transaction._id, `🚫 Transaction cancelled by ${getDisplayName(user)}. Reason: ${reason}${['funded', 'delivered'].includes(transaction.status) ? ' (Refund initiated)' : ''}`);

  return { transaction };
};

const getUserTransactions = async (userId, filters = {}) => {
  const query = {
    $or: [
      { buyer: userId },
      { seller: userId }
    ]
  };

  if (filters.status) {
    query.status = filters.status;
  }

  const transactions = await Transaction.find(query)
    .populate('buyer', 'email profile trustScore stripe.connectOnboarded')
    .populate('seller', 'email profile trustScore stripe.connectOnboarded')
    .sort({ createdAt: -1 });

  return { transactions };
};

const getTransactionById = async (transactionId, userId) => {
  const transaction = await Transaction.findById(transactionId)
    .populate('buyer', 'email profile trustScore stripe.connectOnboarded')
    .populate('seller', 'email profile trustScore stripe.connectOnboarded')
    .populate('dispute.raisedBy', 'email profile trustScore stripe.connectOnboarded')
    .populate('dispute.resolvedBy', 'email profile trustScore stripe.connectOnboarded');

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  const isBuyer = transaction.buyer._id.toString() === userId.toString();
  const isSeller = transaction.seller && transaction.seller._id.toString() === userId.toString();

  if (!isBuyer && !isSeller) {
    throw new Error('Access denied');
  }

  return { transaction };
};

const getTransactionStats = async (userId) => {
  const stats = await Transaction.aggregate([
    {
      $match: {
        $or: [
          { buyer: userId },
          { seller: userId }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        pending: {
          $sum: { $cond: [{ $in: ['$status', ['pending', 'accepted']] }, 1, 0] }
        },
        completed: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        }
      }
    }
  ]);

  return {
    stats: stats[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      pending: 0,
      completed: 0
    }
  };
};

const autoReleaseExpiredInspections = async () => {
  const expiredTransactions = await Transaction.find({
    status: 'delivered',
    inspectionEndsAt: { $lte: new Date() }
  });

  for (const transaction of expiredTransactions) {
    try {
      await paymentService.transferToSeller(transaction);

      const buyer = await User.findById(transaction.buyer);
      if (buyer) {
        await notificationService.notifyTransaction(
          buyer._id,
          'Auto-Release',
          `Funds for "${transaction.title}" have been automatically released as the inspection period expired.`,
          'payment',
          { transactionId: transaction._id }
        );
      }

      await AuditLog.log({
        action: 'auto_release',
        category: 'transaction',
        status: 'success',
        metadata: { transactionId: transaction._id }
      });

      logger.info('Auto-released transaction', { transactionId: transaction._id });
    } catch (error) {
      logger.error('Auto-release failed', { transactionId: transaction._id, error: error.message });
    }
  }

  return expiredTransactions.length;
};

// ========================
// MILESTONE MANAGEMENT
// ========================

const toggleDeliverable = async (transactionId, milestoneId, deliverableId, completed, user, req) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new Error('Transaction not found');

  const isBuyer = transaction.buyer.toString() === user._id.toString();
  const isSeller = transaction.seller?.toString() === user._id.toString();
  if (!isBuyer && !isSeller) throw new Error('Access denied');

  const milestone = transaction.milestones.id(milestoneId);
  if (!milestone) throw new Error('Milestone not found');

  const deliverable = milestone.deliverables.id(deliverableId);
  if (!deliverable) throw new Error('Deliverable not found');

  deliverable.completed = completed;
  deliverable.completedAt = completed ? new Date() : null;
  deliverable.completedBy = completed ? user._id : null;

  await transaction.save();

  await AuditLog.logTransaction('deliverable_toggled', user._id, 'success', req, {
    transactionId,
    milestoneId,
    deliverableId,
    completed
  });

  return { transaction, message: 'Deliverable updated' };
};

const addMilestoneNote = async (transactionId, milestoneId, content, user, req) => {
  if (!content?.trim()) throw new Error('Note content is required');

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new Error('Transaction not found');

  const isBuyer = transaction.buyer.toString() === user._id.toString();
  const isSeller = transaction.seller?.toString() === user._id.toString();
  if (!isBuyer && !isSeller) throw new Error('Access denied');

  const milestone = transaction.milestones.id(milestoneId);
  if (!milestone) throw new Error('Milestone not found');

  milestone.notes.push({
    content: content.trim(),
    author: user._id,
    createdAt: new Date()
  });

  await transaction.save();

  await AuditLog.logTransaction('milestone_note_added', user._id, 'success', req, {
    transactionId,
    milestoneId
  });

  return { transaction, message: 'Note added' };
};

const submitMilestone = async (transactionId, milestoneId, user, req) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new Error('Transaction not found');

  const isSeller = transaction.seller?.toString() === user._id.toString();
  if (!isSeller) throw new Error('Only seller can submit milestones');

  if (!['funded', 'delivered'].includes(transaction.status)) {
    throw new Error('Transaction must be funded to submit milestones');
  }

  const milestone = transaction.milestones.id(milestoneId);
  if (!milestone) throw new Error('Milestone not found');

  if (milestone.status === 'released') throw new Error('Milestone already released');

  milestone.status = 'submitted';
  milestone.submittedAt = new Date();

  await transaction.save();

  await createSystemMessage(transactionId, `Seller submitted milestone: ${milestone.title}`);

  await AuditLog.logTransaction('milestone_submitted', user._id, 'success', req, {
    transactionId,
    milestoneId,
    title: milestone.title
  });

  return { transaction, message: 'Milestone submitted for review' };
};

const approveMilestone = async (transactionId, milestoneId, user, req) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new Error('Transaction not found');

  const isBuyer = transaction.buyer.toString() === user._id.toString();
  if (!isBuyer) throw new Error('Only buyer can approve milestones');

  const milestone = transaction.milestones.id(milestoneId);
  if (!milestone) throw new Error('Milestone not found');

  if (milestone.status === 'released') throw new Error('Milestone already released');
  if (milestone.status !== 'submitted') throw new Error('Milestone must be submitted first');

  milestone.status = 'approved';
  milestone.approvedAt = new Date();
  milestone.approvedBy = user._id;

  await transaction.save();

  await createSystemMessage(transactionId, `Buyer approved milestone: ${milestone.title}`);

  await AuditLog.logTransaction('milestone_approved', user._id, 'success', req, {
    transactionId,
    milestoneId,
    title: milestone.title
  });

  return { transaction, message: 'Milestone approved' };
};

// ========================
// AGREEMENT MANAGEMENT
// ========================

const getAgreement = async (transactionId, user) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new Error('Transaction not found');

  const isBuyer = transaction.buyer.toString() === user._id.toString();
  const isSeller = transaction.seller?.toString() === user._id.toString();
  if (!isBuyer && !isSeller) throw new Error('Access denied');

  const agreement = await Agreement.getActiveAgreement(transactionId);

  return {
    agreement,
    hasAccepted: agreement ? agreement.hasUserAccepted(user._id) : false
  };
};

const createAgreement = async (transactionId, { title, terms }, user, req) => {
  if (!terms?.trim()) throw new Error('Agreement terms are required');

  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new Error('Transaction not found');

  const isBuyer = transaction.buyer.toString() === user._id.toString();
  const isSeller = transaction.seller?.toString() === user._id.toString();
  if (!isBuyer && !isSeller) throw new Error('Access denied');

  // Deactivate existing agreements
  await Agreement.updateMany(
    { transaction: transactionId, isActive: true },
    { isActive: false }
  );

  // Get latest version number
  const latestAgreement = await Agreement.findOne({ transaction: transactionId })
    .sort({ version: -1 });
  const version = latestAgreement ? latestAgreement.version + 1 : 1;

  const agreement = await Agreement.create({
    transaction: transactionId,
    version,
    title: title || 'Transaction Agreement',
    terms: terms.trim(),
    createdBy: user._id,
    acceptedBy: [{ user: user._id, acceptedAt: new Date(), ipAddress: req.ip }]
  });

  await AuditLog.logTransaction('agreement_created', user._id, 'success', req, {
    transactionId,
    agreementId: agreement._id,
    version
  });

  await createSystemMessage(transactionId, `New agreement (v${version}) created`);

  return { agreement, message: 'Agreement created' };
};

const acceptAgreement = async (transactionId, user, req) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new Error('Transaction not found');

  const isBuyer = transaction.buyer.toString() === user._id.toString();
  const isSeller = transaction.seller?.toString() === user._id.toString();
  if (!isBuyer && !isSeller) throw new Error('Access denied');

  const agreement = await Agreement.findOne({
    transaction: transactionId,
    isActive: true
  });

  if (!agreement) throw new Error('No active agreement found');

  if (agreement.hasUserAccepted(user._id)) {
    throw new Error('You have already accepted this agreement');
  }

  agreement.acceptedBy.push({
    user: user._id,
    acceptedAt: new Date(),
    ipAddress: req.ip
  });

  await agreement.save();

  await AuditLog.logTransaction('agreement_accepted', user._id, 'success', req, {
    transactionId,
    agreementId: agreement._id
  });

  await createSystemMessage(transactionId, `${isBuyer ? 'Buyer' : 'Seller'} accepted the agreement`);

  return { agreement, message: 'Agreement accepted' };
};

// ========================
// AUDIT LOG
// ========================

const getAuditLog = async (transactionId, user) => {
  const transaction = await Transaction.findById(transactionId);
  if (!transaction) throw new Error('Transaction not found');

  const isBuyer = transaction.buyer.toString() === user._id.toString();
  const isSeller = transaction.seller?.toString() === user._id.toString();
  if (!isBuyer && !isSeller && user.role !== 'admin') throw new Error('Access denied');

  const logs = await AuditLog.find({
    category: 'transaction',
    'metadata.transactionId': transactionId
  })
    .populate('user', 'email profile')
    .sort({ createdAt: -1 })
    .limit(100);

  return { logs };
};

module.exports = {
  createTransaction,
  acceptTransaction,
  markAsDelivered,
  releaseFunds,
  raiseDispute,
  cancelTransaction,
  getUserTransactions,
  getTransactionById,
  getTransactionStats,
  autoReleaseExpiredInspections,
  releaseMilestone,
  toggleDeliverable,
  addMilestoneNote,
  submitMilestone,
  approveMilestone,
  getAgreement,
  createAgreement,
  acceptAgreement,
  getAuditLog
};
