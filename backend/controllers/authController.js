const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwtService = require('../config/jwt');
const { asyncHandler, ValidationError, logger } = require('../middleware/errorHandler');

class AuthController {
  /**
   * Register a new user
   */
  static register = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }

    const { username, email, password, firstName, lastName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists',
        errorCode: 'USER_EXISTS'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName
    });

    await user.save();
    logger.info('User registered successfully', { userId: user._id, email: user.email });

    // Generate token pair
    const tokens = jwtService.generateTokenPair(user);

    // Store refresh token
    const refreshTokenDoc = new RefreshToken({
      userId: user._id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      deviceInfo: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });
    await refreshTokenDoc.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: this.sanitizeUser(user),
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      }
    });
  });

  /**
   * Login user
   */
  static login = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError('Validation failed', errors.array());
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errorCode: 'INVALID_CREDENTIALS'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errorCode: 'INVALID_CREDENTIALS'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    logger.info('User logged in successfully', { userId: user._id, email: user.email });

    // Generate token pair
    const tokens = jwtService.generateTokenPair(user);

    // Store refresh token
    const refreshTokenDoc = new RefreshToken({
      userId: user._id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      deviceInfo: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });
    await refreshTokenDoc.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: this.sanitizeUser(user),
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      }
    });
  });

  /**
   * Refresh access token
   */
  static refreshToken = asyncHandler(async (req, res) => {
    const user = req.user;
    const oldRefreshToken = req.refreshToken;

    // Generate new token pair
    const tokens = jwtService.generateTokenPair(user);

    // Revoke old refresh token
    await oldRefreshToken.revoke();

    // Store new refresh token
    const refreshTokenDoc = new RefreshToken({
      userId: user._id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      deviceInfo: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });
    await refreshTokenDoc.save();

    logger.info('Token refreshed successfully', { userId: user._id });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresIn: tokens.expiresIn
        }
      }
    });
  });

  /**
   * Logout user
   */
  static logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      // Revoke the refresh token
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken },
        { isRevoked: true }
      );
    }

    logger.info('User logged out successfully', { userId: req.user?.id });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  });

  /**
   * Verify token
   */
  static verifyToken = asyncHandler(async (req, res) => {
    const user = req.user;

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: this.sanitizeUser(user)
      }
    });
  });

  /**
   * Sanitize user object (remove sensitive data)
   */
  static sanitizeUser(user) {
    return {
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      preferences: user.preferences,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };
  }

  /**
   * Validation middleware
   */
  static validateRegister = [
    body('username').isLength({ min: 3, max: 30 }).trim().withMessage('Username must be 3-30 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().trim().withMessage('First name is required'),
    body('lastName').notEmpty().trim().withMessage('Last name is required')
  ];

  static validateLogin = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required')
  ];
}

module.exports = AuthController;
