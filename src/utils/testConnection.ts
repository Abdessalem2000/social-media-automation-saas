import { api } from '../config/api';

export const testConnection = async () => {
  try {
    console.log('🔍 Testing backend connection...');
    
    // Test health endpoint
    const healthResponse = await api.get('/health', { baseURL: 'http://localhost:3001' });
    console.log('✅ Health check:', healthResponse.data);
    
    // Test auth endpoint (will fail but shows connection works)
    try {
      await api.post('/auth/login', { email: 'test@test.com', password: 'test' });
    } catch (error: any) {
      console.log('✅ Auth endpoint reachable:', error.response?.status);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
};
