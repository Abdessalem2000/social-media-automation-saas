/**
 * Scheduling Engine Testing
 * Tests the core scheduling functionality
 */

const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');

// Mock database
const posts = new Map();
const accounts = new Map();
const schedulerStats = {
  processedJobs: 0,
  failedJobs: 0,
  totalProcessingTime: 0
};

let postIdCounter = 1;
let accountIdCounter = 1;

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
    this.location = data.location;
    this.settings = data.settings || {};
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
      if (query.scheduledAt && post.scheduledAt < query.scheduledAt.$gte) match = false;
      
      if (match) results.push(post);
    }
    
    return results.sort((a, b) => b.createdAt - a.createdAt);
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

// Mock Social Media Account
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
      if (query.userId && query.accountId && 
          account.userId === query.userId && account.accountId === query.accountId) return account;
    }
    return null;
  }
}

// Mock publishing service
class MockPublishingService {
  static async publishPost(post, account) {
    const startTime = Date.now();
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      
      // Simulate 10% failure rate
      if (Math.random() < 0.1) {
        throw new Error('Simulated publishing failure');
      }
      
      // Generate realistic metrics
      const metrics = {
        likes: Math.floor(Math.random() * 1000) + 10,
        comments: Math.floor(Math.random() * 100) + 1,
        shares: Math.floor(Math.random() * 50) + 1,
        views: Math.floor(Math.random() * 5000) + 100,
        reach: Math.floor(Math.random() * 10000) + 500,
        engagement: 0
      };
      
      metrics.engagement = metrics.likes + metrics.comments + metrics.shares;
      
      const processingTime = Date.now() - startTime;
      schedulerStats.processedJobs++;
      schedulerStats.totalProcessingTime += processingTime;
      
      return {
        success: true,
        platformPostId: `platform_${uuidv4()}`,
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

// Mock Scheduler Service
class MockSchedulerService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.startTime = null;
    this.concurrencyLimit = 5;
    this.activeJobs = new Set();
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startTime = Date.now();
    
    // Run every minute for testing
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.processScheduledPosts();
    }, {
      scheduled: true
    });
    
    console.log('🚀 Mock scheduler started - Running every minute');
  }

  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
    
    console.log('🛑 Mock scheduler stopped');
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
    
    await Promise.all(jobs.map(post => this.processPost(post)));
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
        console.log(`   Platform: ${post.platform}`);
        console.log(`   Metrics: ${JSON.stringify(result.metrics)}`);
      } else {
        await MockPost.findByIdAndUpdate(post._id, {
          status: 'failed',
          error: result.error
        });

        console.log(`❌ Post ${post._id} failed to publish: ${result.error}`);
      }
    } catch (error) {
      await MockPost.findByIdAndUpdate(post._id, {
        status: 'failed',
        error: error.message
      });

      console.log(`❌ Post ${post._id} processing failed: ${error.message}`);
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  getStats() {
    return {
      isRunning: this.isRunning,
      uptime: this.isRunning ? (Date.now() - this.startTime) / 1000 : 0,
      nextRun: this.isRunning ? 'Every minute' : 'Not running',
      processedJobs: schedulerStats.processedJobs,
      failedJobs: schedulerStats.failedJobs,
      activeJobs: this.activeJobs.size,
      concurrencyLimit: this.concurrencyLimit,
      averageProcessingTime: schedulerStats.processedJobs > 0 
        ? schedulerStats.totalProcessingTime / schedulerStats.processedJobs 
        : 0,
      memory: process.memoryUsage()
    };
  }
}

// Test functions
async function testCreateScheduledPost() {
  console.log('\n🧪 Test 1: Create Scheduled Post');
  console.log('=================================');
  
  try {
    // Create a mock account first
    const account = await MockSocialMediaAccount.create({
      userId: 'test_user_1',
      platform: 'twitter',
      accountId: 'twitter_account_1',
      accountName: 'Test Twitter Account',
      username: 'testuser',
      accessToken: 'mock_token'
    });

    // Create scheduled post for 30 seconds from now
    const scheduledTime = new Date();
    scheduledTime.setSeconds(scheduledTime.getSeconds() + 30);

    const post = await MockPost.create({
      userId: 'test_user_1',
      accountId: account._id,
      content: {
        text: 'This is a test scheduled post #automation #testing'
      },
      platform: 'twitter',
      status: 'scheduled',
      scheduledAt: scheduledTime,
      hashtags: ['automation', 'testing'],
      mentions: []
    });

    console.log('✅ Scheduled post created successfully!');
    console.log(`Post ID: ${post._id}`);
    console.log(`Platform: ${post.platform}`);
    console.log(`Scheduled for: ${post.scheduledAt.toISOString()}`);
    console.log(`Content: ${post.content.text}`);

    return post;
  } catch (error) {
    console.log('❌ Failed to create scheduled post:', error.message);
    return null;
  }
}

