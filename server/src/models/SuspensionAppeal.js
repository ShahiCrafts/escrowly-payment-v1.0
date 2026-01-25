const mongoose = require('mongoose');

const suspensionAppealSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    reason: {
        type: String,
        required: true,
        maxlength: 2000
    },
    evidence: [{
        type: {
            type: String,
            enum: ['link', 'text', 'image', 'document'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        description: String
    }],
    status: {
        type: String,
        enum: ['pending', 'under_review', 'approved', 'rejected'],
        default: 'pending',
        index: true
    },
    adminResponse: {
        message: String,
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        respondedAt: Date
    },
    suspensionReason: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Only allow one pending/under_review appeal per user
suspensionAppealSchema.index(
    { user: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: { $in: ['pending', 'under_review'] } }
    }
);

module.exports = mongoose.model('SuspensionAppeal', suspensionAppealSchema);
