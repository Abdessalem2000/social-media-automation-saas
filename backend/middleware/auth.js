const jwtService = require('../config/jwt');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

/**
 * Authentication middleware - verifies access token
 */
const authenticate = async (req, res, next) => {
  try {
    const token = jwtService.extractTokenFromHeader(req.header('Authorization'));
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied',
        errorCode: 'NO_TOKEN'
      });
    }

    const decoded = jwtService.verifyAccessToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        errorCode: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account disabled',
        errorCode: 'ACCOUNT_DISABLED'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      errorCode: 'INVALID_TOKEN'
    });
  }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorCode: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        errorCode: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = jwtService.extractTokenFromHeader(req.header('Authorization'));
    
    if (token) {
      const decoded = jwtService.verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (_error) {
    // Silently continue without authentication
    next();
  }
};

/**
 * Refresh token middleware
 */
const refreshTokenAuth = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required',
        errorCode: 'REFRESH_TOKEN_REQUIRED'
      });
    }

    const decoded = jwtService.verifyRefreshToken(refreshToken);
    const storedToken = await RefreshToken.findValidToken(refreshToken, decoded.userId);
    
    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        errorCode: 'INVALID_REFRESH_TOKEN'
      });
    }

    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        errorCode: 'USER_INACTIVE'
      });
    }

    req.user = user;
    req.refreshToken = storedToken;
    next();
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      errorCode: 'INVALID_REFRESH_TOKEN'
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  refreshTokenAuth
};
