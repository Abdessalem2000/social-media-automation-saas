const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        preferences: user.preferences,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile', [
  authenticate,
  body('firstName').optional().notEmpty().trim().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().trim().withMessage('Last name cannot be empty'),
  body('username').optional().isLength({ min: 3, max: 30 }).trim().withMessage('Username must be 3-30 characters'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, username, email, avatar } = req.body;
    const userId = req.user.userId;

    // Check if username is being changed and if it's already taken
    if (username && username !== req.user.username) {
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          error: 'Username already taken',
          message: 'This username is already in use'
        });
      }
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingEmail = await User.findOne({ 
        email, 
        _id: { $ne: userId } 
      });
      
      if (existingEmail) {
        return res.status(400).json({
          error: 'Email already taken',
          message: 'This email is already in use'
        });
      }
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user preferences
router.put('/preferences', [
  authenticate,
  body('language').optional().isIn(['en', 'fr', 'ar']),
  body('timezone').optional().notEmpty(),
  body('notifications').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { language, timezone, notifications } = req.body;
    const userId = req.user.userId;

    const updateData = { 'preferences': {} };
    if (language) updateData['preferences.language'] = language;
    if (timezone) updateData['preferences.timezone'] = timezone;
    if (notifications) {
      if (notifications.email !== undefined) updateData['preferences.notifications.email'] = notifications.email;
      if (notifications.push !== undefined) updateData['preferences.notifications.push'] = notifications.push;
      if (notifications.sms !== undefined) updateData['preferences.notifications.sms'] = notifications.sms;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: user.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/password', [
  authenticate,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Invalid current password',
        message: 'The current password you entered is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user account
router.delete('/account', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Verify user exists before deletion
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User account not found'
      });
    }

    // In a real app, you would:
    // 1. Delete all associated data (posts, accounts, etc.)
    // 2. Cancel any active subscriptions
    // 3. Send confirmation email
    
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to delete account'
    });
  }
});

module.exports = router;
