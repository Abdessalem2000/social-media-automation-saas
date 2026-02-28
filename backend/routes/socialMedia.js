const express = require('express');
const { body, validationResult } = require('express-validator');
const SocialMediaAccount = require('../models/SocialMediaAccount');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Get all connected accounts for a user
router.get('/', authenticate, async (req, res) => {
  try {
    const accounts = await SocialMediaAccount.find({ 
      userId: req.user.userId,
      isActive: true 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Connect a new social media account
router.post('/connect', [
  authenticate,
  body('platform').isIn(['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin']),
  body('accountId').notEmpty(),
  body('accountName').notEmpty(),
  body('username').notEmpty(),
  body('accessToken').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { platform, accountId, accountName, username, accessToken, refreshToken, profileData } = req.body;

    // Check if account already exists
    const existingAccount = await SocialMediaAccount.findOne({
      userId: req.user.userId,
      platform,
      accountId
    });

    if (existingAccount) {
      return res.status(400).json({
        error: 'Account already connected',
        message: 'This social media account is already connected to your profile'
      });
    }

    // Create new account connection
    const account = new SocialMediaAccount({
      userId: req.user.userId,
      platform,
      accountId,
      accountName,
      username,
      accessToken,
      refreshToken,
      profileData: profileData || {}
    });

    await account.save();

    res.status(201).json({
      success: true,
      message: 'Account connected successfully',
      data: account
    });
  } catch (error) {
    console.error('Connect account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Disconnect a social media account
router.delete('/:accountId', authenticate, async (req, res) => {
  try {
    const account = await SocialMediaAccount.findOneAndUpdate(
      {
        _id: req.params.accountId,
        userId: req.user.userId
      },
      { isActive: false },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'This account is not connected to your profile'
      });
    }

    res.json({
      success: true,
      message: 'Account disconnected successfully'
    });
  } catch (error) {
    console.error('Disconnect account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sync account data
router.post('/:accountId/sync', authenticate, async (req, res) => {
  try {
    const account = await SocialMediaAccount.findOne({
      _id: req.params.accountId,
      userId: req.user.userId,
      isActive: true
    });

    if (!account) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'This account is not connected to your profile'
      });
    }

    // Update sync status
    account.syncStatus = 'syncing';
    await account.save();

    // Simulate sync process (in real app, this would call platform APIs)
    setTimeout(async () => {
      try {
        // Mock updated profile data
        account.profileData.followers = Math.floor(Math.random() * 10000) + 100;
        account.profileData.following = Math.floor(Math.random() * 1000) + 50;
        account.profileData.posts = Math.floor(Math.random() * 500) + 10;
        account.lastSync = new Date();
        account.syncStatus = 'success';
        await account.save();
      } catch (_syncError) {
        account.syncStatus = 'error';
        await account.save();
      }
    }, 2000);

    res.json({
      success: true,
      message: 'Account sync started',
      data: {
        syncStatus: 'syncing',
        lastSync: account.lastSync
      }
    });
  } catch (error) {
    console.error('Sync account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get platform-specific authenticate URL
router.get('/:platform/authenticate-url', authenticate, (req, res) => {
  try {
    const { platform } = req.params;
    const { redirectUri } = req.query;

    // Mock authenticate URLs (in real app, these would be actual platform URLs)
    const authenticateUrls = {
      facebook: `https://www.facebook.com/v18.0/dialog/oauthenticate?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${redirectUri}&scope=pages_manage_posts,pages_read_engagement`,
      instagram: `https://api.instagram.com/oauthenticate/authenticateorize?client_id=${process.env.INSTAGRAM_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code`,
      twitter: `https://twitter.com/i/oauthenticate2/authenticateorize?client_id=${process.env.TWITTER_API_KEY}&redirect_uri=${redirectUri}&scope=tweet.read%20tweet.write%20users.read&response_type=code`,
      tiktok: `https://www.tiktok.com/v2/authenticate/authenticateorize?client_key=${process.env.TIKTOK_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user.info.basic%20video.list`,
      linkedin: `https://www.linkedin.com/oauthenticate/v2/authenticateorization?client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${redirectUri}&scope=profile%20email%20w_member_social`
    };

    const authenticateUrl = authenticateUrls[platform];
    if (!authenticateUrl) {
      return res.status(400).json({
        error: 'Invalid platform',
        message: 'Platform not supported'
      });
    }

    res.json({
      success: true,
      data: {
        authenticateUrl
      }
    });
  } catch (error) {
    console.error('Get authenticate URL error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
