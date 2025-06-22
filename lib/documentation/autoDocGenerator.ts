/**
 * Automatic Code Documentation Generator
 * Analyzes code and generates comprehensive documentation
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { extname, join, relative } from 'path';

export interface CodeElement {
  type: 'function' | 'class' | 'interface' | 'type' | 'constant' | 'component';
  name: string;
  description?: string;
  parameters?: Parameter[];
  returnType?: string;
  examples?: string[];
  filePath: string;
  lineNumber: number;
  isExported: boolean;
  complexity?: number;
  dependencies?: string[];
}

export interface Parameter {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
  defaultValue?: string;
}

export interface FileDocumentation {
  filePath: string;
  description: string;
  elements: CodeElement[];
  imports: string[];
  exports: string[];
  lastModified: Date;
  linesOfCode: number;
  complexity: number;
}

export interface ProjectDocumentation {
  projectName: string;
  description: string;
  version: string;
  generatedAt: Date;
  files: FileDocumentation[];
  summary: {
    totalFiles: number;
    totalElements: number;
    totalLinesOfCode: number;
    averageComplexity: number;
  };
  architecture: {
    components: string[];
    utilities: string[];
    types: string[];
    tests: string[];
  };
}

export class AutoDocGenerator {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Generate documentation for the entire project
   */
  async generateProjectDocumentation(): Promise<ProjectDocumentation> {
    const files = this.getAllSourceFiles();
    const fileDocumentations: FileDocumentation[] = [];

    for (const filePath of files) {
      try {
        const doc = await this.analyzeFile(filePath);
        fileDocumentations.push(doc);
      } catch (error) {
        console.error(`Failed to analyze ${filePath}:`, error);
      }
    }

    const summary = this.calculateSummary(fileDocumentations);
    const architecture = this.analyzeArchitecture(fileDocumentations);

    const projectDoc: ProjectDocumentation = {
      projectName: this.getProjectName(),
      description: this.getProjectDescription(),
      version: this.getProjectVersion(),
      generatedAt: new Date(),
      files: fileDocumentations,
      summary,
      architecture,
    };

    this.saveDocumentation(projectDoc);
    return projectDoc;
  }

  /**
   * Analyze a single file and extract documentation
   */
  async analyzeFile(filePath: string): Promise<FileDocumentation> {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const elements = this.extractCodeElements(content, filePath);
    const imports = this.extractImports(content);
    const exports = this.extractExports(content);
    const stats = statSync(filePath);

    return {
      filePath: relative(this.projectRoot, filePath),
      description: this.extractFileDescription(content),
      elements,
      imports,
      exports,
      lastModified: stats.mtime,
      linesOfCode: lines.length,
      complexity: this.calculateFileComplexity(content),
    };
  }

  /**
   * Generate README.md from project documentation
   */
  generateReadme(projectDoc: ProjectDocumentation): string {
    const readme = `# ${projectDoc.projectName}

${projectDoc.description}

## 📊 Project Statistics

- **Total Files:** ${projectDoc.summary.totalFiles}
- **Total Code Elements:** ${projectDoc.summary.totalElements}
- **Lines of Code:** ${projectDoc.summary.totalLinesOfCode}
- **Average Complexity:** ${projectDoc.summary.averageComplexity.toFixed(2)}

## 🏗️ Architecture

### Components (${projectDoc.architecture.components.length})
${projectDoc.architecture.components.map(c => `- ${c}`).join('\n')}

### Utilities (${projectDoc.architecture.utilities.length})
${projectDoc.architecture.utilities.map(u => `- ${u}`).join('\n')}

### Types (${projectDoc.architecture.types.length})
${projectDoc.architecture.types.map(t => `- ${t}`).join('\n')}

## 📁 File Structure

${this.generateFileTree(projectDoc.files)}

## 🔧 Key Components

${this.generateComponentDocs(projectDoc.files)}

---

*Documentation generated automatically on ${projectDoc.generatedAt.toISOString()}*
`;

    writeFileSync(join(this.projectRoot, 'README.md'), readme);
    return readme;
  }

  private getAllSourceFiles(): string[] {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];

    const scanDirectory = (dir: string) => {
      const items = readdirSync(dir);

      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (this.shouldExclude(fullPath)) {
          continue;
        }

        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (extensions.includes(extname(fullPath))) {
          files.push(fullPath);
        }
      }
    };

    scanDirectory(this.projectRoot);
    return files;
  }

  private shouldExclude(filePath: string): boolean {
    const relativePath = relative(this.projectRoot, filePath);
    const excludePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /coverage/,
      /\.next/,
      /\.nuxt/,
      /\.vscode/,
      /\.idea/,
      /\.DS_Store/,
      /\.env/,
      /\.log$/,
      /\.lock$/,
      /\.tmp$/,
      /\.cache/,
    ];
    return excludePatterns.some(pattern => pattern.test(relativePath));
  }

  private extractCodeElements(content: string, filePath: string): CodeElement[] {
    const elements: CodeElement[] = [];

    // Extract functions
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      elements.push({
        type: 'function',
        name: match[1],
        filePath: relative(this.projectRoot, filePath),
        lineNumber,
        isExported: match[0].includes('export'),
      });
    }

    // Extract classes
    const classRegex = /(?:export\s+)?class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      elements.push({
        type: 'class',
        name: match[1],
        filePath: relative(this.projectRoot, filePath),
        lineNumber,
        isExported: match[0].includes('export'),
      });
    }

    // Extract interfaces
    const interfaceRegex = /(?:export\s+)?interface\s+(\w+)/g;
    while ((match = interfaceRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      elements.push({
        type: 'interface',
        name: match[1],
        filePath: relative(this.projectRoot, filePath),
        lineNumber,
        isExported: match[0].includes('export'),
      });
    }

    // Extract React components
    const componentRegex =
      /(?:export\s+)?(?:const|function)\s+(\w+)\s*[=:].*?(?:React\.FC|JSX\.Element|ReactElement)/g;
    while ((match = componentRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      elements.push({
        type: 'component',
        name: match[1],
        filePath: relative(this.projectRoot, filePath),
        lineNumber,
        isExported: match[0].includes('export'),
      });
    }

    return elements;
  }

  private extractImports(content: string): string[] {
    const importRegex = /import.*?from\s+['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  private extractExports(content: string): string[] {
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|interface|type)\s+(\w+)/g;
    const exports: string[] = [];
    let match;

    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }

    return exports;
  }

  private extractFileDescription(content: string): string {
    const commentRegex = /\/\*\*([\s\S]*?)\*\//;
    const match = content.match(commentRegex);

    if (match) {
      return match[1]
        .split('\n')
        .map(line => line.replace(/^\s*\*\s?/, ''))
        .join('\n')
        .trim();
    }

    return 'No description available';
  }

  private calculateFileComplexity(content: string): number {
    // Simple complexity calculation based on control structures
    const complexityPatterns = [
      /if\s*\(/g,
      /else\s*if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /switch\s*\(/g,
      /catch\s*\(/g,
      /&&/g,
      /\|\|/g,
    ];

    let complexity = 1; // Base complexity

    for (const pattern of complexityPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  private calculateSummary(files: FileDocumentation[]): ProjectDocumentation['summary'] {
    const totalElements = files.reduce((sum, file) => sum + file.elements.length, 0);
    const totalLinesOfCode = files.reduce((sum, file) => sum + file.linesOfCode, 0);
    const averageComplexity = files.reduce((sum, file) => sum + file.complexity, 0) / files.length;

    return {
      totalFiles: files.length,
      totalElements,
      totalLinesOfCode,
      averageComplexity,
    };
  }

  private analyzeArchitecture(files: FileDocumentation[]): ProjectDocumentation['architecture'] {
    const components: string[] = [];
    const utilities: string[] = [];
    const types: string[] = [];
    const tests: string[] = [];

    for (const file of files) {
      if (file.filePath.includes('component') || file.filePath.includes('Component')) {
        components.push(file.filePath);
      } else if (file.filePath.includes('util') || file.filePath.includes('helper')) {
        utilities.push(file.filePath);
      } else if (file.filePath.includes('type') || file.filePath.includes('interface')) {
        types.push(file.filePath);
      } else if (file.filePath.includes('test') || file.filePath.includes('spec')) {
        tests.push(file.filePath);
      }
    }

    return { components, utilities, types, tests };
  }

  private generateFileTree(files: FileDocumentation[]): string {
    return files
      .map(
        file =>
          `- \`${file.filePath}\` (${file.linesOfCode} lines, ${file.elements.length} elements)`
      )
      .join('\n');
  }

  private generateComponentDocs(files: FileDocumentation[]): string {
    const components = files
      .filter(file => file.elements.some(el => el.type === 'component'))
      .slice(0, 10); // Top 10 components

    return components
      .map(file => {
        const componentElements = file.elements.filter(el => el.type === 'component');
        return `### ${file.filePath}\n\n${file.description}\n\n**Components:** ${componentElements.map(c => c.name).join(', ')}\n`;
      })
      .join('\n');
  }

  private getProjectName(): string {
    try {
      const packageJson = JSON.parse(readFileSync(join(this.projectRoot, 'package.json'), 'utf-8'));
      return packageJson.name || 'Unknown Project';
    } catch {
      return 'Unknown Project';
    }
  }

  private getProjectDescription(): string {
    try {
      const packageJson = JSON.parse(readFileSync(join(this.projectRoot, 'package.json'), 'utf-8'));
      return packageJson.description || 'No description available';
    } catch {
      return 'No description available';
    }
  }

  private getProjectVersion(): string {
    try {
      const packageJson = JSON.parse(readFileSync(join(this.projectRoot, 'package.json'), 'utf-8'));
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  private saveDocumentation(projectDoc: ProjectDocumentation): void {
    const docsDir = join(this.projectRoot, 'docs', 'generated');
    writeFileSync(join(docsDir, 'project-documentation.json'), JSON.stringify(projectDoc, null, 2));
  }
}

// Global documentation generator instance
// Global auto documentation generator instance
export const autoDocGenerator = new AutoDocGenerator();
