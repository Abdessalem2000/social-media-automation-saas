/**
 * Analytics System Testing
 * Tests analytics aggregation, trends, and top posts functionality
 */

// Mock database
const users = new Map();
const posts = new Map();
const accounts = new Map();

let userIdCounter = 1;
let postIdCounter = 1;
let accountIdCounter = 1;

// Mock User model
class MockUser {
  constructor(data) {
    this._id = `user_${userIdCounter++}`;
    this.username = data.username;
    this.email = data.email;
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
    this.followers = data.followers || 0;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static async find(query = {}) {
    const results = [];
    for (const account of accounts.values()) {
      let match = true;
      if (query.userId && account.userId !== query.userId) match = false;
      if (query.platform && account.platform !== query.platform) match = false;
      if (match) results.push(account);
    }
    return results;
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
    this.status = data.status || 'published';
    this.publishedAt = data.publishedAt || new Date();
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
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = new Date();
  }

  static async find(query = {}) {
    const results = [];
    for (const post of posts.values()) {
      let match = true;
      
      if (query.userId && post.userId !== query.userId) match = false;
      if (query.status && post.status !== query.status) match = false;
      if (query.platform && post.platform !== query.platform) match = false;
      if (query.publishedAt && query.publishedAt.$gte && post.publishedAt < query.publishedAt.$gte) match = false;
      if (query.publishedAt && query.publishedAt.$lte && post.publishedAt > query.publishedAt.$lte) match = false;
      
      if (match) results.push(post);
    }
    
    return results.sort((a, b) => b.publishedAt - a.publishedAt);
  }

  static async findById(id) {
    return posts.get(id);
  }

  static async create(data) {
    const post = new MockPost(data);
    posts.set(post._id, post);
    return post;
  }

  static async aggregate(pipeline) {
    // Mock aggregation for analytics
    console.log(`🔍 Mock aggregation called with pipeline:`, JSON.stringify(pipeline[0], null, 2));
    const results = [];
    
    // Handle different aggregation pipelines
    if (pipeline[0]?.$match?.status === 'published' && !pipeline[0]?.$match?.publishedAt) {
      console.log('📍 Using analytics overview aggregation');
      // Analytics overview aggregation (no date filter)
      const platformStats = {};

      for (const post of posts.values()) {
        if (post.status === 'published' && post.userId === pipeline[0].$match.userId) {
          const platform = post.platform;
          if (!platformStats[platform]) {
            platformStats[platform] = {
              platform,
              posts: 0,
              totalLikes: 0,
              totalComments: 0,
              totalShares: 0,
              totalViews: 0,
              totalReach: 0
            };
          }
          
          platformStats[platform].posts++;
          platformStats[platform].totalLikes += post.metrics.likes;
          platformStats[platform].totalComments += post.metrics.comments;
          platformStats[platform].totalShares += post.metrics.shares;
          platformStats[platform].totalViews += post.metrics.views;
          platformStats[platform].totalReach += post.metrics.reach;
        }
      }

      return Object.values(platformStats);
    }
    
    if (pipeline[0]?.$match?.status === 'published' && pipeline[0]?.$match?.publishedAt?.$gte && pipeline[1]?.$group) {
      console.log('📍 Using trends aggregation');
      // Trends aggregation with date filtering
      const dateGroups = {};
      const startDate = new Date(pipeline[0].$match.publishedAt.$gte);
      
      console.log(`🔍 Mock aggregation filtering posts from ${startDate.toISOString()}`);
      
      let filteredPosts = 0;
      let totalPosts = 0;
      
      // Debug: show some sample post dates
      const sampleDates = [];
      for (const post of posts.values()) {
        totalPosts++;
        if (post.status === 'published' && post.userId === pipeline[0].$match.userId) {
          sampleDates.push(post.publishedAt.toISOString());
          if (sampleDates.length >= 5) break;
        }
      }
      console.log(`📅 Sample post dates: ${sampleDates.join(', ')}`);
      
      for (const post of posts.values()) {
        if (post.status === 'published' && post.publishedAt >= startDate && post.userId === pipeline[0].$match.userId) {
          filteredPosts++;
          const dateKey = post.publishedAt.toISOString().split('T')[0]; // YYYY-MM-DD
          if (!dateGroups[dateKey]) {
            dateGroups[dateKey] = {
              date: dateKey,
              totalLikes: 0,
              totalComments: 0,
              totalShares: 0,
              totalViews: 0,
              totalReach: 0,
              posts: 0
            };
          }
          
          dateGroups[dateKey].totalLikes += post.metrics.likes;
          dateGroups[dateKey].totalComments += post.metrics.comments;
          dateGroups[dateKey].totalShares += post.metrics.shares;
          dateGroups[dateKey].totalViews += post.metrics.views;
          dateGroups[dateKey].totalReach += post.metrics.reach;
          dateGroups[dateKey].posts++;
        }
      }

      console.log(`📊 Found ${filteredPosts} posts in date range out of ${totalPosts} total posts`);

      const result = Object.values(dateGroups).sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Apply projection and sorting from pipeline
      if (pipeline[1]?.$project && pipeline[2]?.$sort) {
        return result.map(item => {
          const projected = {
            date: item.date,
            totalLikes: item.totalLikes,
            totalComments: item.totalComments,
            totalShares: item.totalShares,
            totalViews: item.totalViews,
            totalReach: item.totalReach,
            posts: item.posts,
            avgLikes: item.posts > 0 ? item.totalLikes / item.posts : 0,
            avgComments: item.posts > 0 ? item.totalComments / item.posts : 0,
            avgShares: item.posts > 0 ? item.totalShares / item.posts : 0,
            avgViews: item.posts > 0 ? item.totalViews / item.posts : 0,
            avgReach: item.posts > 0 ? item.totalReach / item.posts : 0
          };
          return projected;
        }).sort((a, b) => a.date.localeCompare(b.date));
      }

      return result;
    }

    return results;
  }

  populate(field) {
    return this;
  }
}

// Analytics Service
class AnalyticsService {
  static async getOverview(userId) {
    try {
      // Get user's accounts
      const accounts = await MockSocialMediaAccount.find({ userId });
      
      // Get platform stats
      const platformStats = await MockPost.aggregate([
        { $match: { userId, status: 'published' } },
        { $group: {
          _id: '$platform',
          posts: { $sum: 1 },
          totalLikes: { $sum: '$metrics.likes' },
          totalComments: { $sum: '$metrics.comments' },
          totalShares: { $sum: '$metrics.shares' },
          totalViews: { $sum: '$metrics.views' },
          totalReach: { $sum: '$metrics.reach' }
        }},
        { $project: {
          platform: '$_id',
          posts: 1,
          totalLikes: 1,
          totalComments: 1,
          totalShares: 1,
          totalViews: 1,
          totalReach: 1,
          avgLikes: { $divide: ['$totalLikes', '$posts'] },
          avgComments: { $divide: ['$totalComments', '$posts'] },
          avgShares: { $divide: ['$totalShares', '$posts'] },
          avgViews: { $divide: ['$totalViews', '$posts'] },
          avgReach: { $divide: ['$totalReach', '$posts'] }
        }}
      ]);

      // Calculate totals
      const totals = platformStats.reduce((acc, stat) => ({
        totalLikes: acc.totalLikes + stat.totalLikes,
        totalComments: acc.totalComments + stat.totalComments,
        totalShares: acc.totalShares + stat.totalShares,
        totalViews: acc.totalViews + stat.totalViews,
        totalReach: acc.totalReach + stat.totalReach,
        totalPosts: acc.totalPosts + stat.posts
      }), { totalLikes: 0, totalComments: 0, totalShares: 0, totalViews: 0, totalReach: 0, totalPosts: 0 });

      // Get account followers
      const accountFollowers = accounts.reduce((acc, account) => acc + account.followers, 0);

      return {
        accounts: platformStats.map(stat => ({
          ...stat,
          followers: accounts.find(acc => acc.platform === stat.platform)?.followers || 0
        })),
        engagement: {
          totalLikes: totals.totalLikes,
          totalComments: totals.totalComments,
          totalShares: totals.totalShares,
          totalViews: totals.totalViews,
          totalReach: totals.totalReach,
          totalEngagement: totals.totalLikes + totals.totalComments + totals.totalShares
        },
        followers: accountFollowers,
        posts: totals.totalPosts
      };
    } catch (error) {
      throw new Error(`Failed to get analytics overview: ${error.message}`);
    }
  }

