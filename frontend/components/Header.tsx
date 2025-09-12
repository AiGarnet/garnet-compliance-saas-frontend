"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Moon,
  Sun,
  Globe,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileNavigation } from './MobileNavigation';
import { translations } from '@/lib/i18n';
import { injectCriticalCSS } from './critical-css';
import { ThemeToggle } from './ui/ThemeToggle';
import { useAuth } from '@/lib/auth/AuthContext';
import { hasPermission } from '@/lib/auth/roles';
import TrialStatusNavbar from './TrialStatusNavbar';
import SubscriptionTierDisplay from './SubscriptionTierDisplay';

// Remove the hardcoded CSS variables since we're using the ones from critical-css
// const cssVariables = {
//   style: {
//     '--primary-color': '#3b82f6',
//     '--primary-light': '#93c5fd',
//     '--header-bg': '#ffffff',
//     '--header-text': '#1f2937',
//     '--font-size-sm': '0.875rem',
//     '--font-size-base': '1rem',
//     '--font-size-lg': '1.125rem',
//   } as React.CSSProperties
// };

interface HeaderProps {
  locale?: string;
}

export default function Header({ locale = 'en' }: HeaderProps) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, hasAccess } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentLocale, setCurrentLocale] = useState(locale);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  
  // Inject critical CSS on component mount and check for saved theme preference
  useEffect(() => {
    injectCriticalCSS();
    
    // Always force light mode - ignore any saved preferences
    localStorage.setItem('theme', 'light');
    setIsDarkMode(false);
    document.documentElement.classList.remove('dark-mode');
  }, []);
  
  // We'll use our ThemeToggle component instead of this function
  // Keep the state for compatibility
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
  };

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isProfileOpen && 
          profileDropdownRef.current && 
          !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isProfileOpen]);

  // Handle ESC key to close dropdowns
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, []);

  // Get translations based on locale
  const t = translations[currentLocale as keyof typeof translations] || translations.en;

  // Navigation items based on user role
  const getNavItems = () => {
    if (!isAuthenticated || !user) return [];
    
    // Base navigation items
    const baseItems = [
      { href: '/dashboard', label: t.dashboard },
      { href: '/questionnaires', label: t.questionnaires },
      { href: '/trust-portal', label: t.trustPortal },
      // { href: '/compliance', label: t.compliance }, // TEMPORARILY HIDDEN
    ];
    
    // Add vendors link only if user has access
    if (hasPermission(user.role, 'canAccessVendors')) {
      baseItems.splice(1, 0, { href: '/vendors', label: t.vendors });
    }
    
    // Add admin link only for admin users
    if (user.role === 'admin') {
      baseItems.push({ href: '/admin', label: 'Admin' });
    }
    
    return baseItems;
  };

  const navItems = getNavItems();

  // Available languages
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' }, // Arabic for RTL testing
  ];

  return (
    <header 
      className="sticky top-0 z-30 transition-colors bg-white shadow-sm"
      style={{backgroundColor: 'var(--header-bg)', color: 'var(--header-text)'}}
    >
      {/* Skip to content link */}
      <a 
        href="#main"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-primary focus:text-white focus:z-50"
      >
        {t.skipToContent}
      </a>
      
      <div className="w-full max-w-screen-2xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md p-1" 
              aria-label="Scroll to top"
              type="button"
            >
              <span className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Garnet
              </span>
            </button>
          </div>
          
          {/* Main Navigation */}
          <nav aria-label="Main navigation" className="hidden md:block">
            <ul className="flex space-x-6">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "nav-link min-h-[44px] min-w-[44px] flex items-center px-3 py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
                      pathname === item.href ? "active" : ""
                    )}
                    aria-current={pathname === item.href ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                
                {/* Trial Status - Only for authenticated users */}
                <TrialStatusNavbar />
                
                {/* Profile Dropdown - Only for authenticated users */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center min-h-[44px] min-w-[44px] p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                    aria-label={t.profile}
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center text-primary">
                      <User className="h-5 w-5" />
                    </div>
                  </button>
                  
                  {isProfileOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 animate-fade-in"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu"
                    >
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <p className="text-xs text-primary capitalize">{user?.role}</p>
                      </div>
                      
                      <Link 
                        href="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary/5 transition-colors"
                        role="menuitem"
                      >
                        {t.profile}
                      </Link>
                      <Link 
                        href="/settings" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-primary/5 transition-colors"
                        role="menuitem"
                      >
                        Settings
                      </Link>
                      <button 
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-primary/5 transition-colors flex items-center"
                        role="menuitem"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t.logout}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Login and Signup buttons for non-authenticated users */}
                <Link
                  href="/auth/login"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-md transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Sign Up
                </Link>
              </>
            )}
            
            {/* Mobile Menu Button - Only visible on mobile */}
            <button 
              aria-label="Menu"
              className="md:hidden min-h-[44px] min-w-[44px] p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
              onClick={() => {
                // This is expected to be handled by the MobileNavigation component
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu) {
                  const isExpanded = mobileMenu.getAttribute('aria-expanded') === 'true';
                  mobileMenu.setAttribute('aria-expanded', (!isExpanded).toString());
                  mobileMenu.classList.toggle('translate-x-0');
                  mobileMenu.classList.toggle('-translate-x-full');
                }
              }}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 