const mongoose = require('mongoose');
const { hashSHA256 } = require('../utils/crypto');

const refreshTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tokenHash: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdByIp: String,
  userAgent: String,
  revokedAt: Date,
  revokedByIp: String,
  replacedByTokenHash: String
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret.tokenHash;
      delete ret.replacedByTokenHash;
      delete ret.__v;
      return ret;
    }
  }
});

refreshTokenSchema.virtual('isExpired').get(function () {
  return Date.now() >= this.expiresAt;
});

refreshTokenSchema.virtual('isActive').get(function () {
  return !this.revokedAt && !this.isExpired;
});

refreshTokenSchema.statics.hashToken = function (token) {
  return hashSHA256(token);
};

refreshTokenSchema.statics.createToken = async function (user, token, ip, userAgent, replacedTokenHash = null) {
  // If this is a rotation (replacing an old token)
  if (replacedTokenHash) {
    const oldToken = await this.findOne({ tokenHash: replacedTokenHash });
    if (oldToken) {
      oldToken.revokedAt = new Date();
      oldToken.revokedByIp = ip;
      oldToken.replacedByTokenHash = this.hashToken(token);
      await oldToken.save();
    }
  } else {
    // If this is a fresh login, enforce concurrent session limit (max 3)
    const activeTokens = await this.countDocuments({
      user: user._id,
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    });

    if (activeTokens >= 3) {
      const oldestToken = await this.findOne({
        user: user._id,
        revokedAt: null,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: 1 });

      if (oldestToken) {
        oldestToken.revokedAt = new Date();
        oldestToken.revokedByIp = ip;
        await oldestToken.save();
      }
    }
  }

  const tokenDoc = await this.create({
    user: user._id,
    tokenHash: this.hashToken(token),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdByIp: ip,
    userAgent: userAgent
  });

  return tokenDoc;
};

refreshTokenSchema.statics.findByToken = async function (token) {
  const hash = this.hashToken(token);
  return this.findOne({ tokenHash: hash });
};

refreshTokenSchema.statics.revokeToken = async function (token, ip) {
  const tokenDoc = await this.findByToken(token);
  if (tokenDoc) {
    tokenDoc.revokedAt = new Date();
    tokenDoc.revokedByIp = ip;
    await tokenDoc.save();
  }
  return tokenDoc;
};

refreshTokenSchema.statics.revokeAllUserTokens = async function (userId, ip) {
  return this.updateMany(
    { user: userId, revokedAt: null },
    { revokedAt: new Date(), revokedByIp: ip }
  );
};

refreshTokenSchema.statics.getActiveSessions = async function (userId) {
  return this.find({
    user: userId,
    revokedAt: null,
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

refreshTokenSchema.index({ user: 1 });
refreshTokenSchema.index({ tokenHash: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
