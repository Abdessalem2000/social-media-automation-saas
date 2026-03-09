const { v4: uuidv4 } = require('uuid');
const { logger } = require('../middleware/errorHandler');

class PublishingService {
  static async publish(post) {
    try {
      logger.info(`🚀 Mock publishing to ${post.platform}...`, {
        postId: post._id,
        platform: post.platform
      });
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Simulate random failure (10% chance)
      if (Math.random() < 0.1) {
        return {
          success: false,
          errorCode: 'PLATFORM_ERROR',
          errorMessage: 'Mock platform API error - please try again'
        };
      }
      
      // Generate mock post ID
      const postId = `${post.platform}_${uuidv4()}`;
      
      // Generate mock engagement metrics
      const metrics = this.generateMockMetrics(post.platform);
      
      logger.info(`✅ Mock published successfully to ${post.platform}`, {
        postId: post._id,
        platformPostId: postId,
        metrics
      });
      
      return {
        success: true,
        postId: postId,
        metrics: metrics,
        platform: post.platform,
        publishedAt: new Date()
      };
      
    } catch (error) {
      logger.error(`❌ Publishing error for ${post.platform}`, error, {
        postId: post._id,
        platform: post.platform
      });
      return {
        success: false,
        errorCode: 'SERVICE_ERROR',
        errorMessage: error.message
      };
    }
  }

  static generateMockMetrics(platform) {
    const baseMetrics = {
      facebook: { likes: 15, comments: 3, shares: 2, views: 150, reach: 300 },
      instagram: { likes: 25, comments: 5, shares: 1, views: 200, reach: 400 },
      twitter: { likes: 8, comments: 2, shares: 4, views: 100, reach: 250 },
      tiktok: { likes: 50, comments: 10, shares: 5, views: 500, reach: 1000 },
      linkedin: { likes: 5, comments: 1, shares: 1, views: 80, reach: 150 }
    };

    const base = baseMetrics[platform] || baseMetrics.facebook;
    
    // Add random variation (±50%)
    const variation = 0.5 + Math.random(); // 0.5 to 1.5
    
    return {
      likes: Math.floor(base.likes * variation),
      comments: Math.floor(base.comments * variation),
      shares: Math.floor(base.shares * variation),
      views: Math.floor(base.views * variation),
      reach: Math.floor(base.reach * variation),
      engagement: 0 // Will be calculated by frontend
    };
  }

  static async updateMetrics(postId, platform) {
    // Mock metrics update - in real implementation this would fetch from platform APIs
    logger.info(`🔄 Updating metrics for post ${postId} on ${platform}...`, {
      postId,
      platform
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newMetrics = this.generateMockMetrics(platform);
    
    logger.info(`📊 Updated metrics for post ${postId}`, {
      postId,
      platform,
      newMetrics
    });
    
    return {
      success: true,
      metrics: newMetrics,
      updatedAt: new Date()
    };
  }
}

module.exports = PublishingService;
