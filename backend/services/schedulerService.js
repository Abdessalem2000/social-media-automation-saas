const cron = require('node-cron');
const Post = require('../models/Post');
const PublishingService = require('./publishingService');
const { logger, CronJobError } = require('../middleware/errorHandler');

class SchedulerService {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  start() {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    logger.info('Starting Social Media Scheduler...');
    
    // Run every minute
    this.job = cron.schedule('* * * * *', async () => {
      await this.processScheduledPosts();
    }, {
      scheduled: false,
      timezone: process.env.TZ || 'UTC'
    });

    this.job.start();
    this.isRunning = true;
    
    logger.info('Scheduler started - Running every minute');
  }

  stop() {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      logger.info('Scheduler stopped');
    }
  }

  async processScheduledPosts() {
    const startTime = Date.now();
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;

    try {
      logger.info('Checking for scheduled posts...');
      
      const now = new Date();
      
      // Find posts that are scheduled and ready to publish
      const scheduledPosts = await Post.find({
        status: 'scheduled',
        scheduledAt: { $lte: now }
      }).populate('userId accountId');

      logger.info(`Found ${scheduledPosts.length} posts to publish`, {
        count: scheduledPosts.length,
        timestamp: now.toISOString()
      });

      if (scheduledPosts.length === 0) {
        logger.debug('No posts to publish at this time');
        return;
      }

      // Process posts in parallel with concurrency limit
      const concurrencyLimit = 5;
      const chunks = [];
      
      for (let i = 0; i < scheduledPosts.length; i += concurrencyLimit) {
        chunks.push(scheduledPosts.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        await Promise.allSettled(
          chunk.map(post => this.publishPost(post))
        );
      }

      // Calculate final stats
      const finalStats = await Post.aggregate([
        { $match: { 
          status: { $in: ['published', 'failed'] },
          publishedAt: { $gte: new Date(startTime) }
        }},
        { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }}
      ]);

      successCount = finalStats.find(s => s._id === 'published')?.count || 0;
      errorCount = finalStats.find(s => s._id === 'failed')?.count || 0;
      processedCount = scheduledPosts.length;

      logger.info('Scheduler batch completed', {
        processed: processedCount,
        successful: successCount,
        failed: errorCount,
        duration: Date.now() - startTime
      });

    } catch (_error) {
      errorCount++;
      const jobError = new CronJobError('Scheduler processing failed', 'process_scheduled_posts');
      logger.error('Scheduler processing error', jobError, {
        processed: processedCount,
        successful: successCount,
        failed: errorCount,
        duration: Date.now() - startTime
      });
    }
  }

  async publishPost(post) {
    const startTime = Date.now();
    
    try {
      logger.info('Publishing post', {
        postId: post._id,
        platform: post.platform,
        userId: post.userId._id
      });
      
      // Call the publishing service
      const result = await PublishingService.publish(post);
      
      if (result.success) {
        // Update post as published
        post.status = 'published';
        post.publishedAt = new Date();
        post.platformPostId = result.postId;
        post.metrics = result.metrics;
        post.error = undefined; // Clear any previous errors
        
        await post.save();
        
        logger.info('Post published successfully', {
          postId: post._id,
          platform: post.platform,
          platformPostId: result.postId,
          metrics: result.metrics,
          duration: Date.now() - startTime
        });
      } else {
        // Mark as failed
        post.status = 'failed';
        post.error = {
          code: result.errorCode || 'PUBLISH_FAILED',
          message: result.errorMessage || 'Failed to publish post',
          timestamp: new Date()
        };
        
        await post.save();
        
        logger.error('Post publication failed', new Error(result.errorMessage), {
          postId: post._id,
          platform: post.platform,
          errorCode: result.errorCode,
          duration: Date.now() - startTime
        });
      }
      
    } catch (error) {
      // Mark as failed
      post.status = 'failed';
      post.error = {
        code: 'SCHEDULER_ERROR',
        message: error.message,
        timestamp: new Date()
      };
      
      await post.save();
      
      logger.error('Post publishing error', error, {
        postId: post._id,
        platform: post.platform,
        duration: Date.now() - startTime
      });
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.job && this.isRunning ? 'Every minute' : null,
      uptime: this.isRunning ? process.uptime() : 0,
      memory: process.memoryUsage()
    };
  }

  /**
   * Get scheduler statistics
   */
  async getStats() {
    try {
      const stats = await Post.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const statusCounts = {};
      stats.forEach(stat => {
        statusCounts[stat._id] = stat.count;
      });

      return {
        isRunning: this.isRunning,
        statusCounts,
        totalPosts: Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
      };
    } catch (error) {
      logger.error('Failed to get scheduler stats', error);
      throw new CronJobError('Failed to retrieve scheduler statistics');
    }
  }
}

module.exports = new SchedulerService();
