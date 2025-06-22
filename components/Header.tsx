'use client';
// Тимчасово закоментовано імпорт Clerk
// import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Тимчасово закоментовано використання Clerk
  // const { isSignedIn, user } = useUser();
  const isSignedIn = false; // Тимчасово встановлюємо як false
  const user: { firstName?: string; fullName?: string } | null = null; // Тимчасово встановлюємо як null
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const { t } = useTranslation('common');

  const publicNavLinks = [
    { name: t('nav.home'), href: '/#hero' },
    { name: t('nav.services'), href: '/#services' },
    { name: t('nav.team'), href: '/#team' },
    { name: t('nav.marketAnalytics'), href: '/#market-analytics' },
    { name: t('nav.export'), href: '/#export' },
    { name: t('nav.testimonials'), href: '/#testimonials' },
    { name: t('nav.contact'), href: '/#contact' },
    { name: t('nav.blog'), href: '/blog' },
  ];

  const privateNavLinks = [
    ...publicNavLinks,
    { name: t('nav.profile'), href: '/profile' },
    { name: t('nav.dashboard'), href: '/dashboard' },
  ];

  const navLinks = isSignedIn ? privateNavLinks : publicNavLinks;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <motion.div
            className="flex items-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <a href="#">
              <svg
                className="w-8 h-8 mr-2 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`text-2xl font-bold ${isScrolled ? 'text-gray-800' : 'text-white'}`}
              >
                {t('footer.company_name')}
              </motion.span>
            </a>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className={`font-medium hover:text-blue-600 transition-colors ${
                  isScrolled ? 'text-gray-700' : 'text-white'
                }`}
              >
                <motion.span
                  className="flex items-center space-x-4"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {link.name}
                </motion.span>
              </Link>
            ))}

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mr-2"
            >
              <div>
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
              {isSignedIn ? (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/profile"
                    className={`text-sm font-medium transition-colors duration-300 ${isScrolled ? 'text-gray-800 hover:text-red-600' : 'text-white hover:text-red-200'}`}
                  >
                    {user?.firstName || t('nav.profile')}
                  </Link>
                  {/* Тимчасово закоментовано компонент UserButton */}
                  {/* <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        userButtonAvatarBox: `border-2 ${isScrolled ? 'border-red-600' : 'border-white'}`
                      }
                    }}
                  /> */}
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${isScrolled ? 'bg-white text-red-600 hover:bg-gray-100 border border-red-600' : 'bg-white text-red-600 hover:bg-red-50'}`}
                  >
                    {t('nav.profile')}
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  {/* Тимчасово закоментовано компоненти SignInButton і SignUpButton */}
                  {/* <SignInButton mode="modal">
                    <button className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${isScrolled ? 'bg-white text-red-600 hover:bg-gray-100 border border-red-600' : 'bg-white text-red-600 hover:bg-red-50'}`}>
                      Увійти
                    </button>
                  </SignInButton>

                  <SignUpButton mode="modal">
                    <button className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${isScrolled ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                      Зареєструватися
                    </button>
                  </SignUpButton> */}
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${isScrolled ? 'bg-white text-red-600 hover:bg-gray-100 border border-red-600' : 'bg-white text-red-600 hover:bg-red-50'}`}
                  >
                    {t('nav.signIn')}
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${isScrolled ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
                  >
                    {t('nav.signUp')}
                  </button>
                </div>
              )}
            </motion.div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className={`p-2 rounded-md focus:outline-none ${
                isScrolled ? 'text-gray-700' : 'text-white'
              }`}
              aria-label={t('nav.toggleMenu')}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden mt-4 py-4 bg-white rounded-lg shadow-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col space-y-3 px-4">
              {navLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="text-gray-700 font-medium hover:text-red-600 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}

              {isSignedIn ? (
                <div className="flex items-center space-x-2 py-2">
                  {/* Тимчасово закоментовано компонент UserButton */}
                  {/* <UserButton afterSignOutUrl="/" /> */}
                  <button className="text-gray-700 font-medium hover:text-red-600 transition-colors py-2">
                    {t('nav.profile')}
                  </button>
                  <span className="text-gray-700 font-medium">
                    {user?.fullName || t('nav.user')}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col space-y-3 pt-2 border-t border-gray-200 mt-2">
                  <div className="py-2 flex items-center space-x-2">
                    <LanguageSwitcher />
                    <ThemeToggle />
                  </div>
                  {/* Тимчасово закоментовано компоненти SignInButton і SignUpButton */}
                  {/* <SignInButton mode="modal">
                    <button
                      className="text-gray-700 font-medium hover:text-red-600 transition-colors py-2"
                    >
                      Увійти
                    </button>
                  </SignInButton>

                  <SignUpButton mode="modal">
                    <button
                      className="bg-red-600 text-white font-medium hover:bg-red-700 transition-colors py-2 px-4 rounded-md"
                    >
                      Реєстрація
                    </button>
                  </SignUpButton> */}
                  <button className="text-gray-700 font-medium hover:text-red-600 transition-colors py-2">
                    {t('nav.signIn')}
                  </button>
                  <button className="bg-red-600 text-white font-medium hover:bg-red-700 transition-colors py-2 px-4 rounded-md">
                    {t('nav.signUp')}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
};

export default Header;
