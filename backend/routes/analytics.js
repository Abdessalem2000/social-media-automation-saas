const express = require('express');
const { logger } = require('../middleware/errorHandler');
const Post = require('../models/Post');
const SocialMediaAccount = require('../models/SocialMediaAccount');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Get analytics overview
router.get('/overview', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get user's connected accounts
    const accounts = await SocialMediaAccount.find({ 
      userId, 
      isActive: true 
    });

    // Get post statistics
    const totalPosts = await Post.countDocuments({ userId });
    const publishedPosts = await Post.countDocuments({ 
      userId, 
      status: 'published' 
    });
    const scheduledPosts = await Post.countDocuments({ 
      userId, 
      status: 'scheduled' 
    });

    // Calculate total engagement
    const engagementData = await Post.aggregate([
      { $match: { userId } },
      { $group: {
        _id: null,
        totalLikes: { $sum: '$metrics.likes' },
        totalComments: { $sum: '$metrics.comments' },
        totalShares: { $sum: '$metrics.shares' },
        totalViews: { $sum: '$metrics.views' },
        totalReach: { $sum: '$metrics.reach' }
      }}
    ]);

    const engagement = engagementData[0] || {
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalViews: 0,
      totalReach: 0
    };

    // Platform-wise statistics
    const platformStats = await Post.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$platform',
        postCount: { $sum: 1 },
        totalEngagement: { 
          $sum: { 
            $add: ['$metrics.likes', '$metrics.comments', '$metrics.shares'] 
          } 
        }
      }},
      { $sort: { postCount: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalAccounts: accounts.length,
          totalPosts,
          publishedPosts,
          scheduledPosts,
          draftPosts: totalPosts - publishedPosts - scheduledPosts
        },
        engagement,
        platformStats,
        accounts: accounts.map(acc => ({
          platform: acc.platform,
          accountName: acc.accountName,
          followers: acc.profileData.followers,
          posts: acc.profileData.posts
        }))
      }
    });
  } catch (error) {
    logger.error('Analytics overview error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get engagement trends (last 30 days)
router.get('/trends', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await Post.aggregate([
      {
        $match: {
          userId,
          publishedAt: { $gte: thirtyDaysAgo },
          status: 'published'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$publishedAt' },
            month: { $month: '$publishedAt' },
            day: { $dayOfMonth: '$publishedAt' }
          },
          posts: { $sum: 1 },
          likes: { $sum: '$metrics.likes' },
          comments: { $sum: '$metrics.comments' },
          shares: { $sum: '$metrics.shares' },
          views: { $sum: '$metrics.views' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Format data for charts
    const trends = dailyStats.map(stat => ({
      date: `${stat._id.year}-${String(stat._id.month).padStart(2, '0')}-${String(stat._id.day).padStart(2, '0')}`,
      posts: stat.posts,
      engagement: stat.likes + stat.comments + stat.shares,
      likes: stat.likes,
      comments: stat.comments,
      shares: stat.shares,
      views: stat.views
    }));

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    logger.error('Analytics trends error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top performing posts
router.get('/top-posts', authenticate, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const topPosts = await Post.find({
      userId: req.user.userId,
      status: 'published'
    })
    .populate('accountId', 'platform accountName username')
    .sort({ 'metrics.engagement': -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: topPosts
    });
  } catch (error) {
    logger.error('Top posts error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get platform-specific analytics
router.get('/platform/:platform', authenticate, async (req, res) => {
  try {
    const { platform } = req.params;
    const userId = req.user.userId;

    const platformData = await Post.aggregate([
      { $match: { userId, platform } },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          totalLikes: { $sum: '$metrics.likes' },
          totalComments: { $sum: '$metrics.comments' },
          totalShares: { $sum: '$metrics.shares' },
          totalViews: { $sum: '$metrics.views' },
          avgEngagement: { $avg: '$metrics.engagement' }
        }
      }
    ]);

    const account = await SocialMediaAccount.findOne({
      userId,
      platform,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        platform,
        stats: platformData[0] || {
          totalPosts: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          totalViews: 0,
          avgEngagement: 0
        },
        account: account ? {
          accountName: account.accountName,
          followers: account.profileData.followers,
          following: account.profileData.following,
          posts: account.profileData.posts
        } : null
      }
    });
  } catch (error) {
    logger.error('Platform analytics error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
