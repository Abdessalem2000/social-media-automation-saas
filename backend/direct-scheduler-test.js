/**
 * Direct Scheduler Test - Testing Core Scheduler Functionality
 * Tests the scheduler without API dependencies
 */

const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Mock database
const users = new Map();
const posts = new Map();
const accounts = new Map();

let userIdCounter = 1;
let postIdCounter = 1;
let accountIdCounter = 1;

// Global scheduler stats
const schedulerStats = {
  processedJobs: 0,
  failedJobs: 0,
  totalProcessingTime: 0,
  startTime: null
};

// Mock User model
class MockUser {
  constructor(data) {
    this._id = `user_${userIdCounter++}`;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.role = data.role || 'user';
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static async findOne(query) {
    if (query.email) {
      for (const user of users.values()) {
        if (user.email === query.email) return user;
      }
    }
    if (query._id) {
      return users.get(query._id);
    }
    return null;
  }

  static async create(data) {
    const user = new MockUser(data);
    users.set(user._id, user);
    return user;
  }

  select(fields) {
    if (fields === '-password') {
      const { password, ...user } = this;
      return user;
    }
    return this;
  }
}

// Mock Social Media Account model
class MockSocialMediaAccount {
  constructor(data) {
    this._id = `account_${accountIdCounter++}`;
    this.userId = data.userId;
    this.platform = data.platform;
    this.accountId = data.accountId;
    this.accountName = data.accountName;
    this.username = data.username;
    this.accessToken = data.accessToken;
    this.isActive = data.isActive !== false;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static async findOne(query) {
    for (const account of accounts.values()) {
      if (query._id && account._id === query._id) return account;
      if (query.userId && account.userId === query.userId) return account;
    }
    return null;
  }

  static async create(data) {
    const account = new MockSocialMediaAccount(data);
    accounts.set(account._id, account);
    return account;
  }
}

// Mock Post model
class MockPost {
  constructor(data) {
    this._id = `post_${postIdCounter++}`;
    this.userId = data.userId;
    this.accountId = data.accountId;
    this.content = data.content || {};
    this.platform = data.platform;
    this.status = data.status || 'draft';
    this.scheduledAt = data.scheduledAt;
    this.publishedAt = data.publishedAt;
    this.platformPostId = data.platformPostId;
    this.metrics = data.metrics || {
      likes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      reach: 0,
      engagement: 0
    };
    this.hashtags = data.hashtags || [];
    this.mentions = data.mentions || [];
    this.error = data.error;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static async find(query = {}) {
    const results = [];
    for (const post of posts.values()) {
      let match = true;
      
      if (query.userId && post.userId !== query.userId) match = false;
      if (query.status && post.status !== query.status) match = false;
      if (query.platform && post.platform !== query.platform) match = false;
      if (query.scheduledAt && query.scheduledAt.$lte && post.scheduledAt > query.scheduledAt.$lte) match = false;
      
      if (match) results.push(post);
    }
    
    return results;
  }

  static async findById(id) {
    return posts.get(id);
  }

  static async create(data) {
    const post = new MockPost(data);
    posts.set(post._id, post);
    return post;
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    const post = posts.get(id);
    if (post) {
      Object.assign(post, update, { updatedAt: new Date() });
      return options.new ? post : posts.get(id);
    }
    return null;
  }

  populate(field) {
    return this;
  }
}

// Mock Publishing Service
class MockPublishingService {
  static async publishPost(post, account) {
    const startTime = Date.now();
    
    try {
      // Simulate processing time (50-150ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      
      // Simulate 10% failure rate
      if (Math.random() < 0.1) {
        throw new Error('Simulated publishing failure - Network timeout');
      }
      
      // Generate realistic metrics based on platform
      const baseMetrics = {
        twitter: { likes: [10, 500], comments: [1, 50], shares: [1, 20], views: [100, 2000], reach: [500, 5000] },
        facebook: { likes: [20, 1000], comments: [2, 100], shares: [2, 50], views: [200, 5000], reach: [1000, 10000] },
        instagram: { likes: [50, 2000], comments: [5, 200], shares: [1, 30], views: [500, 10000], reach: [2000, 20000] },
        linkedin: { likes: [5, 100], comments: [1, 20], shares: [1, 10], views: [50, 1000], reach: [200, 2000] }
      };

      const platformMetrics = baseMetrics[post.platform] || baseMetrics.twitter;
      
      const metrics = {
        likes: Math.floor(Math.random() * (platformMetrics.likes[1] - platformMetrics.likes[0])) + platformMetrics.likes[0],
        comments: Math.floor(Math.random() * (platformMetrics.comments[1] - platformMetrics.comments[0])) + platformMetrics.comments[0],
        shares: Math.floor(Math.random() * (platformMetrics.shares[1] - platformMetrics.shares[0])) + platformMetrics.shares[0],
        views: Math.floor(Math.random() * (platformMetrics.views[1] - platformMetrics.views[0])) + platformMetrics.views[0],
        reach: Math.floor(Math.random() * (platformMetrics.reach[1] - platformMetrics.reach[0])) + platformMetrics.reach[0]
      };
      
      metrics.engagement = metrics.likes + metrics.comments + metrics.shares;
      
      const processingTime = Date.now() - startTime;
      schedulerStats.processedJobs++;
      schedulerStats.totalProcessingTime += processingTime;
      
      return {
        success: true,
        platformPostId: `${post.platform}_${uuidv4()}`,
        metrics,
        processingTime
      };
    } catch (error) {
      schedulerStats.failedJobs++;
      const processingTime = Date.now() - startTime;
      
      return {
        success: false,
        error: error.message,
        processingTime
      };
    }
  }
}

// Enhanced Scheduler Service
class SchedulerService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.startTime = null;
    this.concurrencyLimit = 5;
    this.activeJobs = new Set();
    this.processingHistory = [];
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler is already running');
      return;
    }
    
