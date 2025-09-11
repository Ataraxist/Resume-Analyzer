import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Compass, User, LogOut, ChevronDown, History, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/FirebaseAuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import AuthModal from '../auth/AuthModal';

function Header() {
  const { user, logout, isAuthenticated, isAnonymous } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const dropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <>
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Compass className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">CareerCompass</span>
          </Link>
          
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Profile Icon Dropdown - Always Visible */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <User className="h-5 w-5" />
                <span>{user?.email || 'Guest'}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700">
                  {isAuthenticated && (
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email || 'Anonymous'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email ? 'Signed in' : 'Not signed in'}</p>
                    </div>
                  )}
                  
                  {isAuthenticated && (
                    <Link
                      to="/history"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span className="flex items-center">
                        <History className="h-4 w-4 mr-2" />
                        Analysis History
                      </span>
                    </Link>
                  )}
                  
                  <button
                    onClick={() => {
                      toggleDarkMode();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <span className="flex items-center">
                      {isDarkMode ? (
                        <Sun className="h-4 w-4 mr-2" />
                      ) : (
                        <Moon className="h-4 w-4 mr-2" />
                      )}
                      {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                    </span>
                  </button>
                  
                  {!isAuthenticated || isAnonymous ? (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowAuthModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Sign In / Sign Up
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <span className="flex items-center">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
    
    {/* Auth Modal */}
    <AuthModal 
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
    />
    </>
  );
}

export default Header;