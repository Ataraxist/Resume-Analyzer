/**
 * Toast Service
 * Wrapper around react-hot-toast with error handling integration
 */

import { customToast } from '../contexts/ToastContext';
import { getErrorMessage, logError, createErrorDetails } from '../utils/errorHandler';

class ToastService {
  /**
   * Show success toast
   * @param {string} message - Success message
   * @param {object} options - Additional options
   */
  success(message, options = {}) {
    customToast.success(message);
    
    // Log success events in development
    if (process.env.NODE_ENV === 'development' && options.log) {
      console.log('✅ Success:', message, options);
    }
  }

  /**
   * Show error toast with proper error handling
   * @param {Error|string} error - Error object or message
   * @param {string} context - Context where error occurred
   * @param {object} options - Additional options
   */
  error(error, context = '', options = {}) {
    // Get user-friendly error message
    const message = typeof error === 'string' 
      ? error 
      : getErrorMessage(error, context);
    
    // Log error for debugging
    if (error instanceof Error) {
      logError(error, context, options.metadata);
    }
    
    // Create error details for development
    const details = error instanceof Error 
      ? createErrorDetails(error, context)
      : null;
    
    // Show error toast with details in development
    customToast.error(message, details);
    
    // Return the message for component use
    return message;
  }

  /**
   * Show warning toast
   * @param {string} message - Warning message
   */
  warning(message) {
    customToast.warning(message);
  }

  /**
   * Show info toast
   * @param {string} message - Info message
   */
  info(message) {
    customToast.info(message);
  }

  /**
   * Show loading toast
   * @param {string} message - Loading message
   * @returns {string} Toast ID for dismissing
   */
  loading(message) {
    return customToast.loading(message);
  }

  /**
   * Handle promise with toast notifications
   * @param {Promise} promise - Promise to handle
   * @param {object} messages - Loading, success, and error messages
   * @param {string} context - Error context
   */
  async promise(promise, messages, context = '') {
    try {
      const result = await customToast.promise(
        promise,
        {
          loading: messages.loading || 'Processing...',
          success: messages.success || 'Success!',
          error: (err) => getErrorMessage(err, context)
        }
      );
      return result;
    } catch (error) {
      // Log the error
      logError(error, context);
      throw error;
    }
  }

  /**
   * Show error with retry option
   * @param {Error} error - Error object
   * @param {Function} retryFn - Function to retry
   * @param {string} context - Error context
   */
  errorWithRetry(error, retryFn, context = '') {
    const message = getErrorMessage(error, context);
    
    // For now, show error with instructions to retry
    // TODO: Implement custom retry toast component
    customToast.error(`${message}. Please try again.`);
    
    // Optionally trigger retry after a delay
    if (retryFn && typeof retryFn === 'function') {
      console.log('Retry function available for:', message);
    }
  }

  /**
   * Dismiss a specific toast or all toasts
   * @param {string} toastId - Optional toast ID to dismiss
   */
  dismiss(toastId) {
    if (toastId) {
      customToast.dismiss(toastId);
    } else {
      customToast.dismiss();
    }
  }

  /**
   * Show upload progress toast
   * @param {number} progress - Progress percentage
   * @param {string} fileName - File name being uploaded
   */
  uploadProgress(progress, fileName) {
    const message = `Uploading ${fileName}: ${progress}%`;
    
    if (progress < 100) {
      return this.loading(message);
    } else {
      this.success(`${fileName} uploaded successfully`);
    }
  }

  /**
   * Show form validation errors
   * @param {object} errors - Form validation errors
   */
  formErrors(errors) {
    const errorCount = Object.keys(errors).length;
    const message = errorCount === 1
      ? 'Please fix the error in the form'
      : `Please fix ${errorCount} errors in the form`;
    
    this.warning(message);
  }

  /**
   * Show network error with offline detection
   * @param {Error} error - Network error
   */
  networkError(error) {
    if (!navigator.onLine) {
      this.error('You appear to be offline. Please check your internet connection.');
    } else {
      this.error(error, 'network');
    }
  }

  /**
   * Show authentication required toast
   * @param {string} action - Action that requires auth
   */
  authRequired(action = '') {
    const message = action 
      ? `Please sign in to ${action}`
      : 'Please sign in to continue';
    
    this.warning(message);
  }

  /**
   * Show feature unavailable toast
   * @param {string} feature - Feature name
   */
  featureUnavailable(feature) {
    this.info(`${feature} is coming soon!`);
  }

  /**
   * Show copy to clipboard success
   * @param {string} content - What was copied
   */
  copied(content = 'Content') {
    this.success(`${content} copied to clipboard`);
  }

  /**
   * Show rate limit error
   * @param {number} retryAfter - Seconds to wait
   */
  rateLimited(retryAfter = 60) {
    const minutes = Math.ceil(retryAfter / 60);
    const message = minutes === 1
      ? 'Too many requests. Please wait a minute and try again.'
      : `Too many requests. Please wait ${minutes} minutes and try again.`;
    
    this.warning(message);
  }
}

// Create singleton instance
const toastService = new ToastService();

// Export instance as default
export default toastService;

// Also export class for testing
export { ToastService };