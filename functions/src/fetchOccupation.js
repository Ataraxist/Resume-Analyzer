const { getFirestore } = require('firebase-admin/firestore');
const { HttpsError } = require('firebase-functions/v2/https');
const { onetConfig, validateConfig, getOnetHeaders } = require('./config/onetConfig');
const RateLimiter = require('./utils/rateLimiter');

const db = getFirestore();

// Force fetch occupation data from O*NET API (admin/refresh function)
async function fetchOccupation(request) {
    // Extract data and auth from the v2 request object
    const { data, auth } = request;
    
    // Check if user is authenticated (optional - can be restricted to admin)
    if (!auth) {
        // Optionally restrict this to authenticated users only
        // throw new HttpsError('unauthenticated', 'Authentication required');
    }
    
    const { code, forceRefresh = false } = data;
    
    if (!code) {
        throw new HttpsError('invalid-argument', 'Occupation code is required');
    }
    
    
    try {
        validateConfig();
        
        // Check if occupation exists and when it was last updated
        const occupationRef = db.collection('occupations').doc(code);
        const occupationDoc = await occupationRef.get();
        
        if (!forceRefresh && occupationDoc.exists) {
            const lastUpdated = occupationDoc.data().last_synced;
            if (lastUpdated) {
                const daysSinceUpdate = (Date.now() - lastUpdated.toMillis()) / (1000 * 60 * 60 * 24);
                if (daysSinceUpdate < 7) {
                    return {
                        success: true,
                        message: 'Occupation data is up to date',
                        code: code,
                        lastUpdated: lastUpdated.toDate()
                    };
                }
            }
        }
        
        // Update fetch status
        await updateFetchStatus(code, 'in_progress');
        
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
        
        // Fetch all dimensions
        const dimensions = await fetchAllDimensions(code, rateLimiter);
        
        // Save to Firestore
        await saveOccupationData(code, mainDetails, dimensions);
        
        // Update fetch status
        await updateFetchStatus(code, 'completed');
        
        // Clear cache for this occupation
        const cacheKey = `occupation_details_${code}`;
        await db.collection('cache').doc(cacheKey).delete();
        
        return {
            success: true,
            message: 'Occupation data fetched and saved successfully',
            code: code,
            details: {
                title: mainDetails.title,
                description: mainDetails.description,
                dimensions: Object.keys(dimensions).reduce((acc, key) => {
                    acc[key] = dimensions[key] ? 
                        (Array.isArray(dimensions[key]) ? dimensions[key].length : 'fetched') : 
                        'not available';
                    return acc;
                }, {})
            }
        };
    } catch (error) {
        await updateFetchStatus(code, 'failed', error.message);
        throw new HttpsError('internal', `Failed to fetch occupation: ${error.message}`);
    }
}

async function updateFetchStatus(code, status, errorMessage = null) {
    const fetchMetadataRef = db.collection('fetch_metadata').doc(code);
    const updateData = {
        code: code,
        status: status,
        last_attempt: new Date()
    };
    
    if (status === 'completed') {
        updateData.last_success = new Date();
        updateData.error_message = null;
    } else if (status === 'failed' && errorMessage) {
        updateData.error_message = errorMessage;
    }
    
    await fetchMetadataRef.set(updateData, { merge: true });
}

async function fetchOccupationMain(code) {
    const headers = getOnetHeaders();
    const url = `${onetConfig.baseUrl}${onetConfig.endpoints.occupationDetails(code)}`;
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error(`Occupation ${code} not found in O*NET database`);
        }
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
        { name: 'jobZone', fn: () => fetchJobZone(code), critical: false },
        { name: 'interests', fn: () => fetchDimension(code, 'interests'), critical: false },
        { name: 'workValues', fn: () => fetchDimension(code, 'workValues'), critical: false },
        { name: 'workStyles', fn: () => fetchDimension(code, 'workStyles'), critical: false }
    ];
    
    const results = {};
    const failedDimensions = [];
    
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
        () => {
        },
        taskConfigs
    );
    
    // Map results and track failures
    dimensionFetchers.forEach((dim, index) => {
        const result = fetchResults.results[index];
        if (result.success) {
            results[dim.name] = result.data;
            if (result.attempts > 1) {
                console.log(`Dimension ${dim.name} succeeded after ${result.attempts} attempts`);
            }
        } else {
            results[dim.name] = null;
            
            // Track failed dimensions for potential background retry
            failedDimensions.push({
                name: dim.name,
                critical: dim.critical,
                error: result.error,
                attempts: result.attempts,
                retryable: result.retryable
            });
        }
    });
    
    // Store failed dimensions metadata for background retry
    if (failedDimensions.length > 0) {
        await storeFetchFailures(code, failedDimensions);
    }
    
    
    return results;
}

