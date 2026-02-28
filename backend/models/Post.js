const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialMediaAccount',
    required: true
  },
  content: {
    text: { type: String, required: true, maxlength: 2000 },
    media: [{
      type: { type: String, enum: ['image', 'video'], required: true },
      url: { type: String, required: true },
      thumbnail: { type: String, default: null },
      caption: { type: String, default: null }
    }]
  },
  platform: {
    type: String,
    required: true,
    enum: ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin']
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'published', 'failed'],
    default: 'draft'
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  publishedAt: {
    type: Date,
    default: null
  },
  platformPostId: {
    type: String,
    default: null
  },
  metrics: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 }
  },
  hashtags: [{
    type: String,
    trim: true
  }],
  mentions: [{
    type: String,
    trim: true
  }],
  location: {
    name: { type: String, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null }
  },
  settings: {
    allowComments: { type: Boolean, default: true },
    allowSharing: { type: Boolean, default: true },
    isSensitive: { type: Boolean, default: false }
  },
  error: {
    code: { type: String, default: null },
    message: { type: String, default: null },
    timestamp: { type: Date, default: null }
  }
}, {
  timestamps: true
});

postSchema.index({ userId: 1, status: 1 });
postSchema.index({ accountId: 1 });
postSchema.index({ platform: 1 });
postSchema.index({ scheduledAt: 1 });
postSchema.index({ publishedAt: 1 });

module.exports = mongoose.model('Post', postSchema);