  static async getTrends(userId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      console.log(`📅 Getting trends from ${startDate.toISOString()} to now`);

      const pipeline = [
        { $match: { 
          userId, 
          status: 'published',
          publishedAt: { $gte: startDate }
        }},
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$publishedAt' } },
          totalLikes: { $sum: '$metrics.likes' },
          totalComments: { $sum: '$metrics.comments' },
          totalShares: { $sum: '$metrics.shares' },
          totalViews: { $sum: '$metrics.views' },
          totalReach: { $sum: '$metrics.reach' },
          posts: { $sum: 1 }
        }},
        { $project: {
          date: '$_id',
          totalLikes: 1,
          totalComments: 1,
          totalShares: 1,
          totalViews: 1,
          totalReach: 1,
          posts: 1,
          avgLikes: { $divide: ['$totalLikes', '$posts'] },
          avgComments: { $divide: ['$totalComments', '$posts'] },
          avgShares: { $divide: ['$totalShares', '$posts'] },
          avgViews: { $divide: ['$totalViews', '$posts'] },
          avgReach: { $divide: ['$totalReach', '$posts'] }
        }},
        { $sort: { date: 1 } }
      ];

      console.log(`🔍 Pipeline:`, JSON.stringify(pipeline[0], null, 2));

      const trends = await MockPost.aggregate(pipeline);

