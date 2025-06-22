// Team data file for meat consulting company
// This file can be easily updated by adding, removing or changing employee information

import { TeamMember } from '../types/teamTypes';

// Example images use placeholder service, replace with real photos in actual project
const teamData: TeamMember[] = [
  {
    id: 'tm-001',
    name: 'Alexander Ludasik',
    position: 'Chief Meat Production Technologist',
    department: 'Production',
    bio: 'Expert in meat processing technologies with 8 years of experience. Specializes in developing new recipes and optimizing production processes.',
    imageUrl: 'https://via.placeholder.com/400x500?text=Alexander+L.',
    skills: [
      'Meat Processing',
      'HACCP',
      'Quality Control',
      'Recipe Development',
      'Production Optimization',
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/alexander-ludasik',
      twitter: 'https://twitter.com/alexander_meat',
      email: 'alexander@meatconsulting.com',
      github: 'https://github.com/alexander-meat',
    },
  },
  {
    id: 'tm-002',
    name: 'Maria Ludasik',
    position: 'Meat Products Marketing Specialist',
    department: 'Marketing',
    bio: 'Develops strategies for promoting meat products in Ukraine and abroad. Expert in branding and packaging of meat products.',
    imageUrl: 'https://via.placeholder.com/400x500?text=Maria+L.',
    skills: [
      'Food Product Marketing',
      'Branding',
      'Package Design',
      'Market Analysis',
      'Strategic Planning',
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/maria-ludasik',
      email: 'maria@meatconsulting.com',
    },
  },
  {
    id: 'tm-003',
    name: 'Ivan Ludasik',
    position: 'Meat Products Export Expert',
    department: 'Export',
    bio: 'Responsible for developing export directions and product certification for international markets. Has experience working with European quality standards.',
    imageUrl: 'https://via.placeholder.com/400x500?text=Ivan+L.',
    skills: [
      'International Trade',
      'Certification',
      'Logistics',
      'Customs Clearance',
      'International Standards',
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/ivan-ludasik',
      email: 'ivan@meatconsulting.com',
    },
  },
  {
    id: 'tm-004',
    name: 'Natalia Ludasik',
    position: 'Meat Market Analyst',
    department: 'Analytics',
    bio: 'Specializes in analyzing meat market trends in Ukraine and worldwide. Develops price forecasts and demand for various types of meat products.',
    imageUrl: 'https://via.placeholder.com/400x500?text=Natalia+L.',
    skills: [
      'Market Analysis',
      'Price Forecasting',
      'Consumer Research',
      'Export Analytics',
      'Statistical Analysis',
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/natalia-ludasik',
      twitter: 'https://twitter.com/natalia_meat',
      email: 'natalia@meatconsulting.com',
      github: 'https://github.com/natalia-market',
    },
  },
  {
    id: 'tm-005',
    name: 'Sergey Ludasik',
    position: 'Meat Processing Equipment Consultant',
    department: 'Technology',
    bio: 'Expert in selecting and configuring equipment for meat processing enterprises. Has experience in optimizing production lines and implementing new technologies.',
    imageUrl: 'https://via.placeholder.com/400x500?text=Sergey+L.',
    skills: [
      'Meat Processing Equipment',
      'Production Automation',
      'Energy Efficiency',
      'Technical Audit',
      'Workshop Design',
    ],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/sergey-ludasik',
      email: 'sergey@meatconsulting.com',
      github: 'https://github.com/sergey-tech',
    },
  },
  {
    id: 'tm-006',
    name: 'Julia Ludasik',
    position: 'Quality and Certification Specialist',
    department: 'Quality',
    bio: 'Responsible for implementing quality control systems at meat processing enterprises. Certified HACCP auditor and food safety expert.',
    imageUrl: 'https://via.placeholder.com/400x500?text=Julia+L.',
    skills: ['HACCP', 'ISO 22000', 'Quality Audit', 'Food Safety', 'Regulatory Documentation'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/julia-ludasik',
      email: 'julia@meatconsulting.com',
    },
  },
];

export { teamData };
