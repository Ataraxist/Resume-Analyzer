import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter
} from 'firebase/firestore';
import { db } from '../config/firebase';
import FirebaseFunctionsFactory from './firebaseFunctionsFactory';

class FirebaseOccupationService {
  constructor() {
    this.collectionName = 'occupations';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.syncCheckPerformed = false;
    this.SYNC_STALE_DAYS = 30; // Consider data stale after 30 days
  }

  // Check if occupation data needs syncing (runs once per session)
  async checkAndSyncIfNeeded() {
    if (this.syncCheckPerformed) return;
    this.syncCheckPerformed = true;

    try {
      // Get sync metadata
      const metadataDoc = await getDoc(doc(db, 'system', 'sync_metadata'));
      
      if (!metadataDoc.exists()) {
        this.triggerBackgroundSync();
        return;
      }

      const metadata = metadataDoc.data();
      const lastSync = metadata.last_sync ? new Date(metadata.last_sync) : null;
      
      if (!lastSync) {
        this.triggerBackgroundSync();
        return;
      }

      // Check if data is stale
      const daysSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceSync > this.SYNC_STALE_DAYS) {
        this.triggerBackgroundSync();
      }
    } catch {
      // Don't block the user experience if sync check fails
    }
  }

  // Trigger background sync without blocking user
  async triggerBackgroundSync() {
    try {
      // Get the callable function from the factory
      const fetchOccupationsListFunction = FirebaseFunctionsFactory.getCallable('fetchOccupationsListFunction');
      
      // Fire and forget - don't await
      fetchOccupationsListFunction().catch(() => {
        // Background sync failed silently
      });
    } catch {
      // Error triggering background sync
    }
  }

  // Search occupations
  async searchOccupations(searchQuery = '', filters = {}, limitCount = 20, offset = 0) {
    
    // Check sync status on first search (non-blocking)
    this.checkAndSyncIfNeeded();
    
    // Get the callable function from the factory
    const searchOccupationsFunction = FirebaseFunctionsFactory.getCallable('searchOccupationsFunction');
    
    const payload = {
      query: searchQuery,
      limit: limitCount,
      offset,
      filters
    };
    
    const result = await searchOccupationsFunction(payload);
    
    return result.data;
  }

  // Get all occupations (with pagination)
  async getAllOccupations(limitCount = 50, lastDoc = null) {
    let q = query(
      collection(db, this.collectionName),
      orderBy('title'),
      limit(limitCount)
    );
    
    if (lastDoc) {
      q = query(
        collection(db, this.collectionName),
        orderBy('title'),
        startAfter(lastDoc),
        limit(limitCount)
      );
    }
    
    const snapshot = await getDocs(q);
    const occupations = [];
    let lastVisible = null;
    
    snapshot.forEach((doc) => {
      occupations.push({
        id: doc.id,
        code: doc.id,
        ...doc.data()
      });
      lastVisible = doc;
    });
    
    return {
      occupations,
      lastDoc: lastVisible,
      hasMore: snapshot.docs.length === limitCount
    };
  }

  // Get single occupation by code
  async getOccupationByCode(occupationCode) {
    // Check cache first
    const cacheKey = `occupation_${occupationCode}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    // Fetch from Firestore
    const docRef = doc(db, this.collectionName, occupationCode);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const occupationData = {
        id: docSnap.id,
        code: docSnap.id,
        ...docSnap.data()
      };
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: occupationData,
        timestamp: Date.now()
      });
      
      return occupationData;
    } else {
      throw new Error(`Occupation not found: ${occupationCode}`);
    }
  }

  // Get all occupation titles (lightweight - only title and code fields)
  async getAllOccupationTitles() {
    try {
      // Check cache first
      const cacheKey = 'all_occupation_titles';
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout * 2) {
        // Cache for longer (10 minutes) since this is a larger dataset
        return cached.data;
      }
      
      // Query all occupations, but only fetch title and code fields
      const q = query(
        collection(db, this.collectionName),
        orderBy('title')
      );
      
      const snapshot = await getDocs(q);
      const occupations = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Only include the minimal fields needed
        occupations.push({
          code: doc.id,
          title: data.title || 'Unknown Occupation'
        });
      });
      
      // Cache the results
      this.cache.set(cacheKey, {
        data: occupations,
        timestamp: Date.now()
      });
      
      return occupations;
    } catch {
      // Return a fallback set if the fetch fails
      return [
        { code: '15-1252', title: 'Software Developers' },
        { code: '15-2051', title: 'Data Scientists' },
        { code: '11-2021', title: 'Marketing Managers' },
        { code: '29-1171', title: 'Nurse Practitioners' },
        { code: '13-2051', title: 'Financial Analysts' },
        { code: '15-1255', title: 'Web Developers' },
        { code: '17-2051', title: 'Civil Engineers' },
        { code: '25-2021', title: 'Elementary School Teachers' },
        { code: '11-3021', title: 'Computer and Information Systems Managers' },
        { code: '41-3031', title: 'Securities, Commodities, and Financial Services Sales Agents' }
      ];
    }
  }

  // Get Job Zone details from the separate collection
  async getJobZoneDetails(jobZoneCode) {
    if (!jobZoneCode) return null;
    
    try {
      const jobZoneRef = doc(db, 'job_zones', String(jobZoneCode));
      const jobZoneDoc = await getDoc(jobZoneRef);
      
      if (jobZoneDoc.exists()) {
        return jobZoneDoc.data();
      }
      return null;
    } catch {
      return null;
    }
  }

  // Get occupation details including subcollections
  async getOccupationDetails(occupationCode) {
    try {
      // Check cache first
      const cacheKey = `occupation_details_${occupationCode}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      
      // Call Firebase function to get occupation details
      const getOccupationDetailsFunction = FirebaseFunctionsFactory.getCallable('getOccupationDetailsFunction');
      
      const result = await getOccupationDetailsFunction({ code: occupationCode });
      const details = result.data;
      
      // Fetch Job Zone details if we have a job zone code
      let jobZoneDetails = null;
      if (details.jobZone) {
        jobZoneDetails = await this.getJobZoneDetails(details.jobZone);
      }
      
      // Transform the response to match the expected format from OccupationDetails.jsx
      const formattedDetails = {
        occupation: details.occupation,
        tasks: details.tasks || [],
        skills: details.skills?.map(s => ({
          skill_name: s.element_name || s.name,
          skill_description: s.element_description || s.description,
          importance_score: s.importance_score || s.importance
        })) || [],
        abilities: details.abilities?.map(a => ({
          ability_name: a.element_name || a.name,
          ability_description: a.element_description || a.description,
          importance_score: a.importance_score || a.importance
        })) || [],
        knowledge: details.knowledge?.map(k => ({
          knowledge_name: k.element_name || k.name,
          knowledge_description: k.element_description || k.description,
          importance_score: k.importance_score || k.importance
        })) || [],
        workActivities: details.workActivities || [],
        tools: details.tools?.map(t => ({
          tool_name: t.tool_name,
          tool_description: t.tool_description
        })) || [],
        technologySkills: details.technologySkills?.map(ts => ({
          skill_name: ts.skill_name,
          hot_technology: ts.hot_technology
        })) || [],
        education: details.education || [],
        bright_outlook: details.occupation?.bright_outlook || false,
        jobZone: jobZoneDetails, // Now contains full Job Zone details
        // Include fetch status for UI to handle partial data
        fetchStatus: details.fetchStatus || {
          complete: true,
          partialData: false,
          successfulDimensions: 0,
          totalDimensions: 0,
          failedDimensions: []
        }
      };
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: formattedDetails,
        timestamp: Date.now()
      });
      
      return formattedDetails;
    } catch (error) {
      
      // Fallback: try to get basic data from Firestore
      try {
        const occupation = await this.getOccupationByCode(occupationCode);
        return {
          occupation: occupation,
          tasks: [],
          skills: [],
          abilities: [],
          knowledge: [],
          workActivities: [],
          tools: [],
          technologySkills: [],
          education: [],
          bright_outlook: occupation.bright_outlook,
          jobZone: null
        };
      } catch {
        throw error;
      }
    }
  }

  // Get subcollection data (deprecated - now using Firebase function)
  // Keeping for backward compatibility but returns empty array
  async getSubcollection(_occupationCode, _subcollectionName) {
    // getSubcollection is deprecated. Use getOccupationDetails instead.
    return [];
  }

  // Get bright outlook occupations
  async getBrightOutlookOccupations(limitCount = 20) {
    const q = query(
      collection(db, this.collectionName),
      where('bright_outlook', '==', true),
      orderBy('title'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const occupations = [];
    
    snapshot.forEach((doc) => {
      occupations.push({
        id: doc.id,
        code: doc.id,
        ...doc.data()
      });
    });
    
    return occupations;
  }

  // Get rapid growth occupations
  async getRapidGrowthOccupations(limitCount = 20) {
    const q = query(
      collection(db, this.collectionName),
      where('rapid_growth', '==', true),
      orderBy('title'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const occupations = [];
    
    snapshot.forEach((doc) => {
      occupations.push({
        id: doc.id,
        code: doc.id,
        ...doc.data()
      });
    });
    
    return occupations;
  }

  // Search with debounce functionality
  async searchWithDebounce(searchQuery, debounceMs = 300) {
    // Clear any existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    return new Promise((resolve, reject) => {
      this.searchTimeout = setTimeout(async () => {
        try {
          const result = await this.searchOccupations(searchQuery);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, debounceMs);
    });
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

export default new FirebaseOccupationService();