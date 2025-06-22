'use strict';
/**
 * Main Integration Hub for Project Management Systems
 * Coordinates MCP, reporting, documentation, and metrics
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.projectManagement =
  exports.ProjectManagementSystem =
  exports.dailyReporting =
  exports.DailyReportingSystem =
  exports.qualityMetrics =
  exports.QualityMetricsSystem =
  exports.mcpClient =
  exports.MCPClient =
  exports.autoDocGenerator =
  exports.AutoDocGenerator =
    void 0;
var autoDocGenerator_1 = require('./documentation/autoDocGenerator');
Object.defineProperty(exports, 'AutoDocGenerator', {
  enumerable: true,
  get: function () {
    return autoDocGenerator_1.AutoDocGenerator;
  },
});
Object.defineProperty(exports, 'autoDocGenerator', {
  enumerable: true,
  get: function () {
    return autoDocGenerator_1.autoDocGenerator;
  },
});
var client_1 = require('./mcp/client');
Object.defineProperty(exports, 'MCPClient', {
  enumerable: true,
  get: function () {
    return client_1.MCPClient;
  },
});
Object.defineProperty(exports, 'mcpClient', {
  enumerable: true,
  get: function () {
    return client_1.mcpClient;
  },
});
var qualityMetrics_1 = require('./metrics/qualityMetrics');
Object.defineProperty(exports, 'QualityMetricsSystem', {
  enumerable: true,
  get: function () {
    return qualityMetrics_1.QualityMetricsSystem;
  },
});
Object.defineProperty(exports, 'qualityMetrics', {
  enumerable: true,
  get: function () {
    return qualityMetrics_1.qualityMetrics;
  },
});
var dailyReports_1 = require('./reporting/dailyReports');
Object.defineProperty(exports, 'DailyReportingSystem', {
  enumerable: true,
  get: function () {
    return dailyReports_1.DailyReportingSystem;
  },
});
Object.defineProperty(exports, 'dailyReporting', {
  enumerable: true,
  get: function () {
    return dailyReports_1.dailyReporting;
  },
});
// Import instances for internal use
const autoDocGenerator_2 = require('./documentation/autoDocGenerator');
const client_2 = require('./mcp/client');
const qualityMetrics_2 = require('./metrics/qualityMetrics');
const dailyReports_2 = require('./reporting/dailyReports');
/**
 * Main project management system that coordinates all subsystems
 */
class ProjectManagementSystem {
  constructor() {
    this.mcpClient = client_2.mcpClient;
    this.reporting = dailyReports_2.dailyReporting;
    this.documentation = autoDocGenerator_2.autoDocGenerator;
    this.metrics = qualityMetrics_2.qualityMetrics;
  }
  /**
   * Initialize all systems and perform daily setup
   */
  async initialize() {
    console.log('🚀 Initializing Project Management System...');
    try {
      // Setup MCP servers
      await this.setupMCPServers();
      // Generate daily report
      const report = this.reporting.generateDailyReport();
      console.log(`📊 Daily report generated: ${report.summary.completed} tasks completed`);
      // Update documentation
      await this.documentation.generateProjectDocumentation();
      console.log('📚 Project documentation updated');
      // Collect metrics
      const metrics = await this.metrics.generateMetricsReport();
      console.log(
        `📈 Metrics collected - Quality score: ${metrics.quality.codeQuality.maintainability}%`
      );
      // Generate dashboard
      this.metrics.generateQualityDashboard(metrics);
      console.log('🎯 Quality dashboard generated');
      console.log('✅ Project Management System initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Project Management System:', error);
      throw error;
    }
  }
  /**
   * Add a new work item to the system
   */
  addWorkItem(item) {
    const id = this.reporting.addWorkItem(item);
    console.log(`📝 Work item added: ${item.title} (${id})`);
    return id;
  }
  /**
   * Complete a work item and update metrics
   */
  async completeWorkItem(id, actualHours) {
    this.reporting.updateWorkItem(id, {
      status: 'completed',
      actualHours,
    });
    // Regenerate metrics after completion
    await this.metrics.generateMetricsReport();
    console.log(`✅ Work item completed: ${id}`);
  }
  /**
   * Generate comprehensive project status
   */
  async getProjectStatus() {
    const report = this.reporting.generateDailyReport();
    const metrics = await this.metrics.generateMetricsReport();
    return {
      workItems: {
        total: report.summary.totalItems,
        completed: report.summary.completed,
        inProgress: report.summary.inProgress,
        blocked: report.summary.blocked,
      },
      quality: {
        score: metrics.quality.codeQuality.maintainability,
        testCoverage: metrics.quality.codeQuality.testCoverage,
        securityScore: metrics.quality.security.score,
      },
      business: {
        velocity: metrics.business.development.velocity,
        roi: metrics.business.business.roi,
        userGrowth: metrics.business.business.userGrowth,
      },
    };
  }
  /**
   * Execute MCP tool with logging
   */
  async executeMCPTool(serverName, toolName, args) {
    console.log(`🔧 Executing MCP tool: ${serverName}.${toolName}`);
    try {
      const result = await this.mcpClient.executeTool(serverName, toolName, args);
      console.log(`✅ MCP tool executed successfully`);
      return result;
    } catch (error) {
      console.error(`❌ MCP tool execution failed:`, error);
      throw error;
    }
  }
  /**
   * Generate and save comprehensive README
   */
  async updateProjectDocumentation() {
    const projectDoc = await this.documentation.generateProjectDocumentation();
    const readme = this.documentation.generateReadme(projectDoc);
    console.log('📖 Project README updated');
  }
  /**
   * Setup default MCP servers
   */
  async setupMCPServers() {
    // GitHub MCP Server
    this.mcpClient.registerServer({
      name: 'github',
      description: 'GitHub integration for repository management',
      transport: 'http',
      endpoint: 'https://api.github.com',
      tools: [
        {
          name: 'create_issue',
          description: 'Create a new GitHub issue',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              body: { type: 'string' },
              labels: { type: 'array', items: { type: 'string' } },
            },
            required: ['title', 'body'],
          },
          handler: async args => {
            // GitHub API integration would go here
            console.log('Creating GitHub issue:', args.title);
            return { id: 'issue-123', url: 'https://github.com/repo/issues/123' };
          },
        },
      ],
    });
    // Analytics MCP Server
    this.mcpClient.registerServer({
      name: 'analytics',
      description: 'Project analytics and metrics',
      transport: 'stdio',
      tools: [
        {
          name: 'get_metrics',
          description: 'Get project metrics',
          inputSchema: {
            type: 'object',
            properties: {
              period: { type: 'string', enum: ['day', 'week', 'month'] },
            },
            required: ['period'],
          },
          handler: async args => {
            const metrics = await this.metrics.generateMetricsReport();
            return metrics;
          },
        },
      ],
    });
    console.log('🔌 MCP servers registered');
  }
}
exports.ProjectManagementSystem = ProjectManagementSystem;
// Global project management system instance
exports.projectManagement = new ProjectManagementSystem();
// Auto-initialize on import (can be disabled if needed)
if (typeof window === 'undefined') {
  // Only auto-initialize in Node.js environment
  exports.projectManagement.initialize().catch(console.error);
}
