// Утилиты для работы с командами

import { TeamMember as BaseTeamMember } from '../types/teamTypes';

// Расширенный интерфейс для утилит команд
export interface TeamMember extends BaseTeamMember {
  email: string;
  role: string;
  availability: boolean;
  workload: number; // процент загрузки
}

interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  leader: string; // ID лидера команды
  projects: string[]; // ID проектов
  created: Date;
  status: 'active' | 'inactive' | 'archived';
}

interface Project {
  id: string;
  name: string;
  description: string;
  teamId: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface TeamAnalytics {
  teamId: string;
  totalMembers: number;
  averageWorkload: number;
  skillDistribution: Record<string, number>;
  projectsCompleted: number;
  efficiency: number;
}

// Класс для управления командами
export class TeamManager {
  private teams: Map<string, Team> = new Map();
  private members: Map<string, TeamMember> = new Map();
  private projects: Map<string, Project> = new Map();

  // Создание новой команды
  createTeam(teamData: Omit<Team, 'id' | 'created'>): Team {
    const team: Team = {
      ...teamData,
      id: this.generateId(),
      created: new Date(),
    };

    this.teams.set(team.id, team);
    return team;
  }

  // Добавление участника в команду
  addMemberToTeam(teamId: string, member: Omit<TeamMember, 'id'>): boolean {
    const team = this.teams.get(teamId);
    if (!team) return false;

    const newMember: TeamMember = {
      ...member,
      id: this.generateId(),
    };

    this.members.set(newMember.id, newMember);
    team.members.push(newMember);
    this.teams.set(teamId, team);

    return true;
  }

  // Удаление участника из команды
  removeMemberFromTeam(teamId: string, memberId: string): boolean {
    const team = this.teams.get(teamId);
    if (!team) return false;

    team.members = team.members.filter(member => member.id !== memberId);
    this.members.delete(memberId);
    this.teams.set(teamId, team);

    return true;
  }

  // Поиск участников по навыкам
  findMembersBySkills(skills: string[]): TeamMember[] {
    const allMembers = Array.from(this.members.values());

    return allMembers.filter(
      member => member.skills && skills.some(skill => member.skills!.includes(skill))
    );
  }

  // Получение доступных участников
  getAvailableMembers(maxWorkload: number = 80): TeamMember[] {
    const allMembers = Array.from(this.members.values());

    return allMembers.filter(member => member.availability && member.workload <= maxWorkload);
  }

  // Анализ команды
  analyzeTeam(teamId: string): TeamAnalytics | null {
    const team = this.teams.get(teamId);
    if (!team) return null;

    const skillDistribution: Record<string, number> = {};
    let totalWorkload = 0;

    team.members.forEach(member => {
      totalWorkload += member.workload;
      if (member.skills) {
        member.skills.forEach(skill => {
          skillDistribution[skill] = (skillDistribution[skill] || 0) + 1;
        });
      }
    });

    const completedProjects = team.projects.filter(projectId => {
      const project = this.projects.get(projectId);
      return project?.status === 'completed';
    }).length;

    return {
      teamId,
      totalMembers: team.members.length,
      averageWorkload: team.members.length > 0 ? totalWorkload / team.members.length : 0,
      skillDistribution,
      projectsCompleted: completedProjects,
      efficiency: this.calculateTeamEfficiency(team),
    };
  }

  // Рекомендации по составу команды
  getTeamRecommendations(requiredSkills: string[], teamSize: number): TeamMember[] {
    const availableMembers = this.getAvailableMembers();
    const recommendations: TeamMember[] = [];
    const skillsCovered = new Set<string>();

    // Сначала добавляем участников с нужными навыками
    for (const skill of Array.from(requiredSkills)) {
      const memberWithSkill = availableMembers.find(
        member =>
          member.skills && member.skills.includes(skill) && !recommendations.includes(member)
      );

      if (memberWithSkill) {
        recommendations.push(memberWithSkill);
        if (memberWithSkill.skills) {
          memberWithSkill.skills.forEach(s => skillsCovered.add(s));
        }
      }
    }

    // Добавляем дополнительных участников до нужного размера
    while (recommendations.length < teamSize) {
      const nextMember = availableMembers.find(member => !recommendations.includes(member));

      if (!nextMember) break;
      recommendations.push(nextMember);
    }

    return recommendations;
  }

  // Балансировка нагрузки в команде
  balanceTeamWorkload(teamId: string): boolean {
    const team = this.teams.get(teamId);
    if (!team) return false;

    const totalWorkload = team.members.reduce((sum, member) => sum + member.workload, 0);
    const averageWorkload = totalWorkload / team.members.length;

    team.members.forEach(member => {
      if (member.workload > averageWorkload + 20) {
        // Перераспределяем нагрузку
        const excess = member.workload - averageWorkload;
        member.workload = averageWorkload;

        // Находим участника с наименьшей нагрузкой
        const leastBusyMember = team.members.reduce((min, current) =>
          current.workload < min.workload ? current : min
        );

        leastBusyMember.workload += excess / 2;
      }
    });

    this.teams.set(teamId, team);
    return true;
  }

