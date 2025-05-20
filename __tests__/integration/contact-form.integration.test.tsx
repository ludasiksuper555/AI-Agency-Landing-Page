import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Contact from '../../components/Contact';

// Мокуємо fetch API
global.fetch = jest.fn();

describe('Інтеграційний тест контактної форми', () => {
  beforeEach(() => {
    // Очищаємо моки перед кожним тестом
    jest.clearAllMocks();
    
    // Налаштовуємо мок для fetch
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Повідомлення успішно надіслано' }),
    });
  });

  test('користувач може заповнити та надіслати контактну форму', async () => {
    render(<Contact />);

    // Заповнюємо поля форми
    fireEvent.change(screen.getByLabelText(/ім'я/i), {
      target: { value: 'Тестове Ім\'я' },
    });

    fireEvent.change(screen.getByLabelText(/електронна пошта/i), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByLabelText(/повідомлення/i), {
      target: { value: 'Це тестове повідомлення для перевірки форми зворотного зв\'язку.' },
    });

    // Надсилаємо форму
    fireEvent.click(screen.getByRole('button', { name: /надіслати/i }));

    // Перевіряємо, що fetch був викликаний з правильними параметрами
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('Тестове Ім\'я'),
        })
      );
    });

    // Перевіряємо, що з'явилося повідомлення про успішне надсилання
    expect(await screen.findByText(/успішно надіслано/i)).toBeInTheDocument();
  });

  test('відображає помилку при невдалому надсиланні форми', async () => {
    // Перевизначаємо мок для fetch, щоб симулювати помилку
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, message: 'Помилка сервера' }),
    });

    render(<Contact />);

    // Заповнюємо поля форми
    fireEvent.change(screen.getByLabelText(/ім'я/i), {
      target: { value: 'Тестове Ім\'я' },
    });

    fireEvent.change(screen.getByLabelText(/електронна пошта/i), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByLabelText(/повідомлення/i), {
      target: { value: 'Тестове повідомлення' },
    });

    // Надсилаємо форму
    fireEvent.click(screen.getByRole('button', { name: /надіслати/i }));

    // Перевіряємо, що з'явилося повідомлення про помилку
    expect(await screen.findByText(/помилка сервера/i)).toBeInTheDocument();
  });

  test('валідує поля форми перед надсиланням', async () => {
    render(<Contact />);

    // Надсилаємо форму без заповнення полів
    fireEvent.click(screen.getByRole('button', { name: /надіслати/i }));

    // Перевіряємо, що з'явилися повідомлення про помилки валідації
    expect(await screen.findByText(/ім'я обов'язкове/i)).toBeInTheDocument();
    expect(await screen.findByText(/електронна пошта обов'язкова/i)).toBeInTheDocument();
    expect(await screen.findByText(/повідомлення обов'язкове/i)).toBeInTheDocument();

    // Перевіряємо, що fetch не був викликаний
    expect(global.fetch).not.toHaveBeenCalled();
  });
});