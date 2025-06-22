const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');

// User schema for MongoDB
const userSchema = new mongoose.Schema(
  {
    // Telegram user info
    telegramId: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },
    username: {
      type: String,
      trim: true,
      maxlength: 50
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    languageCode: {
      type: String,
      default: 'en',
      maxlength: 10
    },

    // User profile
    profile: {
      skills: [
        {
          type: String,
          trim: true,
          maxlength: 50
        }
      ],
      experience: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        default: 'intermediate'
      },
      hourlyRate: {
        min: { type: Number, min: 0 },
        max: { type: Number, min: 0 }
      },
      bio: {
        type: String,
        maxlength: 500,
        trim: true
      },
      portfolio: {
        type: String,
        trim: true,
        maxlength: 200
      },
      timezone: {
        type: String,
        default: 'UTC',
        maxlength: 50
      },
      availability: {
        type: String,
        enum: ['full-time', 'part-time', 'project-based'],
        default: 'project-based'
      }
    },

    // Search preferences
    searchSettings: {
      autoSearch: {
        type: Boolean,
        default: false
      },
      keywords: [
        {
          type: String,
          trim: true,
          maxlength: 50
        }
      ],
      platforms: [
        {
          type: String,
          enum: ['upwork', 'freelancer', 'fiverr', 'guru', 'peopleperhour'],
          default: ['upwork', 'freelancer']
        }
      ],
      budgetRange: {
        min: { type: Number, min: 0, default: 0 },
        max: { type: Number, min: 0 }
      },
      projectTypes: [
        {
          type: String,
          enum: ['fixed', 'hourly', 'both'],
          default: 'both'
        }
      ],
      excludeKeywords: [
        {
          type: String,
          trim: true,
          maxlength: 50
        }
      ],
      searchFrequency: {
        type: String,
        enum: ['hourly', 'daily', 'weekly'],
        default: 'daily'
      },
      maxResults: {
        type: Number,
        min: 10,
        max: 100,
        default: 50
      }
    },

    // AI settings
    aiSettings: {
      autoGenerate: {
        type: Boolean,
        default: false
      },
      proposalTone: {
        type: String,
        enum: ['professional', 'friendly', 'confident', 'creative'],
        default: 'professional'
      },
      proposalLength: {
        type: String,
        enum: ['short', 'medium', 'long'],
        default: 'medium'
      },
      includePortfolio: {
        type: Boolean,
        default: true
      },
      includeExperience: {
        type: Boolean,
        default: true
      },
      customPrompt: {
        type: String,
        maxlength: 1000,
        trim: true
      },
      maxProposalsPerDay: {
        type: Number,
        min: 1,
        max: 50,
        default: 10
      }
    },

    // Notification settings
    notifications: {
      newProjects: {
        type: Boolean,
        default: true
      },
      dailyReports: {
        type: Boolean,
        default: true
      },
      weeklyReports: {
        type: Boolean,
        default: true
      },
      highValueProjects: {
        type: Boolean,
        default: true
      },
      proposalGenerated: {
        type: Boolean,
        default: true
      },
      systemAlerts: {
        type: Boolean,
        default: true
      },
      quietHours: {
        enabled: { type: Boolean, default: false },
        start: { type: String, default: '22:00' },
        end: { type: String, default: '08:00' }
      }
    },

    // API credentials (encrypted)
    apiCredentials: {
      upwork: {
        clientId: { type: String, select: false },
        clientSecret: { type: String, select: false },
        accessToken: { type: String, select: false },
        refreshToken: { type: String, select: false }
      },
      freelancer: {
        clientId: { type: String, select: false },
        clientSecret: { type: String, select: false },
        accessToken: { type: String, select: false }
      },
      fiverr: {
        apiKey: { type: String, select: false }
      }
    },

    // Usage statistics
    stats: {
      totalSearches: { type: Number, default: 0 },
      totalProjects: { type: Number, default: 0 },
      totalProposals: { type: Number, default: 0 },
      proposalsSent: { type: Number, default: 0 },
      projectsWon: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
      averageResponseTime: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 },
      lastSearchDate: { type: Date },
      lastProposalDate: { type: Date },
      joinDate: { type: Date, default: Date.now }
    },

    // Subscription info
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'basic', 'premium', 'enterprise'],
        default: 'free'
      },
      startDate: { type: Date },
      endDate: { type: Date },
      autoRenew: { type: Boolean, default: false },
      paymentMethod: { type: String },
      limits: {
        searchesPerDay: { type: Number, default: 10 },
        proposalsPerDay: { type: Number, default: 5 },
        platformsAccess: { type: Number, default: 2 }
      }
    },

    // Security settings
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      lastLoginDate: { type: Date },
      lastLoginIP: { type: String },
      loginAttempts: { type: Number, default: 0 },
      lockedUntil: { type: Date },
      passwordHash: { type: String, select: false },
      securityQuestions: [
        {
          question: String,
          answer: { type: String, select: false }
        }
      ]
    },

    // Bot state
    botState: {
      currentScene: { type: String },
      sessionData: { type: mongoose.Schema.Types.Mixed },
      lastActivity: { type: Date, default: Date.now },
      isActive: { type: Boolean, default: true },
      isBanned: { type: Boolean, default: false },
      banReason: { type: String },
      banDate: { type: Date }
    },

    // Preferences
    preferences: {
      language: { type: String, default: 'en' },
      currency: { type: String, default: 'USD' },
      dateFormat: { type: String, default: 'MM/DD/YYYY' },
      timeFormat: { type: String, default: '12h' },
      theme: { type: String, enum: ['light', 'dark'], default: 'light' }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better performance
userSchema.index({ telegramId: 1 });
userSchema.index({ 'botState.lastActivity': 1 });
userSchema.index({ 'subscription.plan': 1 });
userSchema.index({ 'botState.isActive': 1 });
userSchema.index({ createdAt: 1 });

// Virtual fields
userSchema.virtual('fullName').get(function () {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

userSchema.virtual('isSubscribed').get(function () {
  return (
    this.subscription.plan !== 'free' &&
    this.subscription.endDate &&
    this.subscription.endDate > new Date()
  );
});

userSchema.virtual('daysUntilExpiry').get(function () {
  if (!this.subscription.endDate) return null;
  const diff = this.subscription.endDate - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Pre-save middleware
userSchema.pre('save', async function (next) {
  try {
    // Update last activity
    this.botState.lastActivity = new Date();

    // Hash password if modified
    if (this.isModified('security.passwordHash') && this.security.passwordHash) {
      const salt = await bcrypt.genSalt(12);
      this.security.passwordHash = await bcrypt.hash(this.security.passwordHash, salt);
    }

    // Validate subscription dates
    if (this.subscription.endDate && this.subscription.startDate) {
      if (this.subscription.endDate <= this.subscription.startDate) {
        throw new Error('Subscription end date must be after start date');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.comparePassword = async function (password) {
  if (!this.security.passwordHash) return false;
  return bcrypt.compare(password, this.security.passwordHash);
};

userSchema.methods.updateLastActivity = function () {
  this.botState.lastActivity = new Date();
  return this.save();
};

userSchema.methods.incrementSearchCount = function () {
  this.stats.totalSearches += 1;
  this.stats.lastSearchDate = new Date();
  return this.save();
};

userSchema.methods.incrementProposalCount = function () {
  this.stats.totalProposals += 1;
  this.stats.lastProposalDate = new Date();
  return this.save();
};

userSchema.methods.canPerformSearch = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check daily limits based on subscription
  const dailyLimit = this.subscription.limits.searchesPerDay;

  // Count searches today (this would need to be implemented with a separate tracking mechanism)
  // For now, return true
  return true;
};

userSchema.methods.canGenerateProposal = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check daily limits based on subscription
  const dailyLimit = this.subscription.limits.proposalsPerDay;

  // Count proposals today (this would need to be implemented with a separate tracking mechanism)
  // For now, return true
  return true;
};

userSchema.methods.isInQuietHours = function () {
  if (!this.notifications.quietHours.enabled) return false;

  const now = new Date();
  const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

  const start = this.notifications.quietHours.start;
  const end = this.notifications.quietHours.end;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  }

  return currentTime >= start && currentTime <= end;
};

userSchema.methods.getSubscriptionStatus = function () {
  const now = new Date();

  if (this.subscription.plan === 'free') {
    return { status: 'free', daysLeft: null };
  }

  if (!this.subscription.endDate) {
    return { status: 'invalid', daysLeft: null };
  }

  if (this.subscription.endDate <= now) {
    return { status: 'expired', daysLeft: 0 };
  }

  const daysLeft = Math.ceil((this.subscription.endDate - now) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 7) {
    return { status: 'expiring', daysLeft };
  }

  return { status: 'active', daysLeft };
};

userSchema.methods.updateStats = function (type, value = 1) {
  switch (type) {
    case 'search':
      this.stats.totalSearches += value;
      this.stats.lastSearchDate = new Date();
      break;
    case 'project':
      this.stats.totalProjects += value;
      break;
    case 'proposal':
      this.stats.totalProposals += value;
      this.stats.lastProposalDate = new Date();
      break;
    case 'sent':
      this.stats.proposalsSent += value;
      break;
    case 'won':
      this.stats.projectsWon += value;
      break;
    case 'earnings':
      this.stats.totalEarnings += value;
      break;
  }

  // Calculate success rate
  if (this.stats.proposalsSent > 0) {
    this.stats.successRate = (this.stats.projectsWon / this.stats.proposalsSent) * 100;
  }

  return this.save();
};

userSchema.methods.resetDailyLimits = function () {
  // This would reset daily counters
  // Implementation depends on how you track daily usage
  return this.save();
};

userSchema.methods.exportData = function () {
  const userData = this.toObject();

  // Remove sensitive data
  delete userData.apiCredentials;
  delete userData.security.passwordHash;
  delete userData.security.securityQuestions;

  return userData;
};

// Static methods
userSchema.statics.findByTelegramId = function (telegramId) {
  return this.findOne({ telegramId });
};

userSchema.statics.findActiveUsers = function () {
  return this.find({
    'botState.isActive': true,
    'botState.isBanned': false
  });
};

userSchema.statics.findSubscribedUsers = function () {
  return this.find({
    'subscription.plan': { $ne: 'free' },
    'subscription.endDate': { $gt: new Date() },
    'botState.isActive': true
  });
};

userSchema.statics.findUsersWithAutoSearch = function () {
  return this.find({
    'searchSettings.autoSearch': true,
    'botState.isActive': true,
    'botState.isBanned': false
  });
};

userSchema.statics.findUsersForNotification = function (notificationType) {
  const query = {
    'botState.isActive': true,
    'botState.isBanned': false
  };

  query[`notifications.${notificationType}`] = true;

  return this.find(query);
};

userSchema.statics.getStatistics = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: {
          $sum: {
            $cond: [{ $eq: ['$botState.isActive', true] }, 1, 0]
          }
        },
        subscribedUsers: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$subscription.plan', 'free'] },
                  { $gt: ['$subscription.endDate', new Date()] }
                ]
              },
              1,
              0
            ]
          }
        },
        totalSearches: { $sum: '$stats.totalSearches' },
        totalProposals: { $sum: '$stats.totalProposals' },
        totalEarnings: { $sum: '$stats.totalEarnings' }
      }
    }
  ]);

  return (
    stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      subscribedUsers: 0,
      totalSearches: 0,
      totalProposals: 0,
      totalEarnings: 0
    }
  );
};

// Error handling
userSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('User with this Telegram ID already exists'));
  } else {
    next(error);
  }
});

// Logging
userSchema.post('save', function (doc) {
  logger.userAction(doc.telegramId, 'user_updated', {
    userId: doc._id,
    lastActivity: doc.botState.lastActivity
  });
});

userSchema.post('remove', function (doc) {
  logger.userAction(doc.telegramId, 'user_deleted', {
    userId: doc._id
  });
});

module.exports = mongoose.model('User', userSchema);
