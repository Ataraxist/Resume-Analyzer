/**
 * Centralized error handling utilities
 * Provides consistent error parsing and logging across the application
 */

// Firebase error code mappings
const FIREBASE_ERROR_MESSAGES = {
  // Authentication errors
  'auth/invalid-email': 'Please enter a valid email address',
  'auth/user-disabled': 'This account has been disabled',
  'auth/user-not-found': 'No account found with this email',
  'auth/wrong-password': 'Incorrect password',
  'auth/email-already-in-use': 'An account already exists with this email',
  'auth/weak-password': 'Password should be at least 6 characters',
  'auth/network-request-failed': 'Network error. Please check your connection',
  'auth/too-many-requests': 'Too many attempts. Please try again later',
  'auth/popup-closed-by-user': 'Sign-in was cancelled',
  'auth/unauthorized-domain': 'This domain is not authorized for sign-in',
  
  // Firestore errors
  'permission-denied': 'You don\'t have permission to perform this action',
  'not-found': 'The requested resource was not found',
  'already-exists': 'This resource already exists',
  'resource-exhausted': 'Quota exceeded. Please try again later',
  'failed-precondition': 'Operation cannot be performed in the current state',
  'aborted': 'Operation was aborted. Please try again',
  'out-of-range': 'Operation was attempted past the valid range',
  'unimplemented': 'This feature is not yet implemented',
  'internal': 'An internal error occurred. Please try again',
  'unavailable': 'Service is temporarily unavailable',
  'data-loss': 'Unrecoverable data loss or corruption',
  'unauthenticated': 'Please sign in to continue',
  
  // Storage errors
  'storage/unauthorized': 'You don\'t have permission to access this file',
  'storage/canceled': 'Upload was cancelled',
  'storage/unknown': 'An unknown error occurred during upload',
  'storage/object-not-found': 'File not found',
  'storage/bucket-not-found': 'Storage bucket not configured',
  'storage/project-not-found': 'Project not configured',
  'storage/quota-exceeded': 'Storage quota exceeded',
  'storage/unauthenticated': 'Please sign in to upload files',
  'storage/retry-limit-exceeded': 'Upload failed. Please try again',
  'storage/invalid-checksum': 'File was corrupted during upload',
  'storage/cannot-slice-blob': 'File cannot be read. Please try a different file',
  'storage/server-file-wrong-size': 'File size mismatch. Please try again',
};

// OpenAI/Parser specific error messages
const PARSER_ERROR_MESSAGES = {
  'OPENAI_API_KEY': 'Resume parsing service is temporarily unavailable. Please try again later.',
  'OPENAI_PARSING_MODEL': 'Resume parser configuration error. Please contact support.',
  'Invalid file type': 'Please upload a PDF, DOC, DOCX, or TXT file.',
  'No text content': 'Could not extract text from the file. Please try a different format.',
  'JSON parse error': 'Failed to parse resume structure. Please try again.',
  'Timeout': 'Resume processing is taking longer than expected. Please try again.',
  'Rate limit': 'Too many requests. Please wait a moment and try again.',
  'Google Docs access': 'Unable to access Google Doc. Please make sure it\'s publicly accessible or try uploading the file directly.',
  'Invalid Google Docs URL': 'Please provide a valid Google Docs URL.',
  'File too large': 'Whoa, this resume is huge, and exceeds the size limit (500KB). Please use a smaller file.',
  'Network error': 'Connection issue. Please check your internet and try again.',
};

// Application-specific error messages
const APP_ERROR_MESSAGES = {
  'No occupation selected': 'Please select a career path before uploading your resume.',
  'Resume not found': 'Resume not found. It may have been deleted.',
  'Analysis failed': 'Failed to analyze resume. Please try again.',
  'Invalid resume format': 'Resume format is not recognized. Please check the file.',
  'Session expired': 'Your session has expired. Please sign in again.',
  'Feature unavailable': 'This feature is currently unavailable. Please try again later.',
  'Credit limit exceeded': 'You\'ve reached your analysis limit. Please upgrade your plan.',
};

/**
 * Parse Firebase error and return user-friendly message
 * @param {Error} error - Firebase error object
 * @returns {string} User-friendly error message
 */
export function parseFirebaseError(error) {
  // Check for Firebase auth errors
  if (error.code && FIREBASE_ERROR_MESSAGES[error.code]) {
    return FIREBASE_ERROR_MESSAGES[error.code];
  }
  
  // Check for Firestore errors
  if (error.code && error.code.includes('/')) {
    const baseCode = error.code.split('/')[1];
    if (FIREBASE_ERROR_MESSAGES[baseCode]) {
      return FIREBASE_ERROR_MESSAGES[baseCode];
    }
  }
  
  // Return original message if no mapping found
  return error.message || 'An unexpected error occurred';
}

