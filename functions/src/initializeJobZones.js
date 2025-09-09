const { getFirestore } = require('firebase-admin/firestore');
const { HttpsError } = require('firebase-functions/v2/https');

const db = getFirestore();

async function initializeJobZones(_request) {
  // This function initializes the job_zones collection with all 5 Job Zones
  // Should only be run once or when Job Zone data needs updating
  
  
  const apiKey = process.env.ONET_API_KEY;
  
  if (!apiKey) {
    throw new HttpsError('failed-precondition', 'O*NET API key not configured');
  }

  const headers = {
    'X-API-Key': apiKey,
    'Accept': 'application/json',
    'User-Agent': 'nodejs-OnetWebService/2.00 (bot)'
  };

  const ONET_BASE_URL = 'https://api-v2.onetcenter.org';
  
  try {
    const batch = db.batch();
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Fetch and store each Job Zone (1-5)
    for (let zoneNum = 1; zoneNum <= 5; zoneNum++) {
      try {
        // Use a sample occupation code for each job zone to fetch the data
        // These are well-known examples for each zone
        const sampleCodes = {
          1: '35-3041.00', // Food Servers, Nonrestaurant (Job Zone 1)
          2: '43-3031.00', // Bookkeeping, Accounting, and Auditing Clerks (Job Zone 2)
          3: '49-3023.00', // Automotive Service Technicians and Mechanics (Job Zone 3)
          4: '15-1251.00', // Computer Programmers (Job Zone 4)
          5: '29-1171.00'  // Nurse Practitioners (Job Zone 5)
        };

        const url = `${ONET_BASE_URL}/online/occupations/${sampleCodes[zoneNum]}/details/job_zone`;
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          errors.push(`Job Zone ${zoneNum}: ${response.status}`);
          errorCount++;
          continue;
        }
        
        const data = await response.json();
        
        // Transform the data to match our expected structure
        const jobZoneData = {
          code: data.code,
          title: data.title,
          education: data.education,
          related_experience: data.related_experience,
          on_the_job_training: data.job_training,
          examples: data.job_zone_examples,
          svp_range: data.svp_range,
          last_updated: new Date()
        };
        
        // Save to Firestore
        const docRef = db.collection('job_zones').doc(String(zoneNum));
        batch.set(docRef, jobZoneData);
        
        successCount++;
        
      } catch (error) {
        errors.push(`Job Zone ${zoneNum}: ${error.message}`);
        errorCount++;
      }
    }
    
    // Commit the batch
    await batch.commit();
    
    return {
      success: true,
      message: `Initialized ${successCount} Job Zones`,
      details: {
        successful: successCount,
        failed: errorCount,
        errors: errors.length > 0 ? errors : undefined
      }
    };
    
  } catch (error) {
    throw new HttpsError('internal', `Failed to initialize Job Zones: ${error.message}`);
  }
}

module.exports = { initializeJobZones };