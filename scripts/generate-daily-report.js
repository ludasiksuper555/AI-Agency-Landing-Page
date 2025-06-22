#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Simple daily report generator
 */
class SimpleDailyReportGenerator {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.reportsDir = path.join(projectRoot, 'reports');
    this.workItems = [];
  }

  async generateDailyReport() {
    console.log('📋 Generating daily report...');

    try {
      // Ensure reports directory exists
      if (!fs.existsSync(this.reportsDir)) {
        fs.mkdirSync(this.reportsDir, { recursive: true });
      }

      await this.loadWorkItems();
      const report = await this.createReport();
      await this.saveReport(report);

      console.log('✅ Daily report generated successfully!');
      console.log(`📁 Report saved to: ${this.reportsDir}`);
    } catch (error) {
      console.error('❌ Error generating daily report:', error.message);
      process.exit(1);
    }
  }

  async loadWorkItems() {
    // Load existing work items or create default ones
    const workItemsFile = path.join(this.reportsDir, 'work-items.json');

    if (fs.existsSync(workItemsFile)) {
      try {
        const data = fs.readFileSync(workItemsFile, 'utf8');
        this.workItems = JSON.parse(data);
      } catch (error) {
        console.log('⚠️  Could not load existing work items, creating new ones');
        this.createDefaultWorkItems();
      }
    } else {
      this.createDefaultWorkItems();
    }
  }

  createDefaultWorkItems() {
    const now = new Date().toISOString();

    this.workItems = [
      {
        id: '1',
        title: 'Fix TypeScript compilation errors',
        description: 'Resolve all TypeScript errors in the codebase',
        status: 'completed',
        priority: 'high',
        createdAt: now,
        updatedAt: now,
        completedAt: now,
      },
      {
        id: '2',
        title: 'Implement project management system',
        description: 'Create integrated system for MCP, documentation, and metrics',
        status: 'completed',
        priority: 'high',
        createdAt: now,
        updatedAt: now,
        completedAt: now,
      },
      {
        id: '3',
        title: 'Set up documentation generation',
        description: 'Implement automated documentation generation system',
        status: 'completed',
        priority: 'medium',
        createdAt: now,
        updatedAt: now,
        completedAt: now,
      },
      {
        id: '4',
        title: 'Implement quality metrics tracking',
        description: 'Create system for tracking code quality metrics',
        status: 'completed',
        priority: 'medium',
        createdAt: now,
        updatedAt: now,
        completedAt: now,
      },
      {
        id: '5',
        title: 'Create metrics dashboard',
        description: 'Build interactive dashboard for quality metrics',
        status: 'completed',
        priority: 'low',
        createdAt: now,
        updatedAt: now,
        completedAt: now,
      },
      {
        id: '6',
        title: 'Optimize build performance',
        description: 'Improve build times and bundle size',
        status: 'in-progress',
        priority: 'medium',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '7',
        title: 'Add comprehensive testing',
        description: 'Increase test coverage to 90%+',
        status: 'pending',
        priority: 'high',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: '8',
        title: 'Implement CI/CD pipeline',
        description: 'Set up automated deployment pipeline',
        status: 'pending',
        priority: 'medium',
        createdAt: now,
        updatedAt: now,
      },
    ];

    // Save work items
    fs.writeFileSync(
      path.join(this.reportsDir, 'work-items.json'),
      JSON.stringify(this.workItems, null, 2)
    );
  }

  async createReport() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const completed = this.workItems.filter(item => item.status === 'completed');
    const inProgress = this.workItems.filter(item => item.status === 'in-progress');
    const pending = this.workItems.filter(item => item.status === 'pending');

    const completedToday = completed.filter(item => {
      if (!item.completedAt) return false;
      const completedDate = new Date(item.completedAt).toISOString().split('T')[0];
      return completedDate === dateStr;
    });

    const projectStats = this.getProjectStats();

    const report = {
      date: dateStr,
      timestamp: today.toISOString(),
      summary: {
        totalItems: this.workItems.length,
        completed: completed.length,
        inProgress: inProgress.length,
        pending: pending.length,
        completedToday: completedToday.length,
      },
      workItems: {
        completed,
        inProgress,
        pending,
        completedToday,
      },
      projectStats,
      achievements: this.getAchievements(completedToday),
      nextSteps: this.getNextSteps(inProgress, pending),
    };

    return report;
  }

  getProjectStats() {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8')
      );

      // Count files
      let fileCount = 0;
      let lineCount = 0;

      const countFiles = dir => {
        if (!fs.existsSync(dir)) return;

        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            countFiles(fullPath);
          } else if (
            stat.isFile() &&
            (item.endsWith('.ts') ||
              item.endsWith('.tsx') ||
              item.endsWith('.js') ||
              item.endsWith('.jsx'))
          ) {
            fileCount++;
            try {
              const content = fs.readFileSync(fullPath, 'utf8');
              lineCount += content.split('\n').length;
            } catch (e) {
              // Skip files that can't be read
            }
          }
        }
      };

      countFiles(this.projectRoot);

      return {
        projectName: packageJson.name || 'Unknown Project',
        version: packageJson.version || '0.0.0',
        fileCount,
        lineCount,
        dependencies: Object.keys(packageJson.dependencies || {}).length,
        devDependencies: Object.keys(packageJson.devDependencies || {}).length,
      };
    } catch (error) {
      return {
        projectName: 'Unknown Project',
        version: '0.0.0',
        fileCount: 0,
        lineCount: 0,
        dependencies: 0,
        devDependencies: 0,
      };
    }
  }

  getAchievements(completedToday) {
    const achievements = [];

    if (completedToday.length > 0) {
      achievements.push(
        `✅ Completed ${completedToday.length} work item${completedToday.length > 1 ? 's' : ''} today`
      );
    }

    const highPriorityCompleted = completedToday.filter(item => item.priority === 'high');
    if (highPriorityCompleted.length > 0) {
      achievements.push(
        `🔥 Completed ${highPriorityCompleted.length} high-priority item${highPriorityCompleted.length > 1 ? 's' : ''}`
      );
    }

    // Check if project management system is working
    if (fs.existsSync(path.join(this.reportsDir, 'quality-metrics.md'))) {
      achievements.push('📊 Quality metrics system operational');
    }

    if (fs.existsSync(path.join(this.projectRoot, 'docs', 'generated'))) {
      achievements.push('📚 Documentation generation system active');
    }

    if (achievements.length === 0) {
      achievements.push('🚀 Project management system initialized and ready');
    }

    return achievements;
  }

  getNextSteps(inProgress, pending) {
    const nextSteps = [];

    // Add in-progress items
    inProgress.forEach(item => {
      nextSteps.push(`🔄 Continue: ${item.title}`);
    });

    // Add high-priority pending items
    const highPriorityPending = pending.filter(item => item.priority === 'high');
    highPriorityPending.forEach(item => {
      nextSteps.push(`🔥 Start: ${item.title}`);
    });

    // Add medium-priority pending items (limit to 3)
    const mediumPriorityPending = pending.filter(item => item.priority === 'medium').slice(0, 3);
    mediumPriorityPending.forEach(item => {
      nextSteps.push(`📋 Plan: ${item.title}`);
    });

    if (nextSteps.length === 0) {
      nextSteps.push('🎉 All current work items completed! Consider adding new goals.');
    }

    return nextSteps;
  }

  async saveReport(report) {
    const dateStr = report.date;

    // Save JSON report
    fs.writeFileSync(
      path.join(this.reportsDir, `daily-report-${dateStr}.json`),
      JSON.stringify(report, null, 2)
    );

    // Save Markdown report
    const markdown = this.generateMarkdownReport(report);
    fs.writeFileSync(path.join(this.reportsDir, `daily-report-${dateStr}.md`), markdown);

    // Save latest report
    fs.writeFileSync(path.join(this.reportsDir, 'latest-daily-report.md'), markdown);

    console.log(`📄 Generated daily report for ${dateStr}`);
  }

  generateMarkdownReport(report) {
    return `# Daily Report - ${report.date}

Generated on: ${report.timestamp}

## 📊 Summary

- **Total Work Items**: ${report.summary.totalItems}
- **Completed**: ${report.summary.completed}
- **In Progress**: ${report.summary.inProgress}
- **Pending**: ${report.summary.pending}
- **Completed Today**: ${report.summary.completedToday}

## 📈 Project Stats

- **Project**: ${report.projectStats.projectName} v${report.projectStats.version}
- **Files**: ${report.projectStats.fileCount}
- **Lines of Code**: ${report.projectStats.lineCount}
- **Dependencies**: ${report.projectStats.dependencies}
- **Dev Dependencies**: ${report.projectStats.devDependencies}

## 🎯 Today's Achievements

${report.achievements.map(achievement => `- ${achievement}`).join('\n')}

## ✅ Completed Items

${
  report.workItems.completed.length > 0
    ? report.workItems.completed
        .map(item => `- **${item.title}** (${item.priority}) - ${item.description}`)
        .join('\n')
    : '- No completed items'
}

## 🔄 In Progress

${
  report.workItems.inProgress.length > 0
    ? report.workItems.inProgress
        .map(item => `- **${item.title}** (${item.priority}) - ${item.description}`)
        .join('\n')
    : '- No items in progress'
}

## 📋 Next Steps

${report.nextSteps.map(step => `- ${step}`).join('\n')}

## 🔮 Upcoming Work

${
  report.workItems.pending.length > 0
    ? report.workItems.pending
        .slice(0, 5)
        .map(item => `- **${item.title}** (${item.priority}) - ${item.description}`)
        .join('\n')
    : '- No pending items'
}

---

*Report generated by Project Management System*
`;
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new SimpleDailyReportGenerator();
  generator.generateDailyReport();
}

module.exports = { SimpleDailyReportGenerator };