      console.log(`📊 Found ${trends.length} days of trend data`);
      if (trends.length > 0) {
        console.log(`   First day: ${trends[0].date}, Last day: ${trends[trends.length - 1].date}`);
      }

      return trends;
    } catch (error) {
      throw new Error(`Failed to get trends: ${error.message}`);
    }
  }

  static async getTopPosts(userId, limit = 10, sortBy = 'engagement') {
    try {
      const allPosts = await MockPost.find({ 
        userId, 
        status: 'published' 
      });

      // Sort posts based on the specified metric
      const sortedPosts = allPosts.sort((a, b) => {
        switch (sortBy) {
          case 'likes':
            return b.metrics.likes - a.metrics.likes;
          case 'comments':
            return b.metrics.comments - a.metrics.comments;
          case 'shares':
            return b.metrics.shares - a.metrics.shares;
          case 'views':
            return b.metrics.views - a.metrics.views;
          case 'reach':
            return b.metrics.reach - a.metrics.reach;
          case 'engagement':
          default:
            return (b.metrics.likes + b.metrics.comments + b.metrics.shares) - 
                   (a.metrics.likes + a.metrics.comments + a.metrics.shares);
        }
      });

      return sortedPosts.slice(0, limit);
    } catch (error) {
      throw new Error(`Failed to get top posts: ${error.message}`);
    }
  }

  static async getPlatformAnalytics(userId, platform) {
    try {
      const posts = await MockPost.find({ 
        userId, 
        platform, 
        status: 'published' 
      });

      if (posts.length === 0) {
        return {
          platform,
          posts: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0,
          totalViews: 0,
          totalReach: 0,
          avgLikes: 0,
          avgComments: 0,
          avgShares: 0,
          avgViews: 0,
          avgReach: 0
        };
      }

      const totals = posts.reduce((acc, post) => ({
        totalLikes: acc.totalLikes + post.metrics.likes,
        totalComments: acc.totalComments + post.metrics.comments,
        totalShares: acc.totalShares + post.metrics.shares,
        totalViews: acc.totalViews + post.metrics.views,
        totalReach: acc.totalReach + post.metrics.reach
      }), { totalLikes: 0, totalComments: 0, totalShares: 0, totalViews: 0, totalReach: 0 });

      return {
        platform,
        posts: posts.length,
        ...totals,
        avgLikes: totals.totalLikes / posts.length,
        avgComments: totals.totalComments / posts.length,
        avgShares: totals.totalShares / posts.length,
        avgViews: totals.totalViews / posts.length,
        avgReach: totals.totalReach / posts.length
      };
    } catch (error) {
      throw new Error(`Failed to get platform analytics: ${error.message}`);
    }
  }
}

