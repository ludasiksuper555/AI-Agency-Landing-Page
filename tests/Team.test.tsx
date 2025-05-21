import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Team from '../components/Team';
import teamData from '../data/teamData';

// Мокуємо модулі, які використовуються в компоненті
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />
  },
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

jest.mock('../data/teamData', () => ([
  {
    id: 'tm-001',
    name: 'Олександр Петренко',
    position: 'Головний AI розробник',
    bio: 'Експерт з машинного навчання',
    imageUrl: '/images/team/alex.jpg',
    department: 'Розробка',
    skills: ['AI', 'Machine Learning'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/oleksandr',
      email: 'oleksandr@example.com'
    }
  },
  {
    id: 'tm-002',
    name: 'Марія Коваленко',
    position: 'AI дизайнер',
    bio: 'Дизайнер інтерфейсів',
    imageUrl: '/images/team/maria.jpg',
    department: 'Дизайн',
    skills: ['UI/UX', 'AI Design'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/maria',
      twitter: 'https://twitter.com/maria'
    }
  },
]))

describe('Компонент Team', () => {
  beforeEach(() => {
    // Очищаємо моки перед кожним тестом
    jest.clearAllMocks();
  });

  test('Рендерить компонент без помилок', async () => {
    render(<Team />);
    
    // Перевіряємо, що заголовок відображається
    expect(screen.getByText('Наша команда')).toBeInTheDocument();
    
    // Перевіряємо, що картки співробітників відображаються
    await waitFor(() => {
      expect(screen.getByText('Олександр Петренко')).toBeInTheDocument();
      expect(screen.getByText('Марія Коваленко')).toBeInTheDocument();
    });
  });

  test('Фільтрація за пошуковим запитом працює коректно', async () => {
    render(<Team />);
    
    // Чекаємо завантаження даних
    await waitFor(() => {
      expect(screen.getByText('Олександр Петренко')).toBeInTheDocument();
    });
    
    // Вводимо пошуковий запит
    const searchInput = screen.getByPlaceholderText('Пошук за ім\'ям або посадою');
    fireEvent.change(searchInput, { target: { value: 'дизайнер' } });
    
    // Перевіряємо результати фільтрації
    await waitFor(() => {
      expect(screen.queryByText('Олександр Петренко')).not.toBeInTheDocument();
      expect(screen.getByText('Марія Коваленко')).toBeInTheDocument();
    });
  });

  test('Фільтрація за відділом працює коректно', async () => {
    render(<Team />);
    
    // Чекаємо завантаження даних
    await waitFor(() => {
      expect(screen.getByText('Олександр Петренко')).toBeInTheDocument();
    });
    
    // Вибираємо фільтр за відділом
    const departmentSelect = screen.getByLabelText('Фільтр за відділом');
    fireEvent.change(departmentSelect, { target: { value: 'дизайн' } });
    
    // Перевіряємо результати фільтрації
    await waitFor(() => {
      expect(screen.queryByText('Олександр Петренко')).not.toBeInTheDocument();
      expect(screen.getByText('Марія Коваленко')).toBeInTheDocument();
    });
  });

  test('Кнопка експорту даних працює коректно', async () => {
    // Мокуємо функції для тестування експорту
    const createObjectURLMock = jest.fn();
    const createElementMock = jest.fn();
    const appendChildMock = jest.fn();
    const clickMock = jest.fn();
    const removeChildMock = jest.fn();
    
    // Зберігаємо оригінальні функції
    const originalCreateObjectURL = URL.createObjectURL;
    const originalCreateElement = document.createElement;
    const originalAppendChild = document.body.appendChild;
    const originalRemoveChild = document.body.removeChild;
    
    // Підміняємо функції моками
    URL.createObjectURL = createObjectURLMock;
    document.createElement = jest.fn().mockImplementation(() => ({
      setAttribute: jest.fn(),
      style: {},
      click: clickMock
    }));
    document.body.appendChild = appendChildMock;
    document.body.removeChild = removeChildMock;
    
    render(<Team />);
    
    // Чекаємо завантаження даних
    await waitFor(() => {
      expect(screen.getByText('Експортувати дані')).toBeInTheDocument();
    });
    
    // Клікаємо на кнопку експорту
    fireEvent.click(screen.getByText('Експортувати дані'));
    
    // Перевіряємо, що функції були викликані
    expect(createObjectURLMock).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(clickMock).toHaveBeenCalled();
    
    // Відновлюємо оригінальні функції
    URL.createObjectURL = originalCreateObjectURL;
    document.createElement = originalCreateElement;
    document.body.appendChild = originalAppendChild;
    document.body.removeChild = originalRemoveChild;
  });

  test('Кнопка скидання фільтрів працює коректно', async () => {
    render(<Team />);
    
    // Чекаємо завантаження даних
    await waitFor(() => {
      expect(screen.getByText('Олександр Петренко')).toBeInTheDocument();
    });
    
    // Вводимо пошуковий запит, який не дасть результатів
    const searchInput = screen.getByPlaceholderText('Пошук за ім\'ям або посадою');
    fireEvent.change(searchInput, { target: { value: 'неіснуючий запит' } });
    
    // Чекаємо появи кнопки скидання фільтрів
    await waitFor(() => {
      expect(screen.getByText('Скинути фільтри')).toBeInTheDocument();
    });
    
    // Клікаємо на кнопку скидання фільтрів
    fireEvent.click(screen.getByText('Скинути фільтри'));
    
    // Перевіряємо, що всі співробітники знову відображаються
    await waitFor(() => {
      expect(screen.getByText('Олександр Петренко')).toBeInTheDocument();
      expect(screen.getByText('Марія Коваленко')).toBeInTheDocument();
    });
  });
});