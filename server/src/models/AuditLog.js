const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['auth', 'payment', 'transaction', 'security', 'user', 'admin', 'system'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    required: true
  },
  ip: String,
  userAgent: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });

auditLogSchema.statics.log = async function (data) {
  return this.create({
    user: data.userId,
    action: data.action,
    category: data.category,
    status: data.status || 'success',
    ip: data.ip,
    userAgent: data.userAgent,
    metadata: data.metadata || {},
    severity: data.severity || 'info'
  });
};

auditLogSchema.statics.logAuth = async function (action, userId, status, req, metadata = {}) {
  return this.log({
    userId,
    action,
    category: 'auth',
    status,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    metadata,
    severity: status === 'failure' ? 'warning' : 'info'
  });
};

auditLogSchema.statics.logPayment = async function (action, userId, status, req, metadata = {}) {
  return this.log({
    userId,
    action,
    category: 'payment',
    status,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    metadata,
    severity: status === 'failure' ? 'error' : 'info'
  });
};

auditLogSchema.statics.logTransaction = async function (action, userId, status, req, metadata = {}) {
  return this.log({
    userId,
    action,
    category: 'transaction',
    status,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    metadata,
    severity: 'info'
  });
};

auditLogSchema.statics.logSecurity = async function (action, userId, status, req, metadata = {}) {
  return this.log({
    userId,
    action,
    category: 'security',
    status,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    metadata,
    severity: status === 'failure' ? 'critical' : 'info'
  });
};

module.exports = mongoose.model('AuditLog', auditLogSchema);
