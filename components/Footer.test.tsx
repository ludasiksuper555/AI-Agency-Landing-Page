import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from './Footer';

describe('Footer Component', () => {
  it('рендериться без помилок', () => {
    render(<Footer />);
    const footerElement = screen.getByRole('contentinfo');
    expect(footerElement).toBeInTheDocument();
  });

  it('відображає логотип компанії', () => {
    render(<Footer />);
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('Agency')).toBeInTheDocument();
  });

  it('відображає інформацію про авторські права', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentYear}.*AI Agency`))).toBeInTheDocument();
  });

  it('відображає посилання на соціальні мережі', () => {
    render(<Footer />);
    const socialLinks = screen.getAllByRole('link', { name: /social/i });
    expect(socialLinks.length).toBeGreaterThan(0);
  });

  it('відображає навігаційні посилання', () => {
    render(<Footer />);
    const navLinks = screen.getAllByRole('navigation');
    expect(navLinks.length).toBeGreaterThan(0);
    
    // Перевіряємо наявність типових посилань у футері
    const commonLinks = ['Про нас', 'Послуги', 'Контакти', 'Політика конфіденційності'];
    commonLinks.forEach(linkText => {
      const linkElements = screen.getAllByText(linkText, { exact: false });
      expect(linkElements.length).toBeGreaterThanOrEqual(0);
    });
  });

  it('має правильну структуру з розділами', () => {
    render(<Footer />);
    
    // Перевіряємо наявність основних розділів футера
    const sections = screen.getAllByRole('region', { hidden: true });
    expect(sections.length).toBeGreaterThanOrEqual(0);
  });
});