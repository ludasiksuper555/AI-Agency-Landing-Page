const apiManager = require('../config/apis');
const databaseManager = require('../config/database');
const logger = require('../utils/logger');
const { validateSearchParams } = require('../utils/validators');

class ProjectSearchService {
  constructor() {
    this.searchHistory = new Map();
    this.lastSearchTime = new Map();
    this.searchStats = {
      totalSearches: 0,
      projectsFound: 0,
      averageProjectsPerSearch: 0,
      lastUpdated: new Date()
    };
  }

  async searchAllPlatforms(searchParams) {
    try {
      // Validate search parameters
      const validation = validateSearchParams(searchParams);
      if (!validation.isValid) {
        throw new Error(`Invalid search parameters: ${validation.errors.join(', ')}`);
      }

      const { keywords, budget, category, location, sortBy, limit } = searchParams;

      logger.info('Starting project search across all platforms', {
        keywords,
        budget,
        category,
        limit
      });

      // Check cache first
      const cacheKey = this.generateCacheKey(searchParams);
      const cachedResults = await databaseManager.getCache(cacheKey);

      if (cachedResults && this.isCacheValid(cachedResults.timestamp)) {
        logger.info('Returning cached search results');
        return cachedResults.data;
      }

      // Search all platforms in parallel
      const searchPromises = [
        this.searchUpwork(searchParams),
        this.searchFreelancer(searchParams),
        this.searchFiverr(searchParams)
      ];

      const results = await Promise.allSettled(searchPromises);

      // Process results
      const allProjects = [];
      const platformStats = {
        upwork: { count: 0, errors: null },
        freelancer: { count: 0, errors: null },
        fiverr: { count: 0, errors: null }
      };

      results.forEach((result, index) => {
        const platforms = ['upwork', 'freelancer', 'fiverr'];
        const platform = platforms[index];

        if (result.status === 'fulfilled' && result.value) {
          const projects = this.normalizeProjects(result.value, platform);
          allProjects.push(...projects);
          platformStats[platform].count = projects.length;
        } else {
          platformStats[platform].errors = result.reason?.message || 'Unknown error';
          logger.error(`${platform} search failed:`, result.reason);
        }
      });

      // Sort and filter results
      const filteredProjects = this.filterAndSortProjects(allProjects, searchParams);
      const limitedProjects = filteredProjects.slice(0, limit || 50);

      // Update statistics
      this.updateSearchStats(limitedProjects.length);

      // Cache results
      const searchResult = {
        projects: limitedProjects,
        stats: platformStats,
        totalFound: limitedProjects.length,
        searchParams,
        timestamp: new Date().toISOString()
      };

      await databaseManager.setCache(cacheKey, searchResult, 1800); // 30 minutes cache

      logger.info('Project search completed', {
        totalProjects: limitedProjects.length,
        platformStats
      });

      return searchResult;
    } catch (error) {
      logger.error('Project search failed:', error);
      throw error;
    }
  }

