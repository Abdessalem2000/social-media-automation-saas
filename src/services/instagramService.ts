import {
    ApiResponse,
    PLATFORM_CONFIGS,
    PlatformAnalytics,
    RATE_LIMITS,
    SocialAccount,
    SocialMediaError,
    SocialMediaPost,
} from './types';

export class InstagramService {
  private config = PLATFORM_CONFIGS.instagram;
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
    
    const limits = RATE_LIMITS.instagram;
    if (type === 'api' && this.rateLimitTracker.apiCalls >= limits.apiCallsPerHour) {
      throw new SocialMediaError('API rate limit exceeded', 'instagram', 'RATE_LIMIT_EXCEEDED', 429);
    }
    if (type === 'post' && this.rateLimitTracker.posts >= limits.postsPerHour) {
      throw new SocialMediaError('Post rate limit exceeded', 'instagram', 'POST_RATE_LIMIT_EXCEEDED', 429);
    }
    
    if (type === 'api') this.rateLimitTracker.apiCalls++;
    if (type === 'post') this.rateLimitTracker.posts++;
  }

  async authenticate(code: string): Promise<ApiResponse<SocialAccount>> {
    try {
      await this.checkRateLimit('api');
      
      // Exchange authorization code for access token
      const tokenResponse = await fetch(
        `https://api.instagram.com/oauth/access_token?` +
        `client_id=${this.config.clientId}&` +
        `client_secret=${this.config.clientSecret}&` +
        `grant_type=authorization_code&` +
        `redirect_uri=${this.config.redirectUri}&` +
        `code=${code}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      
      const tokenData = await tokenResponse.json();
      
      if (!tokenResponse.ok || tokenData.error) {
        throw new SocialMediaError(
          tokenData.error?.message || 'Authentication failed',
          'instagram',
          tokenData.error?.code,
          tokenResponse.status
        );
      }

      // Get long-lived access token
      const longLivedTokenResponse = await fetch(
        `https://graph.instagram.com/${this.config.graphApiVersion}/access_token?` +
        `grant_type=ig_exchange_token&` +
        `client_secret=${this.config.clientSecret}&` +
        `access_token=${tokenData.access_token}`
      );
      
      const longLivedTokenData = await longLivedTokenResponse.json();
      
      // Get user profile
      const profileResponse = await fetch(
        `https://graph.instagram.com/${this.config.graphApiVersion}/me?` +
        `fields=id,username,account_type,media_count&access_token=${longLivedTokenData.access_token}`
      );
      
      const profileData = await profileResponse.json();
      
      if (!profileResponse.ok || profileData.error) {
        throw new SocialMediaError(
          profileData.error?.message || 'Failed to fetch profile',
          'instagram',
          profileData.error?.code,
          profileResponse.status
        );
      }

      const account: SocialAccount = {
        id: profileData.id,
        platform: 'instagram',
        name: profileData.username,
        username: profileData.username,
        accessToken: longLivedTokenData.access_token,
        refreshToken: longLivedTokenData.access_token, // Instagram doesn't have refresh tokens
        isConnected: true,
        lastSync: new Date().toISOString(),
      };

      return {
        success: true,
        data: account,
        message: 'Instagram account connected successfully',
      };
    } catch (error) {
      if (error instanceof SocialMediaError) {
        throw error;
      }
      throw new SocialMediaError(
        error instanceof Error ? error.message : 'Unknown authentication error',
        'instagram'
      );
    }
  }

  async publishPost(post: SocialMediaPost, account: SocialAccount): Promise<ApiResponse<SocialMediaPost>> {
    try {
      await this.checkRateLimit('post');
      
      // Create media container
      const mediaContainerData: any = {
        caption: post.content,
        access_token: account.accessToken,
        media_type: post.mediaUrls && post.mediaUrls.length > 0 ? 'IMAGE' : 'CAROUSEL',
      };

      // Handle media upload
      if (post.mediaUrls && post.mediaUrls.length > 0) {
        mediaContainerData.image_url = post.mediaUrls[0];
      } else {
        // For text-only posts, Instagram requires an image
        throw new SocialMediaError('Instagram posts require at least one image', 'instagram');
      }

      // Create media container
      const containerResponse = await fetch(
        `https://graph.instagram.com/${this.config.graphApiVersion}/me/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(mediaContainerData).toString(),
        }
      );

      const containerData = await containerResponse.json();
      
      if (!containerResponse.ok || containerData.error) {
        throw new SocialMediaError(
          containerData.error?.message || 'Failed to create media container',
          'instagram',
          containerData.error?.code,
          containerResponse.status
        );
      }

      // Publish the media
      const publishData = new URLSearchParams({
        creation_id: containerData.id,
        access_token: account.accessToken,
      });

      const publishResponse = await fetch(
        `https://graph.instagram.com/${this.config.graphApiVersion}/me/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: publishData.toString(),
        }
      );

      const publishResult = await publishResponse.json();
      
      if (!publishResponse.ok || publishResult.error) {
        throw new SocialMediaError(
          publishResult.error?.message || 'Failed to publish post',
          'instagram',
          publishResult.error?.code,
          publishResponse.status
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
        message: 'Post published successfully to Instagram',
      };
    } catch (error) {
      if (error instanceof SocialMediaError) {
        throw error;
      }
      throw new SocialMediaError(
        error instanceof Error ? error.message : 'Unknown publishing error',
        'instagram'
      );
    }
  }

  private async uploadMedia(mediaUrl: string, account: SocialAccount): Promise<string> {
    try {
      await this.checkRateLimit('api');
      
      // In a real implementation, you'd upload the media file to Instagram
      // For now, we'll simulate this with a mock media ID
      return 'mock_instagram_media_id_' + Date.now();
    } catch {
      throw new SocialMediaError('Failed to upload media to Instagram', 'instagram');
    }
  }

  async getAnalytics(account: SocialAccount): Promise<ApiResponse<PlatformAnalytics>> {
    try {
      await this.checkRateLimit('api');
      
      // Get user insights
      const insightsResponse = await fetch(
        `https://graph.instagram.com/${this.config.graphApiVersion}/me/insights?` +
        `metric=impressions,reach,engagement&` +
        `access_token=${account.accessToken}`
      );

      const insightsData = await insightsResponse.json();
      
      if (!insightsResponse.ok || insightsData.error) {
        throw new SocialMediaError(
          insightsData.error?.message || 'Failed to fetch analytics',
          'instagram',
          insightsData.error?.code,
          insightsResponse.status
        );
      }

      // Get user media count
      const userResponse = await fetch(
        `https://graph.instagram.com/${this.config.graphApiVersion}/me?` +
        `fields=followers_count,follows_count,media_count&` +
        `access_token=${account.accessToken}`
      );

      const userData = await userResponse.json();
      
      // Mock analytics data for now
      const analytics: PlatformAnalytics = {
        platform: 'instagram',
        followers: userData.followers_count || 890,
        following: userData.follows_count || 150,
        posts: userData.media_count || 32,
        engagement: {
          likes: 156,
          comments: 34,
          shares: 8,
        },
        reach: 2100,
        impressions: 5600,
        growth: {
          followers: 5,
          engagement: 3,
        },
      };

      return {
        success: true,
        data: analytics,
        message: 'Instagram analytics retrieved successfully',
      };
    } catch (error) {
      if (error instanceof SocialMediaError) {
        throw error;
      }
      throw new SocialMediaError(
        error instanceof Error ? error.message : 'Unknown analytics error',
        'instagram'
      );
    }
  }

  getAuthUrl(): string {
    return `https://api.instagram.com/oauth/authorize?` +
      `client_id=${this.config.clientId}&` +
      `redirect_uri=${encodeURIComponent(this.config.redirectUri)}&` +
      `scope=${encodeURIComponent(this.config.scopes.join(' '))}&` +
      `response_type=code`;
  }
}
