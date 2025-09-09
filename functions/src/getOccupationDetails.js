const { getFirestore } = require('firebase-admin/firestore');
const { HttpsError } = require('firebase-functions/v2/https');
const { onetConfig, validateConfig, getOnetHeaders } = require('./config/onetConfig');
const RateLimiter = require('./utils/rateLimiter');

const db = getFirestore();

// Helper function to remove undefined/null values from objects
function cleanForFirestore(obj) {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) return obj.map(cleanForFirestore).filter(v => v !== null);
    if (typeof obj !== 'object') return obj;
    
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null) {
            const cleanedValue = cleanForFirestore(value);
            if (cleanedValue !== null) {
                cleaned[key] = cleanedValue;
            }
        }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : null;
}

async function getOccupationDetails(request) {
    // Extract data and auth from the v2 request object
    const { data, auth } = request;
    
    console.log('Getting occupation details for:', data?.code);
    
    const { code } = data;
    
    if (!code) {
        throw new HttpsError('invalid-argument', 'Occupation code is required');
    }
    
    try {
        validateConfig();
        
        // Check if we have cached details in Firestore
        const cacheKey = `occupation_details_${code}`;
        const cacheRef = db.collection('cache').doc(cacheKey);
        const cacheDoc = await cacheRef.get();
        
        // Return cached data if it's less than 24 hours old
        if (cacheDoc.exists) {
            const cachedData = cacheDoc.data();
            const cacheAge = Date.now() - cachedData.timestamp;
            const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (cacheAge < maxCacheAge) {
                console.log(`Returning cached data for ${code}`);
                return cachedData.data;
            }
        }
        
        // Fetch fresh data from O*NET API
        console.log(`Fetching fresh data for ${code} from O*NET API`);
        const rateLimiter = new RateLimiter(
            onetConfig.rateLimit.maxConcurrent,
            onetConfig.rateLimit.delayMs,
            {
                maxRetries: 3,
                initialDelay: 200,
                maxDelay: 5000,
                backoffMultiplier: 2
            }
        );
        
        // Fetch main occupation details
        const mainDetails = await fetchOccupationMain(code);
        
        // Fetch all dimensions in parallel
        const dimensions = await fetchAllDimensions(code, rateLimiter);
        
        // Extract metadata before combining
        const fetchMetadata = dimensions._metadata;
        delete dimensions._metadata;
        
        // Combine all data
        const fullDetails = {
            occupation: {
                code: mainDetails.code,
                title: mainDetails.title,
                description: mainDetails.description,
                sample_of_reported_titles: mainDetails.sample_of_reported_titles,
                bright_outlook: mainDetails.tags?.bright_outlook || false,
                rapid_growth: mainDetails.bright_outlook?.some(b => b.category === 'rapid_growth'),
                numerous_openings: mainDetails.bright_outlook?.some(b => b.category === 'numerous_openings'),
                updated_year: mainDetails.updated?.year
            },
            ...dimensions,
            fetchStatus: {
                complete: fetchMetadata && !fetchMetadata.partialData,
                partialData: fetchMetadata?.partialData || false,
                successfulDimensions: fetchMetadata?.successfulFetches || 0,
                totalDimensions: fetchMetadata?.totalDimensions || 0,
                failedDimensions: fetchMetadata?.failedFetches?.map(f => f.dimension) || []
            }
        };
        
        console.log(`Full details for ${code} before cleaning:`, {
            occupation: 'present',
            dimensionKeys: Object.keys(dimensions),
            dimensionSizes: Object.entries(dimensions).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.length : typeof v}`)
        });
        
        // Cache the results (remove any null/undefined values to avoid Firestore errors)
        const cleanDetails = cleanForFirestore(fullDetails);
        
        console.log(`Clean details for ${code} after cleaning:`, cleanDetails ? {
            hasOccupation: !!cleanDetails.occupation,
            keys: Object.keys(cleanDetails),
            sizes: Object.entries(cleanDetails).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.length : typeof v}`)
        } : 'null');
        
        if (cleanDetails) {
            await cacheRef.set({
                data: cleanDetails,
                timestamp: Date.now(),
                code: code
            });
        }
        
        // Also save to Firestore subcollections for permanent storage
        await saveToFirestore(code, fullDetails);
        
        return fullDetails;
    } catch (error) {
        console.error('Error fetching occupation details:', error);
        throw new HttpsError('internal', `Failed to fetch occupation details: ${error.message}`);
    }
}