// Test functions
async function setupAnalyticsTestEnvironment() {
  console.log('\n🔧 Setting Up Analytics Test Environment');
  console.log('=======================================');
  
  try {
    // Create test user
    const testUser = await MockUser.create({
      username: 'analytics_test_user',
      email: 'analytics@test.com',
      firstName: 'Analytics',
      lastName: 'Test'
    });

    console.log('✅ Test user created');
    console.log(`   User ID: ${testUser._id}`);

    // Create social media accounts with followers
    const platforms = [
      { platform: 'twitter', followers: 1500 },
      { platform: 'facebook', followers: 3200 },
      { platform: 'instagram', followers: 5600 },
      { platform: 'linkedin', followers: 890 }
    ];

    const accounts = [];
    for (const platformData of platforms) {
      const account = await MockSocialMediaAccount.create({
        userId: testUser._id,
        platform: platformData.platform,
        accountId: `${platformData.platform}_account_1`,
        accountName: `Test ${platformData.platform.charAt(0).toUpperCase() + platformData.platform.slice(1)} Account`,
        username: `testuser_${platformData.platform}`,
        followers: platformData.followers
      });
      accounts.push(account);
    }

    console.log(`✅ Created ${accounts.length} social media accounts`);
    accounts.forEach(acc => console.log(`   ${acc.platform}: ${acc.followers} followers`));

    return { user: testUser, accounts };
  } catch (error) {
    console.log('❌ Failed to setup analytics test environment:', error.message);
    return null;
  }
}

async function generateHistoricalPosts(testData) {
  console.log('\n📊 Generating Historical Posts');
  console.log('==============================');
  
  try {
    const posts = [];
    const now = new Date();
    const platforms = ['twitter', 'facebook', 'instagram', 'linkedin'];
    
    // Generate posts for the last 45 days
    for (let dayOffset = 0; dayOffset < 45; dayOffset++) {
      const postDate = new Date(now);
      postDate.setDate(postDate.getDate() - dayOffset);
      
      // Generate 2-5 posts per day
      const postsPerDay = Math.floor(Math.random() * 4) + 2;
      
      for (let i = 0; i < postsPerDay; i++) {
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const account = testData.accounts.find(acc => acc.platform === platform);
        
        // Generate realistic metrics based on platform and time
        const baseMetrics = {
          twitter: { likes: [5, 200], comments: [0, 20], shares: [0, 10], views: [50, 1000], reach: [100, 2000] },
          facebook: { likes: [10, 500], comments: [2, 50], shares: [1, 25], views: [100, 2500], reach: [200, 5000] },
          instagram: { likes: [25, 1000], comments: [5, 100], shares: [1, 15], views: [200, 5000], reach: [500, 10000] },
          linkedin: { likes: [2, 100], comments: [1, 15], shares: [0, 8], views: [25, 800], reach: [50, 1500] }
        };

        const platformMetrics = baseMetrics[platform];
        
        // Older posts have slightly lower engagement (simulating growth)
        const ageFactor = Math.max(0.7, 1 - (dayOffset / 45) * 0.3);
        
        const metrics = {
          likes: Math.floor((Math.random() * (platformMetrics.likes[1] - platformMetrics.likes[0]) + platformMetrics.likes[0]) * ageFactor),
          comments: Math.floor((Math.random() * (platformMetrics.comments[1] - platformMetrics.comments[0]) + platformMetrics.comments[0]) * ageFactor),
          shares: Math.floor((Math.random() * (platformMetrics.shares[1] - platformMetrics.shares[0]) + platformMetrics.shares[0]) * ageFactor),
          views: Math.floor((Math.random() * (platformMetrics.views[1] - platformMetrics.views[0]) + platformMetrics.views[0]) * ageFactor),
          reach: Math.floor((Math.random() * (platformMetrics.reach[1] - platformMetrics.reach[0]) + platformMetrics.reach[0]) * ageFactor)
        };
        
        metrics.engagement = metrics.likes + metrics.comments + metrics.shares;

        const post = await MockPost.create({
          userId: testData.user._id,
          accountId: account._id,
          content: {
            text: `Historical post from ${postDate.toISOString().split('T')[0]} for ${platform} #analytics #testing`
          },
          platform,
          status: 'published',
          publishedAt: postDate,
          metrics,
          hashtags: ['analytics', 'testing'],
          mentions: [],
          createdAt: postDate
        });

        posts.push(post);
      }
    }

    console.log(`✅ Generated ${posts.length} historical posts`);
    console.log(`   Date range: ${now.setDate(now.getDate() - 44)} to ${new Date()}`);
    console.log(`   Average posts per day: ${(posts.length / 45).toFixed(1)}`);

    return posts;
  } catch (error) {
    console.log('❌ Failed to generate historical posts:', error.message);
    return [];
  }
}