// Store fetch failures for potential background retry
async function storeFetchFailures(code, failedDimensions) {
    try {
        const failureRef = db.collection('fetch_failures').doc(code);
        await failureRef.set({
            code: code,
            failures: failedDimensions,
            timestamp: new Date(),
            retryable_count: failedDimensions.filter(d => d.retryable).length,
            critical_failures: failedDimensions.filter(d => d.critical).length
        }, { merge: true });
        
    } catch (error) {
        console.error('Failed to store fetch failures:', error);
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
    
    return transformDimensionData(allData, dimensionType);
}

function transformDimensionData(data, dimensionType) {
    if (!data || data.length === 0) return [];
    
    switch (dimensionType) {
        case 'tasks':
            return data.map(task => ({
                id: task.id,
                title: task.title,
                category: task.category,
                importance: task.importance
            }));
            
        case 'technologySkills': {
            const skills = [];
            for (const category of data) {
                if (category.example) {
                    for (const example of category.example) {
                        skills.push({
                            id: `${category.code}_${example.title}`,
                            title: example.title,
                            category: category.title,
                            hot_technology: example.hot_technology || false
                        });
                    }
                }
            }
            return skills;
        }
            
        case 'toolsUsed': {
            const tools = [];
            for (const category of data) {
                if (category.example && category.example.length > 0) {
                    for (const exampleStr of category.example) {
                        tools.push({
                            id: `${category.code}_${exampleStr}`,
                            title: exampleStr,
                            category: category.title
                        });
                    }
                }
            }
            return tools;
        }
            
        default:
            // For skills, knowledge, abilities, work activities, interests, work values, work styles
            return data.map(elem => ({
                id: elem.id,
                name: elem.name,
                description: elem.description,
                importance: elem.importance,
                level: elem.level
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
        return (data.response || []).map(edu => ({
            id: edu.code,
            category: edu.title,
            percentage: edu.percentage_of_respondents
        }));
    } catch (error) {
        console.error('Failed to fetch education data:', error);
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
        return data.code || null;
    } catch (error) {
        console.error('Failed to fetch job zone:', error);
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
        }
        
        // Check for next page
        if (data.next) {
            if (data.next.startsWith('http')) {
                const urlObj = new URL(data.next);
                nextUrl = `${onetConfig.baseUrl}${urlObj.pathname}${urlObj.search}`;
            } else {
                nextUrl = `${onetConfig.baseUrl}${data.next}`;
            }
        } else {
            nextUrl = null;
        }
    }
    
    return allData;
}

async function saveOccupationData(code, mainDetails, dimensions) {
    const batch = db.batch();
    
    // Save main occupation data
    const occupationRef = db.collection('occupations').doc(code);
    batch.set(occupationRef, {
        code: mainDetails.code,
        title: mainDetails.title,
        description: mainDetails.description,
        sample_of_reported_titles: mainDetails.sample_of_reported_titles,
        bright_outlook: mainDetails.tags?.bright_outlook || false,
        updated_year: mainDetails.updated?.year,
        job_zone: dimensions.jobZone,
        last_synced: new Date()
    }, { merge: true });
    
    // Save dimensions as subcollections
    const subcollections = [
        { name: 'tasks', data: dimensions.tasks },
        { name: 'technology_skills', data: dimensions.technologySkills },
        { name: 'tools_used', data: dimensions.tools },
        { name: 'work_activities', data: dimensions.workActivities },
        { name: 'knowledge', data: dimensions.knowledge },
        { name: 'skills', data: dimensions.skills },
        { name: 'abilities', data: dimensions.abilities },
        { name: 'education', data: dimensions.education },
        { name: 'interests', data: dimensions.interests },
        { name: 'work_values', data: dimensions.workValues },
        { name: 'work_styles', data: dimensions.workStyles }
    ];
    
    for (const subcol of subcollections) {
        if (subcol.data && Array.isArray(subcol.data)) {
            // Clear existing subcollection data first
            const existingDocs = await occupationRef.collection(subcol.name).limit(500).get();
            existingDocs.forEach(doc => batch.delete(doc.ref));
            
            // Add new data
            for (const item of subcol.data) {
                const docId = item.id || `${subcol.name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                const docRef = occupationRef.collection(subcol.name).doc(docId);
                batch.set(docRef, item);
            }
        }
    }
    
    // Job zone is now stored as a code on the main occupation document
    // Full job zone details are in the job_zones collection
    
    await batch.commit();
}

module.exports = { fetchOccupation };