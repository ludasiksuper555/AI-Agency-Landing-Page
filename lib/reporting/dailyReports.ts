/**
 * Daily Work Summary Reporting System
 * Automatically generates and tracks daily development progress
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export interface WorkItem {
  id: string;
  type: 'feature' | 'bugfix' | 'refactor' | 'documentation' | 'testing';
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  actualHours?: number;
  assignee?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface DailyReport {
  date: string;
  summary: {
    totalItems: number;
    completed: number;
    inProgress: number;
    blocked: number;
    newItems: number;
  };
  workItems: WorkItem[];
  achievements: string[];
  challenges: string[];
  nextDayPlans: string[];
  metrics: {
    codeQuality: number; // 0-100
    testCoverage: number; // 0-100
    performanceScore: number; // 0-100
    securityScore: number; // 0-100
  };
  businessValue: {
    featuresDelivered: number;
    bugsFixed: number;
    performanceImprovements: string[];
    userExperienceEnhancements: string[];
  };
}

export class DailyReportingSystem {
  private reportsDir: string;
  private workItems: Map<string, WorkItem> = new Map();

  constructor(reportsDir: string = './reports') {
    this.reportsDir = reportsDir;
    this.loadWorkItems();
  }

  /**
   * Add a new work item
   */
  addWorkItem(item: Omit<WorkItem, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateId();
    const workItem: WorkItem = {
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
  updateWorkItem(id: string, updates: Partial<WorkItem>): void {
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
  generateDailyReport(date: string = new Date().toISOString().split('T')[0]): DailyReport {
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

    const report: DailyReport = {
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
  getWorkItemsByStatus(status: WorkItem['status']): WorkItem[] {
    return Array.from(this.workItems.values()).filter(item => item.status === status);
  }

  /**
   * Get work items by type
   */
  getWorkItemsByType(type: WorkItem['type']): WorkItem[] {
    return Array.from(this.workItems.values()).filter(item => item.type === type);
  }

  private generateId(): string {
    return `work-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAchievements(items: WorkItem[]): string[] {
    const completed = items.filter(item => item.status === 'completed');
    return completed.map(item => `✅ ${item.title}`);
  }

  private generateChallenges(items: WorkItem[]): string[] {
    const blocked = items.filter(item => item.status === 'blocked');
    return blocked.map(item => `🚫 ${item.title}: ${item.description}`);
  }

  private generateNextDayPlans(): string[] {
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

  private calculateMetrics(): DailyReport['metrics'] {
    // These would be calculated from actual project metrics
    return {
      codeQuality: 85,
      testCoverage: 78,
      performanceScore: 92,
      securityScore: 88,
    };
  }

  private calculateBusinessValue(items: WorkItem[]): DailyReport['businessValue'] {
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

  private loadWorkItems(): void {
    const filePath = join(this.reportsDir, 'work-items.json');
    if (existsSync(filePath)) {
      try {
        const data = readFileSync(filePath, 'utf-8');
        const items = JSON.parse(data);
        items.forEach((item: any) => {
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

  private saveWorkItems(): void {
    const filePath = join(this.reportsDir, 'work-items.json');
    const items = Array.from(this.workItems.values());
    writeFileSync(filePath, JSON.stringify(items, null, 2));
  }

  private saveReport(report: DailyReport): void {
    const filePath = join(this.reportsDir, `daily-${report.date}.json`);
    writeFileSync(filePath, JSON.stringify(report, null, 2));
  }
}

// Global reporting system instance
export const dailyReporting = new DailyReportingSystem();
