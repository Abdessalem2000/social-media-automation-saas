const cron = require('node-cron');
const crypto = require('crypto');
const Post = require('../models/Post');
const PublishingService = require('./publishingService');
const { logger, CronJobError } = require('../middleware/errorHandler');

class SchedulerService {
  constructor() {
    this.isRunning = false;
    this.job = null;
    this.processId = `scheduler-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.lockTimeout = 5 * 60 * 1000; // 5 minutes
  }

  start() {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    logger.info('Starting Social Media Scheduler...', { processId: this.processId });
    
    // Clean up any orphaned locks on startup
    this.cleanupOrphanedLocks();
    
    // Run every minute
    this.job = cron.schedule('* * * * *', async () => {
      await this.processScheduledPosts();
    }, {
      scheduled: false,
      timezone: process.env.TZ || 'UTC'
    });

    this.job.start();
    this.isRunning = true;
    
    logger.info('Scheduler started - Running every minute', { processId: this.processId });
  }

  /**
   * Clean up orphaned locks on startup (when scheduler restarts)
   */
  async cleanupOrphanedLocks() {
    try {
      logger.info('Cleaning up orphaned locks on startup', { processId: this.processId });
      
      const now = new Date();
      const result = await Post.updateMany(
        {
          'processingLock.locked': true,
          $or: [
            { 'processingLock.lockedBy': this.processId },
            { 'processingLock.lockExpiresAt': { $lt: now } }
          ]
        },
        {
          $unset: { processingLock: 1 }
        }
      );
      
      if (result.modifiedCount > 0) {
        logger.info('Cleaned up orphaned locks on startup', {
          cleanedUp: result.modifiedCount,
          processId: this.processId,
          timestamp: now.toISOString()
        });
      }
      
      // Also check for any posts that might be stuck in processing state
      const stuckPosts = await Post.find({
        status: 'scheduled',
        lastProcessedAt: { $lt: new Date(now.getTime() - 10 * 60 * 1000) }, // More than 10 minutes ago
        'processingLock.locked': true
      });
      
      if (stuckPosts.length > 0) {
        logger.warn('Found stuck posts, releasing their locks', {
          stuckCount: stuckPosts.length,
          processId: this.processId
        });
        
        await Post.updateMany(
          {
            _id: { $in: stuckPosts.map(p => p._id) }
          },
          {
            $unset: { processingLock: 1 }
          }
        );
      }
      
    } catch (error) {
      logger.error('Failed to cleanup orphaned locks on startup', error, { 
        processId: this.processId 
      });
    }
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
    const attemptId = crypto.randomUUID();
    let processedCount = 0;
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    try {
      logger.info('Checking for scheduled posts...', { attemptId, processId: this.processId });
      
      const now = new Date();
      
      // Clean up expired locks first
      await this.cleanupExpiredLocks();
      
      // Find posts that are scheduled and ready to publish, with proper locking
      const scheduledPosts = await Post.find({
        status: 'scheduled',
        scheduledAt: { $lte: now },
        $or: [
          { processingLock: { $exists: false } },
          { 'processingLock.locked': { $ne: true } },
          { 'processingLock.lockExpiresAt': { $lt: now } }
        ]
      }).populate('userId accountId');

      logger.info(`Found ${scheduledPosts.length} posts to publish`, {
        count: scheduledPosts.length,
        timestamp: now.toISOString(),
        attemptId
      });

      if (scheduledPosts.length === 0) {
        logger.debug('No posts to publish at this time', { attemptId });
        return;
      }

      // Process posts in parallel with concurrency limit and proper locking
      const concurrencyLimit = 5;
      const chunks = [];
      
      for (let i = 0; i < scheduledPosts.length; i += concurrencyLimit) {
        chunks.push(scheduledPosts.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        const results = await Promise.allSettled(
          chunk.map(post => this.publishPostWithLock(post, attemptId))
        );
        
        // Count results
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            if (result.value.status === 'skipped') {
              skippedCount++;
            } else if (result.value.status === 'success') {
              successCount++;
            } else {
              errorCount++;
            }
            processedCount++;
          } else {
            errorCount++;
          }
        });
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
        attemptId,
        processed: processedCount,
        successful: successCount,
        failed: errorCount,
        skipped: skippedCount,
        duration: Date.now() - startTime
      });

    } catch {
      errorCount++;
      const jobError = new CronJobError('Scheduler processing failed', 'process_scheduled_posts');
      logger.error('Scheduler processing error', jobError, {
        attemptId,
        processed: processedCount,
        successful: successCount,
        failed: errorCount,
        skipped: skippedCount,
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Clean up expired processing locks
   */
  async cleanupExpiredLocks() {
    try {
      const now = new Date();
      const result = await Post.updateMany(
        {
          'processingLock.locked': true,
          'processingLock.lockExpiresAt': { $lt: now }
        },
        {
          $unset: { processingLock: 1 }
        }
      );
      
      if (result.modifiedCount > 0) {
        logger.info('Cleaned up expired processing locks', {
          cleanedUp: result.modifiedCount,
          timestamp: now.toISOString()
        });
      }
    } catch (error) {
      logger.error('Failed to cleanup expired locks', error);
    }
  }

  /**
   * Acquire processing lock for a post
   */
  async acquireProcessingLock(postId, attemptId) {
    const now = new Date();
    const lockExpiresAt = new Date(now.getTime() + this.lockTimeout);
    
    try {
      const result = await Post.updateOne(
        {
          _id: postId,
          $or: [
            { processingLock: { $exists: false } },
            { 'processingLock.locked': { $ne: true } },
            { 'processingLock.lockExpiresAt': { $lt: now } }
          ]
        },
        {
          $set: {
            processingLock: {
              locked: true,
              lockedAt: now,
              lockedBy: this.processId,
              lockExpiresAt
            },
            processingAttemptId: attemptId,
            lastProcessedAt: now
          }
        }
      );
      
      return result.modifiedCount > 0;
    } catch {
      logger.error('Failed to acquire processing lock', { postId, attemptId });
      return false;
    }
  }

  /**
   * Release processing lock for a post
   */
  async releaseProcessingLock(postId) {
    try {
      await Post.updateOne(
        {
          _id: postId,
          'processingLock.lockedBy': this.processId
        },
        {
          $unset: { processingLock: 1 }
        }
      );
    } catch (error) {
      logger.error('Failed to release processing lock', error, { postId });
    }
  }

  /**
   * Publish post with proper locking and idempotency protection
   */
  async publishPostWithLock(post, attemptId) {
    const startTime = Date.now();
    
    try {
      // Check if this post was already processed with this attempt ID
      if (post.processingAttemptId === attemptId) {
        logger.debug('Post already processed in this attempt', {
          postId: post._id,
          attemptId,
          status: post.status
        });
        return { status: 'skipped', reason: 'already_processed' };
      }

      // Try to acquire lock
      const lockAcquired = await this.acquireProcessingLock(post._id, attemptId);
      
      if (!lockAcquired) {
        logger.debug('Failed to acquire processing lock, post may be processed by another process', {
          postId: post._id,
          attemptId
        });
        return { status: 'skipped', reason: 'lock_not_acquired' };
      }

      // Double-check status after acquiring lock
      const freshPost = await Post.findById(post._id);
      if (freshPost.status !== 'scheduled') {
        logger.debug('Post status changed, skipping', {
          postId: post._id,
          currentStatus: freshPost.status,
          attemptId
        });
        await this.releaseProcessingLock(post._id);
        return { status: 'skipped', reason: 'status_changed' };
      }

      // Process the post
      const result = await this.publishPost(post, attemptId);
      
      // Always release the lock
      await this.releaseProcessingLock(post._id);
      
      return result;
      
    } catch (error) {
      // Ensure lock is released on error
      await this.releaseProcessingLock(post._id);
      
      logger.error('Post publishing error with lock', error, {
        postId: post._id,
        attemptId,
        duration: Date.now() - startTime
      });
      
      return { status: 'error', error: error.message };
    }
  }

  async publishPost(post, attemptId = null) {
    const startTime = Date.now();
    
    try {
      logger.info('Publishing post', {
        postId: post._id,
        platform: post.platform,
        userId: post.userId._id,
        attemptId
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
          attemptId,
          duration: Date.now() - startTime
        });
        
        return { status: 'success', postId: post._id, platformPostId: result.postId };
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
          attemptId,
          duration: Date.now() - startTime
        });
        
        return { status: 'failed', error: result.errorMessage };
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
        attemptId,
        duration: Date.now() - startTime
      });
      
      return { status: 'error', error: error.message };
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      processId: this.processId,
      nextRun: this.job && this.isRunning ? 'Every minute' : null,
      uptime: this.isRunning ? process.uptime() : 0,
      memory: process.memoryUsage(),
      lockTimeout: this.lockTimeout
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
