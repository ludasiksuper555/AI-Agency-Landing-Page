import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTranslation } from 'next-i18next';

import Team from '../components/Team';
import { TeamMember } from '../types/teamTypes';

// Mock next-i18next
jest.mock('next-i18next', () => ({
  useTranslation: jest.fn(),
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock team data
const mockTeamData: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    position: 'Frontend Developer',
    department: 'Engineering',
    bio: 'Experienced frontend developer',
    imageUrl: '/images/john.jpg',
    socialLinks: {
      twitter: 'https://twitter.com/johndoe',
      linkedin: 'https://linkedin.com/in/johndoe',
      github: 'https://github.com/johndoe',
      email: 'john@example.com',
    },
    skills: ['React', 'TypeScript', 'Next.js'],
    projects: ['Project A', 'Project B'],
    startDate: '2022-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    position: 'Backend Developer',
    department: 'Engineering',
    bio: 'Backend specialist with Node.js expertise',
    imageUrl: '/images/jane.jpg',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/janesmith',
      email: 'jane@example.com',
    },
    skills: ['Node.js', 'Python', 'PostgreSQL'],
    projects: ['Project C'],
    startDate: '2021-06-10',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    position: 'Designer',
    department: 'Design',
    bio: 'Creative UI/UX designer',
    imageUrl: '/images/mike.jpg',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/mikejohnson',
      email: 'mike@example.com',
    },
    skills: ['Figma', 'Adobe XD', 'Sketch'],
    projects: ['Project A', 'Project D'],
    startDate: '2023-03-01',
  },
];

// Mock translations
const mockTranslations = {
  'team.title': 'Our Team',
  'team.filters.search': 'Search team members...',
  'team.filters.position': 'Filter by position',
  'team.filters.department': 'Filter by department',
  'team.filters.allPositions': 'All positions',
  'team.filters.allDepartments': 'All departments',
  'team.sorting.name': 'Name',
  'team.sorting.position': 'Position',
  'team.sorting.department': 'Department',
  'team.stats.totalMembers': 'Total Members',
  'team.stats.positionsCount': '{{count}} Positions',
  'team.stats.departmentsCount': '{{count}} Departments',
};

const mockUseTranslation = useTranslation as jest.MockedFunction<typeof useTranslation>;

