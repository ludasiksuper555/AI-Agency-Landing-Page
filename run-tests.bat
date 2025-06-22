@echo off
echo ========================================
echo    STAGE 6 PWA & SECURITY TESTS
echo ========================================
echo.

echo [INFO] Checking project structure...
echo.

REM Security Tests
echo [SECURITY TESTS]
if exist package.json (
    echo [PASS] TC-SEC-001: package.json exists
) else (
    echo [FAIL] TC-SEC-001: package.json missing
)

if exist .env.example (
    echo [PASS] TC-SEC-002: .env.example exists
) else (
    echo [FAIL] TC-SEC-002: .env.example missing
)

if exist middleware.ts (
    echo [PASS] TC-SEC-003: middleware.ts exists
) else (
    echo [FAIL] TC-SEC-003: middleware.ts missing
)

echo.
REM PWA Tests
echo [PWA TESTS]
if exist public\manifest.json (
    echo [PASS] TC-PWA-001: PWA manifest exists
) else (
    echo [FAIL] TC-PWA-001: PWA manifest missing
)

if exist public\sw.js (
    echo [PASS] TC-PWA-002: Service Worker exists
) else (
    echo [FAIL] TC-PWA-002: Service Worker missing
)

if exist components\PWAInstallPrompt.tsx (
    echo [PASS] TC-PWA-003: PWA Install Component exists
) else (
    echo [FAIL] TC-PWA-003: PWA Install Component missing
)

if exist public\icons (
    echo [PASS] TC-PWA-004: PWA Icons directory exists
) else (
    echo [FAIL] TC-PWA-004: PWA Icons directory missing
)

if exist pages\offline.tsx (
    echo [PASS] TC-PWA-005: Offline page exists
) else if exist pages\offline.js (
    echo [PASS] TC-PWA-005: Offline page exists
) else (
    echo [FAIL] TC-PWA-005: Offline page missing
)

echo.
REM Configuration Tests
echo [CONFIGURATION TESTS]
if exist next.config.js (
    echo [PASS] TC-CFG-001: Next.js config exists
) else (
    echo [FAIL] TC-CFG-001: Next.js config missing
)

if exist tsconfig.json (
    echo [PASS] TC-CFG-002: TypeScript config exists
) else (
    echo [FAIL] TC-CFG-002: TypeScript config missing
)

if exist tailwind.config.js (
    echo [PASS] TC-CFG-003: Tailwind config exists
) else (
    echo [FAIL] TC-CFG-003: Tailwind config missing
)

echo.
REM Documentation Tests
echo [DOCUMENTATION TESTS]
if exist README.md (
    echo [PASS] TC-DOC-001: README exists
) else (
    echo [FAIL] TC-DOC-001: README missing
)

if exist PWA_SECURITY_SETUP.md (
    echo [PASS] TC-DOC-002: PWA Setup Guide exists
) else (
    echo [FAIL] TC-DOC-002: PWA Setup Guide missing
)

if exist STAGE_6_TESTING_PLAN.md (
    echo [PASS] TC-DOC-003: Testing Plan exists
) else (
    echo [FAIL] TC-DOC-003: Testing Plan missing
)

if exist manual-pwa-testing-guide.md (
    echo [PASS] TC-DOC-004: Manual Testing Guide exists
) else (
    echo [FAIL] TC-DOC-004: Manual Testing Guide missing
)

echo.
echo ========================================
echo           TEST SUMMARY
echo ========================================
echo.
echo Tests completed! Check results above.
echo.
echo Next steps:
echo 1. Review failed tests
echo 2. Run manual testing guide
echo 3. Use Lighthouse for PWA audit
echo 4. Check security headers online
echo.
echo For detailed testing:
echo - Open manual-pwa-testing-guide.md
echo - Run: npm audit (if npm available)
echo - Test PWA in Chrome DevTools
echo.
pause
