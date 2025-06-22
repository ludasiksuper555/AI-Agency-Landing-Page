# Enhanced Next.js Team Portfolio

A modern, fully-featured team portfolio website built with Next.js, TypeScript, and Tailwind CSS. This enhanced version includes comprehensive internationalization, advanced filtering, performance optimizations, and robust testing infrastructure.

## 🚀 Features

### Core Features

- **Modern Tech Stack**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Internationalization**: Full i18n support with next-i18next (English & Ukrainian)
- **Responsive Design**: Mobile-first approach with modern UI/UX
- **Performance Optimized**: Bundle splitting, image optimization, compression
- **SEO Ready**: Meta tags, structured data, sitemap generation

### Team Management

- **Advanced Filtering**: Filter by position, department, skills
- **Smart Search**: Search across name, email, role, department, skills
- **Flexible Sorting**: Sort by name, role, department, workload
- **Team Statistics**: Real-time counts and analytics
- **Export Functionality**: Export team data in various formats

### Enhanced Functionality

- **Department Management**: Full department-based organization
- **Skill Tracking**: Comprehensive skill management and filtering
- **Project Association**: Link team members to projects
- **Social Integration**: Social media links and profiles
- **Activity Tracking**: User activity monitoring and analytics

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Custom component library
- **Animations**: Framer Motion for smooth interactions
- **Icons**: Lucide React for consistent iconography

### Development Tools

- **Linting**: ESLint with comprehensive rules
- **Formatting**: Prettier with consistent configuration
- **Testing**: Jest + React Testing Library + Cypress
- **Type Checking**: TypeScript with strict configuration
- **Git Hooks**: Husky + lint-staged for quality control

### Performance & Optimization

- **Bundle Analysis**: Webpack Bundle Analyzer
- **Image Optimization**: Next.js Image component with Sharp
- **Code Splitting**: Automatic and manual code splitting
- **Compression**: Gzip compression enabled
- **Caching**: Optimized caching strategies

## 📁 Project Structure

```
├── components/           # React components
│   ├── Team.tsx         # Enhanced team component
│   ├── TeamExport.tsx   # Team export functionality
│   └── ui/              # Reusable UI components
├── data/                # Static data and configurations
│   └── teamData.ts      # Team member data
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── pages/               # Next.js pages
├── public/              # Static assets
│   ├── locales/         # Translation files
│   │   ├── en/          # English translations
│   │   └── uk/          # Ukrainian translations
├── styles/              # Global styles
├── types/               # TypeScript type definitions
│   └── teamTypes.ts     # Team-related types
├── utils/               # Utility functions
│   └── teamUtils.ts     # Team utility functions
└── tests/               # Test files
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd nextjs-team-portfolio
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration.

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

### Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run export` - Export static site

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### Testing

- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run test:ci` - Run tests for CI/CD

### Utilities

- `npm run analyze` - Analyze bundle size
- `npm run clean` - Clean build artifacts
- `npm run validate` - Run all quality checks

## 🌐 Internationalization

The project supports multiple languages using next-i18next:

### Supported Languages

- **English** (en) - Default
- **Ukrainian** (uk)

### Adding New Languages

1. Create translation files in `public/locales/[locale]/`
2. Update `next-i18next.config.js`
3. Add language switcher options

### Translation Structure

```json
{
  "team": {
    "title": "Our Team",
    "filters": {
      "search": "Search team members...",
      "position": "Filter by position",
      "department": "Filter by department",
      "allPositions": "All positions",
      "allDepartments": "All departments"
    },
    "stats": {
      "totalMembers": "Total Members",
      "positionsCount": "{{count}} Positions",
      "departmentsCount": "{{count}} Departments"
    }
  }
}
```

## 🧪 Testing

### Test Structure

- **Unit Tests**: Component and utility function tests
- **Integration Tests**: Feature and workflow tests
- **E2E Tests**: End-to-end user journey tests

### Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Coverage Thresholds

- **Global**: 80% minimum coverage
- **Components**: 85% minimum coverage
- **Utils**: 90% minimum coverage

## 🎨 Styling Guidelines

### Tailwind CSS

- Use utility classes for styling
- Follow mobile-first responsive design
- Maintain consistent spacing and typography

### Component Structure

```tsx
const Component = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Title</h1>
    </div>
  );
};
```

## 🔧 Configuration Files

### Key Configuration Files

- `next.config.js` - Next.js configuration with optimizations
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration with strict settings
- `.eslintrc.json` - ESLint rules and plugins
- `.prettierrc.json` - Prettier formatting rules
- `jest.config.js` - Jest testing configuration

## 📊 Performance Optimizations

### Bundle Optimization

- **Code Splitting**: Automatic route-based splitting
- **Dynamic Imports**: Lazy loading for heavy components
- **Tree Shaking**: Unused code elimination
- **Bundle Analysis**: Regular bundle size monitoring

### Image Optimization

- **Next.js Image**: Automatic optimization and lazy loading
- **Sharp**: High-performance image processing
- **WebP Support**: Modern image format support
- **Responsive Images**: Multiple sizes for different devices

### Caching Strategy

- **Static Assets**: Long-term caching for immutable assets
- **API Routes**: Appropriate cache headers
- **Build Optimization**: Incremental builds and caching

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Other Platforms

- **Netlify**: Use `npm run export` for static deployment
- **AWS**: Use AWS Amplify or S3 + CloudFront
- **Docker**: Dockerfile included for containerized deployment

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run quality checks: `npm run validate`
5. Commit with conventional commits
6. Submit a pull request

### Code Standards

- Follow TypeScript strict mode
- Use ESLint and Prettier configurations
- Write tests for new features
- Update documentation as needed

### Commit Convention

```
type(scope): description

feat(team): add department filtering
fix(ui): resolve mobile navigation issue
docs(readme): update installation guide
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- React Testing Library for testing utilities
- All contributors and maintainers

## 📞 Support

For support and questions:

- Create an issue on GitHub
- Check the documentation
- Review existing issues and discussions

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