async function fetchOccupationMain(code) {
    const headers = getOnetHeaders();
    const url = `${onetConfig.baseUrl}${onetConfig.endpoints.occupationDetails(code)}`;
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
        throw new Error(`O*NET API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
}

async function fetchAllDimensions(code, rateLimiter) {
    const dimensionFetchers = [
        { name: 'tasks', fn: () => fetchDimension(code, 'tasks'), critical: true },
        { name: 'technologySkills', fn: () => fetchDimension(code, 'technologySkills'), critical: false },
        { name: 'tools', fn: () => fetchDimension(code, 'toolsUsed'), critical: false },
        { name: 'workActivities', fn: () => fetchDimension(code, 'workActivities'), critical: true },
        { name: 'knowledge', fn: () => fetchDimension(code, 'knowledge'), critical: true },
        { name: 'skills', fn: () => fetchDimension(code, 'skills'), critical: true },
        { name: 'abilities', fn: () => fetchDimension(code, 'abilities'), critical: true },
        { name: 'education', fn: () => fetchEducation(code), critical: false },
        { name: 'jobZone', fn: () => fetchJobZone(code), critical: false }
    ];
    
    const results = {};
    const metadata = {
        totalDimensions: dimensionFetchers.length,
        successfulFetches: 0,
        failedFetches: [],
        partialData: false
    };
    
    // Configure per-dimension retry settings
    const taskConfigs = dimensionFetchers.map(dim => ({
        maxRetries: dim.critical ? 5 : 3,  // More retries for critical dimensions
        initialDelay: 200,
        maxDelay: dim.critical ? 10000 : 5000,
        backoffMultiplier: 2
    }));
    
    // Execute fetchers with rate limiting and retry logic
    const fetchResults = await rateLimiter.executeMany(
        dimensionFetchers.map(d => d.fn),
        (progress) => {
            console.log(`Fetching dimensions for ${code}: ${progress.completed}/${progress.total} (${progress.percentage}%)${progress.failedCount ? `, ${progress.failedCount} failed` : ''}`);
        },
        taskConfigs
    );
    
    // Map results and track failures
    dimensionFetchers.forEach((dim, index) => {
        const result = fetchResults.results[index];
        if (result.success) {
            results[dim.name] = result.data;
            metadata.successfulFetches++;
            if (result.attempts > 1) {
                console.log(`${dim.name} succeeded after ${result.attempts} attempts`);
            }
        } else {
            console.error(`Failed to fetch ${dim.name} for ${code} after ${result.attempts} attempts:`, result.error);
            results[dim.name] = dim.name === 'education' ? [] : null;
            
            metadata.failedFetches.push({
                dimension: dim.name,
                critical: dim.critical,
                error: result.error,
                attempts: result.attempts,
                retryable: result.retryable
            });
        }
    });
    
    // Set partial data flag if we have some but not all data
    metadata.partialData = metadata.successfulFetches > 0 && metadata.successfulFetches < metadata.totalDimensions;
    
    // Store fetch metadata
    if (metadata.failedFetches.length > 0) {
        await storeFetchMetadata(code, metadata);
    }
    
    console.log(`Fetch summary for ${code}: ${metadata.successfulFetches}/${metadata.totalDimensions} successful${metadata.partialData ? ' (partial data)' : ''}`);
    
    return { ...results, _metadata: metadata };
}

// Store fetch metadata for monitoring and potential retry
async function storeFetchMetadata(code, metadata) {
    try {
        const metadataRef = db.collection('occupation_fetch_metadata').doc(code);
        await metadataRef.set({
            code: code,
            lastFetch: new Date(),
            ...metadata,
            criticalFailures: metadata.failedFetches.filter(f => f.critical).length,
            retryableFailures: metadata.failedFetches.filter(f => f.retryable).length
        }, { merge: true });
        
        console.log(`Stored fetch metadata for ${code}: ${metadata.failedFetches.length} failures`);
    } catch (error) {
        console.error('Error storing fetch metadata:', error);
    }
}

async function fetchDimension(code, dimensionType) {
    const headers = getOnetHeaders();
    const endpoint = onetConfig.endpoints[dimensionType];
    
    if (!endpoint) {
        throw new Error(`Unknown dimension type: ${dimensionType}`);
    }
    
    const url = `${onetConfig.baseUrl}${endpoint(code)}`;
    const allData = await fetchAllPages(url, headers);
    
    // Transform data based on dimension type
    if (dimensionType === 'tasks') {
        return allData.map(task => ({
            id: task.id,
            task_text: task.title,
            task_type: task.category,
            task_importance: task.importance
        }));
    } else if (dimensionType === 'technologySkills') {
        // Transform category/example structure to flat list
        const skills = [];
        for (const category of allData) {
            if (category.example) {
                for (const example of category.example) {
                    skills.push({
                        id: `${category.code}_${example.title}`,
                        skill_name: example.title,
                        skill_category: category.title,
                        hot_technology: example.hot_technology || false
                    });
                }
            }
        }
        return skills;
    } else if (dimensionType === 'toolsUsed') {
        // Transform category/example structure to flat list
        const tools = [];
        for (const category of allData) {
            // Add category as a tool
            tools.push({
                id: category.code,
                tool_name: category.title,
                tool_description: category.title
            });
            
            // Add examples if present
            if (category.example && category.example.length > 0) {
                for (const exampleStr of category.example) {
                    tools.push({
                        id: `${category.code}_${exampleStr}`,
                        tool_name: exampleStr,
                        tool_description: `${category.title} - Example`
                    });
                }
            }
        }
        return tools;
    } else {
        // For skills, knowledge, abilities, work activities
        return allData.map(elem => ({
            id: elem.id,
            element_name: elem.name,
            element_description: elem.description,
            importance_score: elem.importance,
            level_score: elem.level,
            // Map to expected field names for UI
            [`${dimensionType.replace(/([A-Z])/g, '_$1').toLowerCase()}_name`]: elem.name,
            [`${dimensionType.replace(/([A-Z])/g, '_$1').toLowerCase()}_description`]: elem.description
        }));
    }
}

async function fetchEducation(code) {
    try {
        const headers = getOnetHeaders();
        const url = `${onetConfig.baseUrl}${onetConfig.endpoints.education(code)}`;
        
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
            if (response.status === 404) {
                return [];
            }
            throw new Error(`O*NET API error: ${response.status}`);
        }
        
        const data = await response.json();
        // O*NET API v2 returns education data in 'response' field
        const educationData = data.response || [];
        
        return educationData.map(edu => ({
            id: edu.code,
            category: edu.title,
            percentage: edu.percentage_of_respondents
        }));
    } catch (error) {
        console.error(`Error fetching education for ${code}:`, error);
        return [];
    }
}

async function fetchJobZone(code) {
    try {
        const headers = getOnetHeaders();
        const url = `${onetConfig.baseUrl}${onetConfig.endpoints.jobZone(code)}`;
        
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error(`O*NET API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Just return the job zone code
        // The full details are stored in the job_zones collection
        return data.code || null;
    } catch (error) {
        console.error(`Error fetching job zone for ${code}:`, error);
        return null;
    }
}

