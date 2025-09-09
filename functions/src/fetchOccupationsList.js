const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();
const ONET_BASE_URL = 'https://api-v2.onetcenter.org';

async function fetchOccupationsList(_request) {
  // This function is called automatically when sync is needed
  // Allow unauthenticated calls - don't check auth
  
  
  const apiKey = process.env.ONET_API_KEY;
  
  if (!apiKey) {
    return { error: 'O*NET API key not configured' };
  }

  const headers = {
    'X-API-Key': apiKey,
    'Accept': 'application/json',
    'User-Agent': 'nodejs-OnetWebService/2.00 (bot)'
  };

  try {
    // First, check current occupation count from metadata
    const metadataRef = db.collection('system').doc('sync_metadata');
    const metadataDoc = await metadataRef.get();
    const currentCount = metadataDoc.exists ? (metadataDoc.data().occupation_count || 0) : 0;
    
    // Get total count from O*NET API
    const countResponse = await fetch(
      `${ONET_BASE_URL}/online/occupations?start=1&end=1`,
      { headers }
    );
    
    if (!countResponse.ok) {
      throw new Error(`O*NET API error: ${countResponse.status}`);
    }
    
    const countData = await countResponse.json();
    const totalOccupations = countData.total || 1016;
    
    // Check if update is needed
    if (currentCount === totalOccupations) {
      await metadataRef.set({
        last_sync: new Date(),
        occupation_count: currentCount,
        sync_status: 'success',
        message: 'No changes detected'
      }, { merge: true });
      return { 
        success: true, 
        message: 'No updates needed',
        occupationCount: currentCount 
      };
    }
    
    
    // Fetch all occupations
    const occupationsResponse = await fetch(
      `${ONET_BASE_URL}/online/occupations?start=1&end=${totalOccupations + 10}`,
      { headers }
    );

    if (!occupationsResponse.ok) {
      throw new Error(`O*NET API error: ${occupationsResponse.status}`);
    }

    const occupationsData = await occupationsResponse.json();
    let batch = db.batch();
    let count = 0;
    let batchCount = 0;

    // Process occupations in batches (Firestore limit is 500 per batch)
    for (const occupation of occupationsData.occupation || []) {
      // Skip "All Other" occupations as they don't have O*NET data
      if (occupation.title?.includes('All Other')) {
        continue;
      }
      
      const occupationRef = db.collection('occupations').doc(occupation.code);
      
      batch.set(occupationRef, {
        code: occupation.code,
        title: occupation.title,
        description: occupation.description || '',
        bright_outlook: occupation.tags?.bright_outlook || false,
        rapid_growth: occupation.tags?.rapid_growth || false,
        numerous_openings: occupation.tags?.numerous_openings || false,
        updated_at: new Date(),
        last_synced: new Date()
      }, { merge: true });

      count++;
      batchCount++;

      // Commit batch every 400 documents and create a new batch
      if (batchCount === 400) {
        await batch.commit();
        batch = db.batch(); // Create a new batch
        batchCount = 0;
      }
    }

    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
    }

    // Update sync metadata
    await db.collection('system').doc('sync_metadata').set({
      last_sync: new Date(),
      last_onet_sync: new Date(),
      occupation_count: count,
      occupations_synced: count,
      sync_status: 'success',
      onet_api_version: 'v2',
      message: `Updated from ${currentCount} to ${count} occupations`
    }, { merge: true });

    return { 
      success: true, 
      previousCount: currentCount,
      newCount: count,
      occupationsSynced: count 
    };

  } catch (error) {
    
    // Log error to Firestore
    await db.collection('system').doc('sync_metadata').set({
      last_onet_sync_error: error.message,
      last_onet_sync_attempt: new Date(),
      sync_status: 'failed'
    }, { merge: true });

    throw error;
  }
}

module.exports = { fetchOccupationsList };