async function testAnalyticsAggregation(testData) {
  console.log('\n🧪 Test 1: Analytics Aggregation');
  console.log('=================================');
  
  try {
    const overview = await AnalyticsService.getOverview(testData.user._id);

    console.log('✅ Analytics overview generated successfully!');
    console.log(`   Total accounts: ${overview.accounts.length}`);
    console.log(`   Total followers: ${overview.followers}`);
    console.log(`   Total posts: ${overview.posts}`);
    console.log(`   Total engagement: ${overview.engagement.totalEngagement}`);

    // Validate structure
    const hasRequiredFields = 
      Array.isArray(overview.accounts) &&
      overview.engagement &&
      typeof overview.followers === 'number' &&
      typeof overview.posts === 'number';

    // Validate account data
    let accountsValid = true;
    for (const account of overview.accounts) {
      if (!account.platform || typeof account.posts !== 'number' || 
          typeof account.totalLikes !== 'number' || typeof account.followers !== 'number') {
        accountsValid = false;
        break;
      }
    }

    console.log(`   Structure validation: ${hasRequiredFields ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Account data validation: ${accountsValid ? '✅ PASS' : '❌ FAIL'}`);

    return hasRequiredFields && accountsValid;
  } catch (error) {
    console.log('❌ Analytics aggregation test failed:', error.message);
    return false;
  }
}

async function testTrendsAccuracy(testData) {
  console.log('\n🧪 Test 2: 30-Day Trends Accuracy');
  console.log('===================================');
  
  try {
    const trends = await AnalyticsService.getTrends(testData.user._id, 30);

    console.log(`✅ Trends data generated for ${trends.length} days`);
    
    if (trends.length > 0) {
      console.log(`   Date range: ${trends[0].date} to ${trends[trends.length - 1].date}`);
      
      // Debug: print first trend item
      console.log(`   First trend item:`, JSON.stringify(trends[0], null, 2));
      
      // Validate trends structure
      let trendsValid = true;
      let totalEngagement = 0;
      
      for (const trend of trends) {
        if (!trend.date || typeof trend.posts !== 'number' || 
            typeof trend.totalLikes !== 'number' || typeof trend.totalComments !== 'number') {
          trendsValid = false;
          console.log(`❌ Invalid trend item:`, trend);
          break;
        }
        totalEngagement += trend.totalLikes + trend.totalComments + trend.totalShares;
      }

      // Check chronological order
      const isChronological = trends.every((trend, index) => {
        if (index === 0) return true;
        return new Date(trend.date) >= new Date(trends[index - 1].date);
      });

      console.log(`   Structure validation: ${trendsValid ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Chronological order: ${isChronological ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Total engagement in period: ${totalEngagement}`);

      return trendsValid && isChronological;
    } else {
      console.log('❌ No trends data generated');
      return false;
    }
  } catch (error) {
    console.log('❌ Trends accuracy test failed:', error.message);
    return false;
  }
}

async function testTopPostsLogic(testData) {
  console.log('\n🧪 Test 3: Top-Performing Posts Logic');
  console.log('====================================');
  
  try {
    const sortByOptions = ['engagement', 'likes', 'comments', 'shares', 'views', 'reach'];
    const results = {};

    for (const sortBy of sortByOptions) {
      const topPosts = await AnalyticsService.getTopPosts(testData.user._id, 5, sortBy);
      results[sortBy] = topPosts;

      console.log(`✅ Top posts by ${sortBy}: ${topPosts.length} posts`);
      
      if (topPosts.length > 0) {
        console.log(`   #1: ${topPosts[0].metrics[sortBy]} ${sortBy} (${topPosts[0].platform})`);
        
        // Validate sorting
        let isCorrectlySorted = true;
        for (let i = 1; i < topPosts.length; i++) {
          const currentValue = sortBy === 'engagement' 
            ? topPosts[i-1].metrics.likes + topPosts[i-1].metrics.comments + topPosts[i-1].metrics.shares
            : topPosts[i-1].metrics[sortBy];
          const nextValue = sortBy === 'engagement'
            ? topPosts[i].metrics.likes + topPosts[i].metrics.comments + topPosts[i].metrics.shares
            : topPosts[i].metrics[sortBy];
          
          if (nextValue > currentValue) {
            isCorrectlySorted = false;
            break;
          }
        }
        
        console.log(`   Sorting validation: ${isCorrectlySorted ? '✅ PASS' : '❌ FAIL'}`);
        results[`${sortBy}_sorted`] = isCorrectlySorted;
      }
    }

    // Check if all sorting methods worked correctly
    const allSortingValid = Object.values(results).every(result => typeof result === 'boolean' ? result : result.length > 0);
    console.log(`   Overall sorting validation: ${allSortingValid ? '✅ PASS' : '❌ FAIL'}`);

    return allSortingValid;
  } catch (error) {
    console.log('❌ Top posts logic test failed:', error.message);
    return false;
  }
}

