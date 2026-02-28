/**
 * Authentication Testing Script
 * Tests all authentication endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

// Test data
const testUser = {
  username: 'testuser123',
  email: 'test@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

let accessToken = '';
let refreshToken = '';

async function testRegistration() {
  console.log('\n🧪 Test 1: User Registration');
  console.log('========================');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    
    console.log('✅ Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.log('❌ Registration failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testLogin() {
  console.log('\n🧪 Test 2: User Login');
  console.log('====================');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Save tokens for later tests
    accessToken = response.data.data.accessToken;
    refreshToken = response.data.data.refreshToken;
    
    return response.data;
  } catch (error) {
    console.log('❌ Login failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testTokenVerification() {
  console.log('\n🧪 Test 3: Token Verification');
  console.log('=============================');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('✅ Token verification successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.log('❌ Token verification failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testProtectedRouteWithoutToken() {
  console.log('\n🧪 Test 4: Protected Route Without Token');
  console.log('=======================================');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/users/profile`);
    
    console.log('❌ Should have failed but succeeded!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return null;
  } catch (error) {
    console.log('✅ Correctly rejected unauthorized request!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    return error.response?.data;
  }
}

async function testProtectedRouteWithToken() {
  console.log('\n🧪 Test 5: Protected Route With Valid Token');
  console.log('==========================================');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/users/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('✅ Protected route access successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.log('❌ Protected route access failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testInvalidToken() {
  console.log('\n🧪 Test 6: Invalid Token Handling');
  console.log('=================================');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/users/profile`, {
      headers: {
        'Authorization': 'Bearer invalid-token-12345'
      }
    });
    
    console.log('❌ Should have failed but succeeded!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return null;
  } catch (error) {
    console.log('✅ Correctly rejected invalid token!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    return error.response?.data;
  }
}

async function testRefreshToken() {
  console.log('\n🧪 Test 7: Refresh Token Flow');
  console.log('============================');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
      refreshToken: refreshToken
    });
    
    console.log('✅ Token refresh successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Update access token
    accessToken = response.data.data.accessToken;
    
    return response.data;
  } catch (error) {
    console.log('❌ Token refresh failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testLogout() {
  console.log('\n🧪 Test 8: Logout');
  console.log('=================');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/logout`, {
      refreshToken: refreshToken
    });
    
    console.log('✅ Logout successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.log('❌ Logout failed:');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data || error.message);
    return null;
  }
}

async function testTokenAfterLogout() {
  console.log('\n🧪 Test 9: Token Usage After Logout');
  console.log('===================================');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/users/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('❌ Should have failed but succeeded!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return null;
  } catch (error) {
    console.log('✅ Correctly rejected token after logout!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data);
    return error.response?.data;
  }
}

// Run all authentication tests
async function runAuthTests() {
  console.log('🚀 Starting Authentication Tests');
  console.log('==================================');
  
  const results = {
    registration: await testRegistration(),
    login: await testLogin(),
    tokenVerification: await testTokenVerification(),
    protectedWithoutToken: await testProtectedRouteWithoutToken(),
    protectedWithToken: await testProtectedRouteWithToken(),
    invalidToken: await testInvalidToken(),
    refreshToken: await testRefreshToken(),
    logout: await testLogout(),
    tokenAfterLogout: await testTokenAfterLogout()
  };
  
  console.log('\n📊 Authentication Test Results Summary');
  console.log('=======================================');
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result && result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  const passedTests = Object.values(results).filter(r => r && r.success).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All authentication tests passed!');
  } else {
    console.log('⚠️ Some authentication tests failed. Review the logs above.');
  }
}

// Run the tests
runAuthTests().catch(console.error);
