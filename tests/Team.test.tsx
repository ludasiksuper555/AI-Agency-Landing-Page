import '@testing-library/jest-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import Team from '../components/Team';
import type { MockComponentProps } from '../types/common';

// Mock modules used in the component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: MockComponentProps) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: MockComponentProps) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: MockComponentProps) => <>{children}</>,
}));

jest.mock('next-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'team.title': 'Our Team',
        'team.filters.searchPlaceholder': 'Search by name or position',
        'team.filters.positionLabel': 'Filter by position',
        'team.filters.resetButton': 'Reset filters',
        'team.noResults': 'No team members found',
        'team.export.button': 'Export data',
      };
      return translations[key] || key;
    },
  }),
}));

jest.mock('../data/teamData', () => ({
  teamData: [
    {
      id: 'tm-001',
      name: 'Alexander Petrenko',
      position: 'Lead AI Developer',
      bio: 'Expert in machine learning',
      imageUrl: '/images/team/alex.jpg',
      department: 'Development',
      skills: ['AI', 'Machine Learning'],
      socialLinks: {
        linkedin: 'https://linkedin.com/in/alexander',
        email: 'alexander@example.com',
      },
    },
    {
      id: 'tm-002',
      name: 'Maria Kovalenko',
      position: 'AI Designer',
      bio: 'Interface designer',
      imageUrl: '/images/team/maria.jpg',
      department: 'Design',
      skills: ['UI/UX', 'AI Design'],
      socialLinks: {
        linkedin: 'https://linkedin.com/in/maria',
        twitter: 'https://twitter.com/maria',
      },
    },
  ],
}));

describe('Team Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
  });

  test('renders component without errors', async () => {
    render(<Team />);

    // Check that the title is displayed
    expect(screen.getByText('Our Team')).toBeInTheDocument();

    // Check that team member cards are displayed
    await waitFor(() => {
      expect(screen.getByText('Alexander Petrenko')).toBeInTheDocument();
      expect(screen.getByText('Maria Kovalenko')).toBeInTheDocument();
    });
  });

  test('search filtering works correctly', async () => {
    render(<Team />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Alexander Petrenko')).toBeInTheDocument();
    });

    // Enter search query
    const searchInput = screen.getByPlaceholderText('Search by name or position');
    fireEvent.change(searchInput, { target: { value: 'designer' } });

    // Check filtering results
    await waitFor(() => {
      expect(screen.queryByText('Alexander Petrenko')).not.toBeInTheDocument();
      expect(screen.getByText('Maria Kovalenko')).toBeInTheDocument();
    });
  });

  test('department filtering works correctly', async () => {
    render(<Team />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Alexander Petrenko')).toBeInTheDocument();
    });

    // Select department filter
    const departmentSelect = screen.getByLabelText('Filter by position');
    fireEvent.change(departmentSelect, { target: { value: 'design' } });

    // Check filtering results
    await waitFor(() => {
      expect(screen.queryByText('Alexander Petrenko')).not.toBeInTheDocument();
      expect(screen.getByText('Maria Kovalenko')).toBeInTheDocument();
    });
  });

  test('data export button works correctly', async () => {
    // Mock functions for export testing
    const createObjectURLMock = jest.fn();
    const appendChildMock = jest.fn();
    const clickMock = jest.fn();
    const removeChildMock = jest.fn();

    // Store original functions
    const originalCreateObjectURL = URL.createObjectURL;
    const originalCreateElement = document.createElement;
    const originalAppendChild = document.body.appendChild;
    const originalRemoveChild = document.body.removeChild;

    // Replace functions with mocks
    URL.createObjectURL = createObjectURLMock;
    document.createElement = jest.fn().mockImplementation(() => ({
      setAttribute: jest.fn(),
      style: {},
      click: clickMock,
    }));
    document.body.appendChild = appendChildMock;
    document.body.removeChild = removeChildMock;

    render(<Team />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Export data')).toBeInTheDocument();
    });

    // Click export button
    fireEvent.click(screen.getByText('Export data'));

    // Check that functions were called
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(clickMock).toHaveBeenCalled();

    // Restore original functions
    URL.createObjectURL = originalCreateObjectURL;
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
  });

  test('filter reset button works correctly', async () => {
    render(<Team />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Alexander Petrenko')).toBeInTheDocument();
    });

    // Enter search query that will return no results
    const searchInput = screen.getByPlaceholderText('Search by name or position');
    fireEvent.change(searchInput, { target: { value: 'nonexistent query' } });

    // Wait for reset filters button to appear
    await waitFor(() => {
      expect(screen.getByText('Reset filters')).toBeInTheDocument();
    });

    // Click reset filters button
    fireEvent.click(screen.getByText('Reset filters'));

    // Check that all team members are displayed again
    await waitFor(() => {
      expect(screen.getByText('Alexander Petrenko')).toBeInTheDocument();
      expect(screen.getByText('Maria Kovalenko')).toBeInTheDocument();
    });
  });
});
