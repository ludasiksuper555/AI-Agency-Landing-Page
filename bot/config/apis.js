const axios = require('axios');
const logger = require('../utils/logger');
const { RateLimiter } = require('limiter');

class APIManager {
  constructor() {
    this.rateLimiters = {
      upwork: new RateLimiter({ tokensPerInterval: 100, interval: 'hour' }),
      freelancer: new RateLimiter({ tokensPerInterval: 1000, interval: 'hour' }),
      fiverr: new RateLimiter({ tokensPerInterval: 500, interval: 'hour' }),
      openai: new RateLimiter({ tokensPerInterval: 3000, interval: 'minute' })
    };

    this.clients = {
      upwork: this.createUpworkClient(),
      freelancer: this.createFreelancerClient(),
      fiverr: this.createFiverrClient(),
      openai: this.createOpenAIClient()
    };
  }

  createUpworkClient() {
    if (!process.env.UPWORK_API_KEY) {
      logger.warn('Upwork API key not provided');
      return null;
    }

    return axios.create({
      baseURL: 'https://www.upwork.com/api',
      headers: {
        Authorization: `Bearer ${process.env.UPWORK_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TechMoneyBot/1.0'
      },
      timeout: 30000
    });
  }

  createFreelancerClient() {
    if (!process.env.FREELANCER_API_KEY) {
      logger.warn('Freelancer API key not provided');
      return null;
    }

    return axios.create({
      baseURL: 'https://www.freelancer.com/api',
      headers: {
        'freelancer-oauth-token': process.env.FREELANCER_API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'TechMoneyBot/1.0'
      },
      timeout: 30000
    });
  }

  createFiverrClient() {
    if (!process.env.FIVERR_API_KEY) {
      logger.warn('Fiverr API key not provided');
      return null;
    }

    return axios.create({
      baseURL: 'https://api.fiverr.com/v1',
      headers: {
        Authorization: `Bearer ${process.env.FIVERR_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TechMoneyBot/1.0'
      },
      timeout: 30000
    });
  }

  createOpenAIClient() {
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('OpenAI API key not provided');
      return null;
    }

    return axios.create({
      baseURL: 'https://api.openai.com/v1',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TechMoneyBot/1.0'
      },
      timeout: 60000
    });
  }

  async makeRequest(platform, endpoint, options = {}) {
    try {
      // Check rate limit
      const limiter = this.rateLimiters[platform];
      if (limiter && !(await limiter.removeTokens(1))) {
        throw new Error(`Rate limit exceeded for ${platform}`);
      }

      const client = this.clients[platform];
      if (!client) {
        throw new Error(`${platform} client not configured`);
      }

      const response = await client({
        url: endpoint,
        method: options.method || 'GET',
        data: options.data,
        params: options.params,
        ...options
      });

      logger.debug(`${platform} API request successful:`, {
        endpoint,
        status: response.status,
        method: options.method || 'GET'
      });

      return response.data;
    } catch (error) {
      logger.error(`${platform} API request failed:`, {
        endpoint,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  // Upwork API methods
  async searchUpworkProjects(query, options = {}) {
    const params = {
      q: query,
      sort: options.sort || 'create_time desc',
      paging: `${options.offset || 0};${options.limit || 20}`,
      category2: options.category,
      budget: options.budget,
      job_type: options.jobType,
      duration: options.duration,
      client_hires: options.clientHires,
      client_info: true
    };

    return this.makeRequest('upwork', '/profiles/v1/search/jobs', {
      params: Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null))
    });
  }

  // Freelancer API methods
  async searchFreelancerProjects(query, options = {}) {
    const params = {
      query,
      sort_field: options.sortField || 'time_updated',
      sort_order: options.sortOrder || 'desc',
      limit: options.limit || 20,
      offset: options.offset || 0,
      job_details: true,
      user_details: true,
      location_details: true
    };

    return this.makeRequest('freelancer', '/projects/0.1/projects', {
      params
    });
  }

  // Fiverr API methods (Note: Fiverr has limited public API)
  async searchFiverrGigs(query, options = {}) {
    // This is a placeholder - Fiverr's API is limited
    // In practice, you might need to use web scraping or unofficial methods
    logger.warn('Fiverr API search not fully implemented - using mock data');

    return {
      gigs: [],
      total: 0,
      message: 'Fiverr API integration pending'
    };
  }

  // OpenAI API methods
  async generateProposal(projectData, userProfile, options = {}) {
    const prompt = this.buildProposalPrompt(projectData, userProfile, options);

    const requestData = {
      model: options.model || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional freelancer writing compelling project proposals. Write in a professional, confident tone that highlights relevant experience and provides clear value proposition.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || 500,
      temperature: options.temperature || 0.7,
      top_p: options.topP || 0.9
    };

    const response = await this.makeRequest('openai', '/chat/completions', {
      method: 'POST',
      data: requestData
    });

    return response.choices[0]?.message?.content || '';
  }

  buildProposalPrompt(projectData, userProfile, options = {}) {
    const language = options.language || 'en';

    const prompts = {
      en: `Write a professional freelance proposal for the following project:

Project Title: ${projectData.title}
Project Description: ${projectData.description}
Budget: ${projectData.budget || 'Not specified'}
Client Rating: ${projectData.clientRating || 'Not available'}

My Profile:
Name: ${userProfile.name || 'Professional Freelancer'}
Skills: ${userProfile.skills?.join(', ') || 'Web Development, Programming'}
Experience: ${userProfile.experience || '5+ years'}
Portfolio: ${userProfile.portfolio || 'Available upon request'}

Requirements:
- Keep it concise (under 200 words)
- Highlight relevant experience
- Include a clear call to action
- Be professional and confident
- Don't mention specific rates unless asked`,

      uk: `Напишіть професійну пропозицію для наступного проекту:

Назва проекту: ${projectData.title}
Опис проекту: ${projectData.description}
Бюджет: ${projectData.budget || 'Не вказано'}
Рейтинг клієнта: ${projectData.clientRating || 'Недоступно'}

Мій профіль:
Ім'я: ${userProfile.name || 'Професійний фрілансер'}
Навички: ${userProfile.skills?.join(', ') || 'Веб-розробка, Програмування'}
Досвід: ${userProfile.experience || '5+ років'}
Портфоліо: ${userProfile.portfolio || 'Доступне за запитом'}

Вимоги:
- Стисло (до 200 слів)
- Підкресліть відповідний досвід
- Включіть чіткий заклик до дії
- Будьте професійними та впевненими
- Не згадуйте конкретні ставки, якщо не запитують`
    };

    return prompts[language] || prompts.en;
  }

  // Health check for all APIs
  async healthCheck() {
    const health = {
      upwork: false,
      freelancer: false,
      fiverr: false,
      openai: false,
      timestamp: new Date().toISOString()
    };

    const checks = Object.keys(this.clients).map(async platform => {
      try {
        const client = this.clients[platform];
        if (!client) {
          return { platform, status: false, error: 'Client not configured' };
        }

        // Simple health check endpoints
        const endpoints = {
          upwork: '/auth/v1/info',
          freelancer: '/users/0.1/self',
          fiverr: '/users/me',
          openai: '/models'
        };

        await this.makeRequest(platform, endpoints[platform]);
        health[platform] = true;
        return { platform, status: true };
      } catch (error) {
        logger.error(`${platform} health check failed:`, error.message);
        return { platform, status: false, error: error.message };
      }
    });

    await Promise.allSettled(checks);
    return health;
  }

  // Get rate limit status
  getRateLimitStatus() {
    const status = {};
    Object.keys(this.rateLimiters).forEach(platform => {
      const limiter = this.rateLimiters[platform];
      status[platform] = {
        tokensRemaining: limiter.getTokensRemaining(),
        tokensPerInterval: limiter.tokensPerInterval,
        interval: limiter.interval
      };
    });
    return status;
  }
}

// Singleton instance
const apiManager = new APIManager();

module.exports = apiManager;
