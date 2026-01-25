const mongoose = require('mongoose');

// Deliverable item schema for milestone checklists
const deliverableSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true });

// Note schema for milestone progress updates
const milestoneNoteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'submitted', 'approved', 'released'],
    default: 'pending'
  },
  dueDate: Date,
  deliverables: [deliverableSchema],
  notes: [milestoneNoteSchema],
  submittedAt: Date,
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  releasedAt: Date
}, { _id: true });

const disputeSchema = new mongoose.Schema({
  reason: {
    type: String,
    required: true
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved'],
    default: 'open'
  },
  resolution: String,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const transactionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  amount: {
    type: Number,
    required: true,
    min: 1,
    max: 1000000
  },
  currency: {
    type: String,
    enum: ['npr'],
    default: 'npr'
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sellerEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'funded', 'delivered', 'completed', 'disputed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  milestones: [milestoneSchema],
  inspectionPeriod: {
    type: Number,
    default: function () {
      return parseInt(process.env.INSPECTION_PERIOD_DAYS) || 14;
    },
    min: 1,
    max: 30
  },
  deliveredAt: Date,
  inspectionEndsAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  dispute: disputeSchema,
  stripe: {
    paymentIntentId: String,
    chargeId: String,
    transferId: String,
    refundId: String
  },
  fees: {
    platformFee: { type: Number, default: 0 },
    stripeFee: { type: Number, default: 0 }
  },
  amountReleased: {
    type: Number,
    default: 0
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

transactionSchema.methods.canBeAccepted = function (userId) {
  if (this.status !== 'pending') return false;
  if (this.initiatedBy.toString() === userId.toString()) return false;
  if (this.seller && this.seller.toString() !== userId.toString()) return false;
  return true;
};

transactionSchema.methods.canBeFunded = function (userId) {
  if (this.status !== 'accepted') return false;
  if (this.buyer.toString() !== userId.toString()) return false;
  return true;
};

transactionSchema.methods.canBeDelivered = function (userId) {
  if (this.status !== 'funded') return false;
  if (this.seller.toString() !== userId.toString()) return false;
  return true;
};

transactionSchema.methods.canBeReleased = function (userId) {
  if (this.status !== 'delivered') return false;
  if (this.buyer.toString() !== userId.toString()) return false;
  return true;
};

transactionSchema.methods.canBeDisputed = function (userId) {
  if (!['funded', 'delivered'].includes(this.status)) return false;
  const isBuyer = this.buyer.toString() === userId.toString();
  const isSeller = this.seller && this.seller.toString() === userId.toString();
  return isBuyer || isSeller;
};

transactionSchema.methods.canBeCancelled = function (userId) {
  if (!['pending', 'accepted'].includes(this.status)) return false;
  const isBuyer = this.buyer.toString() === userId.toString();
  const isSeller = this.seller && this.seller.toString() === userId.toString();
  const isInitiator = this.initiatedBy.toString() === userId.toString();
  return isBuyer || isSeller || isInitiator;
};

transactionSchema.methods.markAsDelivered = function () {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  this.inspectionEndsAt = new Date(Date.now() + this.inspectionPeriod * 24 * 60 * 60 * 1000);
};

transactionSchema.methods.isInspectionPeriodExpired = function () {
  if (this.status !== 'delivered') return false;
  if (!this.inspectionEndsAt) return false;
  return new Date() > this.inspectionEndsAt;
};

transactionSchema.methods.isBuyer = function (userId) {
  if (!userId) return false;
  return (this.buyer._id || this.buyer).toString() === userId.toString();
};

transactionSchema.methods.isSeller = function (userId) {
  if (!this.seller || !userId) return false;
  return (this.seller._id || this.seller).toString() === userId.toString();
};

transactionSchema.methods.isParty = function (userId) {
  return this.isBuyer(userId) || this.isSeller(userId);
};

transactionSchema.index({ buyer: 1 });
transactionSchema.index({ seller: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ 'stripe.paymentIntentId': 1 });
transactionSchema.index({ inspectionEndsAt: 1, status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
