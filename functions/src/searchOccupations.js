const { getFirestore } = require('firebase-admin/firestore');
const { HttpsError } = require('firebase-functions/v2/https');

const db = getFirestore();

async function searchOccupations(request) {
  // Extract data from the v2 request object
  const { data } = request;
  
  
  
  // Validate that data was provided
  if (!data) {
    throw new HttpsError('invalid-argument', 'Request data is required');
  }
  
  const { 
    query = '', 
    limit = 20, 
    offset = 0,
    filters = {}
  } = data;


  try {
    let occupationsRef = db.collection('occupations');
    
    // Apply search query if provided
    if (query) {
      // Firestore doesn't support full-text search natively
      // For production, consider using Algolia or ElasticSearch
      // For now, we'll fetch all and filter in memory (not ideal for large datasets)
      const snapshot = await occupationsRef.get();
      
      const results = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(occ => {
          // Exclude "All Other" occupations as they don't have O*NET data
          if (occ.title?.includes('All Other')) {
            return false;
          }
          
          const searchLower = query.toLowerCase();
          return (
            occ.title?.toLowerCase().includes(searchLower) ||
            occ.description?.toLowerCase().includes(searchLower) ||
            occ.code?.toLowerCase().includes(searchLower)
          );
        });


      // Apply filters
      let filtered = results;
      
      if (filters.brightOutlook) {
        filtered = filtered.filter(occ => occ.bright_outlook === true);
      }
      
      if (filters.rapidGrowth) {
        filtered = filtered.filter(occ => occ.rapid_growth === true);
      }

      // Apply pagination
      const paginated = filtered.slice(offset, offset + limit);

      return {
        occupations: paginated,
        total: filtered.length,
        hasMore: offset + limit < filtered.length
      };
    } else {
      // No search query, just return paginated results
      let query = occupationsRef;
      
      // Apply filters
      if (filters.brightOutlook) {
        query = query.where('bright_outlook', '==', true);
      }
      
      if (filters.rapidGrowth) {
        query = query.where('rapid_growth', '==', true);
      }
      
      // Apply pagination
      query = query.orderBy('title').limit(limit);
      
      if (offset > 0) {
        // For offset, we need to use startAfter with the last document
        // This is simplified - in production, you'd pass a cursor
        const prevSnapshot = await occupationsRef
          .orderBy('title')
          .limit(offset)
          .get();
        
        if (!prevSnapshot.empty) {
          const lastDoc = prevSnapshot.docs[prevSnapshot.docs.length - 1];
          query = query.startAfter(lastDoc);
        }
      }
      
      const snapshot = await query.get();
      
      // Filter out "All Other" occupations from results
      const occupations = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(occ => !occ.title?.includes('All Other'));
      
      return {
        occupations: occupations,
        hasMore: snapshot.docs.length === limit
      };
    }
  } catch (error) {
    console.error('Search occupations error:', error);
    throw new HttpsError('internal', 'Failed to search occupations');
  }
}

module.exports = { searchOccupations };