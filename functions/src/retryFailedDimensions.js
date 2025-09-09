const { getFirestore } = require('firebase-admin/firestore');
const { HttpsError } = require('firebase-functions/v2/https');
const { onetConfig, validateConfig, getOnetHeaders } = require('./config/onetConfig');
const RateLimiter = require('./utils/rateLimiter');

const db = getFirestore();

/**
 * Background function to retry failed dimension fetches
 * Can be triggered manually or scheduled
 */
async function retryFailedDimensions(request) {
    const { data } = request;
    const { code, dimensions } = data;
    
    if (!code) {
        throw new HttpsError('invalid-argument', 'Occupation code is required');
    }
    
    try {
        validateConfig();
        
        // Get failed dimensions from metadata
        let dimensionsToRetry = dimensions;
        
        if (!dimensionsToRetry) {
            // Fetch from fetch_failures collection
            const failureDoc = await db.collection('fetch_failures').doc(code).get();
            
            if (!failureDoc.exists) {
                return {
                    success: true,
                    message: 'No failed dimensions found for retry',
                    code: code
                };
            }
            
            const failureData = failureDoc.data();
            dimensionsToRetry = failureData.failures?.filter(f => f.retryable) || [];
        }
        
        if (dimensionsToRetry.length === 0) {
            return {
                success: true,
                message: 'No retryable dimensions found',
                code: code
            };
        }
        
        
        // Create rate limiter with more aggressive retry settings
        const rateLimiter = new RateLimiter(
            5, // Lower concurrent to be gentler on the API
            500, // Longer delay between requests
            {
                maxRetries: 5,
                initialDelay: 500,
                maxDelay: 15000,
                backoffMultiplier: 2.5
            }
        );
        
        // Build retry tasks
        const retryTasks = dimensionsToRetry.map(dim => {
            switch (dim.name) {
                case 'tasks':
                    return () => fetchDimension(code, 'tasks');
                case 'technologySkills':
                    return () => fetchDimension(code, 'technologySkills');
                case 'tools':
                    return () => fetchDimension(code, 'toolsUsed');
                case 'workActivities':
                    return () => fetchDimension(code, 'workActivities');
                case 'knowledge':
                    return () => fetchDimension(code, 'knowledge');
                case 'skills':
                    return () => fetchDimension(code, 'skills');
                case 'abilities':
                    return () => fetchDimension(code, 'abilities');
                case 'education':
                    return () => fetchEducation(code);
                case 'jobZone':
                    return () => fetchJobZone(code);
                case 'interests':
                    return () => fetchDimension(code, 'interests');
                case 'workValues':
                    return () => fetchDimension(code, 'workValues');
                case 'workStyles':
                    return () => fetchDimension(code, 'workStyles');
                default:
                    return null;
            }
        }).filter(task => task !== null);
        
        // Execute retry tasks
        const retryResults = await rateLimiter.executeMany(
            retryTasks,
            (progress) => {
            }
        );
        
        // Process results and update Firestore
        const successfulRetries = [];
        const stillFailed = [];
        const batch = db.batch();
        const occupationRef = db.collection('occupations').doc(code);
        
        dimensionsToRetry.forEach((dim, index) => {
            const result = retryResults.results[index];
            
            if (result?.success) {
                successfulRetries.push(dim.name);
                
                // Update subcollection with new data
                const subcollectionName = getSubcollectionName(dim.name);
                if (subcollectionName && result.data) {
                    updateSubcollection(batch, occupationRef, subcollectionName, result.data);
                }
            } else {
                stillFailed.push({
                    ...dim,
                    lastRetryAttempt: new Date(),
                    retryAttempts: (dim.retryAttempts || 0) + 1
                });
            }
        });
        
        // Commit batch updates
        if (successfulRetries.length > 0) {
            await batch.commit();
            
            // Clear cache for this occupation
            const cacheKey = `occupation_details_${code}`;
            await db.collection('cache').doc(cacheKey).delete();
        }
        
        // Update fetch failures
        if (stillFailed.length > 0) {
            await db.collection('fetch_failures').doc(code).set({
                code: code,
                failures: stillFailed,
                lastRetryAttempt: new Date(),
                retryable_count: stillFailed.filter(d => d.retryable).length
            }, { merge: true });
        } else {
            // All retries successful, remove from failures
            await db.collection('fetch_failures').doc(code).delete();
        }
        
        return {
            success: true,
            code: code,
            attempted: dimensionsToRetry.length,
            successful: successfulRetries.length,
            failed: stillFailed.length,
            successfulDimensions: successfulRetries,
            failedDimensions: stillFailed.map(f => f.name)
        };
        
    } catch (error) {
        throw new HttpsError('internal', `Failed to retry dimensions: ${error.message}`);
    }
}

function getSubcollectionName(dimensionName) {
    const mapping = {
        'tasks': 'tasks',
        'technologySkills': 'technology_skills',
        'tools': 'tools_used',
        'workActivities': 'work_activities',
        'knowledge': 'knowledge',
        'skills': 'skills',
        'abilities': 'abilities',
        'education': 'education',
        'interests': 'interests',
        'workValues': 'work_values',
        'workStyles': 'work_styles'
    };
    return mapping[dimensionName];
}

function updateSubcollection(batch, occupationRef, subcollectionName, data) {
    if (!Array.isArray(data)) return;
    
    for (const item of data) {
        const docId = item.id || `${subcollectionName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const docRef = occupationRef.collection(subcollectionName).doc(docId);
        batch.set(docRef, item);
    }
}

// Import dimension fetching functions (these would normally be imported from a shared module)
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
        throw error;
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
        return data.code || null;
    } catch (error) {
        throw error;
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
            const error = new Error(`O*NET API error: ${response.status}`);
            error.status = response.status;
            throw error;
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

module.exports = { retryFailedDimensions };