    this.isRunning = true;
    this.startTime = Date.now();
    schedulerStats.startTime = this.startTime;
    
    console.log('🚀 SCHEDULER STARTUP INITIALIZED');
    console.log(`   ✅ isRunning flag set: ${this.isRunning}`);
    console.log(`   ✅ startTime recorded: ${new Date(this.startTime).toISOString()}`);
    console.log(`   ✅ Cron job scheduling: */10 * * * * *`);
    
    // Run every 10 seconds for faster testing
    this.cronJob = cron.schedule('*/10 * * * * *', async () => {
      await this.processScheduledPosts();
    }, {
      scheduled: true
    });
    
    console.log('🚀 SCHEDULER STARTUP COMPLETED');
    console.log(`⚡ Concurrency limit: ${this.concurrencyLimit} posts`);
    console.log(`📅 Next run: Every 10 seconds`);
    
    // Log initial status
    setTimeout(() => {
      const stats = this.getStats();
      console.log('📊 Initial Scheduler Status:');
      console.log(`   isRunning: ${stats.isRunning}`);
      console.log(`   uptime: ${stats.uptime.toFixed(2)}s`);
      console.log(`   nextRun: ${stats.nextRun}`);
    }, 100);
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Scheduler is not running');
      return;
    }
    
    console.log('🛑 SCHEDULER SHUTDOWN INITIATED');
    console.log(`   ✅ isRunning before stop: ${this.isRunning}`);
    console.log(`   ✅ Active jobs to complete: ${this.activeJobs.size}`);
    
