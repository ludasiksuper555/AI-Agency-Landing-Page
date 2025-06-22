'use strict';
/**
 * Automatic Code Documentation Generator
 * Analyzes code and generates comprehensive documentation
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.autoDocGenerator = exports.AutoDocGenerator = void 0;
const fs_1 = require('fs');
const path_1 = require('path');
class AutoDocGenerator {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
  }
  /**
   * Generate documentation for the entire project
   */
  async generateProjectDocumentation() {
    const files = this.getAllSourceFiles();
    const fileDocumentations = [];
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
    const projectDoc = {
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
  async analyzeFile(filePath) {
    const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
    const lines = content.split('\n');
    const elements = this.extractCodeElements(content, filePath);
    const imports = this.extractImports(content);
    const exports = this.extractExports(content);
    const stats = (0, fs_1.statSync)(filePath);
    return {
      filePath: (0, path_1.relative)(this.projectRoot, filePath),
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
  generateReadme(projectDoc) {
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
    (0, fs_1.writeFileSync)((0, path_1.join)(this.projectRoot, 'README.md'), readme);
    return readme;
  }
  getAllSourceFiles() {
    const files = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const scanDirectory = dir => {
      const items = (0, fs_1.readdirSync)(dir);
      for (const item of items) {
        const fullPath = (0, path_1.join)(dir, item);
        const stat = (0, fs_1.statSync)(fullPath);
        if (this.shouldExclude(fullPath)) {
          continue;
        }
        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (extensions.includes((0, path_1.extname)(fullPath))) {
          files.push(fullPath);
        }
      }
    };
    scanDirectory(this.projectRoot);
    return files;
  }
  shouldExclude(filePath) {
    const relativePath = (0, path_1.relative)(this.projectRoot, filePath);
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
  extractCodeElements(content, filePath) {
    const elements = [];
    const lines = content.split('\n');
    // Extract functions
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      elements.push({
        type: 'function',
        name: match[1],
        filePath: (0, path_1.relative)(this.projectRoot, filePath),
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
        filePath: (0, path_1.relative)(this.projectRoot, filePath),
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
        filePath: (0, path_1.relative)(this.projectRoot, filePath),
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
        filePath: (0, path_1.relative)(this.projectRoot, filePath),
        lineNumber,
        isExported: match[0].includes('export'),
      });
    }
    return elements;
  }
  extractImports(content) {
    const importRegex = /import.*?from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  }
  extractExports(content) {
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|interface|type)\s+(\w+)/g;
    const exports = [];
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    return exports;
  }
  extractFileDescription(content) {
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
  calculateFileComplexity(content) {
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
  calculateSummary(files) {
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
  analyzeArchitecture(files) {
    const components = [];
    const utilities = [];
    const types = [];
    const tests = [];
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
  generateFileTree(files) {
    return files
      .map(
        file =>
          `- \`${file.filePath}\` (${file.linesOfCode} lines, ${file.elements.length} elements)`
      )
      .join('\n');
  }
  generateComponentDocs(files) {
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
  getProjectName() {
    try {
      const packageJson = JSON.parse(
        (0, fs_1.readFileSync)((0, path_1.join)(this.projectRoot, 'package.json'), 'utf-8')
      );
      return packageJson.name || 'Unknown Project';
    } catch {
      return 'Unknown Project';
    }
  }
  getProjectDescription() {
    try {
      const packageJson = JSON.parse(
        (0, fs_1.readFileSync)((0, path_1.join)(this.projectRoot, 'package.json'), 'utf-8')
      );
      return packageJson.description || 'No description available';
    } catch {
      return 'No description available';
    }
  }
  getProjectVersion() {
    try {
      const packageJson = JSON.parse(
        (0, fs_1.readFileSync)((0, path_1.join)(this.projectRoot, 'package.json'), 'utf-8')
      );
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }
  saveDocumentation(projectDoc) {
    const docsDir = (0, path_1.join)(this.projectRoot, 'docs', 'generated');
    (0, fs_1.writeFileSync)(
      (0, path_1.join)(docsDir, 'project-documentation.json'),
      JSON.stringify(projectDoc, null, 2)
    );
  }
}
exports.AutoDocGenerator = AutoDocGenerator;
// Global documentation generator instance
// Global auto documentation generator instance
exports.autoDocGenerator = new AutoDocGenerator();
