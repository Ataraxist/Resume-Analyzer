import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch,
  doc 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Migrate data from an anonymous user to an authenticated user
 * @param {string} fromUid - The anonymous user's UID
 * @param {string} toUid - The authenticated user's UID
 * @returns {Promise<{success: boolean, migratedCount: number, error?: string}>}
 */
export const migrateAnonymousData = async (fromUid, toUid) => {
  if (!fromUid || !toUid) {
    return { success: false, migratedCount: 0, error: 'Missing UID parameters' };
  }

  
  try {
    const batch = writeBatch(db);
    let migratedCount = 0;
    
    // Migrate resumes
    const resumesQuery = query(
      collection(db, 'resumes'), 
      where('userId', '==', fromUid)
    );
    const resumesSnapshot = await getDocs(resumesQuery);
    
    resumesSnapshot.forEach((docSnapshot) => {
      batch.update(doc(db, 'resumes', docSnapshot.id), {
        userId: toUid,
        migratedFrom: fromUid,
        migratedAt: new Date().toISOString()
      });
      migratedCount++;
    });
    
    // Migrate analyses
    const analysesQuery = query(
      collection(db, 'analyses'), 
      where('userId', '==', fromUid)
    );
    const analysesSnapshot = await getDocs(analysesQuery);
    
    analysesSnapshot.forEach((docSnapshot) => {
      batch.update(doc(db, 'analyses', docSnapshot.id), {
        userId: toUid,
        migratedFrom: fromUid,
        migratedAt: new Date().toISOString()
      });
      migratedCount++;
    });
    
    // Commit all updates in a single batch
    if (migratedCount > 0) {
      await batch.commit();
    }
    
    // Clear the stored anonymous UID from sessionStorage
    sessionStorage.removeItem('anonymousUid');
    
    return { success: true, migratedCount };
  } catch (error) {
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
 * @param {string} anonymousUid - The anonymous user's UID
 * @returns {Promise<{hasData: boolean, resumeCount: number, analysisCount: number}>}
 */
export const checkAnonymousData = async (anonymousUid) => {
  if (!anonymousUid) {
    return { hasData: false, resumeCount: 0, analysisCount: 0 };
  }
  
  try {
    // Check resumes
    const resumesQuery = query(
      collection(db, 'resumes'), 
      where('userId', '==', anonymousUid)
    );
    const resumesSnapshot = await getDocs(resumesQuery);
    
    // Check analyses
    const analysesQuery = query(
      collection(db, 'analyses'), 
      where('userId', '==', anonymousUid)
    );
    const analysesSnapshot = await getDocs(analysesQuery);
    
    const resumeCount = resumesSnapshot.size;
    const analysisCount = analysesSnapshot.size;
    
    return {
      hasData: resumeCount > 0 || analysisCount > 0,
      resumeCount,
      analysisCount
    };
  } catch (error) {
    return { hasData: false, resumeCount: 0, analysisCount: 0 };
  }
};