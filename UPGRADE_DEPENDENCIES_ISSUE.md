# Upgrade all dependencies

## Dependency Upgrade Required

This issue tracks the needed upgrades for all project dependencies to their latest stable versions.

### Current Dependencies

```json
{
  "dependencies": {
    "@tailwindcss/postcss": "^4.1.6",
    "framer-motion": "^12.10.5",
    "next": "^15.3.2",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@types/node": "22.15.17",
    "@types/react": "19.1.3",
    "autoprefixer": "^10.4.21",
    "postcss": "^8.5.3",
    "tailwindcss": "^4.1.6",
    "typescript": "5.8.3"
  }
}
```

### Latest Stable Versions

```json
{
  "dependencies": {
    "@tailwindcss/postcss": "^4.1.6", // Current is latest
    "framer-motion": "^13.0.0", // Upgrade from ^12.10.5
    "next": "^15.3.2", // Current is latest
    "react": "^19.1.0", // Current is latest
    "react-dom": "^19.1.0" // Current is latest
  },
  "devDependencies": {
    "@types/node": "22.15.17", // Current is latest
    "@types/react": "19.1.3", // Current is latest
    "autoprefixer": "^10.4.21", // Current is latest
    "postcss": "^8.5.3", // Current is latest
    "tailwindcss": "^4.1.6", // Current is latest
    "typescript": "5.8.3" // Current is latest
  }
}
```

### Upgrade Plan

1. ✅ **Research latest stable versions** for each dependency
2. **Check for breaking changes** in major version updates
   - Focus on framer-motion upgrade from v12 to v13
3. **Create upgrade strategy** (all at once or incremental)
   - Recommended: Update framer-motion first, then verify compatibility
4. **Test compatibility** between packages after upgrade
5. **Update package.json** with new versions
6. **Run tests** to ensure everything works correctly

### Implementation Steps

1. **Create a new branch for dependency updates**
   ```bash
   git checkout -b update-dependencies
   ```

2. **Update framer-motion to v13**
   ```bash
   npm uninstall framer-motion
   npm install motion
   ```

3. **Update import statements in codebase**
   - Find all framer-motion imports:
   ```bash
   npx grep-cli "import.*framer-motion" --file-extensions=js,jsx,ts,tsx
   ```
   - Replace with new import syntax:
   ```javascript
   // Old
   import { motion } from "framer-motion";
   // New
   import { motion } from "motion/react";
   ```

4. **Run the application in development mode**
   ```bash
   npm run dev
   ```

5. **Test all animations and interactions**
   - Verify all animations work as expected
   - Check for console errors
   - Test responsive behavior

6. **Run automated tests**
   ```bash
   npm test
   ```

7. **Create pull request for review**
   ```bash
   git add .
   git commit -m "Update dependencies: framer-motion to v13"
   git push origin update-dependencies
   ```

### Potential Breaking Changes to Watch For

- Next.js 15.x → latest: Check for API changes and new features
- React 19.x → latest: Review any deprecated APIs
- TailwindCSS 4.x → latest: Check for class naming changes
- TypeScript 5.x → latest: Verify type compatibility
- framer-motion 12.x → 13.x: Review API changes and migration guide
  - Note: framer-motion has been rebranded as "Motion for React" with new import syntax
  - Import changes: `import { motion } from "motion/react"` instead of `import { motion } from "framer-motion"`

### Success Criteria

- All dependencies updated to latest stable versions
- Application builds without errors
- All features function correctly
- No regression in performance

### Testing & Deployment Recommendations

1. **Create a staging environment** for testing updates before production
2. **Implement automated visual regression testing** to catch UI changes
3. **Monitor performance metrics** before and after updates
4. **Prepare rollback plan** in case of unexpected issues
5. **Schedule deployment** during low-traffic periods

### Dependency Monitoring

To prevent future dependency drift, consider implementing:

- **Dependabot** for automated dependency updates
- **npm-check-updates** for regular auditing
- **Monthly dependency review** as part of maintenance schedule

Assignees: @frontend-team, @DevOps
Labels: maintenance, dependencies, priority-medium