  // Генерация уникального ID
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Расчет эффективности команды
  private calculateTeamEfficiency(team: Team): number {
    const completedProjects = team.projects.filter(projectId => {
      const project = this.projects.get(projectId);
      return project?.status === 'completed';
    }).length;

    const totalProjects = team.projects.length;
    const averageWorkload =
      team.members.reduce((sum, member) => sum + member.workload, 0) / team.members.length;

    // Простая формула эффективности
    const completionRate = totalProjects > 0 ? completedProjects / totalProjects : 0;
    const workloadFactor = Math.max(0, 1 - (averageWorkload - 70) / 30); // оптимальная нагрузка 70%

    return Math.round(completionRate * workloadFactor * 100);
  }

  // Получение всех команд
  getAllTeams(): Team[] {
    return Array.from(this.teams.values());
  }

  // Получение команды по ID
  getTeam(teamId: string): Team | undefined {
    return this.teams.get(teamId);
  }

  // Получение участника по ID
  getMember(memberId: string): TeamMember | undefined {
    return this.members.get(memberId);
  }
}

// Утилитарные функции
export function calculateTeamCompatibility(member1: TeamMember, member2: TeamMember): number {
  if (!member1.skills || !member2.skills) return 0;

  const commonSkills = member1.skills.filter(skill => member2.skills!.includes(skill));
  const totalSkills = new Set([...Array.from(member1.skills), ...Array.from(member2.skills)]).size;

  return totalSkills > 0 ? (commonSkills.length / totalSkills) * 100 : 0;
}

export function findOptimalTeamSize(
  projectComplexity: 'low' | 'medium' | 'high' | 'critical'
): number {
  const sizeMap = {
    low: 3,
    medium: 5,
    high: 7,
    critical: 10,
  };

  return sizeMap[projectComplexity];
}

export function generateTeamReport(team: Team, analytics: TeamAnalytics): string {
  return `
Отчет по команде: ${team.name}
=================================
Участников: ${analytics.totalMembers}
Средняя нагрузка: ${analytics.averageWorkload.toFixed(1)}%
Завершенных проектов: ${analytics.projectsCompleted}
Эффективность: ${analytics.efficiency}%
Статус: ${team.status}

Распределение навыков:
${Object.entries(analytics.skillDistribution)
  .map(([skill, count]) => `- ${skill}: ${count} чел.`)
  .join('\n')}
`;
}

// Функции для фильтрации и поиска команд
// Team filtering and utility functions for the Team component
import { TeamFilters } from '../types/teamTypes';

/**
 * Filter team members by position
 * @param members - Array of team members
 * @param position - Position to filter by ('all' for no filter)
 * @returns Filtered array of team members
 */
export function filterTeamByPosition(members: TeamMember[], position: string): TeamMember[] {
  if (position === 'all') return members;
  return members.filter(member => member.position.toLowerCase() === position.toLowerCase());
}

/**
 * Get unique positions from team members
 * @param members - Array of team members
 * @returns Array of unique positions
 */
export function getUniquePositions(members: TeamMember[]): string[] {
  return Array.from(new Set(members.map(member => member.position)));
}

/**
 * Search team members by term
 * @param members - Array of team members
 * @param searchTerm - Search term to filter by
 * @returns Filtered array of team members
 */
export function searchTeamMembers(members: TeamMember[], searchTerm: string): TeamMember[] {
  if (!searchTerm.trim()) return members;

  const term = searchTerm.toLowerCase().trim();
  return members.filter(
    member =>
      member.name.toLowerCase().includes(term) ||
      member.position.toLowerCase().includes(term) ||
      member.bio.toLowerCase().includes(term) ||
      (member.department && member.department.toLowerCase().includes(term)) ||
      (member.skills && member.skills.some(skill => skill.toLowerCase().includes(term)))
  );
}

/**
 * Sort team members by specified criteria
 * @param members - Array of team members
 * @param sortBy - Sort criteria
 * @param ascending - Sort direction (true for ascending, false for descending)
 * @returns Sorted array of team members
 */
export function sortTeamMembers(
  members: TeamMember[],
  sortBy: TeamFilters['sortBy'],
  ascending: boolean = true
): TeamMember[] {
  const sortedMembers = [...members].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'position':
        comparison = a.position.localeCompare(b.position);
        break;
      case 'id':
        comparison = a.id.localeCompare(b.id);
        break;
      case 'startDate':
        if (a.startDate && b.startDate) {
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
        } else if (a.startDate) {
          comparison = -1;
        } else if (b.startDate) {
          comparison = 1;
        }
        break;
      default:
        comparison = 0;
    }

    return ascending ? comparison : -comparison;
  });

  return sortedMembers;
}

/**
 * Get unique departments from team members
 * @param members - Array of team members
 * @returns Array of unique departments
 */
export function getUniqueDepartments(members: TeamMember[]): string[] {
  const departments = members
    .map(member => member.department)
    .filter((dept): dept is string => Boolean(dept));
  return Array.from(new Set(departments));
}

/**
 * Filter team members by department
 * @param members - Array of team members
 * @param department - Department to filter by ('all' for no filter)
 * @returns Filtered array of team members
 */
export function filterTeamByDepartment(members: TeamMember[], department: string): TeamMember[] {
  if (department === 'all') return members;
  return members.filter(member => member.department?.toLowerCase() === department.toLowerCase());
}
