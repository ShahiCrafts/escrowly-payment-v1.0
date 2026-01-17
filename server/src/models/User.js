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
    passwordHistory: [String],
    mustChangePassword: { type: Boolean, default: false }
  },
  stripe: {
    customerId: String,
    connectAccountId: String,
    connectOnboarded: { type: Boolean, default: false }
  },
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id;
      ret.mfaEnabled = doc.mfa?.enabled || false;
      delete ret.password;
      delete ret.mfa;
      delete ret.security;
      delete ret.emailVerification;
      delete ret.passwordResetToken;
      delete ret.passwordResetExpires;
      delete ret.__v;

      if (ret.profile) {
        if (ret.profile.firstName) ret.profile.firstName = decrypt(ret.profile.firstName) || ret.profile.firstName;
        if (ret.profile.lastName) ret.profile.lastName = decrypt(ret.profile.lastName) || ret.profile.lastName;
        if (ret.profile.phoneNumber) ret.profile.phoneNumber = decrypt(ret.profile.phoneNumber) || ret.profile.phoneNumber;
      }

      return ret;
    }
  }
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, rounds);

    if (!this.security.passwordHistory) {
      this.security.passwordHistory = [];
    }
    this.security.passwordHistory.unshift(this.password);
    if (this.security.passwordHistory.length > 5) {
      this.security.passwordHistory = this.security.passwordHistory.slice(0, 5);
    }

    this.security.passwordChangedAt = new Date();
    this.security.passwordExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  }

  if (this.isModified('profile.firstName') && this.profile.firstName) {
    const decrypted = decrypt(this.profile.firstName);
    if (!decrypted) {
      this.profile.firstName = encrypt(this.profile.firstName);
    }
  }
  if (this.isModified('profile.lastName') && this.profile.lastName) {
    const decrypted = decrypt(this.profile.lastName);
    if (!decrypted) {
      this.profile.lastName = encrypt(this.profile.lastName);
    }
  }
  if (this.isModified('profile.phoneNumber') && this.profile.phoneNumber) {
    const decrypted = decrypt(this.profile.phoneNumber);
    if (!decrypted) {
      this.profile.phoneNumber = encrypt(this.profile.phoneNumber);
    }
  }

  if (this.isModified('mfa.secret') && this.mfa.secret) {
    const decrypted = decrypt(this.mfa.secret);
    if (!decrypted) {
      this.mfa.secret = encrypt(this.mfa.secret);
    }
  }

  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.isPasswordInHistory = async function (candidatePassword) {
  if (!this.security.passwordHistory || this.security.passwordHistory.length === 0) {
    return false;
  }
  for (const oldHash of this.security.passwordHistory) {
    const isMatch = await bcrypt.compare(candidatePassword, oldHash);
    if (isMatch) return true;
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

userSchema.methods.incrementFailedAttempts = async function () {
  this.security.failedLoginAttempts += 1;
  if (this.security.failedLoginAttempts >= 5) {
    this.security.lockoutUntil = new Date(Date.now() + 5 * 60 * 1000);
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

userSchema.methods.getMfaSecret = function () {
  if (!this.mfa.secret) return null;
  return decrypt(this.mfa.secret) || this.mfa.secret;
};

userSchema.index({ 'stripe.customerId': 1 });
userSchema.index({ 'stripe.connectAccountId': 1 });

module.exports = mongoose.model('User', userSchema);
