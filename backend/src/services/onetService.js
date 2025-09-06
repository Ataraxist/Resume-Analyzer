import axios from 'axios';
import onetConfig, { validateConfig } from '../config/onet.config.js';
import database from '../db/database.js';
import RateLimiter from '../utils/rateLimiter.js';

class OnetService {
    constructor() {
        this.rateLimiter = new RateLimiter(
            onetConfig.rateLimit.maxConcurrent,
            onetConfig.rateLimit.delayMs
        );
        this.axiosInstance = null;
        this.progressCallbacks = [];
    }

    initialize() {
        validateConfig();
        
        // Create axios instance with API key authentication for O*NET API v2
        this.axiosInstance = axios.create({
            baseURL: onetConfig.baseUrl,
            headers: {
                'X-API-Key': onetConfig.apiKey,
                'Accept': 'application/json'
            },
            timeout: 30000 // 30 second timeout
        });

        // Add response interceptor for error handling
        this.axiosInstance.interceptors.response.use(
            response => response,
            error => {
                const errorMessage = error.response?.data?.error || error.message;
                console.error(`O*NET API Error: ${errorMessage}`);
                throw new Error(errorMessage);
            }
        );
    }

    // Progress tracking
    onProgress(callback) {
        this.progressCallbacks.push(callback);
    }

    notifyProgress(data) {
        this.progressCallbacks.forEach(cb => cb(data));
    }

    // Fetch all occupations
    async fetchOccupationsList() {
        console.log('Fetching occupations list from O*NET...');
        
        try {
            // First, get the total count from the default response
            const countResponse = await this.rateLimiter.execute(async () => {
                return await this.axiosInstance.get(onetConfig.endpoints.occupations);
            });
            
            const totalOccupations = countResponse.data.total;
            console.log(`Total occupations available: ${totalOccupations}`);
            
            // Now fetch all occupations in a single request
            const response = await this.rateLimiter.execute(async () => {
                return await this.axiosInstance.get(
                    `${onetConfig.endpoints.occupations}?start=1&end=${totalOccupations + 100}`
                );
            });

            const occupations = response.data.occupation || [];
            console.log(`Fetched ${occupations.length} occupations`);
            
            // Save basic occupation info to database
            for (const occ of occupations) {
                await database.saveOccupation({
                    code: occ.code,
                    title: occ.title,
                    description: occ.description || '',
                    bright_outlook: occ.tags?.bright_outlook || false
                });
                
                // Initialize fetch metadata
                await database.updateFetchStatus(occ.code, 'pending');
            }
            
            return occupations;
        } catch (error) {
            console.error('Error fetching occupations list:', error);
            throw error;
        }
    }

    // Fetch detailed information for a single occupation
    async fetchOccupationDetails(code) {
        console.log(`Fetching details for occupation: ${code}`);
        
        try {
            await database.updateFetchStatus(code, 'in_progress');
            
            // Fetch main occupation details
            const mainDetails = await this.rateLimiter.execute(async () => {
                const response = await this.axiosInstance.get(onetConfig.endpoints.occupationDetails(code));
                return response.data;
            });

            // Update occupation with detailed info
            await database.saveOccupation({
                code: mainDetails.code,
                title: mainDetails.title,
                description: mainDetails.description,
                sample_of_reported_titles: mainDetails.sample_of_reported_titles,
                bright_outlook: mainDetails.tags?.bright_outlook || false,
                rapid_growth: mainDetails.bright_outlook?.some(b => b.category === 'rapid_growth'),
                numerous_openings: mainDetails.bright_outlook?.some(b => b.category === 'numerous_openings'),
                updated_year: mainDetails.updated?.year
            });

            // Fetch all dimension data in parallel batches
            const dimensions = await this.fetchAllDimensions(code);
            
            await database.updateFetchStatus(code, 'completed');
            
            return {
                main: mainDetails,
                ...dimensions
            };
        } catch (error) {
            console.error(`Error fetching details for ${code}:`, error.message);
            await database.updateFetchStatus(code, 'failed', error.message);
            throw error;
        }
    }

