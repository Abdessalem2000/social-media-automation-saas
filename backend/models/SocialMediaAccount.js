const mongoose = require('mongoose');

const socialMediaAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    required: true,
    enum: ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin']
  },
  accountId: {
    type: String,
    required: true
  },
  accountName: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    default: null
  },
  tokenExpiresAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profileData: {
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },
    profilePicture: { type: String, default: null },
    bio: { type: String, default: null },
    verified: { type: Boolean, default: false }
  },
  lastSync: {
    type: Date,
    default: Date.now
  },
  syncStatus: {
    type: String,
    enum: ['pending', 'syncing', 'success', 'error'],
    default: 'pending'
  }
}, {
  timestamps: true
});

socialMediaAccountSchema.index({ userId: 1, platform: 1 });
socialMediaAccountSchema.index({ platform: 1 });
socialMediaAccountSchema.index({ isActive: 1 });

module.exports = mongoose.model('SocialMediaAccount', socialMediaAccountSchema);
