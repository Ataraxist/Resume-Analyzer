import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Compass, User, LogOut, ChevronDown, History } from 'lucide-react';
import { useAuth } from '../../contexts/FirebaseAuthContext';
import AuthModal from '../auth/AuthModal';

function Header() {
  const { user, logout, isAuthenticated, isAnonymous } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <>
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Compass className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">CareerCompass</span>
          </Link>
          
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* User Menu / Auth Buttons */}
            {isAuthenticated ? (
              <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-gray-50 transition-colors"
              >
                <User className="h-5 w-5" />
                <span>{user?.username || user?.email}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.fullName || user?.username}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  
                  <Link
                    to="/history"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <span className="flex items-center">
                      <History className="h-4 w-4 mr-2" />
                      Analysis History
                    </span>
                  </Link>
                  
                  {isAnonymous ? (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setShowAuthModal(true);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Sign In / Sign Up
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
              >
                Sign In / Sign Up
              </button>
            )}
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