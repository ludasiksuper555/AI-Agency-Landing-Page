'use strict';
/**
 * Daily Work Summary Reporting System
 * Automatically generates and tracks daily development progress
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.dailyReporting = exports.DailyReportingSystem = void 0;
const fs_1 = require('fs');
const path_1 = require('path');
class DailyReportingSystem {
  constructor(reportsDir = './reports') {
    this.workItems = new Map();
    this.reportsDir = reportsDir;
    this.loadWorkItems();
  }
  /**
   * Add a new work item
   */
  addWorkItem(item) {
    const id = this.generateId();
    const workItem = {
      ...item,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workItems.set(id, workItem);
    this.saveWorkItems();
    return id;
  }
  /**
   * Update work item status
   */
  updateWorkItem(id, updates) {
    const item = this.workItems.get(id);
    if (!item) {
      throw new Error(`Work item ${id} not found`);
    }
    const updatedItem = {
      ...item,
      ...updates,
      updatedAt: new Date(),
    };
    if (updates.status === 'completed' && !item.completedAt) {
      updatedItem.completedAt = new Date();
    }
    this.workItems.set(id, updatedItem);
    this.saveWorkItems();
  }
  /**
   * Generate daily report
   */
  generateDailyReport(date = new Date().toISOString().split('T')[0]) {
    const todayItems = Array.from(this.workItems.values()).filter(item => {
      const itemDate = item.updatedAt.toISOString().split('T')[0];
      return itemDate === date;
    });
    const summary = {
      totalItems: todayItems.length,
      completed: todayItems.filter(item => item.status === 'completed').length,
      inProgress: todayItems.filter(item => item.status === 'in-progress').length,
      blocked: todayItems.filter(item => item.status === 'blocked').length,
      newItems: todayItems.filter(item => {
        const createdDate = item.createdAt.toISOString().split('T')[0];
        return createdDate === date;
      }).length,
    };
    const report = {
      date,
      summary,
      workItems: todayItems,
      achievements: this.generateAchievements(todayItems),
      challenges: this.generateChallenges(todayItems),
      nextDayPlans: this.generateNextDayPlans(),
      metrics: this.calculateMetrics(),
      businessValue: this.calculateBusinessValue(todayItems),
    };
    this.saveReport(report);
    return report;
  }
  /**
   * Get work items by status
   */
  getWorkItemsByStatus(status) {
    return Array.from(this.workItems.values()).filter(item => item.status === status);
  }
  /**
   * Get work items by type
   */
  getWorkItemsByType(type) {
    return Array.from(this.workItems.values()).filter(item => item.type === type);
  }
  generateId() {
    return `work-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  generateAchievements(items) {
    const completed = items.filter(item => item.status === 'completed');
    return completed.map(item => `✅ ${item.title}`);
  }
  generateChallenges(items) {
    const blocked = items.filter(item => item.status === 'blocked');
    return blocked.map(item => `🚫 ${item.title}: ${item.description}`);
  }
  generateNextDayPlans() {
    const inProgress = this.getWorkItemsByStatus('in-progress');
    const todo = this.getWorkItemsByStatus('todo')
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 5);
    return [
      ...inProgress.map(item => `🔄 Continue: ${item.title}`),
      ...todo.map(item => `📋 Start: ${item.title}`),
    ];
  }
  calculateMetrics() {
    // These would be calculated from actual project metrics
    return {
      codeQuality: 85,
      testCoverage: 78,
      performanceScore: 92,
      securityScore: 88,
    };
  }
  calculateBusinessValue(items) {
    const completed = items.filter(item => item.status === 'completed');
    return {
      featuresDelivered: completed.filter(item => item.type === 'feature').length,
      bugsFixed: completed.filter(item => item.type === 'bugfix').length,
      performanceImprovements: completed
        .filter(item => item.tags.includes('performance'))
        .map(item => item.title),
      userExperienceEnhancements: completed
        .filter(item => item.tags.includes('ux'))
        .map(item => item.title),
    };
  }
  loadWorkItems() {
    const filePath = (0, path_1.join)(this.reportsDir, 'work-items.json');
    if ((0, fs_1.existsSync)(filePath)) {
      try {
        const data = (0, fs_1.readFileSync)(filePath, 'utf-8');
        const items = JSON.parse(data);
        items.forEach(item => {
          this.workItems.set(item.id, {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
            completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
          });
        });
      } catch (error) {
        console.error('Failed to load work items:', error);
      }
    }
  }
  saveWorkItems() {
    const filePath = (0, path_1.join)(this.reportsDir, 'work-items.json');
    const items = Array.from(this.workItems.values());
    (0, fs_1.writeFileSync)(filePath, JSON.stringify(items, null, 2));
  }
  saveReport(report) {
    const filePath = (0, path_1.join)(this.reportsDir, `daily-${report.date}.json`);
    (0, fs_1.writeFileSync)(filePath, JSON.stringify(report, null, 2));
  }
}
exports.DailyReportingSystem = DailyReportingSystem;
// Global reporting system instance
exports.dailyReporting = new DailyReportingSystem();
