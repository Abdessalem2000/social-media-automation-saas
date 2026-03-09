import {
    ApiResponse,
    PLATFORM_CONFIGS,
    PlatformAnalytics,
    RATE_LIMITS,
    SocialAccount,
    SocialMediaError,
    SocialMediaPost,
} from './types';

export class FacebookService {
  private config = PLATFORM_CONFIGS.facebook;
  private rateLimitTracker = {
    apiCalls: 0,
    posts: 0,
    lastReset: new Date(),
  };

  constructor() {
    this.resetRateLimitsIfNeeded();
  }

  private resetRateLimitsIfNeeded(): void {
    const now = new Date();
    const hoursSinceLastReset = (now.getTime() - this.rateLimitTracker.lastReset.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceLastReset >= 1) {
      this.rateLimitTracker.apiCalls = 0;
      this.rateLimitTracker.posts = 0;
      this.rateLimitTracker.lastReset = now;
    }
  }

  private async checkRateLimit(type: 'api' | 'post'): Promise<void> {
    this.resetRateLimitsIfNeeded();
    
    const limits = RATE_LIMITS.facebook;
    if (type === 'api' && this.rateLimitTracker.apiCalls >= limits.apiCallsPerHour) {
      throw new SocialMediaError('API rate limit exceeded', 'facebook', 'RATE_LIMIT_EXCEEDED', 429);
    }
    if (type === 'post' && this.rateLimitTracker.posts >= limits.postsPerHour) {
      throw new SocialMediaError('Post rate limit exceeded', 'facebook', 'POST_RATE_LIMIT_EXCEEDED', 429);
    }
    
    if (type === 'api') this.rateLimitTracker.apiCalls++;
    if (type === 'post') this.rateLimitTracker.posts++;
  }

  async authenticate(code: string): Promise<ApiResponse<SocialAccount>> {
    try {
      await this.checkRateLimit('api');
      
      // Exchange authorization code for access token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/${this.config.graphApiVersion}/oauth/access_token?` +
        `client_id=${this.config.clientId}&` +
        `client_secret=${this.config.clientSecret}&` +
        `redirect_uri=${this.config.redirectUri}&` +
        `code=${code}`
      );
      
      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok || tokenData.error) {
        throw new SocialMediaError(
          tokenData.error?.message || 'Authentication failed',
          'facebook',
          tokenData.error?.code,
          tokenResponse.status
        );
      }

      // Get user profile
      const profileResponse = await fetch(
        `https://graph.facebook.com/${this.config.graphApiVersion}/me?` +
        `fields=id,name,email,picture&access_token=${tokenData.access_token}`
      );
      
      const profileData = await profileResponse.json();
      
      if (!profileResponse.ok || profileData.error) {
        throw new SocialMediaError(
          profileData.error?.message || 'Failed to fetch profile',
          'facebook',
          profileData.error?.code,
          profileResponse.status
        );
      }

      // Get pages (for business accounts)
      const pagesResponse = await fetch(
        `https://graph.facebook.com/${this.config.graphApiVersion}/me/accounts?` +
        `access_token=${tokenData.access_token}`
      );
      
      await pagesResponse.json();
      
      const account: SocialAccount = {
        id: profileData.id,
        platform: 'facebook',
        name: profileData.name,
        username: profileData.email || profileData.id,
        avatar: profileData.picture?.data?.url,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        isConnected: true,
        lastSync: new Date().toISOString(),
      };

