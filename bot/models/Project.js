const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Project schema for storing found projects
const projectSchema = new mongoose.Schema(
  {
    // External project info
    externalId: {
      type: String,
      required: true,
      index: true
    },
    platform: {
      type: String,
      required: true,
      enum: ['upwork', 'freelancer', 'fiverr', 'guru', 'peopleperhour'],
      index: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },

    // Project details
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    },
    category: {
      type: String,
      trim: true,
      maxlength: 100
    },
    subcategory: {
      type: String,
      trim: true,
      maxlength: 100
    },

    // Budget information
    budget: {
      type: {
        type: String,
        enum: ['fixed', 'hourly', 'not_specified'],
        default: 'not_specified'
      },
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: 'USD', maxlength: 3 },
      hourlyRate: {
        min: { type: Number, min: 0 },
        max: { type: Number, min: 0 }
      }
    },

    // Project requirements
    skills: [
      {
        type: String,
        trim: true,
        maxlength: 50
      }
    ],
    experience: {
      type: String,
      enum: ['entry', 'intermediate', 'expert', 'any'],
      default: 'any'
    },
    duration: {
      type: String,
      enum: [
        'less_than_1_month',
        '1_to_3_months',
        '3_to_6_months',
        'more_than_6_months',
        'ongoing'
      ],
      default: 'not_specified'
    },
    workload: {
      type: String,
      enum: ['less_than_30hrs', '30_to_50hrs', 'more_than_50hrs', 'not_specified'],
      default: 'not_specified'
    },

    // Client information
    client: {
      name: { type: String, trim: true, maxlength: 100 },
      rating: { type: Number, min: 0, max: 5 },
      reviewsCount: { type: Number, min: 0, default: 0 },
      totalSpent: { type: Number, min: 0, default: 0 },
      hireRate: { type: Number, min: 0, max: 100 },
      location: { type: String, trim: true, maxlength: 100 },
      memberSince: { type: Date },
      verified: { type: Boolean, default: false },
      paymentVerified: { type: Boolean, default: false }
    },

    // Project status
    status: {
      type: String,
      enum: ['open', 'in_progress', 'completed', 'cancelled', 'closed'],
      default: 'open',
      index: true
    },
    postedDate: {
      type: Date,
      required: true,
      index: true
    },
    deadline: {
      type: Date
    },

    // Competition info
    proposals: {
      count: { type: Number, min: 0, default: 0 },
      range: { type: String }, // e.g., "5 to 10", "20+"
      interviewing: { type: Number, min: 0, default: 0 }
    },

    // Quality scores
    scores: {
      relevance: { type: Number, min: 0, max: 100, default: 0 },
      quality: { type: Number, min: 0, max: 100, default: 0 },
      competition: { type: Number, min: 0, max: 100, default: 0 },
      client: { type: Number, min: 0, max: 100, default: 0 },
      overall: { type: Number, min: 0, max: 100, default: 0 }
    },

    // Search metadata
    searchMetadata: {
      keywords: [String],
      searchQuery: String,
      foundBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      firstFoundDate: { type: Date, default: Date.now },
      lastSeenDate: { type: Date, default: Date.now },
      viewCount: { type: Number, default: 0 }
    },

    // Flags and tags
    flags: {
      isHighValue: { type: Boolean, default: false },
      isUrgent: { type: Boolean, default: false },
      isScam: { type: Boolean, default: false },
      isVerified: { type: Boolean, default: false },
      hasNDA: { type: Boolean, default: false },
      requiresInterview: { type: Boolean, default: false }
    },

    // Additional metadata
    metadata: {
      attachments: [
        {
          name: String,
          url: String,
          type: String
        }
      ],
      questions: [String],
      requirements: [String],
      preferredQualifications: [String],
      timezone: String,
      communicationPreference: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Proposal schema for storing generated proposals
const proposalSchema = new mongoose.Schema(
  {
    // References
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },

    // Proposal content
    content: {
      type: String,
      required: true,
      maxlength: 5000
    },
    subject: {
      type: String,
      maxlength: 200,
      trim: true
    },

    // Proposal details
    bidAmount: {
      type: Number,
      min: 0
    },
    timeline: {
      type: String,
      maxlength: 200
    },
    milestones: [
      {
        description: String,
        amount: Number,
        deadline: Date
      }
    ],

    // Generation info
    generationMethod: {
      type: String,
      enum: ['ai', 'template', 'manual', 'mixed'],
      required: true
    },
    templateUsed: {
      type: String,
      maxlength: 100
    },
    aiModel: {
      type: String,
      maxlength: 50
    },
    generationTime: {
      type: Number, // milliseconds
      min: 0
    },

    // Quality metrics
    quality: {
      score: { type: Number, min: 0, max: 100 },
      readability: { type: Number, min: 0, max: 100 },
      relevance: { type: Number, min: 0, max: 100 },
      personalization: { type: Number, min: 0, max: 100 },
      wordCount: { type: Number, min: 0 }
    },

    // Status and tracking
    status: {
      type: String,
      enum: ['draft', 'ready', 'sent', 'viewed', 'responded', 'accepted', 'rejected'],
      default: 'draft',
      index: true
    },
    sentDate: {
      type: Date
    },
    responseDate: {
      type: Date
    },

    // Response tracking
    response: {
      received: { type: Boolean, default: false },
      type: {
        type: String,
        enum: ['interview', 'hire', 'reject', 'question', 'other']
      },
      content: String,
      rating: { type: Number, min: 1, max: 5 }
    },

    // Customization
    customizations: {
      tone: {
        type: String,
        enum: ['professional', 'friendly', 'confident', 'creative'],
        default: 'professional'
      },
      length: {
        type: String,
        enum: ['short', 'medium', 'long'],
        default: 'medium'
      },
      includePortfolio: { type: Boolean, default: true },
      includeExperience: { type: Boolean, default: true },
      customPrompt: String
    },

    // Analytics
    analytics: {
      viewCount: { type: Number, default: 0 },
      editCount: { type: Number, default: 0 },
      copyCount: { type: Number, default: 0 },
      shareCount: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better performance
projectSchema.index({ platform: 1, externalId: 1 }, { unique: true });
projectSchema.index({ postedDate: -1 });
projectSchema.index({ status: 1, postedDate: -1 });
projectSchema.index({ 'budget.min': 1, 'budget.max': 1 });
projectSchema.index({ skills: 1 });
projectSchema.index({ 'scores.overall': -1 });
projectSchema.index({ 'flags.isHighValue': 1 });
projectSchema.index({ 'searchMetadata.keywords': 1 });

proposalSchema.index({ userId: 1, createdAt: -1 });
proposalSchema.index({ projectId: 1 });
proposalSchema.index({ status: 1, createdAt: -1 });
proposalSchema.index({ generationMethod: 1 });
proposalSchema.index({ 'quality.score': -1 });

// Virtual fields for Project
projectSchema.virtual('ageInDays').get(function () {
  return Math.floor((new Date() - this.postedDate) / (1000 * 60 * 60 * 24));
});

projectSchema.virtual('isRecent').get(function () {
  return this.ageInDays <= 7;
});

projectSchema.virtual('competitionLevel').get(function () {
  const count = this.proposals.count;
  if (count <= 5) return 'low';
  if (count <= 15) return 'medium';
  if (count <= 30) return 'high';
  return 'very_high';
});

projectSchema.virtual('budgetRange').get(function () {
  if (!this.budget.min && !this.budget.max) return 'Not specified';
  if (this.budget.type === 'hourly') {
    return `$${this.budget.hourlyRate?.min || 0}-${this.budget.hourlyRate?.max || 0}/hr`;
  }
  return `$${this.budget.min || 0}-${this.budget.max || 'Open'}`;
});

// Virtual fields for Proposal
proposalSchema.virtual('ageInHours').get(function () {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60));
});

proposalSchema.virtual('responseTime').get(function () {
  if (!this.sentDate || !this.responseDate) return null;
  return Math.floor((this.responseDate - this.sentDate) / (1000 * 60 * 60)); // hours
});

// Instance methods for Project
projectSchema.methods.calculateScores = function (userProfile) {
  // Calculate relevance score based on skills match
  const userSkills = userProfile.skills || [];
  const projectSkills = this.skills || [];

  let relevanceScore = 0;
  if (projectSkills.length > 0) {
    const matchingSkills = userSkills.filter(skill =>
      projectSkills.some(
        pSkill =>
          pSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(pSkill.toLowerCase())
      )
    );
    relevanceScore = (matchingSkills.length / projectSkills.length) * 100;
  }

  // Calculate quality score based on client info
  let qualityScore = 50; // base score
  if (this.client.verified) qualityScore += 20;
  if (this.client.paymentVerified) qualityScore += 15;
  if (this.client.rating >= 4) qualityScore += 10;
  if (this.client.totalSpent > 1000) qualityScore += 5;

  // Calculate competition score (inverse of proposal count)
  let competitionScore = 100;
  if (this.proposals.count > 0) {
    competitionScore = Math.max(0, 100 - this.proposals.count * 2);
  }

  // Calculate client score
  let clientScore = 0;
  if (this.client.rating) clientScore += this.client.rating * 15;
  if (this.client.hireRate) clientScore += this.client.hireRate * 0.5;
  if (this.client.totalSpent > 5000) clientScore += 10;

  // Calculate overall score
  const overallScore =
    relevanceScore * 0.4 + qualityScore * 0.25 + competitionScore * 0.2 + clientScore * 0.15;

  this.scores = {
    relevance: Math.round(relevanceScore),
    quality: Math.round(qualityScore),
    competition: Math.round(competitionScore),
    client: Math.round(clientScore),
    overall: Math.round(overallScore)
  };

  return this.scores;
};

projectSchema.methods.updateFlags = function () {
  // High value project
  this.flags.isHighValue =
    (this.budget.max && this.budget.max >= 5000) ||
    (this.budget.min && this.budget.min >= 2000) ||
    (this.budget.hourlyRate?.max && this.budget.hourlyRate.max >= 50);

  // Urgent project
  this.flags.isUrgent = this.deadline && this.deadline - new Date() < 7 * 24 * 60 * 60 * 1000; // 7 days

  // Potential scam indicators
  this.flags.isScam =
    !this.client.verified ||
    !this.client.paymentVerified ||
    (this.budget.max && this.budget.max > 50000) ||
    this.description.toLowerCase().includes('advance payment');

  return this;
};

projectSchema.methods.addView = function (userId) {
  this.searchMetadata.viewCount += 1;
  this.searchMetadata.lastSeenDate = new Date();

  if (userId && !this.searchMetadata.foundBy.includes(userId)) {
    this.searchMetadata.foundBy.push(userId);
  }

  return this.save();
};

// Instance methods for Proposal
proposalSchema.methods.calculateQuality = function () {
  const content = this.content || '';
  const wordCount = content.split(/\s+/).length;

  // Basic quality metrics
  let readabilityScore = 50;
  if (wordCount >= 100 && wordCount <= 300) readabilityScore += 30;
  if (content.includes('Dear') || content.includes('Hi')) readabilityScore += 10;
  if (content.includes('Thank you') || content.includes('Best regards')) readabilityScore += 10;

  // Relevance score (basic keyword matching)
  const relevanceScore = 50;
  // This would be enhanced with actual project keywords

  // Personalization score
  let personalizationScore = 30;
  if (content.includes('your project')) personalizationScore += 20;
  if (content.includes('requirements')) personalizationScore += 15;
  if (content.includes('experience')) personalizationScore += 15;
  if (content.includes('portfolio')) personalizationScore += 10;
  if (content.includes('timeline')) personalizationScore += 10;

  const overallScore = readabilityScore * 0.3 + relevanceScore * 0.4 + personalizationScore * 0.3;

  this.quality = {
    score: Math.round(overallScore),
    readability: Math.round(readabilityScore),
    relevance: Math.round(relevanceScore),
    personalization: Math.round(personalizationScore),
    wordCount
  };

  return this.quality;
};

proposalSchema.methods.markAsSent = function () {
  this.status = 'sent';
  this.sentDate = new Date();
  return this.save();
};

proposalSchema.methods.recordResponse = function (responseData) {
  this.response = {
    received: true,
    type: responseData.type,
    content: responseData.content,
    rating: responseData.rating
  };
  this.responseDate = new Date();
  this.status = 'responded';
  return this.save();
};

proposalSchema.methods.incrementView = function () {
  this.analytics.viewCount += 1;
  return this.save();
};

// Static methods for Project
projectSchema.statics.findByPlatformAndId = function (platform, externalId) {
  return this.findOne({ platform, externalId });
};

projectSchema.statics.findRecent = function (days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return this.find({ postedDate: { $gte: cutoffDate } });
};

projectSchema.statics.findHighValue = function (minBudget = 5000) {
  return this.find({
    $or: [{ 'budget.min': { $gte: minBudget } }, { 'budget.max': { $gte: minBudget } }]
  });
};

projectSchema.statics.findBySkills = function (skills) {
  return this.find({ skills: { $in: skills } });
};

// Static methods for Proposal
proposalSchema.statics.findByUser = function (userId, limit = 50) {
  return this.find({ userId }).sort({ createdAt: -1 }).limit(limit).populate('projectId');
};

proposalSchema.statics.findPending = function (userId) {
  return this.find({
    userId,
    status: { $in: ['draft', 'ready'] }
  }).populate('projectId');
};

proposalSchema.statics.getSuccessRate = function (userId) {
  return this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        successful: {
          $sum: {
            $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        successRate: {
          $cond: [
            { $eq: ['$total', 0] },
            0,
            { $multiply: [{ $divide: ['$successful', '$total'] }, 100] }
          ]
        }
      }
    }
  ]);
};

// Middleware
projectSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('budget') || this.isModified('client')) {
    this.updateFlags();
  }
  next();
});

proposalSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('content')) {
    this.calculateQuality();
  }
  next();
});

// Logging
projectSchema.post('save', function (doc) {
  if (doc.isNew) {
    logger.info(`New project saved: ${doc.platform}/${doc.externalId}`);
  }
});

proposalSchema.post('save', function (doc) {
  if (doc.isNew) {
    logger.info(`New proposal saved for user: ${doc.userId}`);
  }
});

const Project = mongoose.model('Project', projectSchema);
const Proposal = mongoose.model('Proposal', proposalSchema);

module.exports = { Project, Proposal };
