import React, { useState } from 'react';

import { TeamMember } from '../types/teamTypes';

interface TeamExportProps {
  teamMembers: TeamMember[];
}

const TeamExport: React.FC<TeamExportProps> = ({ teamMembers }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);

    try {
      // Підготовка заголовків CSV
      const headers = [
        'ID',
        "Ім'я",
        'Посада',
        'Відділ',
        'Біографія',
        'Навички',
        'Email',
        'LinkedIn',
        'Twitter',
        'GitHub',
      ];

      // Підготовка даних
      const csvData = teamMembers.map(member => {
        const skills = member.skills ? member.skills.join(', ') : '';
        const email = member.socialLinks?.email || '';
        const linkedin = member.socialLinks?.linkedin || '';
        const twitter = member.socialLinks?.twitter || '';
        const github = member.socialLinks?.github || '';

        return [
          member.id,
          member.name,
          member.position,
          member.department || '',
          member.bio,
          skills,
          email,
          linkedin,
          twitter,
          github,
        ];
      });

      // Об'єднання заголовків та даних
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      // Створення Blob та посилання для завантаження
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      // Створення елемента для завантаження
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `team-data-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';

      // Додавання до DOM, клік та видалення
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Очищення URL
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Помилка при експорті даних:', error);
      alert('Виникла помилка при експорті даних. Будь ласка, спробуйте ще раз.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={exportToCSV}
      disabled={isExporting || teamMembers.length === 0}
      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
      aria-label="Експортувати дані команди в CSV"
    >
      {isExporting ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          Експортування...
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Експортувати дані
        </>
      )}
    </button>
  );
};

export default TeamExport;
