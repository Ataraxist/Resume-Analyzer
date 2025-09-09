import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/FirebaseAuthContext';
import toastService from '../../services/toastService';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';

function AuthModal({ isOpen, onClose }) {
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [isLoading, setIsLoading] = useState(false);
  const { signup, login, signInWithGoogle, isAnonymous } = useAuth();
  
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm();
  const password = watch('password');

  const handleClose = () => {
    reset();
    setMode('signin');
    onClose();
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      let result;
      
      if (mode === 'signin') {
        // Sign in existing user
        result = await login(data.email, data.password);
      } else {
        // Sign up new user
        result = await signup(data.email, data.password, data.fullName);
      }
      
      if (result.success) {
        // Show success message
        const successMessage = mode === 'signin' 
          ? 'Welcome back!' 
          : 'Account created successfully!';
        
        // Data migration happens automatically in FirebaseAuthContext
        if (result.previousAnonymousUid) {
          toastService.success(successMessage + ' Your previous work has been saved.');
        } else {
          toastService.success(successMessage);
        }
        
        setTimeout(() => {
          handleClose();
        }, 500);
      } else {
        // Handle specific errors
        if (result.error?.includes('email-already-in-use')) {
          toastService.warning('This email is already registered. Please sign in instead.');
          setMode('signin'); // Switch to sign in mode
        } else if (result.error?.includes('user-not-found')) {
          toastService.warning('No account found with this email. Please sign up first.');
          setMode('signup'); // Switch to sign up mode
        } else if (result.error?.includes('wrong-password')) {
          toastService.error('Incorrect password. Please try again.');
        } else {
          toastService.error(result.error || 'An error occurred. Please try again.', 'auth');
        }
      }
    } catch (err) {
      toastService.error(err, 'auth');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      // Pass whether this is a sign-up (true) or sign-in (false)
      const result = await signInWithGoogle(mode === 'signup');
      if (result.success) {
        // Data migration happens automatically in FirebaseAuthContext
        if (result.previousAnonymousUid) {
          toastService.success('Signed in with Google! Your previous work has been saved.');
        } else {
          toastService.success('Successfully signed in with Google!');
        }
        handleClose();
      } else {
        toastService.error(result.error, 'auth');
        // If credential already in use during sign-up, suggest sign-in
        if (result.error?.includes('already registered') && mode === 'signup') {
          setMode('signin');
        }
      }
    } catch (err) {
      toastService.error(err, 'auth');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md">
      <div className="p-8 space-y-6">
        {/* Header with Tabs */}
        <div className="text-center">
          {isAnonymous ? (
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Save Your Progress
            </h1>
          ) : (
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome
            </h1>
          )}
          
          {/* Tab Selector */}
          <div className="flex border-b border-gray-200 mt-6">
            <button
              onClick={() => {
                setMode('signin');
                reset();
              }}
              className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                mode === 'signin'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                reset();
              }}
              className={`flex-1 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                mode === 'signup'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Removed success/error alerts - now using toast notifications */}

        {/* Google Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name Field (Sign Up only) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register('fullName')}
                  type="text"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="john@example.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                {...register('password', { 
                  required: 'Password is required',
                  ...(mode === 'signup' && {
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters'
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Password must contain uppercase, lowercase, and a number'
                    }
                  })
                })}
                type="password"
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={mode === 'signup' ? 'Create password' : 'Enter password'}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field (Sign Up only) */}
          {mode === 'signup' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  {...register('confirmPassword', { 
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  type="password"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Confirm password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          )}

          {/* Forgot Password Link (Sign In only) */}
          {mode === 'signin' && (
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
              </span>
            ) : (
              mode === 'signin' 
                ? 'Sign In' 
                : isAnonymous 
                  ? 'Upgrade Account' 
                  : 'Create Account'
            )}
          </button>
        </form>
      </div>
    </Modal>
  );
}

export default AuthModal;