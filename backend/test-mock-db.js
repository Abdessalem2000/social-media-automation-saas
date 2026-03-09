/**
 * Mock Database for Testing
 * In-memory database simulation for testing without MongoDB
 */

const users = new Map();
const posts = new Map();
const refreshTokens = new Map();
const socialMediaAccounts = new Map();

let userIdCounter = 1;
let postIdCounter = 1;
let accountIdCounter = 1;
let refreshTokenCounter = 1;

// Mock User Model
class MockUser {
  constructor(data) {
    this._id = `user_${userIdCounter++}`;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password; // Should be hashed
    this.firstName = data.firstName;
    this.lastName = data.lastName;
    this.role = data.role || 'user';
    this.emailVerified = false;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.lastLogin = null;
    this.preferences = {
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    };
  }

  static async findOne(query) {
    if (query._id) {
      return users.get(query._id);
    }
    if (query.email) {
      for (const user of users.values()) {
        if (user.email === query.email) return user;
      }
    }
    if (query.username) {
      for (const user of users.values()) {
        if (user.username === query.username) return user;
      }
    }
    return null;
  }

  static async findById(id) {
    return users.get(id);
  }

  static async create(data) {
    const user = new MockUser(data);
    users.set(user._id, user);
    return user;
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    const user = users.get(id);
    if (user) {
      Object.assign(user, update, { updatedAt: new Date() });
      return options.new ? user : users.get(id);
    }
    return null;
  }

  static async findByIdAndDelete(id) {
    const user = users.get(id);
    if (user) {
      users.delete(id);
      return user;
    }
    return null;
  }

  async save() {
    users.set(this._id, this);
    return this;
  }

  select(fields) {
    if (fields === '-password') {
      const { password, ...user } = this;
      return user;
    }
    return this;
  }
}

// Mock Post Model
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
    
    // Sort
    if (query.sort) {
      const sortField = Object.keys(query.sort)[0];
      const sortOrder = query.sort[sortField] === 1 ? 1 : -1;
      results.sort((a, b) => {
        if (sortOrder === 1) {
          return a[sortField] > b[sortField] ? 1 : -1;
        } else {
          return a[sortField] < b[sortField] ? 1 : -1;
        }
      });
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

  static async findByIdAndDelete(id) {
    const post = posts.get(id);
    if (post) {
      posts.delete(id);
      return post;
    }
    return null;
  }

  populate(field) {
    // Mock population - return self for now
    return this;
  }

  limit(count) {
    return this.slice(0, count);
  }
}

// Mock RefreshToken Model
class MockRefreshToken {
  constructor(data) {
    this._id = `refresh_${refreshTokenCounter++}`;
    this.userId = data.userId;
    this.token = data.token;
    this.expiresAt = data.expiresAt;
    this.isRevoked = false;
    this.deviceInfo = data.deviceInfo || {};
    this.createdAt = new Date();
  }

  static async create(data) {
    const token = new MockRefreshToken(data);
    refreshTokens.set(token._id, token);
    return token;
  }

  static async findOne(query) {
    for (const token of refreshTokens.values()) {
      if (query.token && token.token === query.token) return token;
      if (query.userId && token.userId === query.userId) return token;
    }
    return null;
  }

  static async deleteMany(query) {
    let deletedCount = 0;
    for (const [id, token] of refreshTokens.entries()) {
      if (query.userId && token.userId === query.userId) {
        refreshTokens.delete(id);
        deletedCount++;
      }
    }
    return { deletedCount };
  }
}

// Mock SocialMediaAccount Model
class MockSocialMediaAccount {
  constructor(data) {
    this._id = `account_${accountIdCounter++}`;
    this.userId = data.userId;
    this.platform = data.platform;
    this.accountId = data.accountId;
    this.accountName = data.accountName;
    this.username = data.username;
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;
    this.isActive = data.isActive !== false;
    this.followers = data.followers || 0;
    this.following = data.following || 0;
    this.posts = data.posts || 0;
    this.profileImage = data.profileImage;
    this.bio = data.bio;
    this.lastSync = data.lastSync;
    this.syncStatus = data.syncStatus || 'connected';
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  static async find(query = {}) {
    const results = [];
    for (const account of socialMediaAccounts.values()) {
      let match = true;
      
      if (query.userId && account.userId !== query.userId) match = false;
      if (query.isActive !== undefined && account.isActive !== query.isActive) match = false;
      
      if (match) results.push(account);
    }
    
    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  static async findOne(query) {
    for (const account of socialMediaAccounts.values()) {
      if (query._id && account._id === query._id) return account;
      if (query.userId && query.accountId && 
          account.userId === query.userId && account.accountId === query.accountId) return account;
    }
    return null;
  }

  static async create(data) {
    const account = new MockSocialMediaAccount(data);
    socialMediaAccounts.set(account._id, account);
    return account;
  }

  static async findOneAndUpdate(query, update, options = {}) {
    const account = await MockSocialMediaAccount.findOne(query);
    if (account) {
      Object.assign(account, update, { updatedAt: new Date() });
      return options.new ? account : account;
    }
    return null;
  }
}

// Mock aggregation for analytics
MockPost.aggregate = async(pipeline) => {
  const results = [];
  
  // Simple mock aggregation for analytics
  if (pipeline[0].$match) {
    const match = pipeline[0].$match;
    for (const post of posts.values()) {
      let include = true;
      
      if (match.userId && post.userId !== match.userId) include = false;
      if (match.publishedAt && match.publishedAt.$gte && post.publishedAt < match.publishedAt.$gte) include = false;
      if (match.platform && post.platform !== match.platform) include = false;
      if (match.status && post.status !== match.status) include = false;
      
      if (include) {
        if (pipeline[1] && pipeline[1].$group) {
          const group = pipeline[1].$group;
          const result = { _id: group._id };
          
          if (group.$sum && group.$sum === 1) result.totalPosts = 1;
          if (group.$sum && group.$sum === '$metrics.likes') result.totalLikes = post.metrics.likes;
          if (group.$sum && group.$sum === '$metrics.comments') result.totalComments = post.metrics.comments;
          if (group.$sum && group.$sum === '$metrics.shares') result.totalShares = post.metrics.shares;
          if (group.$sum && group.$sum === '$metrics.views') result.totalViews = post.metrics.views;
          if (group.$sum && group.$sum === '$metrics.reach') result.totalReach = post.metrics.reach;
          
          results.push(result);
        }
      }
    }
  }
  
  return results;
};

module.exports = {
  User: MockUser,
  Post: MockPost,
  RefreshToken: MockRefreshToken,
  SocialMediaAccount: MockSocialMediaAccount
};
