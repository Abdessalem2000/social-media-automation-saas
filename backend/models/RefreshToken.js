const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  isRevoked: {
    type: Boolean,
    default: false,
    index: true
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    device: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for cleanup of expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to revoke token
refreshTokenSchema.methods.revoke = function() {
  this.isRevoked = true;
  return this.save();
};

// Static method to find valid token
refreshTokenSchema.statics.findValidToken = function(token, userId) {
  return this.findOne({
    token,
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() }
  }).populate('userId');
};

// Static method to revoke all user tokens
refreshTokenSchema.statics.revokeAllUserTokens = function(userId) {
  return this.updateMany(
    { userId, isRevoked: false },
    { isRevoked: true }
  );
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