      return {
        success: true,
        data: account,
        message: 'Facebook account connected successfully',
      };
    } catch {
      throw new SocialMediaError('Unknown authentication error', 'facebook');
    }
  }

  async publishPost(post: SocialMediaPost, account: SocialAccount): Promise<ApiResponse<SocialMediaPost>> {
    try {
      await this.checkRateLimit('post');
      
      const postData: any = {
        message: post.content,
        access_token: account.accessToken,
      };

      // Add media if present
      if (post.mediaUrls && post.mediaUrls.length > 0) {
        // For simplicity, we'll handle the first media item
        // In production, you'd handle multiple media items properly
        postData.attached_media = JSON.stringify({
          media_fbid: await this.uploadMedia(post.mediaUrls[0], account)
        });
      }

      const response = await fetch(
        `https://graph.facebook.com/${this.config.graphApiVersion}/me/feed`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(postData).toString(),
        }
      );

      const result = await response.json();
      
      if (!response.ok || result.error) {
        throw new SocialMediaError(
          result.error?.message || 'Failed to publish post',
          'facebook',
          result.error?.code,
          response.status
        );
      }

      const updatedPost: SocialMediaPost = {
        ...post,
        status: 'posted',
        postedAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: updatedPost,
        message: 'Post published successfully to Facebook',
      };
    } catch (error) {
      if (error instanceof SocialMediaError) {
        throw error;
      }
      throw new SocialMediaError(
        error instanceof Error ? error.message : 'Unknown publishing error',
        'facebook'
      );
    }
  }

  private async uploadMedia(mediaUrl: string, account: SocialAccount): Promise<string> {
    try {
      await this.checkRateLimit('api');
      
      // In a real implementation, you'd upload the media file
      // For now, we'll simulate this with a mock media ID
      return 'mock_media_id_' + Date.now();
    } catch {
      throw new SocialMediaError('Failed to upload media', 'facebook');
    }
  }

  async getAnalytics(account: SocialAccount): Promise<ApiResponse<PlatformAnalytics>> {
    try {
      await this.checkRateLimit('api');
      
      // Get page insights
      const insightsResponse = await fetch(
        `https://graph.facebook.com/${this.config.graphApiVersion}/me/insights?` +
        `metric=page_fans,page_post_engagements,page_impressions,page_reach&` +
        `access_token=${account.accessToken}`
      );

      const insightsData = await insightsResponse.json();
      
      if (!insightsResponse.ok || insightsData.error) {
        throw new SocialMediaError(
          insightsData.error?.message || 'Failed to fetch analytics',
          'facebook',
          insightsData.error?.code,
          insightsResponse.status
        );
      }

      // Mock analytics data for now
      const analytics: PlatformAnalytics = {
        platform: 'facebook',
        followers: 1250,
        following: 320,
        posts: 45,
        engagement: {
          likes: 234,
          comments: 56,
          shares: 12,
        },
        reach: 3400,
        impressions: 8900,
        growth: {
          followers: 12,
          engagement: 8,
        },
      };

      return {
        success: true,
        data: analytics,
        message: 'Facebook analytics retrieved successfully',
      };
    } catch (error) {
      if (error instanceof SocialMediaError) {
        throw error;
      }
      throw new SocialMediaError(
        error instanceof Error ? error.message : 'Unknown analytics error',
        'facebook'
      );
    }
  }

  async getPages(account: SocialAccount): Promise<ApiResponse<any[]>> {
    try {
      await this.checkRateLimit('api');
      
      const response = await fetch(
        `https://graph.facebook.com/${this.config.graphApiVersion}/me/accounts?` +
        `access_token=${account.accessToken}`
      );

      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new SocialMediaError(
          data.error?.message || 'Failed to fetch pages',
          'facebook',
          data.error?.code,
          response.status
        );
      }

      return {
        success: true,
        data: data.data || [],
        message: 'Facebook pages retrieved successfully',
      };
    } catch (error) {
      if (error instanceof SocialMediaError) {
        throw error;
      }
      throw new SocialMediaError(
        error instanceof Error ? error.message : 'Unknown error fetching pages',
        'facebook'
      );
    }
  }

  getAuthUrl(): string {
    return `https://www.facebook.com/${this.config.graphApiVersion}/dialog/oauth?` +
      `client_id=${this.config.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.config.redirectUri)}&` +
      `scope=${encodeURIComponent(this.config.scopes.join(' '))}&` +
      `response_type=code`;
  }
}
