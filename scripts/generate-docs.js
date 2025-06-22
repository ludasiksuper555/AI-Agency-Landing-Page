#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Simple documentation generator
 */
class SimpleDocGenerator {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.docsDir = path.join(projectRoot, 'docs', 'generated');
  }

  async generateDocumentation() {
    console.log('📚 Generating project documentation...');

    try {
      // Ensure docs directory exists
      if (!fs.existsSync(this.docsDir)) {
        fs.mkdirSync(this.docsDir, { recursive: true });
      }

      // Generate project overview
      await this.generateProjectOverview();

      // Generate component documentation
      await this.generateComponentDocs();

      // Generate API documentation
      await this.generateApiDocs();

      console.log('✅ Documentation generated successfully!');
      console.log(`📁 Documentation saved to: ${this.docsDir}`);
    } catch (error) {
      console.error('❌ Error generating documentation:', error.message);
      process.exit(1);
    }
  }

  async generateProjectOverview() {
    const overview = `# Project Overview

Generated on: ${new Date().toISOString()}

## Project Structure

This is a Next.js project with TypeScript, featuring:

- **Frontend**: React components with TypeScript
- **Styling**: TailwindCSS
- **Testing**: Jest and Cypress
- **Documentation**: Auto-generated documentation system
- **Quality Metrics**: Automated code quality tracking
- **MCP Integration**: Model Context Protocol support

## Key Directories

- \`components/\` - React components
- \`pages/\` - Next.js pages
- \`lib/\` - Core library code
- \`utils/\` - Utility functions
- \`tests/\` - Test files
- \`docs/\` - Documentation

## Getting Started

1. Install dependencies: \`npm install\`
2. Run development server: \`npm run dev\`
3. Run tests: \`npm test\`
4. Generate documentation: \`npm run docs:generate\`
`;

    fs.writeFileSync(path.join(this.docsDir, 'project-overview.md'), overview);
    console.log('📄 Generated project overview');
  }

  async generateComponentDocs() {
    const componentsDir = path.join(this.projectRoot, 'components');

    if (!fs.existsSync(componentsDir)) {
      console.log('⚠️  Components directory not found');
      return;
    }

    const components = fs
      .readdirSync(componentsDir)
      .filter(file => file.endsWith('.tsx') || file.endsWith('.ts'))
      .map(file => file.replace(/\.(tsx?|jsx?)$/, ''));

    const componentDocs = `# Components Documentation

Generated on: ${new Date().toISOString()}

## Available Components

${components.map(comp => `- **${comp}**: Located at \`components/${comp}\``).join('\n')}

## Component Guidelines

- All components should be TypeScript-based
- Use TailwindCSS for styling
- Include proper TypeScript interfaces
- Add accessibility attributes where needed
- Follow naming conventions (PascalCase)

## Usage Examples

\`\`\`tsx
import { ComponentName } from '@/components/ComponentName';

function MyPage() {
  return (
    <div>
      <ComponentName prop="value" />
    </div>
  );
}
\`\`\`
`;

    fs.writeFileSync(path.join(this.docsDir, 'components.md'), componentDocs);
    console.log('🧩 Generated component documentation');
  }

  async generateApiDocs() {
    const apiDocs = `# API Documentation

Generated on: ${new Date().toISOString()}

## Available APIs

### Authentication
- \`POST /api/auth/login\` - User login
- \`POST /api/auth/logout\` - User logout
- \`GET /api/auth/me\` - Get current user

### Recommendations
- \`GET /api/recommendations\` - Get recommendations
- \`POST /api/recommendations\` - Create recommendation
- \`PUT /api/recommendations/:id\` - Update recommendation
- \`DELETE /api/recommendations/:id\` - Delete recommendation

### Analytics
- \`GET /api/analytics/metrics\` - Get quality metrics
- \`GET /api/analytics/reports\` - Get reports

## Response Format

All API responses follow this format:

\`\`\`json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\`

## Error Handling

Error responses include:

\`\`\`json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\`
`;

    fs.writeFileSync(path.join(this.docsDir, 'api.md'), apiDocs);
    console.log('🔌 Generated API documentation');
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new SimpleDocGenerator();
  generator.generateDocumentation();
}

module.exports = { SimpleDocGenerator };
