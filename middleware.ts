import { authMiddleware } from '@clerk/nextjs';
 
export default authMiddleware({
  // Маршрути, які будуть публічно доступні
  publicRoutes: [
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api(.*)',
  ],
  // Маршрути, які будуть ігноруватися middleware (не потребують аутентифікації)
  ignoredRoutes: [
    '/api/webhook/clerk'
  ],
});
 
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};