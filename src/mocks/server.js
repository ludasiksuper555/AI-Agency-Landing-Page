/**
 * Mock Service Worker (MSW) Server Setup
 * Provides API mocking for testing the enhanced team portfolio project
 */

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Mock team data
const mockTeamMembers = [
  {
    id: '1',
    name: 'John Doe',
    position: 'Frontend Developer',
    department: 'Engineering',
    bio: 'Experienced frontend developer with expertise in React and TypeScript',
    imageUrl: '/images/team/john-doe.jpg',
    socialLinks: {
      twitter: 'https://twitter.com/johndoe',
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
      email: 'john@example.com',
    },
    skills: ['React', 'TypeScript', 'Next.js', 'JavaScript', 'CSS', 'HTML'],
    projects: ['E-commerce Platform', 'Dashboard Analytics'],
    startDate: '2022-01-15',
    isActive: true,
    location: 'New York, USA',
    timezone: 'EST',
  },
  {
    id: '2',
    name: 'Jane Smith',
    position: 'Backend Developer',
    department: 'Engineering',
    bio: 'Backend specialist with extensive Node.js and database expertise',
    imageUrl: '/images/team/jane-smith.jpg',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/janesmith',
      github: 'https://github.com/janesmith',
      email: 'jane@example.com',
    },
    skills: ['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker'],
    projects: ['API Gateway', 'Microservices Architecture'],
    startDate: '2021-06-10',
    isActive: true,
    location: 'San Francisco, USA',
    timezone: 'PST',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    position: 'UI/UX Designer',
    department: 'Design',
    bio: 'Creative designer focused on user experience and interface design',
    imageUrl: '/images/team/mike-johnson.jpg',
    socialLinks: {
      dribbble: 'https://dribbble.com/mikejohnson',
      behance: 'https://behance.net/mikejohnson',
      email: 'mike@example.com',
    },
    skills: ['Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'Prototyping'],
    projects: ['Mobile App Design', 'Brand Identity'],
    startDate: '2023-03-01',
    isActive: true,
    location: 'London, UK',
    timezone: 'GMT',
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    position: 'Product Manager',
    department: 'Product',
    bio: 'Strategic product manager with focus on user-centered design',
    imageUrl: '/images/team/sarah-wilson.jpg',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/sarahwilson',
      twitter: 'https://twitter.com/sarahwilson',
      email: 'sarah@example.com',
    },
    skills: ['Product Strategy', 'User Research', 'Analytics', 'Agile', 'Scrum', 'Roadmapping'],
    projects: ['Product Roadmap 2024', 'User Research Initiative'],
    startDate: '2020-09-15',
    isActive: true,
    location: 'Toronto, Canada',
    timezone: 'EST',
  },
  {
    id: '5',
    name: 'David Chen',
    position: 'DevOps Engineer',
    department: 'Engineering',
    bio: 'DevOps specialist ensuring reliable and scalable infrastructure',
    imageUrl: '/images/team/david-chen.jpg',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/davidchen',
      github: 'https://github.com/davidchen',
      email: 'david@example.com',
    },
    skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'Jenkins', 'Monitoring'],
    projects: ['CI/CD Pipeline', 'Infrastructure Automation'],
    startDate: '2021-11-20',
    isActive: true,
    location: 'Seattle, USA',
    timezone: 'PST',
  },
  {
    id: '6',
    name: 'Emily Rodriguez',
    position: 'QA Engineer',
    department: 'Engineering',
    bio: 'Quality assurance engineer ensuring product reliability and performance',
    imageUrl: '/images/team/emily-rodriguez.jpg',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/emilyrodriguez',
      email: 'emily@example.com',
    },
    skills: [
      'Test Automation',
      'Selenium',
      'Jest',
      'Cypress',
      'Performance Testing',
      'API Testing',
    ],
    projects: ['Test Automation Framework', 'Performance Optimization'],
    startDate: '2022-08-05',
    isActive: true,
    location: 'Austin, USA',
    timezone: 'CST',
  },
];

