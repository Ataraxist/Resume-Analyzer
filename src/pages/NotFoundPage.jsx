import { Link } from 'react-router-dom';
import { Compass, Home, ArrowLeft } from 'lucide-react';

function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Icon */}
        <div className="mb-8">
          <Compass className="h-24 w-24 text-gray-300 mx-auto mb-4 animate-pulse" />
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Lost Your Way?
          </h2>
        </div>
        
        {/* Message */}
        <p className="text-gray-600 mb-8">
          It looks like you've wandered off the career path. The page you're looking for doesn't exist or has been moved.
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Home className="h-5 w-5 mr-2" />
            Go Home
          </Link>
          
          <Link
            to="/careers"
            className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            <Compass className="h-5 w-5 mr-2" />
            Explore Careers
          </Link>
        </div>
        
        {/* Additional Help Text */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need help? Try starting from our{' '}
            <Link to="/" className="text-primary-600 hover:text-primary-700 underline">
              homepage
            </Link>
            {' '}or{' '}
            <Link to="/careers" className="text-primary-600 hover:text-primary-700 underline">
              browse career paths
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;