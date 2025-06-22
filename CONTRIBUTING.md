# Contributing to AI Agency Landing Page

Thank you for your interest in contributing to the AI Agency Landing Page project! This document provides guidelines and best practices for contributors.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager
- Git
- Basic knowledge of React, Next.js, and TypeScript

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/ai-agency-landing-page.git
   cd ai-agency-landing-page
   ```
3. **Install dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Start the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## How to Contribute

### Reporting Issues

- Use our [issue templates](.github/ISSUE_TEMPLATE/) for bug reports and feature requests
- Search existing issues before creating a new one
- Provide detailed information including:
  - Steps to reproduce (for bugs)
  - Expected vs actual behavior
  - Environment details (OS, browser, Node.js version)
  - Screenshots or error logs when applicable

### Submitting Changes

1. **Create an issue** first to discuss your proposed changes
2. **Follow our coding standards** (see below)
3. **Write tests** for new functionality
4. **Update documentation** as needed
5. **Submit a pull request** using our [PR template](.github/PULL_REQUEST_TEMPLATE.md)

## Coding Standards

### General Guidelines

- Write clean, readable, and maintainable code
- Follow the DRY (Don't Repeat Yourself) principle
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### JavaScript/TypeScript

- **Use TypeScript** for all new code
- **Strict typing**: Avoid `any` type, use proper interfaces and types
- **ES6+ features**: Use modern JavaScript syntax
- **Functional programming**: Prefer pure functions and immutability
- **Error handling**: Implement proper error boundaries and validation

```typescript
// Good
interface UserProps {
  id: string;
  name: string;
  email: string;
}

const formatUserName = (user: UserProps): string => {
  return `${user.name} (${user.email})`;
};

// Avoid
const formatUser = (user: any) => {
  return user.name + ' (' + user.email + ')';
};
```

### React/Next.js

- **Functional components**: Use hooks instead of class components
- **Component structure**: Follow atomic design principles
- **Props validation**: Use TypeScript interfaces for props
- **State management**: Use appropriate state management (useState, useContext, etc.)
- **Performance**: Implement React.memo, useMemo, useCallback when needed

```tsx
// Good
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ variant, onClick, children, disabled = false }) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick} disabled={disabled} type="button">
      {children}
    </button>
  );
};
```

### CSS/Styling

- **Tailwind CSS**: Use utility classes for styling
- **Responsive design**: Mobile-first approach
- **Accessibility**: Follow WCAG guidelines
- **Custom CSS**: Minimize custom CSS, prefer Tailwind utilities
- **Dark mode**: Support both light and dark themes

```tsx
// Good
<div className="flex flex-col md:flex-row gap-4 p-6 bg-white dark:bg-gray-900">
  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
    Click me
  </button>
</div>
```

## Testing

### Test Requirements

- **Unit tests**: Write tests for utility functions and hooks
- **Component tests**: Test component behavior and rendering
- **Integration tests**: Test component interactions
- **E2E tests**: Test critical user flows

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

### Test Guidelines

- Write descriptive test names
- Test both happy path and edge cases
- Mock external dependencies
- Aim for high test coverage (>80%)

## Pull Request Process

1. **Update documentation** for any new features
2. **Add tests** that prove your fix/feature works
3. **Ensure all tests pass** and code follows our standards
4. **Update the changelog** if applicable
5. **Request review** from maintainers
6. **Address feedback** promptly and professionally

### PR Guidelines

- **One feature per PR**: Keep changes focused and atomic
- **Descriptive titles**: Use clear, concise titles
- **Detailed description**: Explain what, why, and how
- **Link issues**: Reference related issues using keywords
- **Screenshots**: Include before/after screenshots for UI changes

## Development Guidelines

### Performance

- **Optimize images**: Use Next.js Image component
- **Code splitting**: Implement dynamic imports for large components
- **Bundle analysis**: Monitor bundle size regularly
- **Core Web Vitals**: Maintain good performance metrics

### Accessibility

- **Semantic HTML**: Use proper HTML elements
- **ARIA labels**: Add appropriate ARIA attributes
- **Keyboard navigation**: Ensure all interactive elements are keyboard accessible
- **Screen readers**: Test with screen reader software
- **Color contrast**: Maintain WCAG AA compliance

### Security

- **Input validation**: Sanitize all user inputs
- **XSS prevention**: Use proper escaping and sanitization
- **Dependencies**: Keep dependencies updated
- **Environment variables**: Never commit secrets to version control
- **Content Security Policy**: Follow CSP best practices

### Internationalization (i18n)

- **Translation keys**: Use descriptive, hierarchical keys
- **Pluralization**: Handle plural forms correctly
- **RTL support**: Consider right-to-left languages
- **Date/time formatting**: Use locale-appropriate formatting

## Release Process

1. **Version bumping**: Follow semantic versioning (SemVer)
2. **Changelog updates**: Document all changes
3. **Testing**: Comprehensive testing before release
4. **Deployment**: Automated deployment pipeline
5. **Monitoring**: Post-release monitoring and rollback procedures

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community discussions
- **Pull Requests**: Code review and collaboration

### Getting Help

- Check existing documentation and issues first
- Use appropriate issue templates
- Provide detailed context when asking questions
- Be patient and respectful in all interactions

## Licensing

By contributing to this project, you agree that your contributions will be licensed under the same license as the project. See [LICENSE](LICENSE) for details.

## Recognition

Contributors are recognized in our [CONTRIBUTORS.md](CONTRIBUTORS.md) file and through GitHub's contributor features.

## Contact

For questions about contributing, please:

- Open an issue for technical questions
- Use GitHub Discussions for general questions
- Contact maintainers for sensitive matters

Thank you for contributing to AI Agency Landing Page! 🚀