describe('Enhanced Team Component', () => {
  beforeEach(() => {
    mockUseTranslation.mockReturnValue({
      t: (key: string, options?: any) => {
        const translation = mockTranslations[key as keyof typeof mockTranslations];
        if (options?.count !== undefined) {
          return translation.replace('{{count}}', options.count.toString());
        }
        return translation || key;
      },
      i18n: {
        language: 'en',
        changeLanguage: jest.fn(),
      },
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the team component with title', () => {
      render(<Team />);
      expect(screen.getByText('Our Team')).toBeInTheDocument();
    });

    it('renders team statistics', async () => {
      render(<Team />);

      await waitFor(() => {
        expect(screen.getByText('Total Members')).toBeInTheDocument();
        expect(screen.getByText(/Positions/)).toBeInTheDocument();
        expect(screen.getByText(/Departments/)).toBeInTheDocument();
      });
    });

    it('renders search input', () => {
      render(<Team />);
      expect(screen.getByPlaceholderText('Search team members...')).toBeInTheDocument();
    });

    it('renders filter dropdowns', () => {
      render(<Team />);
      expect(screen.getByText('Filter by position')).toBeInTheDocument();
      expect(screen.getByText('Filter by department')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters team members by name', async () => {
      const user = userEvent.setup();
      render(<Team />);

      const searchInput = screen.getByPlaceholderText('Search team members...');
      await user.type(searchInput, 'John');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('filters team members by skills', async () => {
      const user = userEvent.setup();
      render(<Team />);

      const searchInput = screen.getByPlaceholderText('Search team members...');
      await user.type(searchInput, 'React');

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when search yields no matches', async () => {
      const user = userEvent.setup();
      render(<Team />);

      const searchInput = screen.getByPlaceholderText('Search team members...');
      await user.type(searchInput, 'NonexistentName');

      await waitFor(() => {
        expect(screen.getByText(/No team members found/)).toBeInTheDocument();
      });
    });
  });

  describe('Position Filtering', () => {
    it('filters team members by position', async () => {
      const user = userEvent.setup();
      render(<Team />);

      const positionFilter = screen.getByText('Filter by position');
      await user.click(positionFilter);

      const frontendOption = screen.getByText('Frontend Developer');
      await user.click(frontendOption);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument();
      });
    });

    it('shows all positions in filter dropdown', async () => {
      const user = userEvent.setup();
      render(<Team />);

      const positionFilter = screen.getByText('Filter by position');
      await user.click(positionFilter);

      expect(screen.getByText('All positions')).toBeInTheDocument();
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Backend Developer')).toBeInTheDocument();
      expect(screen.getByText('Designer')).toBeInTheDocument();
    });
  });

  describe('Department Filtering', () => {
    it('filters team members by department', async () => {
      const user = userEvent.setup();
      render(<Team />);

      const departmentFilter = screen.getByText('Filter by department');
      await user.click(departmentFilter);

      const engineeringOption = screen.getByText('Engineering');
      await user.click(engineeringOption);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument();
      });
    });

    it('shows all departments in filter dropdown', async () => {
      const user = userEvent.setup();
      render(<Team />);

      const departmentFilter = screen.getByText('Filter by department');
      await user.click(departmentFilter);

      expect(screen.getByText('All departments')).toBeInTheDocument();
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('Design')).toBeInTheDocument();
    });
  });

  describe('Sorting Functionality', () => {
    it('sorts team members by name', async () => {
      const user = userEvent.setup();
      render(<Team />);

      const sortSelect = screen.getByDisplayValue('Name');
      await user.selectOptions(sortSelect, 'name');

      await waitFor(() => {
        const memberCards = screen.getAllByTestId('team-member-card');
        expect(memberCards[0]).toHaveTextContent('Jane Smith');
        expect(memberCards[1]).toHaveTextContent('John Doe');
        expect(memberCards[2]).toHaveTextContent('Mike Johnson');
      });
    });

    it('sorts team members by department', async () => {
      const user = userEvent.setup();
      render(<Team />);

      const sortSelect = screen.getByDisplayValue('Name');
      await user.selectOptions(sortSelect, 'department');

      await waitFor(() => {
        const memberCards = screen.getAllByTestId('team-member-card');
        expect(memberCards[0]).toHaveTextContent('Mike Johnson'); // Design
        expect(memberCards[1]).toHaveTextContent('John Doe'); // Engineering
        expect(memberCards[2]).toHaveTextContent('Jane Smith'); // Engineering
      });
    });
  });

  describe('Combined Filtering', () => {
    it('applies search and position filter together', async () => {
      const user = userEvent.setup();
      render(<Team />);

      // Apply search filter
      const searchInput = screen.getByPlaceholderText('Search team members...');
      await user.type(searchInput, 'Developer');

      // Apply position filter
      const positionFilter = screen.getByText('Filter by position');
      await user.click(positionFilter);

      const frontendOption = screen.getByText('Frontend Developer');
      await user.click(frontendOption);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument();
      });
    });

    it('applies all filters together', async () => {
      const user = userEvent.setup();
      render(<Team />);

      // Apply search
      const searchInput = screen.getByPlaceholderText('Search team members...');
      await user.type(searchInput, 'John');

      // Apply department filter
      const departmentFilter = screen.getByText('Filter by department');
      await user.click(departmentFilter);

      const engineeringOption = screen.getByText('Engineering');
      await user.click(engineeringOption);

      // Apply position filter
      const positionFilter = screen.getByText('Filter by position');
      await user.click(positionFilter);

      const frontendOption = screen.getByText('Frontend Developer');
      await user.click(frontendOption);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Mike Johnson')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      render(<Team />);

      expect(screen.getByLabelText(/search team members/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by position/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/filter by department/i)).toBeInTheDocument();
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<Team />);

      const searchInput = screen.getByPlaceholderText('Search team members...');

      // Tab to search input
      await user.tab();
      expect(searchInput).toHaveFocus();

      // Tab to position filter
      await user.tab();
      expect(screen.getByText('Filter by position')).toHaveFocus();
    });
  });

  describe('Loading States', () => {
    it('shows loading state initially', () => {
      render(<Team />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('hides loading state after data loads', async () => {
      render(<Team />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', () => {
      // Mock window.matchMedia for mobile
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<Team />);

      // Check if mobile-specific classes are applied
      const container = screen.getByTestId('team-container');
      expect(container).toHaveClass('flex-col');
    });
  });

  describe('Performance', () => {
    it('debounces search input', async () => {
      const user = userEvent.setup();
      render(<Team />);

      const searchInput = screen.getByPlaceholderText('Search team members...');

      // Type quickly
      await user.type(searchInput, 'John');

      // Should not filter immediately
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();

      // Wait for debounce
      await waitFor(
        () => {
          expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });
});