// Mock departments data
const mockDepartments = [
  {
    id: 'engineering',
    name: 'Engineering',
    description: 'Building and maintaining our technical infrastructure',
    memberCount: 4,
    lead: 'John Doe',
  },
  {
    id: 'design',
    name: 'Design',
    description: 'Creating beautiful and intuitive user experiences',
    memberCount: 1,
    lead: 'Mike Johnson',
  },
  {
    id: 'product',
    name: 'Product',
    description: 'Defining product strategy and user requirements',
    memberCount: 1,
    lead: 'Sarah Wilson',
  },
];

// Mock positions data
const mockPositions = [
  'Frontend Developer',
  'Backend Developer',
  'UI/UX Designer',
  'Product Manager',
  'DevOps Engineer',
  'QA Engineer',
];

// Mock projects data
const mockProjects = [
  {
    id: '1',
    name: 'E-commerce Platform',
    description: 'Modern e-commerce solution with React and Node.js',
    status: 'active',
    teamMembers: ['1', '2'],
    technologies: ['React', 'Node.js', 'PostgreSQL'],
  },
  {
    id: '2',
    name: 'Dashboard Analytics',
    description: 'Real-time analytics dashboard for business insights',
    status: 'completed',
    teamMembers: ['1', '4'],
    technologies: ['React', 'D3.js', 'Python'],
  },
  {
    id: '3',
    name: 'API Gateway',
    description: 'Microservices API gateway with authentication',
    status: 'active',
    teamMembers: ['2', '5'],
    technologies: ['Node.js', 'Docker', 'Kubernetes'],
  },
  {
    id: '4',
    name: 'Mobile App Design',
    description: 'iOS and Android app design system',
    status: 'in-progress',
    teamMembers: ['3', '4'],
    technologies: ['Figma', 'React Native'],
  },
];

