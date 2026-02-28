import { FacebookService } from './facebookService';
import { InstagramService } from './instagramService';
import {
  SocialAccount,
  SocialMediaPost,
  PlatformAnalytics,
  ApiResponse,
  SocialMediaError,
} from './types';

export class SocialMediaManager {
  private facebookService = new FacebookService();
  private instagramService = new InstagramService();

  async authenticatePlatform(
    platform: string,
    code: string
  ): Promise<ApiResponse<SocialAccount>> {
    try {
      switch (platform) {
        case 'facebook':
          return await this.facebookService.authenticate(code);
        case 'instagram':
          return await this.instagramService.authenticate(code);
        default:
          throw new SocialMediaError(
            `Platform ${platform} is not supported`,
            platform,
            'PLATFORM_NOT_SUPPORTED'
          );
      }
    } catch (error) {
      if (error instanceof SocialMediaError) {
        return {
          success: false,
          error: error.message,
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown authentication error',
      };
    }
  }

  async publishPostToPlatforms(
    post: SocialMediaPost,
    accounts: SocialAccount[]
  ): Promise<ApiResponse<{ [platform: string]: SocialMediaPost }>> {
    const results: { [platform: string]: SocialMediaPost } = {};
    const errors: string[] = [];

    // Group accounts by platform
    const accountsByPlatform = accounts.reduce((acc, account) => {
      if (!acc[account.platform]) {
        acc[account.platform] = [];
      }
      acc[account.platform].push(account);
      return acc;
    }, {} as { [platform: string]: SocialAccount[] });

    // Publish to each platform
    for (const [platform, platformAccounts] of Object.entries(accountsByPlatform)) {
      try {
        const account = platformAccounts[0]; // Use first account for each platform
        let result: ApiResponse<SocialMediaPost>;

        switch (platform) {
          case 'facebook':
            result = await this.facebookService.publishPost(post, account);
            break;
          case 'instagram':
            result = await this.instagramService.publishPost(post, account);
            break;
          default:
            throw new SocialMediaError(
              `Platform ${platform} is not supported`,
              platform,
              'PLATFORM_NOT_SUPPORTED'
            );
        }

        if (result.success && result.data) {
          results[platform] = result.data;
        } else {
          errors.push(`${platform}: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        const errorMessage = error instanceof SocialMediaError 
          ? error.message 
          : error instanceof Error 
          ? error.message 
          : 'Unknown publishing error';
        errors.push(`${platform}: ${errorMessage}`);
      }
    }

    return {
      success: errors.length === 0,
      data: results,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      message: errors.length === 0 
        ? 'Post published successfully to all platforms'
        : 'Post published with some errors',
    };
  }

  async getAnalyticsForPlatforms(
    accounts: SocialAccount[]
  ): Promise<ApiResponse<PlatformAnalytics[]>> {
    const analytics: PlatformAnalytics[] = [];
    const errors: string[] = [];

    // Group accounts by platform
    const accountsByPlatform = accounts.reduce((acc, account) => {
      if (!acc[account.platform]) {
        acc[account.platform] = [];
      }
      acc[account.platform].push(account);
      return acc;
    }, {} as { [platform: string]: SocialAccount[] });

    // Get analytics for each platform
    for (const [platform, platformAccounts] of Object.entries(accountsByPlatform)) {
      try {
        const account = platformAccounts[0]; // Use first account for each platform
        let result: ApiResponse<PlatformAnalytics>;

        switch (platform) {
          case 'facebook':
            result = await this.facebookService.getAnalytics(account);
            break;
          case 'instagram':
            result = await this.instagramService.getAnalytics(account);
            break;
          default:
            throw new SocialMediaError(
              `Platform ${platform} is not supported`,
              platform,
              'PLATFORM_NOT_SUPPORTED'
            );
        }

        if (result.success && result.data) {
          analytics.push(result.data);
        } else {
          errors.push(`${platform}: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        const errorMessage = error instanceof SocialMediaError 
          ? error.message 
          : error instanceof Error 
          ? error.message 
          : 'Unknown analytics error';
        errors.push(`${platform}: ${errorMessage}`);
      }
    }

    return {
      success: errors.length === 0,
      data: analytics,
      error: errors.length > 0 ? errors.join('; ') : undefined,
      message: errors.length === 0 
        ? 'Analytics retrieved successfully'
        : 'Analytics retrieved with some errors',
    };
  }

  getAuthUrl(platform: string): string {
    switch (platform) {
      case 'facebook':
        return this.facebookService.getAuthUrl();
      case 'instagram':
        return this.instagramService.getAuthUrl();
      default:
        throw new SocialMediaError(
          `Platform ${platform} is not supported`,
          platform,
          'PLATFORM_NOT_SUPPORTED'
        );
    }
  }

  async validateAccount(account: SocialAccount): Promise<ApiResponse<boolean>> {
    try {
      let result: ApiResponse<PlatformAnalytics>;

      switch (account.platform) {
        case 'facebook':
          result = await this.facebookService.getAnalytics(account);
          break;
        case 'instagram':
          result = await this.instagramService.getAnalytics(account);
          break;
        default:
          throw new SocialMediaError(
            `Platform ${account.platform} is not supported`,
            account.platform,
            'PLATFORM_NOT_SUPPORTED'
          );
      }

      return {
        success: result.success,
        data: result.success,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        data: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  }

  async refreshAccessToken(account: SocialAccount): Promise<ApiResponse<SocialAccount>> {
    try {
      // For now, most platforms don't require explicit token refresh
      // In a production app, you'd implement platform-specific refresh logic
      return {
        success: true,
        data: {
          ...account,
          lastSync: new Date().toISOString(),
        },
        message: 'Account token refreshed successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown token refresh error',
      };
    }
  }

  getSupportedPlatforms(): string[] {
    return ['facebook', 'instagram'];
  }

  getPlatformCapabilities(platform: string): {
    supportsMedia: boolean;
    supportsStories: boolean;
    supportsReels: boolean;
    maxCharacters: number;
    supportedMediaTypes: string[];
  } {
    const capabilities = {
      facebook: {
        supportsMedia: true,
        supportsStories: true,
        supportsReels: false,
        maxCharacters: 63206,
        supportedMediaTypes: ['image', 'video', 'link'],
      },
      instagram: {
        supportsMedia: true,
        supportsStories: true,
        supportsReels: true,
        maxCharacters: 2200,
        supportedMediaTypes: ['image', 'video'],
      },
      twitter: {
        supportsMedia: true,
        supportsStories: false,
        supportsReels: false,
        maxCharacters: 280,
        supportedMediaTypes: ['image', 'video', 'gif'],
      },
      tiktok: {
        supportsMedia: true,
        supportsStories: false,
        supportsReels: true,
        maxCharacters: 150,
        supportedMediaTypes: ['video'],
      },
      linkedin: {
        supportsMedia: true,
        supportsStories: false,
        supportsReels: false,
        maxCharacters: 3000,
        supportedMediaTypes: ['image', 'video', 'document'],
      },
    };

    return capabilities[platform as keyof typeof capabilities] || {
      supportsMedia: false,
      supportsStories: false,
      supportsReels: false,
      maxCharacters: 0,
      supportedMediaTypes: [],
    };
  }
}
