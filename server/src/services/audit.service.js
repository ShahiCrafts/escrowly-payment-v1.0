const { AuditLog } = require('../models');

const getAuditLogs = async (filters = {}) => {
  const query = {};

  if (filters.userId) {
    query.user = filters.userId;
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.action) {
    query.action = filters.action;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) {
      query.createdAt.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.createdAt.$lte = new Date(filters.endDate);
    }
  }

  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const logs = await AuditLog.find(query)
    .populate('user', 'email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await AuditLog.countDocuments(query);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const getUserAuditLogs = async (userId, limit = 20) => {
  return AuditLog.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

const getSecurityEvents = async (userId, limit = 10) => {
  return AuditLog.find({
    user: userId,
    category: { $in: ['auth', 'security'] }
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = {
  getAuditLogs,
  getUserAuditLogs,
  getSecurityEvents
};
