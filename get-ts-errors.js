const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Getting detailed TypeScript errors...');

// Run TypeScript compiler with detailed output
exec('npx tsc --noEmit --pretty false', (error, stdout, stderr) => {
  if (error) {
    console.log('\n📋 TypeScript Compilation Errors:');
    console.log('='.repeat(50));

    // Parse and display errors
    const output = stderr || stdout;
    if (output) {
      const lines = output.split('\n');
      let currentFile = '';

      lines.forEach(line => {
        if (line.trim()) {
          // Check if it's a file path line
          if (line.includes('.ts(') || line.includes('.tsx(')) {
            const match = line.match(/^(.+\.tsx?)\((\d+),(\d+)\): (.+)$/);
            if (match) {
              const [, filePath, lineNum, colNum, message] = match;
              const fileName = path.basename(filePath);

              if (fileName !== currentFile) {
                console.log(`\n📄 ${fileName}:`);
                currentFile = fileName;
              }

              console.log(`  Line ${lineNum}:${colNum} - ${message}`);
            }
          } else if (line.includes('error TS')) {
            console.log(`    ${line.trim()}`);
          }
        }
      });
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n💡 Next steps:');
    console.log('1. Fix the errors shown above');
    console.log('2. Run this script again to verify fixes');
    console.log('3. Continue with environment setup');
  } else {
    console.log('✅ No TypeScript errors found!');
    console.log('\n🚀 Ready for next steps:');
    console.log('1. Environment setup (JWT_SECRET, etc.)');
    console.log('2. Database integration');
    console.log('3. Unit testing');
    console.log('4. Security review');
  }
});
