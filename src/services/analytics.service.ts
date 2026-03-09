import { api } from '../config/api';

export interface AnalyticsOverview {
  overview: {
    totalAccounts: number;
    totalPosts: number;
    publishedPosts: number;
    scheduledPosts: number;
    draftPosts: number;
  };
  engagement: {
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalViews: number;
    totalReach: number;
  };
  platformStats: {
    _id: string;
    postCount: number;
    totalEngagement: number;
  }[];
  accounts: {
    platform: string;
    accountName: string;
    followers: number;
    posts: number;
  }[];
}

export interface TrendData {
  date: string;
  posts: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  views: number;
}

export interface PlatformAnalytics {
  platform: string;
  stats: {
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalViews: number;
    avgEngagement: number;
  };
  account?: {
    accountName: string;
    followers: number;
    following: number;
    posts: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const analyticsService = {
  // Get analytics overview
  getOverview: async (): Promise<ApiResponse<AnalyticsOverview>> => {
    const response = await api.get('/analytics/overview');
    return response.data;
  },

  // Get engagement trends (last 30 days)
  getTrends: async (): Promise<ApiResponse<TrendData[]>> => {
    const response = await api.get('/analytics/trends');
    return response.data;
  },

  // Get top performing posts
  getTopPosts: async (limit?: number): Promise<ApiResponse<any[]>> => {
    const response = await api.get('/analytics/top-posts', {
      params: { limit }
    });
    return response.data;
  },

  // Get platform-specific analytics
  getPlatformAnalytics: async (platform: string): Promise<ApiResponse<PlatformAnalytics>> => {
    const response = await api.get(`/analytics/platform/${platform}`);
    return response.data;
  },
};
