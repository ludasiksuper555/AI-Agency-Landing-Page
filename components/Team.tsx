'use client';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { teamData } from '../data/teamData';
import { TeamFilters } from '../types/teamTypes';
import {
  filterTeamByDepartment,
  filterTeamByPosition,
  getUniqueDepartments,
  getUniquePositions,
  searchTeamMembers,
  sortTeamMembers,
  TeamMember,
} from '../utils/teamUtils';
import TeamExport from './TeamExport';

const TeamMemberCard: React.FC<{ member: TeamMember }> = ({ member }) => {
  const { t } = useTranslation('common');

  const handleSocialClick = (url: string) => () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (url: string) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="bg-white rounded-lg shadow-lg overflow-hidden"
    >
      <div className="relative h-64 w-full">
        {member.imageUrl ? (
          <Image
            src={member.imageUrl}
            alt={`${t('team.photo')} ${member.name}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
        <p className="text-blue-600 mb-4">{member.position}</p>
        {member.department && <p className="text-gray-500 mb-2">{member.department}</p>}
        <p className="text-gray-600 mb-4">{member.bio}</p>

        {member.skills && member.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {member.skills.map(skill => (
                <span
                  key={skill}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {member.socialLinks && (
          <div className="flex space-x-4">
            {member.socialLinks.linkedin && (
              <div
                className="text-gray-600 hover:text-blue-600 cursor-pointer transition-colors"
                onClick={handleSocialClick(member.socialLinks.linkedin)}
                onKeyDown={handleKeyDown(member.socialLinks.linkedin)}
                tabIndex={0}
                aria-label={`${t('team.socialLinks.linkedin')} ${member.name}`}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </div>
            )}

            {member.socialLinks.twitter && (
              <div
                className="text-gray-600 hover:text-blue-400 cursor-pointer transition-colors"
                onClick={handleSocialClick(member.socialLinks.twitter)}
                onKeyDown={handleKeyDown(member.socialLinks.twitter)}
                tabIndex={0}
                aria-label={`${t('team.socialLinks.twitter')} ${member.name}`}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </div>
            )}

            {member.socialLinks.email && (
              <div
                className="text-gray-600 hover:text-red-500 cursor-pointer transition-colors"
                onClick={handleSocialClick(`mailto:${member.socialLinks.email}`)}
                onKeyDown={handleKeyDown(`mailto:${member.socialLinks.email}`)}
                tabIndex={0}
                aria-label={`${t('team.socialLinks.email')} ${member.name}`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            {member.socialLinks.github && (
              <div
                className="text-gray-600 hover:text-gray-900 cursor-pointer transition-colors"
                onClick={handleSocialClick(member.socialLinks.github)}
                onKeyDown={handleKeyDown(member.socialLinks.github)}
                tabIndex={0}
                aria-label={`${t('team.socialLinks.github')} ${member.name}`}
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const Team: React.FC = () => {
  const { t } = useTranslation('common');

  const [filters, setFilters] = useState<TeamFilters>({
    searchTerm: '',
    position: 'all',
    department: 'all',
    sortBy: 'name',
    sortDirection: 'asc',
  });

  // Convert base TeamMember to extended TeamMember with default values
  const extendedTeamData: TeamMember[] = teamData.map(member => ({
    ...member,
    email: member.socialLinks?.email || '',
    role: member.position,
    availability: true,
    workload: 80, // default 80% workload
  }));

  const [filteredTeam, setFilteredTeam] = useState<TeamMember[]>(extendedTeamData);
  const [uniquePositions, setUniquePositions] = useState<string[]>([]);
  const [uniqueDepartments, setUniqueDepartments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Оновлення фільтрованих даних при зміні фільтрів
  useEffect(() => {
    let result = [...extendedTeamData];

    // Фільтрація за посадою
    result = filterTeamByPosition(result, filters.position);

    // Фільтрація за відділом
    if (filters.department) {
      result = filterTeamByDepartment(result, filters.department);
    }

    // Пошук за ключовим словом
    result = searchTeamMembers(result, filters.searchTerm);

    // Сортування
    result = sortTeamMembers(result, filters.sortBy, filters.sortDirection === 'asc');

    setFilteredTeam(result);
  }, [filters, extendedTeamData]);

  // Отримання унікальних посад та відділів при завантаженні компонента
  useEffect(() => {
    setIsLoading(true);

    // Simulate loading delay
    const timer = setTimeout(() => {
      setUniquePositions(getUniquePositions(extendedTeamData));
      setUniqueDepartments(getUniqueDepartments(extendedTeamData));
      setFilteredTeam(extendedTeamData);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [extendedTeamData]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
  }, []);

  const handlePositionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, position: e.target.value }));
  }, []);

  const handleDepartmentChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, department: e.target.value }));
  }, []);

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortBy, sortDirection] = e.target.value.split('-') as [
      TeamFilters['sortBy'],
      TeamFilters['sortDirection'],
    ];
    setFilters(prev => ({ ...prev, sortBy, sortDirection }));
  }, []);

  // Мемоізація анімацій для покращення продуктивності
  // Мемоізація анімацій для покращення продуктивності
  const containerAnimation = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
        },
      },
    }),
    []
  );

  // Мемоізація статистики команди
  const teamStats = useMemo(() => {
    const positionStats = teamData.reduce(
      (acc, member) => {
        const position = member.position;
        acc[position] = (acc[position] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const departmentStats = teamData.reduce(
      (acc, member) => {
        if (member.department) {
          acc[member.department] = (acc[member.department] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalMembers: teamData.length,
      byPosition: positionStats,
      byDepartment: departmentStats,
    };
  }, []);

  return (
    <div id="team" className="py-20 bg-gray-50">
      <motion.div
        className="container mx-auto px-4"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('team.title')}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{t('team.description')}</p>
        </motion.div>

        {/* Статистика команди */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-10 p-6 bg-white rounded-lg shadow-md"
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('team.stats.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">{t('team.stats.totalCount')}</p>
              <p className="text-2xl font-bold text-blue-600">{teamStats.totalMembers}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">{t('team.stats.positionsCount')}</p>
              <p className="text-2xl font-bold text-green-600">
                {Object.keys(teamStats.byPosition).length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">{t('team.stats.departmentsCount')}</p>
              <p className="text-2xl font-bold text-purple-600">
                {Object.keys(teamStats.byDepartment).length}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Фільтри та пошук */}
        <div className="mb-10 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-1/5">
            <input
              type="text"
              placeholder={t('team.filters.searchPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={filters.searchTerm}
              onChange={handleSearchChange}
              aria-label={t('team.filters.searchPlaceholder')}
            />
          </div>

          <div className="w-full md:w-1/5">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={filters.position}
              onChange={handlePositionChange}
              aria-label={t('team.filters.positionLabel')}
            >
              <option value="all">{t('team.filters.allPositions')}</option>
              {uniquePositions.map(position => (
                <option key={position} value={position.toLowerCase()}>
                  {position}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/5">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={filters.department}
              onChange={handleDepartmentChange}
              aria-label={t('team.filters.departmentLabel')}
            >
              <option value="all">{t('team.filters.allDepartments')}</option>
              {uniqueDepartments.map(department => (
                <option key={department} value={department.toLowerCase()}>
                  {department}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-1/5">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              value={`${filters.sortBy}-${filters.sortDirection}`}
              onChange={handleSortChange}
              aria-label={t('team.filters.sortLabel')}
            >
              <option value="name-asc">{t('team.filters.sortNameAsc')}</option>
              <option value="name-desc">{t('team.filters.sortNameDesc')}</option>
              <option value="position-asc">{t('team.filters.sortPositionAsc')}</option>
              <option value="position-desc">{t('team.filters.sortPositionDesc')}</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <TeamExport teamMembers={filteredTeam} />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredTeam.length > 0 ? (
          <motion.div
            variants={containerAnimation}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredTeam.map(member => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-10"
          >
            <p className="text-xl text-gray-600">{t('team.noResults')}</p>
            <button
              onClick={() =>
                setFilters({
                  searchTerm: '',
                  position: 'all',
                  department: 'all',
                  sortBy: 'name',
                  sortDirection: 'asc',
                })
              }
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              aria-label={t('team.filters.resetButton')}
            >
              {t('team.filters.resetButton')}
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Team;
