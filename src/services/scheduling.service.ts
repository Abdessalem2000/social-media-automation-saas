import { api } from '../config/api';

export interface PostData {
  accountId: string;
  content: {
    text: string;
    media?: {
      type: 'image' | 'video';
      url: string;
      thumbnail?: string;
      caption?: string;
    }[];
  };
  platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'linkedin';
  scheduledAt?: string;
  hashtags?: string[];
  mentions?: string[];
  settings?: {
    allowComments?: boolean;
    allowSharing?: boolean;
    isSensitive?: boolean;
  };
}

export interface Post {
  _id: string;
  userId: string;
  accountId: string;
  content: {
    text: string;
    media?: {
      type: 'image' | 'video';
      url: string;
      thumbnail?: string;
      caption?: string;
    }[];
  };
  platform: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: string;
  publishedAt?: string;
  platformPostId?: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    reach: number;
    engagement: number;
  };
  hashtags: string[];
  mentions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    posts: T[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  };
}

export const schedulingService = {
  // Get all posts
  getPosts: async (params?: {
    status?: string;
    platform?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Post>> => {
    const response = await api.get('/scheduling', { params });
    return response.data;
  },

  // Create new post
  createPost: async (postData: PostData): Promise<ApiResponse<Post>> => {
    const response = await api.post('/scheduling', postData);
    return response.data;
  },

  // Get scheduled posts
  getScheduledPosts: async (): Promise<ApiResponse<Post[]>> => {
    const response = await api.get('/scheduling/scheduled');
    return response.data;
  },

  // Get published posts
  getPublishedPosts: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Post>> => {
    const response = await api.get('/scheduling/published', { params });
    return response.data;
  },

  // Update post
  updatePost: async (postId: string, postData: Partial<PostData>): Promise<ApiResponse<Post>> => {
    const response = await api.put(`/scheduling/${postId}`, postData);
    return response.data;
  },

  // Delete post
  deletePost: async (postId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/scheduling/${postId}`);
    return response.data;
  },
};