    // Fetch all dimensions for an occupation
    async fetchAllDimensions(code) {
        const dimensionFetchers = [
            { name: 'tasks', fn: () => this.fetchTasks(code) },
            { name: 'technology_skills', fn: () => this.fetchTechnologySkills(code) },
            { name: 'tools_used', fn: () => this.fetchToolsUsed(code) },
            { name: 'work_activities', fn: () => this.fetchWorkActivities(code) },
            { name: 'knowledge', fn: () => this.fetchKnowledge(code) },
            { name: 'skills', fn: () => this.fetchSkills(code) },
            { name: 'abilities', fn: () => this.fetchAbilities(code) },
            { name: 'education', fn: () => this.fetchEducation(code) },
            { name: 'job_zone', fn: () => this.fetchJobZone(code) }
        ];

        const results = {};
        
        // Execute fetchers with rate limiting
        const fetchResults = await this.rateLimiter.executeMany(
            dimensionFetchers.map(d => d.fn),
            (progress) => {
                this.notifyProgress({
                    occupation: code,
                    dimensionsProgress: progress
                });
            }
        );

        // Map results
        dimensionFetchers.forEach((dim, index) => {
            if (fetchResults.results[index].success) {
                results[dim.name] = fetchResults.results[index].data;
            } else {
                const errorInfo = fetchResults.results[index];
                console.error(`Failed to fetch ${dim.name} for ${code}:`, errorInfo.error);
                if (errorInfo.fullError) {
                    console.error(`Full error:`, errorInfo.fullError);
                }
                results[dim.name] = null;
            }
        });

        return results;
    }

    // Helper method to fetch all pages of data
    async fetchAllPages(endpoint) {
        let allData = [];
        let nextUrl = endpoint;
        
        while (nextUrl) {
            const response = await this.axiosInstance.get(nextUrl);
            
            // Extract data based on response structure
            if (response.data.task) {
                allData = allData.concat(response.data.task);
            } else if (response.data.element) {
                allData = allData.concat(response.data.element);
            } else if (response.data.category) {
                allData = allData.concat(response.data.category);
            } else if (response.data.occupation) {
                // For occupations list endpoint
                allData = allData.concat(response.data.occupation);
            } else if (response.data.response) {
                // Education and some other endpoints return 'response' array
                return response.data.response;
            } else if (response.data.education?.most_common) {
                return response.data.education.most_common; // Legacy format if it exists
            } else if (response.data.job_zone) {
                return response.data.job_zone; // Job zone is not paginated
            }
            
            // Check for next page - handle both relative and absolute URLs
            if (response.data.next) {
                // If it's a relative URL, keep it as is (axiosInstance baseURL will handle it)
                // If it's an absolute URL, extract the path after the base URL
                const next = response.data.next;
                if (next.startsWith('http')) {
                    // Extract path from absolute URL
                    const url = new URL(next);
                    nextUrl = url.pathname + url.search;
                } else {
                    nextUrl = next;
                }
            } else {
                nextUrl = null;
            }
        }
        
        return allData;
    }

    // Individual dimension fetchers
    async fetchTasks(code) {
        const tasks = await this.fetchAllPages(onetConfig.endpoints.tasks(code));
        await database.saveTasks(code, tasks);
        return tasks;
    }

    async fetchTechnologySkills(code) {
        try {
            const categories = await this.fetchAllPages(onetConfig.endpoints.technologySkills(code));
            // Transform category/example structure to flat list
            const skills = [];
            for (const category of categories) {
                if (category.example) {
                    for (const example of category.example) {
                        skills.push({
                            id: `${category.code}_${example.title}`,
                            title: example.title,
                            description: category.title,
                            example: example.title,
                            hot_technology: example.hot_technology || false
                        });
                    }
                }
            }
            await database.saveTechnologySkills(code, skills);
            return skills;
        } catch (error) {
            if (error.response?.status === 404) {
                // No technology skills for this occupation
                return [];
            }
            throw error;
        }
    }

