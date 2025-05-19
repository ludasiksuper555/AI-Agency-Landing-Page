import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSignedIn, user } = useUser();
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

  const publicNavLinks = [
    { name: 'Головна', href: '/#hero' },
    { name: 'Послуги', href: '/#services' },
    { name: 'Переваги', href: '/#features' },
    { name: 'Відгуки', href: '/#testimonials' },
    { name: 'Тарифи', href: '/#pricing' },
    { name: 'FAQ', href: '/#faq' },
    { name: 'Контакти', href: '/#contact' },
  ];
  
  const privateNavLinks = [
    ...publicNavLinks,
    { name: 'Профіль', href: '/profile' },
    { name: 'Панель керування', href: '/dashboard' },
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <a href="#" className="flex items-center">
              <span className="text-2xl font-bold text-blue-600 mr-2">AI</span>
              <span className={`text-2xl font-bold ${isScrolled ? 'text-gray-800' : 'text-white'}`}>Agency</span>
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
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {link.name}
                </motion.span>
              </Link>
            ))}
            
            <div className="flex items-center space-x-4">
              {isSignedIn ? (
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/profile" 
                    className={`text-sm font-medium transition-colors duration-300 ${isScrolled ? 'text-gray-800 hover:text-blue-600' : 'text-white hover:text-blue-200'}`}
                  >
                    {user?.firstName || 'Профіль'}
                  </Link>
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        userButtonAvatarBox: `border-2 ${isScrolled ? 'border-blue-600' : 'border-white'}`
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <SignInButton mode="modal">
                    <button className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${isScrolled ? 'bg-white text-blue-600 hover:bg-gray-100 border border-blue-600' : 'bg-white text-blue-600 hover:bg-blue-50'}`}>
                      Увійти
                    </button>
                  </SignInButton>
                  
                  <SignUpButton mode="modal">
                    <button className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${isScrolled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                      Зареєструватися
                    </button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className={`p-2 rounded-md focus:outline-none ${
                isScrolled ? 'text-gray-700' : 'text-white'
              }`}
              aria-label="Відкрити меню"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
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
                  className="text-gray-700 font-medium hover:text-blue-600 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              
              {isSignedIn ? (
                <div className="flex items-center space-x-2 py-2">
                  <UserButton afterSignOutUrl="/" />
                  <span className="text-gray-700 font-medium">{user?.fullName || 'Користувач'}</span>
                </div>
              ) : (
                <div className="flex flex-col space-y-3 pt-2 border-t border-gray-200 mt-2">
                  <SignInButton mode="modal">
                    <button 
                      className="text-gray-700 font-medium hover:text-blue-600 transition-colors py-2"
                    >
                      Увійти
                    </button>
                  </SignInButton>
                  
                  <SignUpButton mode="modal">
                    <button 
                      className="bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors py-2 px-4 rounded-md"
                    >
                      Реєстрація
                    </button>
                  </SignUpButton>
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