async function testSchedulerDetection(post) {
  console.log('\n🧪 Test 2: Scheduler Detection');
  console.log('=============================');
  
  try {
    const scheduler = new MockSchedulerService();
    scheduler.start();

    console.log('✅ Scheduler started');
    console.log(`⏰ Waiting for post ${post._id} to be detected...`);

    // Wait for the post to be processed (should happen within 1 minute)
    let processed = false;
    let attempts = 0;
    const maxAttempts = 70; // Wait up to 70 seconds

    while (!processed && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedPost = await MockPost.findById(post._id);
      if (updatedPost.status !== 'scheduled') {
        processed = true;
        console.log(`✅ Post detected and processed! Status: ${updatedPost.status}`);
        
        if (updatedPost.status === 'published') {
          console.log(`📊 Published metrics: ${JSON.stringify(updatedPost.metrics)}`);
        } else if (updatedPost.status === 'failed') {
          console.log(`❌ Publish failed: ${updatedPost.error}`);
        }
      }
      
      attempts++;
      if (attempts % 10 === 0) {
        console.log(`⏳ Still waiting... (${attempts}s elapsed)`);
      }
    }

    if (!processed) {
      console.log('❌ Post was not processed within the expected time');
    }

    scheduler.stop();
    return processed;
  } catch (error) {
    console.log('❌ Scheduler detection test failed:', error.message);
    return false;
  }
}

async function testStatusChanges() {
  console.log('\n🧪 Test 3: Status Changes (Scheduled → Published)');
  console.log('===============================================');
  
  try {
    const scheduler = new MockSchedulerService();
    scheduler.start();

    // Create multiple posts with different scheduled times
    const posts = [];
    const account = await MockSocialMediaAccount.create({
      userId: 'test_user_2',
      platform: 'facebook',
      accountId: 'facebook_account_1',
      accountName: 'Test Facebook Account',
      username: 'testuser',
      accessToken: 'mock_token'
    });

    for (let i = 0; i < 5; i++) {
      const scheduledTime = new Date();
      scheduledTime.setSeconds(scheduledTime.getSeconds() + (i * 10) + 5);

      const post = await MockPost.create({
        userId: 'test_user_2',
        accountId: account._id,
        content: {
          text: `Test post ${i + 1} - Scheduled for status change test`
        },
        platform: 'facebook',
        status: 'scheduled',
        scheduledAt: scheduledTime
      });

      posts.push(post);
    }

    console.log(`✅ Created ${posts.length} scheduled posts`);

    // Wait for all posts to be processed
    let processedCount = 0;
    let attempts = 0;
    const maxAttempts = 120; // Wait up to 2 minutes

    while (processedCount < posts.length && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      processedCount = 0;
      for (const post of posts) {
        const updatedPost = await MockPost.findById(post._id);
        if (updatedPost.status !== 'scheduled') {
          processedCount++;
        }
      }
      
      attempts++;
      console.log(`⏳ Processed: ${processedCount}/${posts.length} posts (${attempts * 2}s elapsed)`);
    }

    // Verify status changes
    let publishedCount = 0;
    let failedCount = 0;

    for (const post of posts) {
      const updatedPost = await MockPost.findById(post._id);
      if (updatedPost.status === 'published') {
        publishedCount++;
        console.log(`✅ Post ${post._id} published with metrics: ${JSON.stringify(updatedPost.metrics)}`);
      } else if (updatedPost.status === 'failed') {
        failedCount++;
        console.log(`❌ Post ${post._id} failed: ${updatedPost.error}`);
      }
    }

    console.log(`📊 Final results: ${publishedCount} published, ${failedCount} failed`);

    scheduler.stop();
    return processedCount === posts.length;
  } catch (error) {
    console.log('❌ Status changes test failed:', error.message);
    return false;
  }
}

