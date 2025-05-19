/**
 * Утиліти для роботи з даними про команду
 * Ці функції дозволяють легко фільтрувати, сортувати та оновлювати дані про співробітників
 */

import { TeamMember } from '../types/teamTypes';

/**
 * Фільтрує членів команди за посадою
 * @param teamMembers - масив членів команди
 * @param position - посада для фільтрації (або 'all' для всіх)
 * @returns відфільтрований масив членів команди
 */
export const filterTeamByPosition = (teamMembers: TeamMember[], position: string): TeamMember[] => {
  if (position === 'all') return teamMembers;
  return teamMembers.filter(member => 
    member.position.toLowerCase().includes(position.toLowerCase())
  );
};

/**
 * Шукає членів команди за ключовим словом у імені або посаді
 * @param teamMembers - масив членів команди
 * @param searchTerm - пошуковий запит
 * @returns відфільтрований масив членів команди
 */
export const searchTeamMembers = (teamMembers: TeamMember[], searchTerm: string): TeamMember[] => {
  if (!searchTerm.trim()) return teamMembers;
  
  const term = searchTerm.toLowerCase().trim();
  return teamMembers.filter(member => 
    member.name.toLowerCase().includes(term) || 
    member.position.toLowerCase().includes(term) ||
    member.bio.toLowerCase().includes(term)
  );
};

/**
 * Сортує членів команди за різними критеріями
 * @param teamMembers - масив членів команди
 * @param sortBy - критерій сортування ('name', 'position', або 'id')
 * @param ascending - напрямок сортування (true для зростання, false для спадання)
 * @returns відсортований масив членів команди
 */
export const sortTeamMembers = (
  teamMembers: TeamMember[], 
  sortBy: 'name' | 'position' | 'id' = 'name', 
  ascending: boolean = true
): TeamMember[] => {
  const sortedMembers = [...teamMembers];
  
  sortedMembers.sort((a, b) => {
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
      default:
        comparison = 0;
    }
    
    return ascending ? comparison : -comparison;
  });
  
  return sortedMembers;
};

/**
 * Групує членів команди за посадою
 * @param teamMembers - масив членів команди
 * @returns об'єкт, де ключі - посади, а значення - масиви членів команди
 */
export const groupTeamByPosition = (teamMembers: TeamMember[]): Record<string, TeamMember[]> => {
  return teamMembers.reduce((groups, member) => {
    const position = member.position;
    if (!groups[position]) {
      groups[position] = [];
    }
    groups[position].push(member);
    return groups;
  }, {} as Record<string, TeamMember[]>);
};

/**
 * Отримує унікальні посади з масиву членів команди
 * @param teamMembers - масив членів команди
 * @returns масив унікальних посад
 */
export const getUniquePositions = (teamMembers: TeamMember[]): string[] => {
  const positions = teamMembers.map(member => member.position);
  return [...new Set(positions)];
};