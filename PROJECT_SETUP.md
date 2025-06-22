# Project Setup and Development Guide

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd rules

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Run development server
npm run dev
```

## Available Scripts

### Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm run quality:check` - Run all quality checks
- `npm run quality:fix` - Fix formatting and linting issues

### Testing

- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## Project Structure

```
├── components/          # React components
├── pages/              # Next.js pages
├── utils/              # Utility functions
├── lib/                # Library code
├── types/              # TypeScript type definitions
├── styles/             # CSS and styling
├── public/             # Static assets
├── tests/              # Test files
└── docs/               # Documentation
```

## Code Standards

### TypeScript

- Use strict TypeScript configuration
- Define proper interfaces and types
- Avoid `any` type when possible
- Use proper error handling

### React/Next.js

- Use functional components with hooks
- Follow React best practices
- Use proper prop types
- Implement proper error boundaries

### Styling

- Use Tailwind CSS for styling
- Follow responsive design principles
- Use semantic HTML elements
- Implement accessibility features

### Code Quality

- Use ESLint and Prettier
- Write meaningful commit messages
- Add proper documentation
- Write tests for critical functionality

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
DATABASE_URL=your_database_url

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# External APIs
MGX_API_KEY=your_mgx_api_key
TRAE_AI_API_KEY=your_trae_ai_api_key

# Email
EMAIL_SERVER=your_email_server
EMAIL_FROM=your_email_from
```

## Development Workflow

1. **Before starting work:**

   ```bash
   npm run quality:check
   ```

2. **During development:**

   - Write code following the established patterns
   - Add proper TypeScript types
   - Include error handling
   - Write tests for new functionality

3. **Before committing:**

   ```bash
   npm run quality:fix
   npm run type-check
   npm run test
   ```

4. **Commit message format:**

   ```
   type(scope): description

   Examples:
   feat(auth): add two-factor authentication
   fix(api): handle null response in user endpoint
   docs(readme): update installation instructions
   ```

## Troubleshooting

### Common Issues

1. **TypeScript errors:**

   - Run `npm run type-check` to see all errors
   - Check for missing imports
   - Verify interface definitions

2. **Linting errors:**

   - Run `npm run lint:fix` to auto-fix issues
   - Check ESLint configuration

3. **Build errors:**
   - Clear `.next` directory
   - Reinstall dependencies
   - Check environment variables

### Performance Optimization

- Use Next.js Image component for images
- Implement proper caching strategies
- Use dynamic imports for code splitting
- Monitor bundle size with `npm run analyze`

### Security Best Practices

- Never commit sensitive data
- Use environment variables for secrets
- Implement proper input validation
- Use HTTPS in production
- Keep dependencies updated

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run quality checks
5. Submit a pull request

## Support

For questions and support:

- Check the documentation
- Review existing issues
- Create a new issue with detailed information
