module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'tsc --noEmit --skipLibCheck',
    'jest --bail --findRelatedTests --passWithNoTests',
  ],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  '*.{css,scss}': ['prettier --write'],
  'package*.json': ['npm audit --audit-level=moderate'],
};