  async searchUpwork(searchParams) {
    try {
      const { keywords, budget, category, sortBy, limit } = searchParams;

      const options = {
        sort: this.mapSortToUpwork(sortBy),
        limit: Math.min(limit || 20, 50),
        category: category,
        budget: budget,
        jobType: 'hourly,fixed',
        clientHires: '1+'
      };

      const response = await apiManager.searchUpworkProjects(keywords, options);

      if (!response || !response.jobs) {
        return [];
      }

      return response.jobs.map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        budget: job.budget,
        budgetType: job.job_type,
        skills: job.skills || [],
        clientRating: job.client?.feedback_score,
        clientCountry: job.client?.country,
        clientHires: job.client?.jobs_posted,
        postedDate: job.date_created,
        platform: 'upwork',
        url: job.url,
        proposals: job.proposals || 0,
        verified: job.client?.payment_verification_status === 'VERIFIED'
      }));
    } catch (error) {
      logger.error('Upwork search failed:', error);
      throw error;
    }
  }

  async searchFreelancer(searchParams) {
    try {
      const { keywords, budget, category, sortBy, limit } = searchParams;

      const options = {
        sortField: this.mapSortToFreelancer(sortBy),
        limit: Math.min(limit || 20, 50),
        offset: 0
      };

      const response = await apiManager.searchFreelancerProjects(keywords, options);

      if (!response || !response.result || !response.result.projects) {
        return [];
      }

      return response.result.projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        budget: project.budget,
        budgetType: project.type === 'FIXED' ? 'fixed' : 'hourly',
        skills: project.jobs?.map(job => job.name) || [],
        clientRating: project.owner?.reputation?.entire_history?.overall,
        clientCountry: project.owner?.location?.country?.name,
        clientHires: project.owner?.jobs_posted,
        postedDate: new Date(project.time_submitted * 1000).toISOString(),
        platform: 'freelancer',
        url: `https://www.freelancer.com/projects/${project.seo_url}`,
        proposals: project.bid_stats?.bid_count || 0,
        verified: project.owner?.status?.payment_verified
      }));
    } catch (error) {
      logger.error('Freelancer search failed:', error);
      throw error;
    }
  }

  async searchFiverr(searchParams) {
    try {
      // Note: Fiverr has limited API access
      // This is a placeholder implementation
      logger.warn('Fiverr search using mock data - API integration pending');

      return [
        {
          id: 'fiverr_mock_1',
          title: 'Mock Fiverr Project',
          description: 'This is a mock project from Fiverr API integration',
          budget: { min: 50, max: 500 },
          budgetType: 'fixed',
          skills: ['Web Development', 'Design'],
          clientRating: 4.5,
          clientCountry: 'United States',
          postedDate: new Date().toISOString(),
          platform: 'fiverr',
          url: 'https://fiverr.com/mock-project',
          proposals: 5,
          verified: true
        }
      ];
    } catch (error) {
      logger.error('Fiverr search failed:', error);
      throw error;
    }
  }

  normalizeProjects(projects, platform) {
    return projects.map(project => ({
      ...project,
      platform,
      normalizedBudget: this.normalizeBudget(project.budget),
      relevanceScore: this.calculateRelevanceScore(project),
      qualityScore: this.calculateQualityScore(project)
    }));
  }

  filterAndSortProjects(projects, searchParams) {
    let filtered = projects;

    // Filter by budget range
    if (searchParams.minBudget || searchParams.maxBudget) {
      filtered = filtered.filter(project => {
        const budget = project.normalizedBudget;
        if (!budget) return true;

        if (searchParams.minBudget && budget < searchParams.minBudget) return false;
        if (searchParams.maxBudget && budget > searchParams.maxBudget) return false;
        return true;
      });
    }

    // Filter by client rating
    if (searchParams.minClientRating) {
      filtered = filtered.filter(
        project => !project.clientRating || project.clientRating >= searchParams.minClientRating
      );
    }

    // Filter by verification status
    if (searchParams.verifiedOnly) {
      filtered = filtered.filter(project => project.verified);
    }

    // Sort projects
    filtered.sort((a, b) => {
      switch (searchParams.sortBy) {
        case 'budget_desc':
          return (b.normalizedBudget || 0) - (a.normalizedBudget || 0);
        case 'budget_asc':
          return (a.normalizedBudget || 0) - (b.normalizedBudget || 0);
        case 'relevance':
          return (b.relevanceScore || 0) - (a.relevanceScore || 0);
        case 'quality':
          return (b.qualityScore || 0) - (a.qualityScore || 0);
        case 'date_desc':
        default:
          return new Date(b.postedDate) - new Date(a.postedDate);
      }
    });

    return filtered;
  }

  normalizeBudget(budget) {
    if (!budget) return null;

    if (typeof budget === 'number') return budget;
    if (typeof budget === 'string') {
      const match = budget.match(/\d+/);
      return match ? parseInt(match[0]) : null;
    }
    if (typeof budget === 'object') {
      return budget.max || budget.amount || null;
    }

    return null;
  }

  calculateRelevanceScore(project) {
    let score = 0;

    // Title relevance (basic keyword matching)
    if (project.title) {
      const titleWords = project.title.toLowerCase().split(' ');
      const techKeywords = [
        'web',
        'app',
        'mobile',
        'react',
        'node',
        'javascript',
        'python',
        'ai',
        'ml'
      ];
      score += titleWords.filter(word => techKeywords.includes(word)).length * 10;
    }

    // Skills relevance
    if (project.skills && project.skills.length > 0) {
      score += Math.min(project.skills.length * 5, 25);
    }

    // Budget factor
    const budget = project.normalizedBudget;
    if (budget) {
      if (budget >= 1000) score += 20;
      else if (budget >= 500) score += 15;
      else if (budget >= 100) score += 10;
    }

    return Math.min(score, 100);
  }

  calculateQualityScore(project) {
    let score = 0;

    // Client rating
    if (project.clientRating) {
      score += project.clientRating * 10;
    }

    // Verification status
    if (project.verified) {
      score += 20;
    }

    // Client hire history
    if (project.clientHires) {
      if (project.clientHires >= 10) score += 15;
      else if (project.clientHires >= 5) score += 10;
      else if (project.clientHires >= 1) score += 5;
    }

    // Description quality (length and detail)
    if (project.description && project.description.length > 100) {
      score += 10;
    }

    // Competition level (inverse of proposals)
    if (project.proposals !== undefined) {
      if (project.proposals < 5) score += 15;
      else if (project.proposals < 10) score += 10;
      else if (project.proposals < 20) score += 5;
    }

    return Math.min(score, 100);
  }

  mapSortToUpwork(sortBy) {
    const mapping = {
      date_desc: 'create_time desc',
      date_asc: 'create_time asc',
      budget_desc: 'budget desc',
      budget_asc: 'budget asc',
      relevance: 'relevance desc'
    };
    return mapping[sortBy] || 'create_time desc';
  }

  mapSortToFreelancer(sortBy) {
    const mapping = {
      date_desc: 'time_updated',
      date_asc: 'time_updated',
      budget_desc: 'budget',
      budget_asc: 'budget',
      relevance: 'relevance'
    };
    return mapping[sortBy] || 'time_updated';
  }

  generateCacheKey(searchParams) {
    const key = JSON.stringify({
      keywords: searchParams.keywords,
      budget: searchParams.budget,
      category: searchParams.category,
      sortBy: searchParams.sortBy,
      limit: searchParams.limit
    });
    return `search:${Buffer.from(key).toString('base64')}`;
  }

  isCacheValid(timestamp, maxAge = 1800000) {
    // 30 minutes
    return new Date() - new Date(timestamp) < maxAge;
  }

  updateSearchStats(projectsFound) {
    this.searchStats.totalSearches++;
    this.searchStats.projectsFound += projectsFound;
    this.searchStats.averageProjectsPerSearch =
      this.searchStats.projectsFound / this.searchStats.totalSearches;
    this.searchStats.lastUpdated = new Date();
  }

  getSearchStats() {
    return { ...this.searchStats };
  }

  async getSearchHistory(userId, limit = 10) {
    try {
      const cacheKey = `search_history:${userId}`;
      const history = (await databaseManager.getCache(cacheKey)) || [];
      return history.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get search history:', error);
      return [];
    }
  }

  async saveSearchHistory(userId, searchParams, results) {
    try {
      const cacheKey = `search_history:${userId}`;
      const history = (await databaseManager.getCache(cacheKey)) || [];

      const searchEntry = {
        timestamp: new Date().toISOString(),
        searchParams,
        resultsCount: results.totalFound,
        platforms: Object.keys(results.stats)
      };

      history.unshift(searchEntry);
      const limitedHistory = history.slice(0, 50); // Keep last 50 searches

      await databaseManager.setCache(cacheKey, limitedHistory, 86400 * 7); // 7 days
    } catch (error) {
      logger.error('Failed to save search history:', error);
    }
  }
}

module.exports = new ProjectSearchService();
