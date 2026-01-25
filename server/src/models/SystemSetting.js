const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    description: String,
    category: {
        type: String,
        enum: ['general', 'transactions', 'security', 'notifications'],
        default: 'general'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