    async fetchToolsUsed(code) {
        try {
            console.log(`Fetching tools for ${code}...`);
            const categories = await this.fetchAllPages(onetConfig.endpoints.toolsUsed(code));
            console.log(`Got ${categories.length} tool categories for ${code}`);
            
            // Transform category/example structure to flat list
            const tools = [];
            for (const category of categories) {
                // Include the category itself as a tool
                tools.push({
                    id: `${category.code}`,
                    title: category.title,
                    description: category.title
                });
                
                // Add any examples as separate tools
                if (category.example && category.example.length > 0) {
                    for (const exampleStr of category.example) {
                        tools.push({
                            id: `${category.code}_${exampleStr}`,
                            title: exampleStr,
                            description: `${category.title} - Example`
                        });
                    }
                }
            }
            
            console.log(`Saving ${tools.length} tools for ${code}`);
            await database.saveToolsUsed(code, tools);
            return tools;
        } catch (error) {
            console.error(`Error in fetchToolsUsed for ${code}:`, error.message, error.stack);
            if (error.response?.status === 404) {
                return [];
            }
            throw error;
        }
    }

    async fetchWorkActivities(code) {
        const elements = await this.fetchAllPages(onetConfig.endpoints.workActivities(code));
        // Transform element structure to match database expectations
        const activities = elements.map(elem => ({
            id: elem.id,
            title: elem.name,
            description: elem.description,
            importance: elem.importance,
            level: elem.level
        }));
        await database.saveWorkActivities(code, activities);
        return activities;
    }

    async fetchKnowledge(code) {
        const elements = await this.fetchAllPages(onetConfig.endpoints.knowledge(code));
        // Transform element structure to match database expectations
        const knowledge = elements.map(elem => ({
            id: elem.id,
            title: elem.name,
            description: elem.description,
            importance: elem.importance,
            level: elem.level
        }));
        await database.saveKnowledge(code, knowledge);
        return knowledge;
    }

    async fetchSkills(code) {
        const elements = await this.fetchAllPages(onetConfig.endpoints.skills(code));
        // Transform element structure to match database expectations
        const skills = elements.map(elem => ({
            id: elem.id,
            title: elem.name,
            description: elem.description,
            importance: elem.importance,
            level: elem.level
        }));
        await database.saveSkills(code, skills);
        return skills;
    }

    async fetchAbilities(code) {
        const elements = await this.fetchAllPages(onetConfig.endpoints.abilities(code));
        // Transform element structure to match database expectations
        const abilities = elements.map(elem => ({
            id: elem.id,
            title: elem.name,
            description: elem.description,
            importance: elem.importance,
            level: elem.level
        }));
        await database.saveAbilities(code, abilities);
        return abilities;
    }

    async fetchEducation(code) {
        try {
            const response = await this.axiosInstance.get(onetConfig.endpoints.education(code));
            // O*NET API v2 returns education data in 'response' field
            const education = response.data.response || [];
            await database.saveEducation(code, education);
            return education;
        } catch (error) {
            if (error.response?.status === 404) {
                return [];
            }
            throw error;
        }
    }

    async fetchJobZone(code) {
        try {
            const response = await this.axiosInstance.get(onetConfig.endpoints.jobZone(code));
            const jobZone = response.data || {};
            await database.saveJobZone(code, jobZone);
            return jobZone;
        } catch (error) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    // Check if occupations list needs updating
    async checkAndUpdateOccupationsList() {
        const occupations = await database.query('SELECT COUNT(*) as count FROM occupations');
        const count = occupations[0]?.count || 0;
        
        if (count === 0) {
            console.log('No occupations in database, fetching from O*NET...');
            await this.fetchOccupationsList();
            return true;
        }
        
        // Optionally check for updates (can be called manually)
        try {
            const response = await this.rateLimiter.execute(async () => {
                return await this.axiosInstance.get(onetConfig.endpoints.occupations);
            });
            const currentTotal = response.data.total;
            
            if (currentTotal > count) {
                console.log(`O*NET has ${currentTotal} occupations, but we only have ${count}. Updating...`);
                await this.fetchOccupationsList();
                return true;
            }
        } catch (error) {
            console.error('Error checking O*NET for updates:', error.message);
        }
        
        return false;
    }
}

// Create singleton instance
const onetService = new OnetService();

export default onetService;