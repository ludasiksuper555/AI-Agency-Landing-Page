import axios from 'axios';

interface SearchParams {
  keywords: string;
  minBudget?: number;
  maxBudget?: number;
  platforms: string[];
  limit?: number;
  category?: string;
  location?: string;
  sortBy?: string;
}

interface ProposalParams {
  projectId: string;
  tone: 'professional' | 'friendly' | 'formal';
  length: 'short' | 'medium' | 'detailed';
  customText?: string;
}

interface BotSettings {
  searchInterval: number;
  autoApply: boolean;
  platforms: string[];
  keywords: string;
  minBudget: number;
  maxBudget: number;
}

interface BotStats {
  totalProjects: number;
  proposalsSent: number;
  responseRate: number;
  activeSearches: number;
  dailyEarnings: number;
  weeklyEarnings: number;
  isRunning: boolean;
  lastUpdate: string;
}

interface Project {
  id: string;
  title: string;
  platform: string;
  budget: string;
  description: string;
  postedAt: string;
  status: string;
  clientRating: number;
}

interface Proposal {
  id: string;
  projectId: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

class BotService {
  private apiUrl: string;

  constructor() {
    // В реальному проекті URL має бути в .env файлі
    this.apiUrl = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';
  }

  // Отримання статистики бота
  async getBotStats(): Promise<BotStats> {
    try {
      const response = await axios.get(`${this.apiUrl}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bot stats:', error);
      throw error;
    }
  }

  // Отримання списку проектів
  async getProjects(page: number = 1, limit: number = 10): Promise<Project[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/projects`, {
        params: { page, limit },
      });
      return response.data.projects;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  }

  // Отримання списку пропозицій
  async getProposals(page: number = 1, limit: number = 10): Promise<Proposal[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/proposals`, {
        params: { page, limit },
      });
      return response.data.proposals;
    } catch (error) {
      console.error('Error fetching proposals:', error);
      throw error;
    }
  }

  // Запуск пошуку проектів
  async startSearch(params: SearchParams): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(`${this.apiUrl}/search/start`, params);
      return response.data;
    } catch (error) {
      console.error('Error starting search:', error);
      throw error;
    }
  }

  // Зупинка пошуку проектів
  async stopSearch(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(`${this.apiUrl}/search/stop`);
      return response.data;
    } catch (error) {
      console.error('Error stopping search:', error);
      throw error;
    }
  }

  // Генерація пропозиції
  async generateProposal(params: ProposalParams): Promise<{ proposal: string }> {
    try {
      const response = await axios.post(`${this.apiUrl}/proposals/generate`, params);
      return response.data;
    } catch (error) {
      console.error('Error generating proposal:', error);
      throw error;
    }
  }

  // Відправка пропозиції
  async sendProposal(
    projectId: string,
    content: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(`${this.apiUrl}/proposals/send`, {
        projectId,
        content,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending proposal:', error);
      throw error;
    }
  }

  // Оновлення налаштувань бота
  async updateSettings(settings: BotSettings): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.put(`${this.apiUrl}/settings`, settings);
      return response.data;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  // Отримання налаштувань бота
  async getSettings(): Promise<BotSettings> {
    try {
      const response = await axios.get(`${this.apiUrl}/settings`);
      return response.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }

  // Отримання деталей проекту
  async getProjectDetails(projectId: string): Promise<Project> {
    try {
      const response = await axios.get(`${this.apiUrl}/projects/${projectId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching project details for ID ${projectId}:`, error);
      throw error;
    }
  }

  // Отримання аналітики
  async getAnalytics(period: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/analytics`, {
        params: { period },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }

  // Перевірка статусу бота
  async checkBotStatus(): Promise<{ isRunning: boolean }> {
    try {
      const response = await axios.get(`${this.apiUrl}/status`);
      return response.data;
    } catch (error) {
      console.error('Error checking bot status:', error);
      throw error;
    }
  }
}

// Експортуємо єдиний екземпляр сервісу для використання в усьому додатку
export const botService = new BotService();

// Експортуємо типи для використання в компонентах
export type { BotSettings, BotStats, Project, Proposal, ProposalParams, SearchParams };
