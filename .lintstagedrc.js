module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix --max-warnings=0',
    'prettier --write',
    () => 'tsc --noEmit --skipLibCheck',
  ],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  '*.{css,scss}': ['prettier --write'],
  'package.json': [
    'prettier --write',
    () => 'npm audit --audit-level=moderate || echo "Audit warnings found but continuing..."',
  ],
};
