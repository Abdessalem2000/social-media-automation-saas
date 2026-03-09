const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticate, refreshTokenAuth } = require('../middleware/auth');
const router = express.Router();

// Register user
router.post('/register', AuthController.validateRegister, AuthController.register);

// Login user
router.post('/login', AuthController.validateLogin, AuthController.login);

// Refresh token
router.post('/refresh', refreshTokenAuth, AuthController.refreshToken);

// Logout user
router.post('/logout', authenticate, AuthController.logout);

// Verify token
router.get('/verify', authenticate, AuthController.verifyToken);

module.exports = router;
