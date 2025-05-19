/**
 * Типи для роботи з даними про команду
 * Ці типи забезпечують типову безпеку при роботі з даними про співробітників
 */

/**
 * Тип для соціальних посилань члена команди
 */
export type SocialLinks = {
  linkedin?: string;
  twitter?: string;
  email?: string;
  github?: string;
  facebook?: string;
  instagram?: string;
};

/**
 * Тип для члена команди
 */
export type TeamMember = {
  id: string;
  name: string;
  position: string;
  bio: string;
  imageUrl: string;
  socialLinks?: SocialLinks;
  skills?: string[];
  projects?: string[];
  startDate?: string;
  department?: string;
};

/**
 * Тип для фільтрів команди
 */
export type TeamFilters = {
  searchTerm: string;
  position: string;
  department?: string;
  sortBy: 'name' | 'position' | 'id' | 'startDate';
  sortDirection: 'asc' | 'desc';
};

/**
 * Тип для статистики команди
 */
export type TeamStats = {
  totalMembers: number;
  byDepartment: Record<string, number>;
  byPosition: Record<string, number>;
};