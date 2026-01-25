const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  }
}, { _id: true });

const messageSchema = new mongoose.Schema({
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true,
    maxlength: 5000
  },
  encryptedContent: {
    type: String,
    trim: true,
    default: null
  },
  encryptionNonce: {
    type: String,
    trim: true,
    default: null
  },
  attachments: [attachmentSchema],
  isSystemMessage: {
    type: Boolean,
    default: false
  },
  isPoc: {
    type: Boolean,
    default: false
  },
  pocTitle: {
    type: String,
    trim: true,
    maxlength: 200
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
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

messageSchema.index({ transaction: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema);
