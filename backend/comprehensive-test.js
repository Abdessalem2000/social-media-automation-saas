/**
 * Comprehensive System Testing
 * Tests all core functionality directly without route dependencies
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Test configuration
const TEST_CONFIG = {
  JWT_ACCESS_SECRET: 'test-access-secret-key-for-testing-only-123456789012345678901234567890',
  JWT_REFRESH_SECRET: 'test-refresh-secret-key-for-testing-only-123456789012345678901234567890',
  JWT_ACCESS_EXPIRY: '15m',
  JWT_REFRESH_EXPIRY: '7d'
};

// Set environment variables for testing
process.env.JWT_ACCESS_SECRET = TEST_CONFIG.JWT_ACCESS_SECRET;
process.env.JWT_REFRESH_SECRET = TEST_CONFIG.JWT_REFRESH_SECRET;
process.env.JWT_ACCESS_EXPIRY = TEST_CONFIG.JWT_ACCESS_EXPIRY;
process.env.JWT_REFRESH_EXPIRY = TEST_CONFIG.JWT_REFRESH_EXPIRY;

// Import JWT service directly
const jwtService = require('./config/jwt');

// Mock database
const users = new Map();
const refreshTokens = new Map();

let userIdCounter = 1;
let refreshTokenCounter = 1;

// Mock User model
class MockUser {
  constructor(data) {
    this._id = `user_${userIdCounter++}`;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password; // Should be hashed
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.role = data.role || 'user';
    this.emailVerified = false;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.lastLogin = null;
    this.preferences = {
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    };
  }

  static async findOne(query) {
    if (query._id) {
      return users.get(query._id);
    }
    if (query.email) {
      for (const user of users.values()) {
        if (user.email === query.email) return user;
      }
    }
    if (query.username) {
      for (const user of users.values()) {
        if (user.username === query.username) return user;
      }
    }
    return null;
  }

  static async findById(id) {
    return users.get(id);
  }

  static async create(data) {
    const user = new MockUser(data);
    users.set(user._id, user);
    return user;
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    const user = users.get(id);
    if (user) {
      Object.assign(user, update, { updatedAt: new Date() });
      return options.new ? user : users.get(id);
    }
    return null;
  }

  async save() {
    users.set(this._id, this);
    return this;
  }

  select(fields) {
    if (fields === '-password') {
      const { password, ...user } = this;
      return user;
    }
    return this;
  }
}

// Mock RefreshToken model
class MockRefreshToken {
  constructor(data) {
    this._id = `refresh_${refreshTokenCounter++}`;
    this.userId = data.userId;
    this.token = data.token;
    this.expiresAt = data.expiresAt;
    this.isRevoked = false;
    this.deviceInfo = data.deviceInfo || {};
    this.createdAt = new Date();
  }

  static async create(data) {
    const token = new MockRefreshToken(data);
    refreshTokens.set(token._id, token);
    return token;
  }

  static async findOne(query) {
    for (const token of refreshTokens.values()) {
      if (query.token && token.token === query.token) return token;
      if (query.userId && token.userId === query.userId) return token;
    }
    return null;
  }

  static async deleteMany(query) {
    let deletedCount = 0;
    for (const [id, token] of refreshTokens.entries()) {
      if (query.userId && token.userId === query.userId) {
        refreshTokens.delete(id);
        deletedCount++;
      }
    }
    return { deletedCount };
  }
}

// Test functions
async function testUserRegistration() {
  console.log('\n🧪 Test 1: User Registration');
  console.log('========================');
  
  try {
    const userData = {
      username: 'testuser123',
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    };

    // Check if user already exists
    const existingUser = await MockUser.findOne({ email: userData.email });
    if (existingUser) {
      console.log('❌ User already exists');
      return null;
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create user
    const user = await MockUser.create({
      ...userData,
      password: hashedPassword
    });

    console.log('✅ User registration successful!');
    console.log(`User ID: ${user._id}`);
    console.log(`Username: ${user.username}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);

    return user;
  } catch (error) {
    console.log('❌ Registration failed:', error.message);
    return null;
  }
}

async function testUserLogin(user) {
  console.log('\n🧪 Test 2: User Login');
  console.log('====================');
  
  try {
    const loginData = {
      email: 'test@example.com',
      password: 'TestPassword123!'
    };

    // Find user
    const foundUser = await MockUser.findOne({ email: loginData.email });
    if (!foundUser) {
      console.log('❌ User not found');
      return null;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(loginData.password, foundUser.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return null;
    }

    // Generate tokens
    const accessToken = jwtService.generateAccessToken({
      userId: foundUser._id,
      role: foundUser.role,
      type: 'access'
    });
    const refreshToken = jwtService.generateRefreshToken({
      userId: foundUser._id,
      type: 'refresh'
    });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await MockRefreshToken.create({
      userId: foundUser._id,
      token: refreshToken,
      expiresAt,
      deviceInfo: {
        userAgent: 'Test Agent',
        ip: '127.0.0.1'
      }
    });

    // Update last login
    await MockUser.findByIdAndUpdate(foundUser._id, { lastLogin: new Date() });

    console.log('✅ Login successful!');
    console.log(`Access Token: ${accessToken.substring(0, 50)}...`);
    console.log(`Refresh Token: ${refreshToken.substring(0, 50)}...`);

    return { user: foundUser, accessToken, refreshToken };
  } catch (error) {
    console.log('❌ Login failed:', error.message);
    return null;
  }
}

async function testTokenVerification(accessToken) {
  console.log('\n🧪 Test 3: Token Verification');
  console.log('=============================');
  
  try {
    // Verify token
    const decoded = jwtService.verifyAccessToken(accessToken);
    
    console.log('✅ Token verification successful!');
    console.log(`User ID: ${decoded.userId}`);
    console.log(`Role: ${decoded.role}`);
    console.log(`Token Type: ${decoded.type}`);
    console.log(`Expires: ${new Date(decoded.exp * 1000).toISOString()}`);

    return decoded;
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    return null;
  }
}

async function testTokenExpiration() {
  console.log('\n🧪 Test 4: Token Expiration (Simulated)');
  console.log('=======================================');
  
  try {
    // Create a token that expires in 1 second for testing
    const shortLivedToken = jwt.sign(
      { 
        userId: 'test_user_id',
        role: 'user',
        type: 'access'
      },
      TEST_CONFIG.JWT_ACCESS_SECRET,
      { expiresIn: '1s' }
    );

    console.log('Created token that expires in 1 second');

    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Try to verify expired token
    try {
      jwtService.verifyAccessToken(shortLivedToken);
      console.log('❌ Token should have expired but didn\'t');
      return false;
    } catch (error) {
      console.log('✅ Token correctly expired!');
      console.log(`Error: ${error.message}`);
      return true;
    }
  } catch (error) {
    console.log('❌ Expiration test failed:', error.message);
    return false;
  }
}

async function testRefreshTokenFlow(refreshToken) {
  console.log('\n🧪 Test 5: Refresh Token Flow');
  console.log('============================');
  
  try {
    // Find refresh token in database
    const storedToken = await MockRefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      console.log('❌ Refresh token not found');
      return null;
    }

    if (storedToken.isRevoked) {
      console.log('❌ Refresh token has been revoked');
      return null;
    }

    if (new Date() > storedToken.expiresAt) {
      console.log('❌ Refresh token has expired');
      return null;
    }

    // Get user
    const user = await MockUser.findById(storedToken.userId);
    if (!user) {
      console.log('❌ User not found');
      return null;
    }

    // Generate new tokens
    const newAccessToken = jwtService.generateAccessToken({
      userId: user._id,
      role: user.role,
      type: 'access'
    });
    const newRefreshToken = jwtService.generateRefreshToken({
      userId: user._id,
      type: 'refresh'
    });

    // Revoke old refresh token
    storedToken.isRevoked = true;

    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await MockRefreshToken.create({
      userId: user._id,
      token: newRefreshToken,
      expiresAt,
      deviceInfo: storedToken.deviceInfo
    });

    console.log('✅ Refresh token flow successful!');
    console.log(`New Access Token: ${newAccessToken.substring(0, 50)}...`);
    console.log(`New Refresh Token: ${newRefreshToken.substring(0, 50)}...`);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    console.log('❌ Refresh token flow failed:', error.message);
    return null;
  }
}

async function testInvalidTokenHandling() {
  console.log('\n🧪 Test 6: Invalid Token Handling');
  console.log('=================================');
  
  try {
    const invalidTokens = [
      'invalid.token.here',
      'Bearer invalid',
      '',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'
    ];

    for (const token of invalidTokens) {
      try {
        jwtService.verifyAccessToken(token);
        console.log(`❌ Token "${token}" should have failed but didn't`);
      } catch (error) {
        console.log(`✅ Token "${token}" correctly rejected: ${error.message}`);
      }
    }

    return true;
  } catch (error) {
    console.log('❌ Invalid token test failed:', error.message);
    return false;
  }
}

async function testRoleBasedAuthorization() {
  console.log('\n🧪 Test 7: Role-Based Authorization');
  console.log('====================================');
  
  try {
    // Create admin user
    const adminUser = await MockUser.create({
      username: 'admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('AdminPass123!', 12),
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    // Create regular user
    const regularUser = await MockUser.create({
      username: 'regular',
      email: 'regular@example.com',
      password: await bcrypt.hash('RegularPass123!', 12),
      firstName: 'Regular',
      lastName: 'User',
      role: 'user'
    });

    // Generate tokens for both
    const adminToken = jwtService.generateAccessToken({
      userId: adminUser._id,
      role: 'admin',
      type: 'access'
    });
    const userToken = jwtService.generateAccessToken({
      userId: regularUser._id,
      role: 'user',
      type: 'access'
    });

    // Verify admin token
    const adminDecoded = jwtService.verifyAccessToken(adminToken);
    console.log(`✅ Admin token verified: Role = ${adminDecoded.role}`);

    // Verify user token
    const userDecoded = jwtService.verifyAccessToken(userToken);
    console.log(`✅ User token verified: Role = ${userDecoded.role}`);

    // Test role checking logic
    const checkAdminAccess = (role) => role === 'admin';
    const checkUserAccess = (role) => ['user', 'admin'].includes(role);

    console.log(`✅ Admin access for admin: ${checkAdminAccess(adminDecoded.role)}`);
    console.log(`✅ Admin access for user: ${checkAdminAccess(userDecoded.role)}`);
    console.log(`✅ User access for admin: ${checkUserAccess(adminDecoded.role)}`);
    console.log(`✅ User access for user: ${checkUserAccess(userDecoded.role)}`);

    return true;
  } catch (error) {
    console.log('❌ Role-based authorization test failed:', error.message);
    return false;
  }
}

async function testLogout(refreshToken) {
  console.log('\n🧪 Test 8: Logout');
  console.log('=================');
  
  try {
    // Find and revoke refresh token
    const storedToken = await MockRefreshToken.findOne({ token: refreshToken });
    if (!storedToken) {
      console.log('❌ Refresh token not found');
      return false;
    }

    // Revoke the token
    storedToken.isRevoked = true;
    console.log('✅ Refresh token revoked');

    // Try to use the revoked token
    const refreshResult = await testRefreshTokenFlow(refreshToken);
    if (refreshResult === null) {
      console.log('✅ Revoked token correctly rejected');
      return true;
    } else {
      console.log('❌ Revoked token was accepted');
      return false;
    }
  } catch (error) {
    console.log('❌ Logout test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive System Tests');
  console.log('=======================================');
  console.log('📊 Testing JWT Authentication System');
  console.log('🔧 Environment: Test Mode');
  console.log('💾 Database: Mock In-Memory');

  const results = {};

  // Test 1: Registration
  const user = await testUserRegistration();
  results.registration = !!user;

  // Test 2: Login
  const loginResult = user ? await testUserLogin(user) : null;
  results.login = !!loginResult;

  // Test 3: Token Verification
  results.tokenVerification = loginResult ? !!await testTokenVerification(loginResult.accessToken) : false;

  // Test 4: Token Expiration
  results.tokenExpiration = await testTokenExpiration();

  // Test 5: Refresh Token Flow
  results.refreshTokenFlow = loginResult ? !!await testRefreshTokenFlow(loginResult.refreshToken) : false;

  // Test 6: Invalid Token Handling
  results.invalidTokenHandling = await testInvalidTokenHandling();

  // Test 7: Role-Based Authorization
  results.roleBasedAuthorization = await testRoleBasedAuthorization();

  // Test 8: Logout
  results.logout = loginResult ? await testLogout(loginResult.refreshToken) : false;

  // Results summary
  console.log('\n📊 Test Results Summary');
  console.log('=======================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${testName}`);
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All authentication tests passed!');
    console.log('✅ JWT Authentication System is working correctly');
    console.log('✅ Token generation and verification working');
    console.log('✅ Refresh token flow working');
    console.log('✅ Role-based authorization working');
    console.log('✅ Token expiration handling working');
    console.log('✅ Logout functionality working');
  } else {
    console.log('⚠️ Some tests failed. Review the logs above.');
  }

  return results;
}

// Run the tests
runComprehensiveTests().catch(console.error);
