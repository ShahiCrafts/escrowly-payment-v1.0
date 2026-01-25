const mongoose = require('mongoose');

// Schema for tracking who accepted the agreement
const acceptanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    acceptedAt: {
        type: Date,
        default: Date.now
    },
    ipAddress: String
}, { _id: true });

const agreementSchema = new mongoose.Schema({
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true,
        index: true
    },
    version: {
        type: Number,
        default: 1
    },
    title: {
        type: String,
        trim: true,
        maxlength: 200,
        default: 'Transaction Agreement'
    },
    terms: {
        type: String,
        required: true,
        maxlength: 50000 // Rich text or Markdown content
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    acceptedBy: [acceptanceSchema],
    isActive: {
        type: Boolean,
        default: true
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

// Index for efficient queries
agreementSchema.index({ transaction: 1, version: -1 });
agreementSchema.index({ transaction: 1, isActive: 1 });

// Static method to get the active agreement for a transaction
agreementSchema.statics.getActiveAgreement = async function (transactionId) {
    return this.findOne({
        transaction: transactionId,
        isActive: true
    }).populate('createdBy', 'email profile')
        .populate('acceptedBy.user', 'email profile');
};

// Instance method to check if a user has accepted
agreementSchema.methods.hasUserAccepted = function (userId) {
    return this.acceptedBy.some(a => a.user.toString() === userId.toString());
};

module.exports = mongoose.model('Agreement', agreementSchema);