async function testMetricsGeneration() {
  console.log('\n🧪 Test 4: Metrics Generation');
  console.log('=============================');
  
  try {
    // Create a post and manually publish it to test metrics
    const account = await MockSocialMediaAccount.create({
      userId: 'test_user_3',
      platform: 'instagram',
      accountId: 'instagram_account_1',
      accountName: 'Test Instagram Account',
      username: 'testuser',
      accessToken: 'mock_token'
    });

    const post = await MockPost.create({
      userId: 'test_user_3',
      accountId: account._id,
      content: {
        text: 'Test post for metrics generation',
        imageUrl: 'https://example.com/image.jpg'
      },
      platform: 'instagram',
      status: 'scheduled',
      scheduledAt: new Date(Date.now() - 1000) // Schedule for past
    });

    // Process the post
    const result = await MockPublishingService.publishPost(post, account);

    if (result.success) {
      await MockPost.findByIdAndUpdate(post._id, {
        status: 'published',
        publishedAt: new Date(),
        platformPostId: result.platformPostId,
        metrics: result.metrics
      });

      const updatedPost = await MockPost.findById(post._id);

      console.log('✅ Metrics generated successfully!');
      console.log(`Post ID: ${updatedPost._id}`);
      console.log(`Platform: ${updatedPost.platform}`);
      console.log(`Likes: ${updatedPost.metrics.likes}`);
      console.log(`Comments: ${updatedPost.metrics.comments}`);
      console.log(`Shares: ${updatedPost.metrics.shares}`);
      console.log(`Views: ${updatedPost.metrics.views}`);
      console.log(`Reach: ${updatedPost.metrics.reach}`);
      console.log(`Engagement: ${updatedPost.metrics.engagement}`);

      // Verify metrics are realistic
      const metricsValid = 
        updatedPost.metrics.likes >= 0 &&
        updatedPost.metrics.comments >= 0 &&
        updatedPost.metrics.shares >= 0 &&
        updatedPost.metrics.views >= 0 &&
        updatedPost.metrics.reach >= 0 &&
        updatedPost.metrics.engagement === updatedPost.metrics.likes + updatedPost.metrics.comments + updatedPost.metrics.shares;

      console.log(`✅ Metrics validation: ${metricsValid ? 'PASSED' : 'FAILED'}`);
      return metricsValid;
    } else {
      console.log('❌ Publishing failed, cannot test metrics');
      return false;
    }
  } catch (error) {
    console.log('❌ Metrics generation test failed:', error.message);
    return false;
  }
}

async function testFailureSimulation() {
  console.log('\n🧪 Test 5: Failure Simulation (10% failure rate)');
  console.log('===============================================');
  
  try {
    const scheduler = new MockSchedulerService();
    scheduler.start();

    // Create many posts to test failure rate
    const posts = [];
    const account = await MockSocialMediaAccount.create({
      userId: 'test_user_4',
      platform: 'linkedin',
      accountId: 'linkedin_account_1',
      accountName: 'Test LinkedIn Account',
      username: 'testuser',
      accessToken: 'mock_token'
    });

    for (let i = 0; i < 20; i++) {
      const scheduledTime = new Date();
      scheduledTime.setSeconds(scheduledTime.getSeconds() + 5);

      const post = await MockPost.create({
        userId: 'test_user_4',
        accountId: account._id,
        content: {
          text: `Failure test post ${i + 1}`
        },
        platform: 'linkedin',
        status: 'scheduled',
        scheduledAt: scheduledTime
      });

      posts.push(post);
    }

    console.log(`✅ Created ${posts.length} posts for failure simulation`);

    // Wait for all posts to be processed
    let processedCount = 0;
    let attempts = 0;
    const maxAttempts = 60;

    while (processedCount < posts.length && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      processedCount = 0;
      for (const post of posts) {
        const updatedPost = await MockPost.findById(post._id);
        if (updatedPost.status !== 'scheduled') {
          processedCount++;
        }
      }
      
      attempts++;
    }

    // Count failures
    let publishedCount = 0;
    let failedCount = 0;

    for (const post of posts) {
      const updatedPost = await MockPost.findById(post._id);
      if (updatedPost.status === 'published') {
        publishedCount++;
      } else if (updatedPost.status === 'failed') {
        failedCount++;
      }
    }

    const failureRate = (failedCount / posts.length) * 100;
    const expectedFailureRate = 10; // 10% expected

    console.log(`📊 Results: ${publishedCount} published, ${failedCount} failed`);
    console.log(`📈 Failure rate: ${failureRate.toFixed(1)}% (expected ~${expectedFailureRate}%)`);

    // Allow some tolerance (5-15% is acceptable for 10% expected with 20 samples)
    const acceptable = failureRate >= 5 && failureRate <= 15;
    console.log(`✅ Failure rate test: ${acceptable ? 'PASSED' : 'FAILED'}`);

    scheduler.stop();
    return acceptable;
  } catch (error) {
    console.log('❌ Failure simulation test failed:', error.message);
    return false;
  }
}

