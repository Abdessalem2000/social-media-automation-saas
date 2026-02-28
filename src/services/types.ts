// Base types for social media platform integrations
export interface SocialMediaPost {
  id: string;
  content: string;
  mediaUrls?: string[];
  platforms: string[];
  scheduledDate: string;
  status: 'scheduled' | 'posted' | 'failed' | 'draft';
  createdAt: string;
  postedAt?: string;
  engagement?: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface SocialAccount {
  id: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin';
  name: string;
  username: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
  isConnected: boolean;
  followerCount?: number;
  lastSync?: string;
}

export interface PlatformAnalytics {
  platform: string;
  followers: number;
  following: number;
  posts: number;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  reach: number;
  impressions: number;
  growth: {
    followers: number;
    engagement: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PlatformConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  apiBaseUrl: string;
  graphApiVersion?: string;
}

// Platform-specific configurations
export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  facebook: {
    clientId: process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_ID || '',
    clientSecret: process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_SECRET || '',
    redirectUri: process.env.EXPO_PUBLIC_FACEBOOK_REDIRECT_URI || '',
    scopes: ['pages_manage_posts', 'pages_read_engagement', 'instagram_basic'],
    apiBaseUrl: 'https://graph.facebook.com',
    graphApiVersion: 'v18.0',
  },
  instagram: {
    clientId: process.env.EXPO_PUBLIC_INSTAGRAM_CLIENT_ID || '',
    clientSecret: process.env.EXPO_PUBLIC_INSTAGRAM_CLIENT_SECRET || '',
    redirectUri: process.env.EXPO_PUBLIC_INSTAGRAM_REDIRECT_URI || '',
    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement'],
    apiBaseUrl: 'https://graph.instagram.com',
    graphApiVersion: 'v18.0',
  },
  twitter: {
    clientId: process.env.EXPO_PUBLIC_TWITTER_CLIENT_ID || '',
    clientSecret: process.env.EXPO_PUBLIC_TWITTER_CLIENT_SECRET || '',
    redirectUri: process.env.EXPO_PUBLIC_TWITTER_REDIRECT_URI || '',
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    apiBaseUrl: 'https://api.twitter.com/2',
  },
  tiktok: {
    clientId: process.env.EXPO_PUBLIC_TIKTOK_CLIENT_ID || '',
    clientSecret: process.env.EXPO_PUBLIC_TIKTOK_CLIENT_SECRET || '',
    redirectUri: process.env.EXPO_PUBLIC_TIKTOK_REDIRECT_URI || '',
    scopes: ['user.info.basic', 'video.list'],
    apiBaseUrl: 'https://open.tiktokapis.com/v2',
  },
  linkedin: {
    clientId: process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_ID || '',
    clientSecret: process.env.EXPO_PUBLIC_LINKEDIN_CLIENT_SECRET || '',
    redirectUri: process.env.EXPO_PUBLIC_LINKEDIN_REDIRECT_URI || '',
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social', 'r_organization_social'],
    apiBaseUrl: 'https://api.linkedin.com/v2',
  },
};

// Error types
export class SocialMediaError extends Error {
  constructor(
    message: string,
    public platform: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'SocialMediaError';
  }
}

// Rate limiting configuration
export const RATE_LIMITS = {
  facebook: {
    postsPerHour: 50,
    postsPerDay: 200,
    apiCallsPerHour: 200,
  },
  instagram: {
    postsPerHour: 25,
    postsPerDay: 50,
    apiCallsPerHour: 200,
  },
  twitter: {
    postsPerHour: 300,
    postsPerDay: 2400,
    apiCallsPerHour: 300,
  },
  tiktok: {
    postsPerHour: 30,
    postsPerDay: 300,
    apiCallsPerHour: 1000,
  },
  linkedin: {
    postsPerHour: 100,
    postsPerDay: 1000,
    apiCallsPerHour: 1000,
  },
};
