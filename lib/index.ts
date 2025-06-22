import { logger } from '../utils/logger';
import { dailyReporting, DailyReportingSystem, WorkItem } from './reporting/dailyReports';
/**
 * Main Integration Hub for Project Management Systems
 * Coordinates MCP, reporting, documentation, and metrics
 */

// Core library exports
export * from './apiClient';
export * from './contentful';
export * from './reactQuery';
export * from './securityEventLogger';
export * from './sentry';
export * from './userActivityDatabase';
export * from './userActivityExport';
export * from './userActivityTracker';

// Documentation exports
export { AutoDocGenerator, autoDocGenerator } from './documentation/autoDocGenerator';
export type {
  CodeElement,
  FileDocumentation,
  ProjectDocumentation,
} from './documentation/autoDocGenerator';

// MCP exports
export { MCPClient, mcpClient } from './mcp/client';
export type { MCPServer, MCPTool } from './mcp/client';

// Metrics exports
export { qualityMetrics, QualityMetricsSystem } from './metrics/qualityMetrics';
export type { BusinessMetrics, MetricsReport, QualityMetrics } from './metrics/qualityMetrics';

// Reporting exports
export { dailyReporting, DailyReportingSystem } from './reporting/dailyReports';
export type { DailyReport, WorkItem } from './reporting/dailyReports';

// Import instances for internal use
import { AutoDocGenerator, autoDocGenerator } from './documentation/autoDocGenerator';
import { MCPClient, mcpClient } from './mcp/client';
import { qualityMetrics, QualityMetricsSystem } from './metrics/qualityMetrics';
/**
 * Main project management system that coordinates all subsystems
 */
export class ProjectManagementSystem {
  private mcpClient: MCPClient;
  private reporting: DailyReportingSystem;
  private documentation: AutoDocGenerator;
  private metrics: QualityMetricsSystem;

  constructor() {
    this.mcpClient = mcpClient;
    this.reporting = dailyReporting;
    this.documentation = autoDocGenerator;
    this.metrics = qualityMetrics;
  }

  /**
   * Initialize all systems and perform daily setup
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Project Management System...');

    try {
      // Setup MCP servers
      await this.setupMCPServers();

      // Generate daily report
      const report = this.reporting.generateDailyReport();
      logger.info('Daily report generated', { completedTasks: report.summary.completed });

      // Update documentation
      await this.documentation.generateProjectDocumentation();
      logger.info('Project documentation updated');

      // Collect metrics
      const metrics = await this.metrics.generateMetricsReport();
      console.log(
        `📈 Metrics collected - Quality score: ${metrics.quality.codeQuality.maintainability}%`
      );

      // Generate dashboard
      this.metrics.generateQualityDashboard(metrics);
      logger.info('Quality dashboard generated');

      logger.info('Project Management System initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Project Management System:', error);
      throw error;
    }
  }

  /**
   * Add a new work item to the system
   */
  addWorkItem(item: Omit<WorkItem, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.reporting.addWorkItem(item);
    logger.info('Work item added', { title: item.title, id });
    return id;
  }

  /**
   * Complete a work item and update metrics
   */
  async completeWorkItem(id: string, actualHours?: number): Promise<void> {
    this.reporting.updateWorkItem(id, {
      status: 'completed',
      actualHours,
    });

    // Regenerate metrics after completion
    await this.metrics.generateMetricsReport();
    logger.info('Work item completed', { id });
  }

  /**
   * Generate comprehensive project status
   */
  async getProjectStatus(): Promise<{
    workItems: {
      total: number;
      completed: number;
      inProgress: number;
      blocked: number;
    };
    quality: {
      score: number;
      testCoverage: number;
      securityScore: number;
    };
    business: {
      velocity: number;
      roi: number;
      userGrowth: number;
    };
  }> {
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
  async executeMCPTool(
    serverName: string,
    toolName: string,
    args: Record<string, any>
  ): Promise<any> {
    logger.info('Executing MCP tool', { serverName, toolName });

    try {
      const result = await this.mcpClient.executeTool(serverName, toolName, args);
      logger.info('MCP tool executed successfully');
      return result;
    } catch (error) {
      console.error(`❌ MCP tool execution failed:`, error);
      throw error;
    }
  }

  /**
   * Generate and save comprehensive README
   */
  async updateProjectDocumentation(): Promise<void> {
    const projectDoc = await this.documentation.generateProjectDocumentation();
    const readme = this.documentation.generateReadme(projectDoc);
    logger.info('Project README updated');
  }

  /**
   * Setup default MCP servers
   */
  private async setupMCPServers(): Promise<void> {
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
            logger.info('Creating GitHub issue', { title: args.title });
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

    logger.info('MCP servers registered');
  }
}

// Global project management system instance
export const projectManagement = new ProjectManagementSystem();

// Auto-initialize on import (can be disabled if needed)
if (typeof window === 'undefined') {
  // Only auto-initialize in Node.js environment
  projectManagement.initialize().catch(console.error);
}