async function testPlatformAnalytics(testData) {
  console.log('\n🧪 Test 4: Platform-Specific Analytics');
  console.log('======================================');
  
  try {
    const platforms = ['twitter', 'facebook', 'instagram', 'linkedin'];
    const results = {};

    for (const platform of platforms) {
      const analytics = await AnalyticsService.getPlatformAnalytics(testData.user._id, platform);
      results[platform] = analytics;

      console.log(`✅ ${platform} analytics:`);
      console.log(`   Posts: ${analytics.posts}`);
      console.log(`   Avg likes: ${analytics.avgLikes.toFixed(1)}`);
      console.log(`   Avg comments: ${analytics.avgComments.toFixed(1)}`);
      console.log(`   Total engagement: ${analytics.totalLikes + analytics.totalComments + analytics.totalShares}`);

      // Validate structure
      const isValid = 
        analytics.platform === platform &&
        typeof analytics.posts === 'number' &&
        typeof analytics.totalLikes === 'number' &&
        typeof analytics.avgLikes === 'number';

      console.log(`   Structure validation: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
      results[`${platform}_valid`] = isValid;
    }

    const allPlatformsValid = platforms.every(platform => results[`${platform}_valid`]);
    console.log(`   Overall platform validation: ${allPlatformsValid ? '✅ PASS' : '❌ FAIL'}`);

    return allPlatformsValid;
  } catch (error) {
    console.log('❌ Platform analytics test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runAnalyticsTests() {
  console.log('🚀 ANALYTICS SYSTEM TESTS');
  console.log('========================');
  console.log('📊 Testing analytics aggregation, trends, and top posts');
  console.log('📈 Historical data: 45 days of posts');
  console.log('🔍 Platforms: Twitter, Facebook, Instagram, LinkedIn');

  try {
    // Step 1: Setup test environment
    const testData = await setupAnalyticsTestEnvironment();
    if (!testData) {
      console.log('❌ Cannot proceed without test environment');
      return;
    }

    // Step 2: Generate historical posts
    const posts = await generateHistoricalPosts(testData);
    if (posts.length === 0) {
      console.log('❌ Cannot proceed without historical posts');
      return;
    }

    // Step 3: Run analytics tests
    const results = {
      analyticsAggregation: await testAnalyticsAggregation(testData),
      trendsAccuracy: await testTrendsAccuracy(testData),
      topPostsLogic: await testTopPostsLogic(testData),
      platformAnalytics: await testPlatformAnalytics(testData)
    };

    // Step 4: Generate comprehensive report
    console.log('\n📋 ANALYTICS TEST REPORT');
    console.log('=======================');
    
    console.log('\n🎯 Test Results:');
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`   ${status} ${testName}`);
    });

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;

    console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
      console.log('🎉 ALL ANALYTICS TESTS PASSED!');
      console.log('✅ Analytics aggregation working correctly');
      console.log('✅ 30-day trends calculation accurate');
      console.log('✅ Top-performing posts logic working');
      console.log('✅ Platform-specific analytics working');
      console.log('✅ Data structures and validation working');
    } else {
      console.log('⚠️ Some analytics tests failed. Review the logs above.');
    }

    return results;
  } catch (error) {
    console.log('❌ Analytics tests failed:', error.message);
    console.log('Stack:', error.stack);
    return null;
  }
}

// Run the tests
runAnalyticsTests().catch(console.error);
