const { getFirestore } = require('firebase-admin/firestore');
const { HttpsError } = require('firebase-functions/v2/https');

/**
 * Cloud Function to migrate data from anonymous user to authenticated user
 * Uses admin SDK to bypass security rules
 */
exports.migrateAnonymousData = async (data, context) => {
  const { fromUid, toUid } = data;

  // Validate inputs
  if (!fromUid || !toUid) {
    throw new HttpsError('invalid-argument', 'Both fromUid and toUid are required');
  }

  // Ensure the caller is authenticated and is the target user
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (context.auth.uid !== toUid) {
    throw new HttpsError('permission-denied', 'Can only migrate data to your own account');
  }

  const db = getFirestore();
  const batch = db.batch();
  let migratedCount = 0;
  const migrationDetails = {
    resumes: 0,
    analyses: 0
  };

  try {
    // Query and migrate resumes
    const resumesSnapshot = await db.collection('resumes')
      .where('userId', '==', fromUid)
      .get();

    resumesSnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        userId: toUid,
        migratedFrom: fromUid,
        migratedAt: new Date().toISOString()
      });
      migratedCount++;
      migrationDetails.resumes++;
    });

    // Query and migrate analyses
    const analysesSnapshot = await db.collection('analyses')
      .where('userId', '==', fromUid)
      .get();

    analysesSnapshot.forEach((doc) => {
      batch.update(doc.ref, {
        userId: toUid,
        migratedFrom: fromUid,
        migratedAt: new Date().toISOString()
      });
      migratedCount++;
      migrationDetails.analyses++;
    });

    // Commit all updates in a single batch
    if (migratedCount > 0) {
      await batch.commit();
      console.log(`Successfully migrated ${migratedCount} documents from ${fromUid} to ${toUid}`);
    }

    return {
      success: true,
      migratedCount,
      details: migrationDetails,
      message: `Successfully migrated ${migratedCount} items`
    };
  } catch (error) {
    console.error('Migration error:', error);
    throw new HttpsError('internal', `Migration failed: ${error.message}`);
  }
};

/**
 * Cloud Function to check if anonymous user has data to migrate
 * Uses admin SDK to bypass security rules for checking
 */
exports.checkAnonymousData = async (data, context) => {
  const { anonymousUid } = data;

  // Validate input
  if (!anonymousUid) {
    throw new HttpsError('invalid-argument', 'anonymousUid is required');
  }

  // Ensure the caller is authenticated
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const db = getFirestore();

  try {
    // Check resumes
    const resumesSnapshot = await db.collection('resumes')
      .where('userId', '==', anonymousUid)
      .get();

    // Check analyses
    const analysesSnapshot = await db.collection('analyses')
      .where('userId', '==', anonymousUid)
      .get();

    const resumeCount = resumesSnapshot.size;
    const analysisCount = analysesSnapshot.size;

    return {
      hasData: resumeCount > 0 || analysisCount > 0,
      resumeCount,
      analysisCount,
      totalCount: resumeCount + analysisCount
    };
  } catch (error) {
    console.error('Check anonymous data error:', error);
    throw new HttpsError('internal', `Failed to check anonymous data: ${error.message}`);
  }
};