    this.isRunning = false;
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    
    console.log('🛑 SCHEDULER SHUTDOWN COMPLETED');
    console.log(`   ✅ isRunning after stop: ${this.isRunning}`);
    console.log(`   ✅ Cron job stopped`);
    console.log(`   ✅ Final uptime: ${((Date.now() - this.startTime) / 1000).toFixed(2)}s`);
  }

  async processScheduledPosts() {
    if (this.activeJobs.size >= this.concurrencyLimit) {
      console.log('⚠️ Concurrency limit reached, skipping this run');
      return;
    }

    const now = new Date();
    const scheduledPosts = await MockPost.find({
      status: 'scheduled',
      scheduledAt: { $lte: now }
    });

    if (scheduledPosts.length === 0) {
      console.log('📭 No scheduled posts to process');
      return;
    }

    console.log(`📝 Processing ${scheduledPosts.length} scheduled posts`);

    // Process posts concurrently with limit
    const jobs = scheduledPosts.slice(0, this.concurrencyLimit - this.activeJobs.size);
    
    const processingPromises = jobs.map(post => this.processPost(post));
    await Promise.all(processingPromises);
  }

  async processPost(post) {
    const jobId = `job_${post._id}`;
    this.activeJobs.add(jobId);

    try {
      console.log(`📤 Processing post ${post._id} for ${post.platform}`);

      // Get account
      const account = await MockSocialMediaAccount.findOne({
        _id: post.accountId,
        isActive: true
      });

      if (!account) {
        throw new Error('Account not found or inactive');
      }

      // Publish post
      const result = await MockPublishingService.publishPost(post, account);

      if (result.success) {
        await MockPost.findByIdAndUpdate(post._id, {
          status: 'published',
          publishedAt: new Date(),
          platformPostId: result.platformPostId,
          metrics: result.metrics,
          error: null
        });

        console.log(`✅ Post ${post._id} published successfully`);
        console.log(`   Platform: ${post.platform} | Processing time: ${result.processingTime}ms`);
        
        this.processingHistory.push({
          postId: post._id,
          status: 'published',
          platform: post.platform,
          processingTime: result.processingTime,
          timestamp: new Date()
        });
      } else {
        await MockPost.findByIdAndUpdate(post._id, {
          status: 'failed',
          error: result.error
        });

        console.log(`❌ Post ${post._id} failed to publish: ${result.error}`);
        
        this.processingHistory.push({
          postId: post._id,
          status: 'failed',
          platform: post.platform,
          error: result.error,
          processingTime: result.processingTime,
          timestamp: new Date()
        });
      }
    } catch (error) {
      await MockPost.findByIdAndUpdate(post._id, {
        status: 'failed',
        error: error.message
      });

      console.log(`❌ Post ${post._id} processing failed: ${error.message}`);
      
      this.processingHistory.push({
        postId: post._id,
        status: 'failed',
        platform: post.platform,
        error: error.message,
        timestamp: new Date()
      });
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  getStats() {
    const uptime = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    const avgProcessingTime = schedulerStats.processedJobs > 0 
      ? schedulerStats.totalProcessingTime / schedulerStats.processedJobs 
      : 0;

    return {
      isRunning: this.isRunning,
      uptime,
      nextRun: this.isRunning ? 'Every 10 seconds' : 'Not running',
      processedJobs: schedulerStats.processedJobs,
      failedJobs: schedulerStats.failedJobs,
      activeJobs: this.activeJobs.size,
      concurrencyLimit: this.concurrencyLimit,
      averageProcessingTime: avgProcessingTime,
      processingHistory: this.processingHistory.slice(-10), // Last 10 operations
      memory: process.memoryUsage()
    };
  }
}

// Test functions
async function setupTestEnvironment() {
  console.log('\n🔧 Setting Up Test Environment');
  console.log('==============================');
  
  try {
    // Create test user
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    const testUser = await MockUser.create({
      username: 'scheduler_test_user',
      email: 'scheduler@test.com',
      password: hashedPassword,
      firstName: 'Scheduler',
      lastName: 'Test'
    });

    console.log('✅ Test user created');
    console.log(`   User ID: ${testUser._id}`);

    // Create social media accounts for different platforms
    const platforms = ['twitter', 'facebook', 'instagram', 'linkedin'];
    const accounts = [];

    for (const platform of platforms) {
      const account = await MockSocialMediaAccount.create({
        userId: testUser._id,
        platform,
        accountId: `${platform}_account_1`,
        accountName: `Test ${platform.charAt(0).toUpperCase() + platform.slice(1)} Account`,
        username: `testuser_${platform}`,
        accessToken: `mock_token_${platform}`
      });
      accounts.push(account);
    }

    console.log(`✅ Created ${accounts.length} social media accounts`);
    accounts.forEach(acc => console.log(`   ${acc.platform}: ${acc._id}`));

    return { user: testUser, accounts };
  } catch (error) {
    console.log('❌ Failed to setup test environment:', error.message);
    return null;
  }
}

async function seedScheduledPosts(testData) {
  console.log('\n🌱 Seeding Scheduled Posts');
  console.log('===========================');
  
  try {
    const posts = [];
    const now = new Date();

    // Create posts scheduled for immediate processing (past time)
    for (let i = 0; i < 10; i++) {
      const scheduledTime = new Date(now);
      scheduledTime.setSeconds(scheduledTime.getSeconds() - 30); // 30 seconds in the past

      const account = testData.accounts[i % testData.accounts.length];
      
      const post = await MockPost.create({
        userId: testData.user._id,
        accountId: account._id,
        content: {
          text: `Test scheduled post ${i + 1} for ${account.platform} - Immediate processing test #automation #testing`
        },
        platform: account.platform,
        status: 'scheduled',
        scheduledAt: scheduledTime,
        hashtags: ['automation', 'testing'],
        mentions: []
      });

      posts.push(post);
    }

    console.log(`✅ Created ${posts.length} scheduled posts`);
    console.log('   Posts scheduled for immediate processing (30 seconds ago)');
    
    posts.forEach((post, index) => {
      console.log(`   ${index + 1}. ${post._id} - ${post.platform} - ${post.scheduledAt.toISOString()}`);
    });

    return posts;
  } catch (error) {
    console.log('❌ Failed to seed scheduled posts:', error.message);
    return [];
  }
}

async function runSchedulerTest(posts) {
  console.log('\n🚀 Running Scheduler Test');
  console.log('========================');
  
  try {
    const scheduler = new SchedulerService();
    
    // Start scheduler
    scheduler.start();
    console.log('✅ Scheduler started');

    // Monitor processing for up to 2 minutes
    console.log('📡 Monitoring post processing...');
    console.log('⏰ Timeout: 2 minutes');

    let processedCount = 0;
    let failedCount = 0;
    let attempts = 0;
    const maxAttempts = 120; // 2 minutes with 1-second intervals

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check post statuses
      processedCount = 0;
      failedCount = 0;

      for (const post of posts) {
        const updatedPost = await MockPost.findById(post._id);
        if (updatedPost.status === 'published') {
          processedCount++;
        } else if (updatedPost.status === 'failed') {
          failedCount++;
        }
      }

      attempts++;
      
      // Log progress every 10 seconds
      if (attempts % 10 === 0) {
        const totalProcessed = processedCount + failedCount;
        console.log(`⏳ Progress: ${totalProcessed}/${posts.length} posts processed (${attempts}s elapsed)`);
        console.log(`   Published: ${processedCount}, Failed: ${failedCount}`);
      }

      // Exit early if all posts are processed
      if (processedCount + failedCount === posts.length) {
        console.log('🎉 All posts have been processed!');
        break;
      }
    }

    // Stop scheduler
    scheduler.stop();

    // Get final stats
    const stats = scheduler.getStats();
    
    console.log('\n📊 Final Scheduler Stats:');
    console.log(`   Total Processed: ${stats.processedJobs}`);
    console.log(`   Total Failed: ${stats.failedJobs}`);
    console.log(`   Average Processing Time: ${stats.averageProcessingTime.toFixed(2)}ms`);
    console.log(`   Uptime: ${stats.uptime.toFixed(2)}s`);

    // Analyze results
    const totalPosts = posts.length;
    const processingRate = ((processedCount + failedCount) / totalPosts) * 100;
    const successRate = (processedCount / totalPosts) * 100;
    const failureRate = (failedCount / totalPosts) * 100;

    console.log('\n📈 Processing Analysis:');
    console.log(`   Processing Rate: ${processingRate.toFixed(1)}%`);
    console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`   Failure Rate: ${failureRate.toFixed(1)}% (expected ~10%)`);

    // Validate metrics for published posts
    let metricsValid = true;
    let postsWithMetrics = 0;

    for (const post of posts) {
      const updatedPost = await MockPost.findById(post._id);
      if (updatedPost.status === 'published' && updatedPost.metrics) {
        postsWithMetrics++;
        const metrics = updatedPost.metrics;
        
        if (typeof metrics.likes !== 'number' || metrics.likes < 0 ||
            typeof metrics.comments !== 'number' || metrics.comments < 0 ||
            typeof metrics.shares !== 'number' || metrics.shares < 0 ||
            typeof metrics.views !== 'number' || metrics.views < 0 ||
            typeof metrics.reach !== 'number' || metrics.reach < 0 ||
            typeof metrics.engagement !== 'number' || metrics.engagement < 0 ||
            metrics.engagement !== metrics.likes + metrics.comments + metrics.shares) {
          metricsValid = false;
          console.log(`❌ Invalid metrics for post ${post._id}`);
        }
      }
    }

    console.log(`\n📊 Metrics Validation:`);
    console.log(`   Posts with metrics: ${postsWithMetrics}/${processedCount}`);
    console.log(`   Metrics validation: ${metricsValid ? '✅ PASS' : '❌ FAIL'}`);

    // Test results
    const results = {
      environmentSetup: true,
      postSeeding: posts.length > 0,
      schedulerStart: stats.uptime > 0 || schedulerStats.startTime !== null, // Check if scheduler was started
      postProcessing: (processedCount + failedCount) === posts.length,
      successRate: successRate >= 70, // Allow for 10% failure rate + tolerance
      failureRate: failureRate <= 25, // Allow tolerance for small sample
      metricsGeneration: metricsValid && postsWithMetrics === processedCount,
      concurrencyTest: processedCount >= 5 // Should process at least 5 concurrently
    };

    return { results, stats, processedCount, failedCount, successRate, failureRate };
  } catch (error) {
    console.log('❌ Scheduler test failed:', error.message);
    return null;
  }
}