async function fetchAllPages(url, headers) {
    let allData = [];
    let nextUrl = url;
    
    while (nextUrl) {
        const response = await fetch(nextUrl, { headers });
        
        if (!response.ok) {
            if (response.status === 404) {
                return [];
            }
            throw new Error(`O*NET API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract data based on response structure
        if (data.task) {
            allData = allData.concat(data.task);
        } else if (data.element) {
            allData = allData.concat(data.element);
        } else if (data.category) {
            allData = allData.concat(data.category);
        } else if (data.occupation) {
            allData = allData.concat(data.occupation);
        }
        
        // Check for next page
        if (data.next) {
            // Handle both relative and absolute URLs
            if (data.next.startsWith('http')) {
                // If it's already an absolute URL, use it as-is
                nextUrl = data.next;
            } else {
                // If it's a relative path, prepend the base URL
                nextUrl = `${onetConfig.baseUrl}${data.next}`;
            }
        } else {
            nextUrl = null;
        }
    }
    
    return allData;
}

async function saveToFirestore(code, details) {
    const batch = db.batch();
    
    // Save main occupation data
    const occupationRef = db.collection('occupations').doc(code);
    const cleanOccupation = cleanForFirestore(details.occupation);
    if (cleanOccupation) {
        batch.set(occupationRef, cleanOccupation, { merge: true });
    }
    
    // Save subcollections
    const subcollections = [
        { name: 'tasks', data: details.tasks },
        { name: 'skills', data: details.skills },
        { name: 'abilities', data: details.abilities },
        { name: 'knowledge', data: details.knowledge },
        { name: 'work_activities', data: details.workActivities },
        { name: 'tools_used', data: details.tools },
        { name: 'technology_skills', data: details.technologySkills },
        { name: 'education', data: details.education }
    ];
    
    for (const subcol of subcollections) {
        if (subcol.data && Array.isArray(subcol.data)) {
            for (const item of subcol.data) {
                const cleanItem = cleanForFirestore(item);
                if (cleanItem) {
                    // Generate a document ID - convert to string to handle numeric IDs
                    let docId = String(
                        item.id || 
                        item.code || 
                        item.category || 
                        ''
                    ).trim();
                    
                    // Sanitize the ID for Firestore - replace invalid characters
                    // Firestore document IDs cannot contain: / \ . # [ ] $
                    docId = docId.replace(/[\/\\\.#\[\]$]/g, '_');
                    
                    // Firestore document IDs cannot be empty strings
                    // Also handle the case where ID is '0' which is valid but would be falsy
                    if (!docId) {
                        // Generate a fallback ID
                        docId = `${subcol.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        console.log(`Generated fallback ID for ${subcol.name}: ${docId}`);
                    }
                                 
                    const docRef = occupationRef.collection(subcol.name).doc(docId);
                    batch.set(docRef, cleanItem);
                }
            }
        }
    }
    
    // Save job zone code if present
    if (details.jobZone !== null && details.jobZone !== undefined) {
        batch.set(occupationRef, { job_zone: details.jobZone }, { merge: true });
    }
    
    await batch.commit();
    console.log(`Saved occupation details for ${code} to Firestore`);
}

module.exports = { getOccupationDetails };