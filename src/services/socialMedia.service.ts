import { api } from '../config/api';

export interface SocialMediaAccount {
  _id: string;
  userId: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'linkedin';
  accountId: string;
  accountName: string;
  username: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  isActive: boolean;
  profileData: {
    followers: number;
    following: number;
    posts: number;
    profilePicture?: string;
    bio?: string;
    verified: boolean;
  };
  lastSync: string;
  syncStatus: 'pending' | 'syncing' | 'success' | 'error';
  createdAt: string;
  updatedAt: string;
}

export interface ConnectAccountData {
  platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'linkedin';
  accountId: string;
  accountName: string;
  username: string;
  accessToken: string;
  refreshToken?: string;
  profileData?: Partial<SocialMediaAccount['profileData']>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const socialMediaService = {
  // Get all connected accounts
  getAccounts: async (): Promise<ApiResponse<SocialMediaAccount[]>> => {
    const response = await api.get('/social-media');
    return response.data;
  },

  // Connect a new account
  connectAccount: async (accountData: ConnectAccountData): Promise<ApiResponse<SocialMediaAccount>> => {
    const response = await api.post('/social-media/connect', accountData);
    return response.data;
  },

  // Disconnect an account
  disconnectAccount: async (accountId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/social-media/${accountId}`);
    return response.data;
  },

  // Sync account data
  syncAccount: async (accountId: string): Promise<ApiResponse<{ syncStatus: string; lastSync: string }>> => {
    const response = await api.post(`/social-media/${accountId}/sync`);
    return response.data;
  },

  // Get platform-specific auth URL
  getAuthUrl: async (platform: string, redirectUri?: string): Promise<ApiResponse<{ authUrl: string }>> => {
    const response = await api.get(`/social-media/${platform}/auth-url`, {
      params: { redirectUri }
    });
    return response.data;
  },
};