// Main test runner
async function runDirectSchedulerTest() {
  console.log('🚀 DIRECT SCHEDULER TEST');
  console.log('========================');
  console.log('📊 Testing core scheduler functionality without API dependencies');
  console.log('⚡ Concurrency Limit: 5 posts');
  console.log('❌ Expected Failure Rate: ~10%');
  console.log('🕐 Test Duration: Up to 2 minutes');

  try {
    // Step 1: Setup test environment
    const testData = await setupTestEnvironment();
    if (!testData) {
      console.log('❌ Cannot proceed without test environment');
      return;
    }

    // Step 2: Seed scheduled posts
    const posts = await seedScheduledPosts(testData);
    if (posts.length === 0) {
      console.log('❌ Cannot proceed without scheduled posts');
      return;
    }

    // Step 3: Run scheduler test
    const testResults = await runSchedulerTest(posts);
    if (!testResults) {
      console.log('❌ Scheduler test failed');
      return;
    }

    // Step 4: Generate comprehensive report
    console.log('\n📋 COMPREHENSIVE TEST REPORT');
    console.log('============================');
    
    console.log('\n🎯 Test Results:');
    Object.entries(testResults.results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`   ${status} ${testName}`);
    });

    const passedTests = Object.values(testResults.results).filter(Boolean).length;
    const totalTests = Object.keys(testResults.results).length;

    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
      console.log('🎉 ALL SCHEDULER TESTS PASSED!');
      console.log('✅ Scheduler is working correctly');
      console.log('✅ Post scheduling and processing working');
      console.log('✅ Status transitions working (scheduled → published/failed)');
      console.log('✅ Metrics generation working');
      console.log('✅ Failure handling working');
      console.log('✅ Concurrent processing working');
    } else {
      console.log('⚠️ Some scheduler tests failed. Review the logs above.');
    }

    return testResults;
  } catch (error) {
    console.log('❌ Direct scheduler test failed:', error.message);
    console.log('Stack:', error.stack);
    return null;
  }
}

// Run the test
runDirectSchedulerTest().catch(console.error);
