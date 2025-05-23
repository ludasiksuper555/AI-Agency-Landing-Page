import { authMiddleware } from '@clerk/nextjs';
 
export default authMiddleware({
  // Маршрути, які будуть публічно доступні
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api(.*)',
    '/assets(.*)',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ],
  // Маршрути, які будуть ігноруватися middleware (не потребують аутентифікації)
  ignoredRoutes: [
    '/api/webhook/clerk',
    '/api/health',
  ],
  // Покращення взаємодії з браузером
  debug: process.env.NODE_ENV === 'development',
  apiRoutes: ["/api(.*)"]
});
 
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};