const express = require('express');
const Post = require('../models/Post');
const { authenticate } = require('../middleware/auth');
const { logger } = require('../middleware/errorHandler');
const router = express.Router();

// Get all posts for a user
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, platform, page = 1, limit = 20 } = req.query;
    
    const filter = { userId: req.user.userId };
    if (status) filter.status = status;
    if (platform) filter.platform = platform;

    const posts = await Post.find(filter)
      .populate('accountId', 'platform accountName username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(filter);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    logger.error('Get posts error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new post
router.post('/', [
  authenticate,
  require('express-validator').body('accountId').notEmpty(),
  require('express-validator').body('content.text').notEmpty().isLength({ max: 2000 }),
  require('express-validator').body('platform').isIn(['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin'])
], async (req, res) => {
  try {
    const { validationResult } = require('express-validator');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { accountId, content, platform, scheduledAt, hashtags, mentions, settings } = req.body;

    const post = new Post({
      userId: req.user.userId,
      accountId,
      content,
      platform,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      hashtags: hashtags || [],
      mentions: mentions || [],
      settings: settings || {}
    });

    await post.save();

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: post
    });
  } catch (error) {
    logger.error('Create post error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get scheduled posts
router.get('/scheduled', authenticate, async (req, res) => {
  try {
    const posts = await Post.find({
      userId: req.user.userId,
      status: 'scheduled',
      scheduledAt: { $gte: new Date() }
    })
    .populate('accountId', 'platform accountName username')
    .sort({ scheduledAt: 1 });

    res.json({
      success: true,
      data: posts
    });
  } catch (error) {
    logger.error('Get scheduled posts error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get published posts with metrics
router.get('/published', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const posts = await Post.find({
      userId: req.user.userId,
      status: 'published'
    })
    .populate('accountId', 'platform accountName username')
    .sort({ publishedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Post.countDocuments({
      userId: req.user.userId,
      status: 'published'
    });

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    logger.error('Get published posts error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
