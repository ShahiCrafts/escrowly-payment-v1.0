const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { encrypt, decrypt } = require('../utils/crypto');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: function () { return !this.googleId; }
    },
    googleId: {
        type: String,
        sparse: true,
        index: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    profile: {
        firstName: { type: String, default: '' },
        lastName: { type: String, default: '' },
        phoneNumber: { type: String, default: '' },
        avatar: {
            url: String,
            publicId: String
        }
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerification: {
        token: String,
        expiresAt: Date
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    suspensionReason: String,
    mfa: {
        enabled: { type: Boolean, default: false },
        method: { type: String, enum: ['totp', 'email'], default: 'totp' },
        secret: String,
        backupCodes: [String],
        emailOtp: {
            code: String,
            expiresAt: Date
        }
    },
    security: {
        failedLoginAttempts: { type: Number, default: 0 },
        lockoutUntil: Date,
        lastLogin: Date,
        lastLoginIp: String,
        passwordChangedAt: Date,
        passwordExpiresAt: Date,
        mustChangePassword: { type: Boolean, default: false },
        tokenVersion: { type: Number, default: 0 },
        passwordHistory: [String]
    },
    stripe: {
        customerId: String,
        connectAccountId: String,
        connectOnboarded: { type: Boolean, default: false }
    },
    notificationPreferences: {
        emailTransactions: { type: Boolean, default: true },
        emailMarketing: { type: Boolean, default: false },
        emailSecurity: { type: Boolean, default: true },
        inAppNotifications: { type: Boolean, default: true },
        pushTransactions: { type: Boolean, default: true },
        pushMessages: { type: Boolean, default: true }
    },
    trustScore: {
        type: Number,
        default: 100,
        min: 0,
        max: 100
    },
    stats: {
        totalCompleted: { type: Number, default: 0 },
        totalDisputed: { type: Number, default: 0 },
        totalCancelled: { type: Number, default: 0 },
        totalTransactionVolume: { type: Number, default: 0 },
        monthlyUsage: {
            amount: { type: Number, default: 0 },
            count: { type: Number, default: 0 },
            lastResetAt: { type: Date, default: Date.now }
        }
    },
    kyc: {
        status: {
            type: String,
            enum: ['not_started', 'pending', 'verified', 'rejected'],
            default: 'not_started'
        },
        documentType: {
            type: String,
            enum: ['passport', 'nid', 'citizenship']
        },
        idNumber: { type: String },
        fullName: { type: String },
        gender: { type: String, enum: ['male', 'female', 'others'] },
        maritalStatus: { type: String, enum: ['married', 'unmarried', 'other'] },
        dob: {
            ad: Date,
            bs: String
        },
        panNumber: { type: String },
        socialMediaId: { type: String },
        familyDetails: {
            fatherName: String,
            motherName: String,
            grandfatherName: String,
            spouseName: String
        },
        permanentAddress: {
            street: String,
            ward: String,
            municipality: String,
            district: String,
            province: String,
            country: { type: String, default: 'Nepal' }
        },
        currentAddress: {
            street: String,
            ward: String,
            municipality: String,
            district: String,
            province: String,
            country: { type: String, default: 'Nepal' }
        },
        education: String,
        occupation: String,
        employerName: String,
        position: String,
        yearlyIncome: String,
        incomeSource: String,
        pepStatus: { type: Boolean, default: false },
        beneficialOwner: { type: Boolean, default: false },
        residenceStatus: String,
        documents: [{
            url: String,
            publicId: String,
            type: { type: String, enum: ['front', 'back', 'selfie', 'other'], default: 'other' }
        }],
        isAutomatedVerified: { type: Boolean, default: false },
        selfieMatchScore: { type: Number, min: 0, max: 100 },
        verificationSource: { type: String, enum: ['manual', 'ai_match', 'external_api'], default: 'manual' },
        submittedAt: Date,
        verifiedAt: Date,
        rejectionReason: String
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    publicKey: {
        type: String,
        trim: true,
        default: null
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            try {
                ret.id = ret._id;
                ret.mfaEnabled = doc.mfa?.enabled || false;
                ret.trustScore = doc.trustScore || 100;
                ret.stats = doc.stats || { totalCompleted: 0, totalDisputed: 0, totalCancelled: 0, totalTransactionVolume: 0 };
                delete ret.password;
                delete ret.mfa;
                delete ret.security;
                delete ret.emailVerification;
                delete ret.passwordResetToken;
                delete ret.passwordResetExpires;
                delete ret.__v;

                const decryptIfSet = (obj, field) => {
                    if (obj && obj[field] && typeof obj[field] === 'string') {
                        obj[field] = decrypt(obj[field]) || obj[field];
                    }
                };

                if (ret.profile) {
                    ['firstName', 'lastName', 'phoneNumber'].forEach(f => decryptIfSet(ret.profile, f));
                }

                if (ret.kyc) {
                    ['fullName', 'idNumber', 'panNumber', 'socialMediaId'].forEach(f => decryptIfSet(ret.kyc, f));
                    if (ret.kyc.familyDetails) {
                        ['fatherName', 'motherName', 'grandfatherName', 'spouseName'].forEach(f => decryptIfSet(ret.kyc.familyDetails, f));
                    }
                    if (ret.kyc.permanentAddress) {
                        ['street', 'ward', 'municipality', 'district'].forEach(f => decryptIfSet(ret.kyc.permanentAddress, f));
                    }
                    if (ret.kyc.currentAddress) {
                        ['street', 'ward', 'municipality', 'district'].forEach(f => decryptIfSet(ret.kyc.currentAddress, f));
                    }
                }

                return ret;
            } catch (error) {
                console.error('Error in User transform:', error);
                return ret;
            }
        }
    }
});

userSchema.pre('save', async function (next) {
    if (this.isModified('password') && this.password) {
        const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const oldUser = await this.constructor.findById(this._id).select('password');
        if (oldUser && oldUser.password) {
            this.security.passwordHistory.unshift(oldUser.password);
            this.security.passwordHistory = this.security.passwordHistory.slice(0, 5);
        }
        this.password = await bcrypt.hash(this.password, rounds);
        this.security.passwordChangedAt = new Date();
        this.security.passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    }

    const sensitiveFields = [
        'profile.firstName', 'profile.lastName', 'profile.phoneNumber',
        'mfa.secret',
        'kyc.fullName', 'kyc.idNumber', 'kyc.panNumber', 'kyc.socialMediaId',
        'kyc.familyDetails.fatherName', 'kyc.familyDetails.motherName', 'kyc.familyDetails.grandfatherName', 'kyc.familyDetails.spouseName',
        'kyc.permanentAddress.street', 'kyc.permanentAddress.ward', 'kyc.permanentAddress.municipality', 'kyc.permanentAddress.district',
        'kyc.currentAddress.street', 'kyc.currentAddress.ward', 'kyc.currentAddress.municipality', 'kyc.currentAddress.district'
    ];

    for (const field of sensitiveFields) {
        if (this.isModified(field)) {
            const value = this.get(field);
            if (value && typeof value === 'string' && !decrypt(value)) {
                this.set(field, encrypt(value));
            }
        }
    }

    next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isPasswordInHistory = async function (newPassword) {
    for (const hashedPassword of this.security.passwordHistory) {
        const match = await bcrypt.compare(newPassword, hashedPassword);
        if (match) return true;
    }
    return false;
};

userSchema.methods.isLocked = function () {
    return this.security.lockoutUntil && this.security.lockoutUntil > Date.now();
};

userSchema.methods.isPasswordExpired = function () {
    if (!this.security.passwordExpiresAt) return false;
    return new Date() > this.security.passwordExpiresAt;
};

userSchema.methods.incrementFailedAttempts = async function (maxAttempts = 5, lockoutMinutes = 5) {
    this.security.failedLoginAttempts += 1;
    if (this.security.failedLoginAttempts >= maxAttempts) {
        this.security.lockoutUntil = new Date(Date.now() + lockoutMinutes * 60 * 1000);
    }
    await this.save();
};

userSchema.methods.resetFailedAttempts = async function () {
    this.security.failedLoginAttempts = 0;
    this.security.lockoutUntil = undefined;
    await this.save();
};

userSchema.methods.getDecryptedProfile = function () {
    return {
        firstName: decrypt(this.profile.firstName) || this.profile.firstName || '',
        lastName: decrypt(this.profile.lastName) || this.profile.lastName || '',
        phoneNumber: decrypt(this.profile.phoneNumber) || this.profile.phoneNumber || ''
    };
};

userSchema.methods.getDecryptedKYC = function () {
    const k = this.kyc || {};
    const df = (val) => (val ? (decrypt(val) || val) : '');

    return {
        fullName: df(k.fullName),
        idNumber: df(k.idNumber),
        panNumber: df(k.panNumber),
        socialMediaId: df(k.socialMediaId),
        family: k.familyDetails ? {
            father: df(k.familyDetails.fatherName),
            mother: df(k.familyDetails.motherName),
            grandfather: df(k.familyDetails.grandfatherName),
            spouse: df(k.familyDetails.spouseName)
        } : {},
        permanentAddress: k.permanentAddress ? {
            street: df(k.permanentAddress.street),
            ward: df(k.permanentAddress.ward),
            municipality: df(k.permanentAddress.municipality),
            district: df(k.permanentAddress.district)
        } : {},
        currentAddress: k.currentAddress ? {
            street: df(k.currentAddress.street),
            ward: df(k.currentAddress.ward),
            municipality: df(k.currentAddress.municipality),
            district: df(k.currentAddress.district)
        } : {}
    };
};

userSchema.methods.getMfaSecret = function () {
    if (!this.mfa.secret) return null;
    return decrypt(this.mfa.secret) || this.mfa.secret;
};

userSchema.index({ 'stripe.customerId': 1 });
userSchema.index({ 'stripe.connectAccountId': 1 });

module.exports = mongoose.model('User', userSchema);
