import FirebaseFunctionsFactory from './firebaseFunctionsFactory';

/**
 * Migrate data from an anonymous user to an authenticated user
 * Now uses a Cloud Function to bypass security rules
 * @param {string} fromUid - The anonymous user's UID
 * @param {string} toUid - The authenticated user's UID
 * @returns {Promise<{success: boolean, migratedCount: number, error?: string}>}
 */
export const migrateAnonymousData = async (fromUid, toUid) => {
  if (!fromUid || !toUid) {
    return { success: false, migratedCount: 0, error: 'Missing UID parameters' };
  }

  try {
    // Get the Cloud Function
    const migrateFunction = FirebaseFunctionsFactory.getCallable('migrateAnonymousDataFunction');
    
    // Call the Cloud Function
    const result = await migrateFunction({ fromUid, toUid });
    
    if (result.data.success) {
      // Clear the stored anonymous UID from sessionStorage
      sessionStorage.removeItem('anonymousUid');
      
      return {
        success: true,
        migratedCount: result.data.migratedCount,
        details: result.data.details
      };
    } else {
      return {
        success: false,
        migratedCount: 0,
        error: result.data.error || 'Migration failed'
      };
    }
  } catch (error) {
    console.error('Migration error:', error);
    return { 
      success: false, 
      migratedCount: 0, 
      error: error.message || 'Migration failed' 
    };
  }
};

/**
 * Check if there's pending anonymous data to migrate
 * @returns {string|null} The anonymous UID if found, null otherwise
 */
export const getPendingAnonymousUid = () => {
  return sessionStorage.getItem('anonymousUid');
};

/**
 * Clear pending anonymous data
 */
export const clearPendingAnonymousData = () => {
  sessionStorage.removeItem('anonymousUid');
};

/**
 * Check if a user has any data to migrate
 * Now uses a Cloud Function to bypass security rules
 * @param {string} anonymousUid - The anonymous user's UID
 * @returns {Promise<{hasData: boolean, resumeCount: number, analysisCount: number}>}
 */
export const checkAnonymousData = async (anonymousUid) => {
  if (!anonymousUid) {
    return { hasData: false, resumeCount: 0, analysisCount: 0 };
  }
  
  try {
    // Get the Cloud Function
    const checkFunction = FirebaseFunctionsFactory.getCallable('checkAnonymousDataFunction');
    
    // Call the Cloud Function
    const result = await checkFunction({ anonymousUid });
    
    return {
      hasData: result.data.hasData,
      resumeCount: result.data.resumeCount,
      analysisCount: result.data.analysisCount
    };
  } catch (error) {
    console.error('Failed to check for existing data:', error);
    // Return false to allow login to continue even if check fails
    return { hasData: false, resumeCount: 0, analysisCount: 0 };
  }
};