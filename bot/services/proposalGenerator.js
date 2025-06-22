const apiManager = require('../config/apis');
const databaseManager = require('../config/database');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class ProposalGeneratorService {
  constructor() {
    this.templates = new Map();
    this.generationStats = {
      totalGenerated: 0,
      successRate: 0,
      averageLength: 0,
      lastUpdated: new Date()
    };
    this.loadTemplates();
  }

  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '..', 'data', 'templates');

      // Create templates directory if it doesn't exist
      try {
        await fs.access(templatesDir);
      } catch {
        await fs.mkdir(templatesDir, { recursive: true });
        await this.createDefaultTemplates(templatesDir);
      }

      const files = await fs.readdir(templatesDir);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const templateName = file.replace('.json', '');
          const templatePath = path.join(templatesDir, file);
          const templateContent = await fs.readFile(templatePath, 'utf8');
          this.templates.set(templateName, JSON.parse(templateContent));
        }
      }

      logger.info(`Loaded ${this.templates.size} proposal templates`);
    } catch (error) {
      logger.error('Failed to load templates:', error);
      this.createFallbackTemplates();
    }
  }

  async createDefaultTemplates(templatesDir) {
    const defaultTemplates = {
      web_development: {
        name: 'Web Development',
        language: 'en',
        structure: {
          greeting: 'Hi there!',
          introduction: "I'm a professional web developer with {experience} years of experience.",
          relevantExperience:
            'I have extensive experience in {skills} and have successfully completed {projectCount} similar projects.',
          valueProposition:
            'I can help you {projectGoal} by leveraging my expertise in {relevantSkills}.',
          timeline:
            'I can complete this project within {estimatedTime} while maintaining high quality standards.',
          callToAction:
            "I'd love to discuss your project in detail. Please feel free to message me to get started!",
          closing: 'Best regards'
        },
        variables: [
          'experience',
          'skills',
          'projectCount',
          'projectGoal',
          'relevantSkills',
          'estimatedTime'
        ]
      },
      web_development_uk: {
        name: 'Веб-розробка',
        language: 'uk',
        structure: {
          greeting: 'Вітаю!',
          introduction: 'Я професійний веб-розробник з {experience} роками досвіду.',
          relevantExperience:
            'Маю великий досвід роботи з {skills} та успішно завершив {projectCount} подібних проектів.',
          valueProposition:
            'Можу допомогти вам {projectGoal}, використовуючи свій досвід у {relevantSkills}.',
          timeline:
            'Зможу завершити цей проект протягом {estimatedTime}, дотримуючись високих стандартів якості.',
          callToAction:
            'Буду радий обговорити ваш проект детальніше. Будь ласка, напишіть мені, щоб почати!',
          closing: 'З найкращими побаженнями'
        },
        variables: [
          'experience',
          'skills',
          'projectCount',
          'projectGoal',
          'relevantSkills',
          'estimatedTime'
        ]
      },
      mobile_development: {
        name: 'Mobile Development',
        language: 'en',
        structure: {
          greeting: 'Hello!',
          introduction:
            "I'm a mobile app developer specializing in {platforms} with {experience} years of experience.",
          relevantExperience: "I've developed {appCount} mobile applications using {technologies}.",
          valueProposition:
            'I can create a high-quality {appType} app that meets your requirements and provides excellent user experience.',
          timeline: 'The development timeline would be approximately {estimatedTime}.',
          callToAction: "Let's discuss your app idea and how I can bring it to life!",
          closing: 'Looking forward to working with you'
        },
        variables: [
          'platforms',
          'experience',
          'appCount',
          'technologies',
          'appType',
          'estimatedTime'
        ]
      },
      design: {
        name: 'Design',
        language: 'en',
        structure: {
          greeting: 'Hi!',
          introduction:
            "I'm a creative designer with {experience} years of experience in {designTypes}.",
          relevantExperience:
            "My portfolio includes {portfolioHighlights} and I've worked with {clientTypes}.",
          valueProposition:
            'I can create {deliverables} that will {designGoal} and enhance your brand presence.',
          timeline: 'I can deliver the final designs within {estimatedTime}.',
          callToAction: "I'd love to show you my portfolio and discuss your design needs!",
          closing: 'Creative regards'
        },
        variables: [
          'experience',
          'designTypes',
          'portfolioHighlights',
          'clientTypes',
          'deliverables',
          'designGoal',
          'estimatedTime'
        ]
      }
    };

    for (const [templateName, template] of Object.entries(defaultTemplates)) {
      const templatePath = path.join(templatesDir, `${templateName}.json`);
      await fs.writeFile(templatePath, JSON.stringify(template, null, 2));
    }
  }

  createFallbackTemplates() {
    this.templates.set('default', {
      name: 'Default Template',
      language: 'en',
      structure: {
        greeting: 'Hello!',
        introduction: "I'm a professional freelancer with relevant experience.",
        valueProposition: 'I can help you achieve your project goals.',
        callToAction: "Let's discuss your project!",
        closing: 'Best regards'
      },
      variables: []
    });
  }

  async generateProposal(projectData, userProfile, options = {}) {
    try {
      const startTime = Date.now();

      // Determine the best approach
      const useAI = options.useAI !== false && process.env.OPENAI_API_KEY;

      let proposal;
      if (useAI) {
        proposal = await this.generateAIProposal(projectData, userProfile, options);
      } else {
        proposal = await this.generateTemplateProposal(projectData, userProfile, options);
      }

      // Post-process the proposal
      const processedProposal = this.postProcessProposal(proposal, options);

      // Update statistics
      const generationTime = Date.now() - startTime;
      this.updateGenerationStats(processedProposal, generationTime, true);

      // Save to history
      await this.saveProposalHistory(userProfile.id, projectData, processedProposal, options);

      logger.info('Proposal generated successfully', {
        projectId: projectData.id,
        platform: projectData.platform,
        length: processedProposal.length,
        generationTime,
        method: useAI ? 'AI' : 'template'
      });

      return {
        proposal: processedProposal,
        metadata: {
          generationTime,
          method: useAI ? 'AI' : 'template',
          template: options.template,
          language: options.language || 'en',
          wordCount: processedProposal.split(' ').length
        }
      };
    } catch (error) {
      logger.error('Proposal generation failed:', error);
      this.updateGenerationStats('', 0, false);
      throw error;
    }
  }

  async generateAIProposal(projectData, userProfile, options) {
    try {
      const enhancedUserProfile = this.enhanceUserProfile(userProfile, projectData);
      const aiOptions = {
        model: options.model || 'gpt-3.5-turbo',
        maxTokens: options.maxTokens || 400,
        temperature: options.temperature || 0.7,
        language: options.language || 'en'
      };

      const proposal = await apiManager.generateProposal(
        projectData,
        enhancedUserProfile,
        aiOptions
      );

      return proposal;
    } catch (error) {
      logger.error('AI proposal generation failed:', error);
      // Fallback to template-based generation
      return this.generateTemplateProposal(projectData, userProfile, options);
    }
  }

  async generateTemplateProposal(projectData, userProfile, options) {
    const templateName = options.template || this.selectBestTemplate(projectData, options.language);
    const template = this.templates.get(templateName) || this.templates.get('default');

    if (!template) {
      throw new Error('No templates available');
    }

    const variables = this.extractVariables(projectData, userProfile);
    const proposal = this.buildProposalFromTemplate(template, variables);

    return proposal;
  }

  selectBestTemplate(projectData, language = 'en') {
    const title = projectData.title?.toLowerCase() || '';
    const description = projectData.description?.toLowerCase() || '';
    const skills = projectData.skills?.map(s => s.toLowerCase()) || [];

    const content = `${title} ${description} ${skills.join(' ')}`;

    // Template selection logic
    if (
      content.includes('mobile') ||
      content.includes('app') ||
      content.includes('ios') ||
      content.includes('android')
    ) {
      return 'mobile_development';
    }

    if (
      content.includes('design') ||
      content.includes('ui') ||
      content.includes('ux') ||
      content.includes('graphic')
    ) {
      return 'design';
    }

    if (
      content.includes('web') ||
      content.includes('website') ||
      content.includes('react') ||
      content.includes('node')
    ) {
      return language === 'uk' ? 'web_development_uk' : 'web_development';
    }

    return language === 'uk' ? 'web_development_uk' : 'web_development';
  }

  extractVariables(projectData, userProfile) {
    return {
      experience: userProfile.experience || '5+',
      skills: userProfile.skills?.join(', ') || 'various technologies',
      projectCount: userProfile.completedProjects || '50+',
      projectGoal: this.extractProjectGoal(projectData),
      relevantSkills: this.extractRelevantSkills(projectData, userProfile),
      estimatedTime: this.estimateProjectTime(projectData),
      platforms: this.extractPlatforms(projectData),
      appCount: userProfile.mobileApps || '20+',
      technologies: this.extractTechnologies(projectData),
      appType: this.extractAppType(projectData),
      designTypes: this.extractDesignTypes(projectData),
      portfolioHighlights: userProfile.portfolioHighlights || 'various successful projects',
      clientTypes: userProfile.clientTypes || 'startups and enterprises',
      deliverables: this.extractDeliverables(projectData),
      designGoal: this.extractDesignGoal(projectData)
    };
  }

  extractProjectGoal(projectData) {
    const description = projectData.description?.toLowerCase() || '';

    if (
      description.includes('build') ||
      description.includes('create') ||
      description.includes('develop')
    ) {
      return 'build a high-quality solution';
    }
    if (
      description.includes('fix') ||
      description.includes('debug') ||
      description.includes('improve')
    ) {
      return 'fix and improve your existing system';
    }
    if (description.includes('design') || description.includes('redesign')) {
      return 'create an outstanding design';
    }

    return 'achieve your project objectives';
  }

  extractRelevantSkills(projectData, userProfile) {
    const projectSkills = projectData.skills || [];
    const userSkills = userProfile.skills || [];

    const relevantSkills = userSkills.filter(skill =>
      projectSkills.some(
        pSkill =>
          pSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(pSkill.toLowerCase())
      )
    );

    return relevantSkills.length > 0
      ? relevantSkills.join(', ')
      : userSkills.slice(0, 3).join(', ');
  }

  estimateProjectTime(projectData) {
    const budget = projectData.normalizedBudget || 0;
    const description = projectData.description?.length || 0;

    if (budget > 5000 || description > 1000) {
      return '4-6 weeks';
    } else if (budget > 1000 || description > 500) {
      return '2-3 weeks';
    } else {
      return '1-2 weeks';
    }
  }

  extractPlatforms(projectData) {
    const content = `${projectData.title} ${projectData.description}`.toLowerCase();
    const platforms = [];

    if (content.includes('ios')) platforms.push('iOS');
    if (content.includes('android')) platforms.push('Android');
    if (content.includes('react native')) platforms.push('React Native');
    if (content.includes('flutter')) platforms.push('Flutter');

    return platforms.length > 0 ? platforms.join(' and ') : 'iOS and Android';
  }

  extractTechnologies(projectData) {
    const skills = projectData.skills || [];
    const techSkills = skills.filter(skill =>
      ['react', 'node', 'javascript', 'python', 'swift', 'kotlin', 'flutter', 'react native'].some(
        tech => skill.toLowerCase().includes(tech)
      )
    );

    return techSkills.length > 0 ? techSkills.join(', ') : 'modern technologies';
  }

  extractAppType(projectData) {
    const content = `${projectData.title} ${projectData.description}`.toLowerCase();

    if (content.includes('ecommerce') || content.includes('shop')) return 'e-commerce';
    if (content.includes('social')) return 'social';
    if (content.includes('business')) return 'business';
    if (content.includes('game')) return 'gaming';

    return 'mobile';
  }

  extractDesignTypes(projectData) {
    const content = `${projectData.title} ${projectData.description}`.toLowerCase();
    const types = [];

    if (content.includes('logo')) types.push('logo design');
    if (content.includes('web') || content.includes('ui')) types.push('web design');
    if (content.includes('brand')) types.push('branding');
    if (content.includes('print')) types.push('print design');

    return types.length > 0 ? types.join(', ') : 'visual design';
  }

  extractDeliverables(projectData) {
    const content = `${projectData.title} ${projectData.description}`.toLowerCase();

    if (content.includes('logo')) return 'a professional logo';
    if (content.includes('website')) return 'a modern website design';
    if (content.includes('app')) return 'mobile app designs';

    return 'high-quality designs';
  }

  extractDesignGoal(projectData) {
    const content = `${projectData.title} ${projectData.description}`.toLowerCase();

    if (content.includes('brand')) return 'strengthen your brand identity';
    if (content.includes('user') || content.includes('ux')) return 'improve user experience';
    if (content.includes('modern')) return 'modernize your visual presence';

    return 'achieve your design goals';
  }

  buildProposalFromTemplate(template, variables) {
    const sections = [];

    for (const [sectionName, sectionTemplate] of Object.entries(template.structure)) {
      let section = sectionTemplate;

      // Replace variables in the section
      for (const [varName, varValue] of Object.entries(variables)) {
        const placeholder = `{${varName}}`;
        section = section.replace(new RegExp(placeholder, 'g'), varValue);
      }

      sections.push(section);
    }

    return sections.join('\n\n');
  }

  enhanceUserProfile(userProfile, projectData) {
    return {
      ...userProfile,
      relevantExperience: this.extractRelevantExperience(userProfile, projectData),
      estimatedHours: this.estimateHours(projectData),
      similarProjects: this.findSimilarProjects(userProfile, projectData)
    };
  }

  extractRelevantExperience(userProfile, projectData) {
    // This would ideally analyze the user's portfolio and match it with the project
    return userProfile.experience || 'Extensive experience in relevant technologies';
  }

  estimateHours(projectData) {
    const budget = projectData.normalizedBudget || 0;
    const hourlyRate = 50; // Default hourly rate

    if (projectData.budgetType === 'hourly') {
      return Math.max(budget / hourlyRate, 10);
    }

    return Math.max(budget / hourlyRate, 20);
  }

  findSimilarProjects(userProfile, projectData) {
    // This would ideally search through the user's project history
    return userProfile.similarProjects || [];
  }

  postProcessProposal(proposal, options) {
    let processed = proposal;

    // Remove excessive whitespace
    processed = processed.replace(/\n{3,}/g, '\n\n');
    processed = processed.trim();

    // Ensure proper capitalization
    processed = processed.replace(/^[a-z]/gm, match => match.toUpperCase());

    // Add personalization if requested
    if (options.personalize && options.clientName) {
      processed = processed.replace(/Hi there!/g, `Hi ${options.clientName}!`);
      processed = processed.replace(/Hello!/g, `Hello ${options.clientName}!`);
    }

    // Ensure length limits
    if (options.maxLength && processed.length > options.maxLength) {
      const sentences = processed.split('. ');
      let truncated = '';

      for (const sentence of sentences) {
        if ((truncated + sentence + '. ').length <= options.maxLength) {
          truncated += sentence + '. ';
        } else {
          break;
        }
      }

      processed = truncated.trim();
    }

    return processed;
  }

  updateGenerationStats(proposal, generationTime, success) {
    this.generationStats.totalGenerated++;

    if (success) {
      const currentSuccessCount = Math.floor(
        this.generationStats.successRate * (this.generationStats.totalGenerated - 1)
      );
      this.generationStats.successRate =
        (currentSuccessCount + 1) / this.generationStats.totalGenerated;

      const currentTotalLength =
        this.generationStats.averageLength * (this.generationStats.totalGenerated - 1);
      this.generationStats.averageLength =
        (currentTotalLength + proposal.length) / this.generationStats.totalGenerated;
    } else {
      const currentSuccessCount = Math.floor(
        this.generationStats.successRate * (this.generationStats.totalGenerated - 1)
      );
      this.generationStats.successRate = currentSuccessCount / this.generationStats.totalGenerated;
    }

    this.generationStats.lastUpdated = new Date();
  }

  async saveProposalHistory(userId, projectData, proposal, options) {
    try {
      const cacheKey = `proposal_history:${userId}`;
      const history = (await databaseManager.getCache(cacheKey)) || [];

      const proposalEntry = {
        timestamp: new Date().toISOString(),
        projectId: projectData.id,
        projectTitle: projectData.title,
        platform: projectData.platform,
        proposal: proposal.substring(0, 200) + '...', // Store truncated version
        options,
        wordCount: proposal.split(' ').length
      };

      history.unshift(proposalEntry);
      const limitedHistory = history.slice(0, 100); // Keep last 100 proposals

      await databaseManager.setCache(cacheKey, limitedHistory, 86400 * 30); // 30 days
    } catch (error) {
      logger.error('Failed to save proposal history:', error);
    }
  }

  async getProposalHistory(userId, limit = 10) {
    try {
      const cacheKey = `proposal_history:${userId}`;
      const history = (await databaseManager.getCache(cacheKey)) || [];
      return history.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get proposal history:', error);
      return [];
    }
  }

  getGenerationStats() {
    return { ...this.generationStats };
  }

  getAvailableTemplates() {
    return Array.from(this.templates.entries()).map(([key, template]) => ({
      key,
      name: template.name,
      language: template.language,
      variables: template.variables
    }));
  }

  async addCustomTemplate(templateName, templateData) {
    try {
      this.templates.set(templateName, templateData);

      // Save to file
      const templatesDir = path.join(__dirname, '..', 'data', 'templates');
      const templatePath = path.join(templatesDir, `${templateName}.json`);
      await fs.writeFile(templatePath, JSON.stringify(templateData, null, 2));

      logger.info(`Custom template '${templateName}' added successfully`);
      return true;
    } catch (error) {
      logger.error('Failed to add custom template:', error);
      return false;
    }
  }
}

module.exports = new ProposalGeneratorService();
