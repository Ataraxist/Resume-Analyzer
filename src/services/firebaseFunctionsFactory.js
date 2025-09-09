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

    console.log(`[FirebaseFunctionsFactory] getCallable called for: ${functionName}`);
    console.log(`[FirebaseFunctionsFactory] Current auth state:`, {
      currentUser: auth.currentUser,
      initialized: this._initialized,
      functionsInstance: !!functions
    });

    // Trigger initialization but don't wait (non-blocking)
    // This allows the app to continue loading while ensuring init happens
    this.ensureInitialized().catch(error => {
      console.error('Failed to initialize Firebase Functions Factory:', error);
    });

    // Check if we already have this callable cached
    if (!this._callables.has(functionName)) {
      try {
        console.log(`[FirebaseFunctionsFactory] Creating new callable for: ${functionName}`);
        // Create and cache the callable function
        const callable = httpsCallable(functions, functionName);
        
        // Create a wrapper for the callable function
        const wrappedCallable = async (data) => {
          console.log(`[FirebaseFunctionsFactory] Calling ${functionName} with data:`, data);
          console.log(`[FirebaseFunctionsFactory] Auth state at call time:`, {
            currentUser: auth.currentUser,
            uid: auth.currentUser?.uid,
            isAnonymous: auth.currentUser?.isAnonymous
          });
          
          try {
            const result = await callable(data);
            console.log(`[FirebaseFunctionsFactory] ${functionName} returned successfully`);
            return result;
          } catch (error) {
            console.error(`[FirebaseFunctionsFactory] ${functionName} failed:`, error);
            throw error;
          }
        };
        
        // Add the native stream method if it exists on the callable
        if (callable.stream) {
          wrappedCallable.stream = async (data) => {
            console.log(`[FirebaseFunctionsFactory] Streaming ${functionName} with data:`, data);
            console.log(`[FirebaseFunctionsFactory] Auth state at stream time:`, {
              currentUser: auth.currentUser,
              uid: auth.currentUser?.uid,
              isAnonymous: auth.currentUser?.isAnonymous
            });
            
            try {
              const result = await callable.stream(data);
              console.log(`[FirebaseFunctionsFactory] ${functionName} stream started successfully`);
              return result;
            } catch (error) {
              console.error(`[FirebaseFunctionsFactory] ${functionName} stream failed:`, error);
              throw error;
            }
          };
        }
        
        this._callables.set(functionName, wrappedCallable);
      } catch (error) {
        console.error(`Failed to create callable for ${functionName}:`, error);
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