// API handlers
const handlers = [
  // Team members endpoints
  http.get('/api/team', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const department = url.searchParams.get('department');
    const position = url.searchParams.get('position');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 10;
    const sortBy = url.searchParams.get('sortBy') || 'name';
    const sortOrder = url.searchParams.get('sortOrder') || 'asc';

    let filteredMembers = [...mockTeamMembers];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredMembers = filteredMembers.filter(
        member =>
          member.name.toLowerCase().includes(searchLower) ||
          member.socialLinks.email.toLowerCase().includes(searchLower) ||
          member.position.toLowerCase().includes(searchLower) ||
          member.department.toLowerCase().includes(searchLower) ||
          member.skills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }

    // Apply department filter
    if (department && department !== 'all') {
      filteredMembers = filteredMembers.filter(
        member => member.department.toLowerCase() === department.toLowerCase()
      );
    }

    // Apply position filter
    if (position && position !== 'all') {
      filteredMembers = filteredMembers.filter(member =>
        member.position.toLowerCase().includes(position.toLowerCase())
      );
    }

    // Apply sorting
    filteredMembers.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

    const totalPages = Math.ceil(filteredMembers.length / limit);

    return HttpResponse.json({
      data: paginatedMembers,
      pagination: {
        page,
        limit,
        total: filteredMembers.length,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      filters: {
        search,
        department,
        position,
        sortBy,
        sortOrder,
      },
    });
  }),

  http.get('/api/team/:id', ({ params }) => {
    const { id } = params;
    const member = mockTeamMembers.find(m => m.id === id);

    if (!member) {
      return HttpResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    return HttpResponse.json({ data: member });
  }),

  http.post('/api/team', async ({ request }) => {
    const newMember = await request.json();
    const id = (mockTeamMembers.length + 1).toString();
    const member = {
      id,
      ...newMember,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
      avatar: `https://images.unsplash.com/photo-${Date.now()}?w=150&h=150&fit=crop&crop=face`,
    };

    mockTeamMembers.push(member);
    return HttpResponse.json({ data: member }, { status: 201 });
  }),

  http.put('/api/team/:id', async ({ params, request }) => {
    const { id } = params;
    const updates = await request.json();
    const memberIndex = mockTeamMembers.findIndex(m => m.id === id);

    if (memberIndex === -1) {
      return HttpResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    mockTeamMembers[memberIndex] = {
      ...mockTeamMembers[memberIndex],
      ...updates,
      id, // Ensure ID doesn't change
    };

    return HttpResponse.json({
      data: mockTeamMembers[memberIndex],
      message: 'Team member updated successfully',
    });
  }),

  http.delete('/api/team/:id', ({ params }) => {
    const { id } = params;
    const memberIndex = mockTeamMembers.findIndex(m => m.id === id);

    if (memberIndex === -1) {
      return HttpResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const deletedMember = mockTeamMembers.splice(memberIndex, 1)[0];

    return HttpResponse.json({
      data: deletedMember,
      message: 'Team member deleted successfully',
    });
  }),

  // Departments endpoints
  http.get('/api/departments', () => {
    return HttpResponse.json({ data: mockDepartments });
  }),

  // Positions endpoints
  http.get('/api/positions', () => {
    return HttpResponse.json({ data: mockPositions });
  }),

  // Projects endpoints
  http.get('/api/projects', () => {
    return HttpResponse.json({ data: mockProjects });
  }),

  // Statistics endpoints
  http.get('/api/stats', () => {
    const stats = {
      totalMembers: mockTeamMembers.length,
      totalDepartments: mockDepartments.length,
      totalPositions: mockPositions.length,
      totalProjects: mockProjects.length,
      departmentBreakdown: mockDepartments.map(dept => ({
        name: dept.name,
        count: mockTeamMembers.filter(m => m.department === dept.name).length,
      })),
      positionBreakdown: mockPositions.map(position => ({
        name: position,
        count: mockTeamMembers.filter(m => m.position === position).length,
      })),
    };

    return HttpResponse.json({ data: stats });
  }),

  // Search suggestions endpoint
  http.get('/api/search/suggestions', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (!query || query.length < 2) {
      return HttpResponse.json({ data: [] });
    }

    const queryLower = query.toLowerCase();
    const suggestions = [];

    // Search in member names
    mockTeamMembers.forEach(member => {
      if (member.name.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: 'member',
          value: member.name,
          label: `${member.name} - ${member.position}`,
          data: member,
        });
      }
    });

    // Search in departments
    mockDepartments.forEach(dept => {
      if (dept.name.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: 'department',
          value: dept.name,
          label: `Department: ${dept.name}`,
          data: dept,
        });
      }
    });

    // Search in positions
    mockPositions.forEach(position => {
      if (position.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: 'position',
          value: position,
          label: `Position: ${position}`,
          data: { position },
        });
      }
    });

    // Search in skills
    const allSkills = [...new Set(mockTeamMembers.flatMap(m => m.skills))];
    allSkills.forEach(skill => {
      if (skill.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: 'skill',
          value: skill,
          label: `Skill: ${skill}`,
          data: { skill },
        });
      }
    });

    // Limit results and remove duplicates
    const uniqueSuggestions = suggestions
      .filter(
        (suggestion, index, self) =>
          index === self.findIndex(s => s.value === suggestion.value && s.type === suggestion.type)
      )
      .slice(0, 10);

    return HttpResponse.json({ data: uniqueSuggestions });
  }),

  // Error simulation endpoints for testing
  http.get('/api/team/error/500', () => {
    return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
  }),

  http.get('/api/team/error/404', () => {
    return HttpResponse.json({ error: 'Not found' }, { status: 404 });
  }),

  http.get('/api/team/error/timeout', () => {
    return new Promise(() => {}); // Never resolves, simulating timeout
  }),

  // Slow response simulation
  http.get('/api/team/slow', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return HttpResponse.json({ data: mockTeamMembers });
  }),
];

// Create and export the server
export const server = setupServer(...handlers);

// Export mock data for use in tests
export { mockDepartments, mockPositions, mockProjects, mockTeamMembers };

// Export handlers for custom test scenarios
export { handlers };
