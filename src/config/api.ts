import axios from 'axios';

// Use local backend with mock endpoints (correct for Social Media app)
export const API_BASE_URL = 'http://localhost:3001/api';

// Factory Management backend (different project):
// export const API_BASE_URL = 'https://factory-management-project.onrender.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add debugging
api.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', config.method?.toUpperCase(), config.baseURL + config.url);
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.message);
    if (error.response) {
      console.error('❌ Response Status:', error.response.status);
      console.error('❌ Response Data:', error.response.data);
    }
    if (error.response?.status === 401) {
      // Token expired or invalid
      clearStoredToken();
      // Redirect to login
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Token storage helpers (React Native Web compatible)
export const getStoredToken = (): string | null => {
  try {
    // Try localStorage first (web)
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('authToken');
    }
    // Fallback for React Native
    return null;
  } catch (error) {
    console.error('❌ Failed to get token:', error);
    return null;
  }
};

export const setStoredToken = (token: string): void => {
  try {
    // Try localStorage first (web)
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('authToken', token);
    }
  } catch (error) {
    console.error('❌ Failed to store token:', error);
  }
};

export const clearStoredToken = (): void => {
  try {
    // Try localStorage first (web)
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('authToken');
    }
  } catch (error) {
    console.error('❌ Failed to clear token:', error);
  }
};
