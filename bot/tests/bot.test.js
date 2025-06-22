const { describe, it, beforeEach, afterEach, before, after } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');
const redis = require('redis');
const { Telegraf } = require('telegraf');

// Import modules to test
const User = require('../models/User');
const { Project, Proposal } = require('../models/Project');
const projectSearchService = require('../services/projectSearch');
const proposalGeneratorService = require('../services/proposalGenerator');
const analyticsService = require('../services/analytics');
const CronJobManager = require('../automation/cronJobs');
const logger = require('../utils/logger');
const { ValidationService } = require('../utils/validation');

describe('TechMoneyBot Tests', function () {
  this.timeout(10000);

  let bot;
  let redisClient;
  let sandbox;

  before(async function () {
    // Setup test environment
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = 'mongodb://localhost:27017/techmoneybot_test';
    process.env.REDIS_URL = 'redis://localhost:6379/1';

    // Connect to test database
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Connect to test Redis
    redisClient = redis.createClient({ url: process.env.REDIS_URL });
    await redisClient.connect();

    // Create test bot instance
    bot = new Telegraf('test_token');
  });

  after(async function () {
    // Cleanup
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await redisClient.quit();
  });

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('User Model', function () {
    let testUser;

    beforeEach(async function () {
      await User.deleteMany({});

      testUser = new User({
        telegramId: 123456789,
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        profile: {
          skills: ['JavaScript', 'Node.js', 'React'],
          experience: 'intermediate',
          hourlyRate: { min: 25, max: 50 }
        }
      });

      await testUser.save();
    });

    it('should create a user with valid data', function () {
      expect(testUser.telegramId).to.equal(123456789);
      expect(testUser.username).to.equal('testuser');
      expect(testUser.profile.skills).to.include('JavaScript');
    });

    it('should have virtual fullName property', function () {
      expect(testUser.fullName).to.equal('Test User');
    });

    it('should update last activity on save', async function () {
      const oldActivity = testUser.botState.lastActivity;
      await new Promise(resolve => setTimeout(resolve, 10));

      testUser.username = 'updateduser';
      await testUser.save();

      expect(testUser.botState.lastActivity).to.be.above(oldActivity);
    });

    it('should increment search count', async function () {
      const initialCount = testUser.stats.totalSearches;
      await testUser.incrementSearchCount();

      expect(testUser.stats.totalSearches).to.equal(initialCount + 1);
      expect(testUser.stats.lastSearchDate).to.be.a('date');
    });

    it('should check subscription status', function () {
      const status = testUser.getSubscriptionStatus();
      expect(status.status).to.equal('free');
      expect(status.daysLeft).to.be.null;
    });

    it('should find user by telegram ID', async function () {
      const foundUser = await User.findByTelegramId(123456789);
      expect(foundUser).to.not.be.null;
      expect(foundUser.username).to.equal('testuser');
    });
  });

  describe('Project Model', function () {
    let testProject;

    beforeEach(async function () {
      await Project.deleteMany({});

      testProject = new Project({
        externalId: 'test_project_123',
        platform: 'upwork',
        url: 'https://upwork.com/jobs/test',
        title: 'Build a React Application',
        description: 'Need a skilled React developer to build a modern web application',
        skills: ['React', 'JavaScript', 'CSS'],
        budget: {
          type: 'fixed',
          min: 1000,
          max: 3000,
          currency: 'USD'
        },
        client: {
          name: 'Test Client',
          rating: 4.5,
          verified: true,
          paymentVerified: true
        },
        postedDate: new Date()
      });

      await testProject.save();
    });

    it('should create a project with valid data', function () {
      expect(testProject.externalId).to.equal('test_project_123');
      expect(testProject.platform).to.equal('upwork');
      expect(testProject.skills).to.include('React');
    });

    it('should calculate age in days', function () {
      expect(testProject.ageInDays).to.equal(0);
    });

    it('should determine if project is recent', function () {
      expect(testProject.isRecent).to.be.true;
    });

    it('should calculate budget range', function () {
      expect(testProject.budgetRange).to.equal('$1000-3000');
    });

    it('should calculate scores based on user profile', function () {
      const userProfile = {
        skills: ['React', 'JavaScript', 'Node.js']
      };

      const scores = testProject.calculateScores(userProfile);

      expect(scores.relevance).to.be.above(0);
      expect(scores.quality).to.be.above(0);
      expect(scores.overall).to.be.above(0);
    });

    it('should update flags correctly', function () {
      testProject.updateFlags();

      expect(testProject.flags.isHighValue).to.be.false; // Budget < 5000
      expect(testProject.flags.isScam).to.be.false; // Client is verified
    });

    it('should find project by platform and external ID', async function () {
      const foundProject = await Project.findByPlatformAndId('upwork', 'test_project_123');
      expect(foundProject).to.not.be.null;
      expect(foundProject.title).to.equal('Build a React Application');
    });
  });

  describe('Proposal Model', function () {
    let testUser, testProject, testProposal;

    beforeEach(async function () {
      await User.deleteMany({});
      await Project.deleteMany({});
      await Proposal.deleteMany({});

      testUser = await new User({
        telegramId: 123456789,
        username: 'testuser'
      }).save();

      testProject = await new Project({
        externalId: 'test_project_123',
        platform: 'upwork',
        url: 'https://upwork.com/jobs/test',
        title: 'Test Project',
        description: 'Test description',
        postedDate: new Date()
      }).save();

      testProposal = new Proposal({
        userId: testUser._id,
        projectId: testProject._id,
        content:
          'Dear client, I am interested in your project. I have experience with React and can deliver high-quality work within your timeline. Thank you for considering my proposal.',
        generationMethod: 'ai',
        bidAmount: 1500
      });

      await testProposal.save();
    });

    it('should create a proposal with valid data', function () {
      expect(testProposal.userId.toString()).to.equal(testUser._id.toString());
      expect(testProposal.projectId.toString()).to.equal(testProject._id.toString());
      expect(testProposal.generationMethod).to.equal('ai');
    });

    it('should calculate quality metrics', function () {
      const quality = testProposal.calculateQuality();

      expect(quality.score).to.be.above(0);
      expect(quality.wordCount).to.be.above(0);
      expect(quality.readability).to.be.above(0);
    });

    it('should mark proposal as sent', async function () {
      await testProposal.markAsSent();

      expect(testProposal.status).to.equal('sent');
      expect(testProposal.sentDate).to.be.a('date');
    });

    it('should record response', async function () {
      const responseData = {
        type: 'interview',
        content: 'We would like to interview you',
        rating: 4
      };

      await testProposal.recordResponse(responseData);

      expect(testProposal.response.received).to.be.true;
      expect(testProposal.response.type).to.equal('interview');
      expect(testProposal.status).to.equal('responded');
    });

    it('should find proposals by user', async function () {
      const proposals = await Proposal.findByUser(testUser._id);

      expect(proposals).to.have.length(1);
      expect(proposals[0].content).to.include('Dear client');
    });
  });

  describe('Project Search Service', function () {
    beforeEach(function () {
      // Mock external API calls
      sandbox.stub(projectSearchService, 'searchUpwork').resolves([
        {
          id: 'upwork_1',
          title: 'React Developer Needed',
          description: 'Build a React app',
          budget: { min: 1000, max: 3000 },
          skills: ['React', 'JavaScript'],
          postedDate: new Date()
        }
      ]);

      sandbox.stub(projectSearchService, 'searchFreelancer').resolves([
        {
          id: 'freelancer_1',
          title: 'Node.js Backend',
          description: 'Build REST API',
          budget: { min: 2000, max: 5000 },
          skills: ['Node.js', 'Express'],
          postedDate: new Date()
        }
      ]);
    });

    it('should search projects across platforms', async function () {
      const searchParams = {
        keywords: ['React', 'JavaScript'],
        platforms: ['upwork', 'freelancer'],
        minBudget: 1000,
        maxBudget: 5000
      };

      const results = await projectSearchService.searchProjects(searchParams);

      expect(results).to.be.an('array');
      expect(results.length).to.be.above(0);
    });

    it('should validate search parameters', function () {
      const invalidParams = {
        keywords: [], // Empty keywords
        platforms: ['invalid_platform']
      };

      expect(() => {
        projectSearchService.validateSearchParams(invalidParams);
      }).to.throw();
    });

    it('should cache search results', async function () {
      const searchParams = {
        keywords: ['React'],
        platforms: ['upwork']
      };

      // First search
      const results1 = await projectSearchService.searchProjects(searchParams);

      // Second search (should use cache)
      const results2 = await projectSearchService.searchProjects(searchParams);

      expect(results1).to.deep.equal(results2);
    });
  });

  describe('Proposal Generator Service', function () {
    let testProject;

    beforeEach(function () {
      testProject = {
        title: 'Build React Application',
        description: 'Need experienced React developer',
        skills: ['React', 'JavaScript'],
        budget: { min: 2000, max: 4000 }
      };

      // Mock OpenAI API
      sandbox
        .stub(proposalGeneratorService, 'generateWithAI')
        .resolves(
          'Dear client, I am excited about your React project. With 5+ years of experience in React development, I can deliver a high-quality application that meets your requirements. Best regards.'
        );
    });

    it('should generate proposal using AI', async function () {
      const proposalData = {
        project: testProject,
        method: 'ai',
        parameters: {
          tone: 'professional',
          length: 'medium'
        }
      };

      const proposal = await proposalGeneratorService.generateProposal(proposalData);

      expect(proposal).to.be.a('string');
      expect(proposal).to.include('Dear client');
      expect(proposal.length).to.be.above(50);
    });

    it('should generate proposal using template', async function () {
      const proposalData = {
        project: testProject,
        method: 'template',
        templateName: 'web_development'
      };

      const proposal = await proposalGeneratorService.generateProposal(proposalData);

      expect(proposal).to.be.a('string');
      expect(proposal.length).to.be.above(0);
    });

    it('should estimate project timeline', function () {
      const timeline = proposalGeneratorService.estimateTimeline(testProject);

      expect(timeline).to.be.a('string');
      expect(timeline).to.match(/\d+/);
    });
  });

  describe('Analytics Service', function () {
    beforeEach(async function () {
      await analyticsService.resetData();
    });

    it('should track search events', async function () {
      await analyticsService.trackSearch('user123', {
        platform: 'upwork',
        keywords: ['React'],
        resultsCount: 10
      });

      const stats = await analyticsService.getSearchStats('user123');

      expect(stats.totalSearches).to.equal(1);
      expect(stats.platforms.upwork).to.equal(1);
    });

    it('should track proposal events', async function () {
      await analyticsService.trackProposal('user123', {
        platform: 'upwork',
        method: 'ai',
        quality: 85
      });

      const stats = await analyticsService.getProposalStats('user123');

      expect(stats.totalProposals).to.equal(1);
      expect(stats.averageQuality).to.equal(85);
    });

    it('should generate daily report', async function () {
      // Add some test data
      await analyticsService.trackSearch('user123', { platform: 'upwork' });
      await analyticsService.trackProposal('user123', { platform: 'upwork' });

      const report = await analyticsService.generateDailyReport('user123');

      expect(report).to.be.an('object');
      expect(report.searches).to.be.above(0);
      expect(report.proposals).to.be.above(0);
    });
  });

  describe('Validation Service', function () {
    it('should validate user data', function () {
      const validUser = {
        telegramId: 123456789,
        username: 'testuser',
        firstName: 'Test'
      };

      const result = ValidationService.validateUser(validUser);
      expect(result.isValid).to.be.true;
    });

    it('should reject invalid user data', function () {
      const invalidUser = {
        telegramId: 'invalid', // Should be number
        username: 'a'.repeat(100) // Too long
      };

      const result = ValidationService.validateUser(invalidUser);
      expect(result.isValid).to.be.false;
      expect(result.errors).to.be.an('array');
    });

    it('should validate search parameters', function () {
      const validParams = {
        keywords: ['React', 'JavaScript'],
        platforms: ['upwork', 'freelancer'],
        minBudget: 1000,
        maxBudget: 5000
      };

      const result = ValidationService.validateSearchParams(validParams);
      expect(result.isValid).to.be.true;
    });

    it('should sanitize input data', function () {
      const dirtyData = {
        title: '<script>alert("xss")</script>Clean Title',
        description: 'Normal description with <b>bold</b> text'
      };

      const clean = ValidationService.sanitizeInput(dirtyData);

      expect(clean.title).to.not.include('<script>');
      expect(clean.title).to.include('Clean Title');
    });
  });

  describe('Cron Job Manager', function () {
    let cronManager;

    beforeEach(function () {
      cronManager = new CronJobManager(bot);
    });

    afterEach(function () {
      if (cronManager.isInitialized) {
        cronManager.stopAll();
      }
    });

    it('should initialize cron jobs', async function () {
      await cronManager.initialize();

      expect(cronManager.isInitialized).to.be.true;
      expect(cronManager.jobs.size).to.be.above(0);
    });

    it('should schedule custom job', function () {
      const testJob = sandbox.stub().resolves();

      cronManager.scheduleJob('test-job', '*/5 * * * * *', testJob);

      expect(cronManager.jobs.has('test-job')).to.be.true;
    });

    it('should get job status', async function () {
      await cronManager.initialize();

      const status = cronManager.getJobStatus();

      expect(status.initialized).to.be.true;
      expect(status.totalJobs).to.be.above(0);
      expect(status.jobs).to.be.an('array');
    });

    it('should stop all jobs', async function () {
      await cronManager.initialize();
      cronManager.stopAll();

      expect(cronManager.isInitialized).to.be.false;
      expect(cronManager.jobs.size).to.equal(0);
    });
  });

  describe('Integration Tests', function () {
    it('should handle complete user workflow', async function () {
      // Create user
      const user = await new User({
        telegramId: 987654321,
        username: 'integrationuser',
        profile: {
          skills: ['React', 'Node.js']
        }
      }).save();

      // Search for projects
      const searchParams = {
        keywords: ['React'],
        platforms: ['upwork']
      };

      // Mock search results
      sandbox.stub(projectSearchService, 'searchProjects').resolves([
        {
          id: 'integration_project',
          title: 'React App Development',
          description: 'Build a React application',
          platform: 'upwork',
          skills: ['React', 'JavaScript'],
          budget: { min: 2000, max: 4000 },
          postedDate: new Date()
        }
      ]);

      const projects = await projectSearchService.searchProjects(searchParams);
      expect(projects).to.have.length(1);

      // Generate proposal
      const proposalData = {
        project: projects[0],
        method: 'ai',
        userId: user._id
      };

      sandbox
        .stub(proposalGeneratorService, 'generateProposal')
        .resolves('Professional proposal content for the React project.');

      const proposal = await proposalGeneratorService.generateProposal(proposalData);
      expect(proposal).to.be.a('string');

      // Track analytics
      await analyticsService.trackSearch(user._id.toString(), {
        platform: 'upwork',
        resultsCount: 1
      });

      await analyticsService.trackProposal(user._id.toString(), {
        platform: 'upwork',
        method: 'ai'
      });

      // Verify analytics
      const searchStats = await analyticsService.getSearchStats(user._id.toString());
      const proposalStats = await analyticsService.getProposalStats(user._id.toString());

      expect(searchStats.totalSearches).to.equal(1);
      expect(proposalStats.totalProposals).to.equal(1);
    });
  });
});
