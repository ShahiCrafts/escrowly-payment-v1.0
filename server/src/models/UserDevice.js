const mongoose = require('mongoose');

const userDeviceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: {
        type: String,
        required: true
    },
    isTrusted: {
        type: Boolean,
        default: true
    },
    lastUsedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

userDeviceSchema.index({ user: 1, ipAddress: 1, userAgent: 1 }, { unique: true });

module.exports = mongoose.model('UserDevice', userDeviceSchema);