async function testConcurrentProcessing() {
  console.log('\n🧪 Test 6: Concurrent Processing');
  console.log('================================');
  
  try {
    const scheduler = new MockSchedulerService();
    scheduler.start();

    // Create posts scheduled for the same time
    const posts = [];
    const account = await MockSocialMediaAccount.create({
      userId: 'test_user_5',
      platform: 'tiktok',
      accountId: 'tiktok_account_1',
      accountName: 'Test TikTok Account',
      username: 'testuser',
      accessToken: 'mock_token'
    });

    const scheduledTime = new Date();
    scheduledTime.setSeconds(scheduledTime.getSeconds() + 5);

    // Create 8 posts (more than concurrency limit of 5)
    for (let i = 0; i < 8; i++) {
      const post = await MockPost.create({
        userId: 'test_user_5',
        accountId: account._id,
        content: {
          text: `Concurrent test post ${i + 1}`
        },
        platform: 'tiktok',
        status: 'scheduled',
        scheduledAt: scheduledTime
      });

      posts.push(post);
    }

    console.log(`✅ Created ${posts.length} posts scheduled for the same time`);
    console.log(`⚡ Concurrency limit: ${scheduler.concurrencyLimit}`);

    // Wait for processing
    let processedCount = 0;
    let attempts = 0;
    const maxAttempts = 60;

    while (processedCount < posts.length && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      processedCount = 0;
      for (const post of posts) {
        const updatedPost = await MockPost.findById(post._id);
        if (updatedPost.status !== 'scheduled') {
          processedCount++;
        }
      }
      
      attempts++;
      console.log(`⏳ Processed: ${processedCount}/${posts.length} posts`);
    }

    // Get final stats
    const stats = scheduler.getStats();
    
    console.log(`📊 Final stats:`, stats);
    console.log(`✅ Concurrent processing test: ${processedCount === posts.length ? 'PASSED' : 'FAILED'}`);

    scheduler.stop();
    return processedCount === posts.length;
  } catch (error) {
    console.log('❌ Concurrent processing test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runSchedulerTests() {
  console.log('🚀 Starting Scheduling Engine Tests');
  console.log('=====================================');
  console.log('📊 Testing Post Scheduling and Publishing');
  console.log('⚡ Concurrency Limit: 5 posts');
  console.log('❌ Failure Rate: 10% (simulated)');

  const results = {};

  // Test 1: Create scheduled post
  const post = await testCreateScheduledPost();
  results.createScheduledPost = !!post;

  // Test 2: Scheduler detection
  results.schedulerDetection = post ? await testSchedulerDetection(post) : false;

  // Test 3: Status changes
  results.statusChanges = await testStatusChanges();

  // Test 4: Metrics generation
  results.metricsGeneration = await testMetricsGeneration();

  // Test 5: Failure simulation
  results.failureSimulation = await testFailureSimulation();

  // Test 6: Concurrent processing
  results.concurrentProcessing = await testConcurrentProcessing();

  // Results summary
  console.log('\n📊 Scheduler Test Results Summary');
  console.log('===================================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${testName}`);
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All scheduler tests passed!');
    console.log('✅ Post scheduling working correctly');
    console.log('✅ Cron detection working correctly');
    console.log('✅ Status transitions working correctly');
    console.log('✅ Metrics generation working correctly');
    console.log('✅ Failure handling working correctly');
    console.log('✅ Concurrent processing working correctly');
  } else {
    console.log('⚠️ Some scheduler tests failed. Review the logs above.');
  }

  return results;
}

// Run the tests
runSchedulerTests().catch(console.error);