/**
 * Parse parser/OpenAI errors and return user-friendly message
 * @param {Error} error - Parser error object
 * @returns {string} User-friendly error message
 */
export function parseParserError(error) {
  const errorMessage = error.message || '';
  
  // Check each parser error pattern
  for (const [pattern, message] of Object.entries(PARSER_ERROR_MESSAGES)) {
    if (errorMessage.includes(pattern)) {
      return message;
    }
  }
  
  // Check for specific HTTP status codes
  if (error.status === 429) {
    return PARSER_ERROR_MESSAGES['Rate limit'];
  }
  
  if (error.status === 504 || error.status === 408) {
    return PARSER_ERROR_MESSAGES['Timeout'];
  }
  
  if (error.status >= 500) {
    return 'Server error. Our team has been notified. Please try again later.';
  }
  
  return errorMessage || 'Failed to process resume. Please try again.';
}

/**
 * Parse application errors and return user-friendly message
 * @param {Error} error - Application error object
 * @returns {string} User-friendly error message
 */
export function parseAppError(error) {
  const errorMessage = error.message || '';
  
  // Check each app error pattern
  for (const [pattern, message] of Object.entries(APP_ERROR_MESSAGES)) {
    if (errorMessage.includes(pattern)) {
      return message;
    }
  }
  
  return errorMessage;
}

/**
 * Get user-friendly error message from any error type
 * @param {Error|string} error - Error object or string
 * @param {string} context - Context where error occurred (e.g., 'upload', 'auth', 'analysis')
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error, context = '') {
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle null/undefined
  if (!error) {
    return 'An unexpected error occurred';
  }
  
  // Try different parsers based on context
  if (context === 'auth' || error.code?.includes('auth/')) {
    return parseFirebaseError(error);
  }
  
  if (context === 'parser' || context === 'resume' || context === 'upload') {
    return parseParserError(error);
  }
  
  if (context === 'storage' || error.code?.includes('storage/')) {
    return parseFirebaseError(error);
  }
  
  // Try all parsers
  let message = parseFirebaseError(error);
  if (message === error.message) {
    message = parseParserError(error);
  }
  if (message === error.message) {
    message = parseAppError(error);
  }
  
  return message || 'An unexpected error occurred';
}

/**
 * Log error with context for debugging
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @param {object} metadata - Additional metadata
 */
export function logError(error, context = '', metadata = {}) {
  // Always log in development
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔴 Error in ${context}`);
    console.error('Error:', error);
    console.error('Stack:', error?.stack);
    console.error('Metadata:', metadata);
    console.groupEnd();
  }
  
  // In production, you might want to send to error tracking service
  // Example: Sentry, LogRocket, etc.
  if (process.env.NODE_ENV === 'production') {
    // Only log critical errors in production console
    if (error?.status >= 500 || context === 'critical') {
      console.error(`Error in ${context}:`, error?.message);
    }
    
    // TODO: Send to error tracking service
    // window.Sentry?.captureException(error, {
    //   tags: { context },
    //   extra: metadata
    // });
  }
}

/**
 * Create detailed error object for debugging
 * @param {Error} error - Original error
 * @param {string} context - Error context
 * @returns {object} Detailed error object
 */
export function createErrorDetails(error, context = '') {
  return {
    message: getErrorMessage(error, context),
    originalMessage: error?.message,
    code: error?.code,
    status: error?.status,
    context,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
  };
}

/**
 * Retry a failed operation with exponential backoff
 * @param {Function} operation - Async operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in ms
 * @returns {Promise} Result of the operation
 */
export async function retryWithBackoff(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error.code === 'auth/user-not-found' || 
          error.code === 'auth/wrong-password' ||
          error.status === 401 ||
          error.status === 403) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}

/**
 * Check if error is retryable
 * @param {Error} error - Error object
 * @returns {boolean} Whether the error is retryable
 */
export function isRetryableError(error) {
  // Network errors
  if (error.code === 'auth/network-request-failed' || 
      error.message?.includes('Network') ||
      error.message?.includes('fetch')) {
    return true;
  }
  
  // Rate limiting
  if (error.status === 429 || error.code === 'resource-exhausted') {
    return true;
  }
  
  // Server errors
  if (error.status >= 500) {
    return true;
  }
  
  // Timeout errors
  if (error.code === 'deadline-exceeded' || error.status === 408) {
    return true;
  }
  
  return false;
}

// Export all for convenience
export default {
  parseFirebaseError,
  parseParserError,
  parseAppError,
  getErrorMessage,
  logError,
  createErrorDetails,
  retryWithBackoff,
  isRetryableError,
};