'use client';

import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationProps {
  variant?: 'public' | 'authenticated';
}

export default function Navigation({ variant = 'authenticated' }: NavigationProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // For public pages (home, login, signup)
  if (variant === 'public' || !isAuthenticated) {
    return (
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <a href="/" className="cursor-pointer">
              <Image
                src="/logo.png"
                alt="admorix"
                width={120}
                height={120}
              />
            </a>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/'
                    ? 'text-primary-600'
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                Home
              </a>
              <a
                href="/login"
                className="btn btn-secondary"
              >
                Login
              </a>
              <a
                href="/signup"
                className="btn btn-primary"
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // For authenticated pages
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <a href="/" className="cursor-pointer">
            <Image
              src="/logo.png"
              alt="admorix"
              width={120}
              height={120}
            />
          </a>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600 text-sm">
              {user?.firstName || user?.email}
            </span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex gap-8 mt-4 border-t pt-3">
          <a
            href="/dashboard"
            className={`text-sm font-medium transition-colors ${
              pathname === '/dashboard'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-700 hover:text-primary-600'
            }`}
          >
            Home
          </a>
          <a
            href="/creatives"
            className={`text-sm font-medium transition-colors ${
              pathname === '/creatives'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-700 hover:text-primary-600'
            }`}
          >
            Generating New Ideas
          </a>
          <a
            href="/agent"
            className={`text-sm font-medium transition-colors ${
              pathname === '/agent'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-700 hover:text-primary-600'
            }`}
          >
            Agent
          </a>
          <a
            href="/settings"
            className={`text-sm font-medium transition-colors ${
              pathname === '/settings'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-700 hover:text-primary-600'
            }`}
          >
            Settings
          </a>
        </div>
      </div>
    </nav>
  );
}
