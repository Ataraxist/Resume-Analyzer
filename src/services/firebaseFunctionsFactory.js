import { httpsCallable } from 'firebase/functions';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, functions } from '../config/firebase';

/**
 * Factory for managing Firebase Callable Functions
 * Ensures proper initialization and provides centralized function management
 */
class FirebaseFunctionsFactory {
  static _callables = new Map();
  static _initPromise = null;
  static _initialized = false;

  /**
   * Ensures Firebase is properly initialized before creating callable functions
   * @returns {Promise<void>}
   */
  static ensureInitialized() {
    if (!this._initPromise) {
      this._initPromise = this._initialize();
    }
    return this._initPromise;
  }

  /**
   * Private initialization method
   * Waits for Firebase Auth to be ready, which ensures Firebase is fully initialized
   * @private
   */
  static async _initialize() {
    if (this._initialized) return;

    return new Promise((resolve) => {
      // If auth already has a known state, resolve immediately
      if (auth.currentUser !== undefined) {
        this._initialized = true;
        resolve();
        return;
      }

      // Otherwise wait for the first auth state change
      const unsubscribe = onAuthStateChanged(auth, () => {
        this._initialized = true;
        unsubscribe();
        resolve();
      });
    });
  }

  /**
   * Gets or creates a callable function reference
   * @param {string} functionName - The name of the Cloud Function
   * @returns {Function} The callable function
   */
  static getCallable(functionName) {
    if (!functionName) {
      throw new Error('Function name is required');
    }


    // Trigger initialization but don't wait (non-blocking)
    // This allows the app to continue loading while ensuring init happens
    this.ensureInitialized().catch(error => {
      console.error('Failed to initialize Firebase Functions Factory:', error);
    });

    // Check if we already have this callable cached
    if (!this._callables.has(functionName)) {
      try {
        // Create and cache the callable function
        const callable = httpsCallable(functions, functionName);
        
        // Create a wrapper for the callable function
        const wrappedCallable = async (data) => {
          const result = await callable(data);
          return result;
        };
        
        // Add the native stream method if it exists on the callable
        if (callable.stream) {
          wrappedCallable.stream = async (data) => {
            const result = await callable.stream(data);
            return result;
          };
        }
        
        this._callables.set(functionName, wrappedCallable);
      } catch (error) {
        console.error(`Failed to initialize function ${functionName}:`, error);
        // Return a function that will throw when called
        return () => {
          throw new Error(`Failed to initialize function: ${functionName}`);
        };
      }
    }

    return this._callables.get(functionName);
  }

  /**
   * Clears the cache of callable functions
   * Useful for testing or when you need to reset the factory
   */
  static clearCache() {
    this._callables.clear();
  }

  /**
   * Waits for initialization to complete
   * Useful for app startup sequences where you want to ensure readiness
   */
  static async waitForInitialization() {
    return this.ensureInitialized();
  }

  /**
   * Gets initialization status
   */
  static isInitialized() {
    return this._initialized;
  }
}

export default FirebaseFunctionsFactory;