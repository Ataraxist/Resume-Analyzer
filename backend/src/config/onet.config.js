import dotenv from 'dotenv';

dotenv.config();

const onetConfig = {
    baseUrl: 'https://api-v2.onetcenter.org/',
    apiKey: process.env.ONET_API_KEY,
    endpoints: {
        occupations: 'online/occupations',
        occupationDetails: (code) => `online/occupations/${code}`,
        tasks: (code) => `online/occupations/${code}/details/tasks`,
        technologySkills: (code) => `online/occupations/${code}/details/technology_skills`,
        toolsUsed: (code) => `online/occupations/${code}/details/tools_used`,
        workActivities: (code) => `online/occupations/${code}/details/work_activities`,
        detailedWorkActivities: (code) => `online/occupations/${code}/details/detailed_work_activities`,
        knowledge: (code) => `online/occupations/${code}/details/knowledge`,
        skills: (code) => `online/occupations/${code}/details/skills`,
        abilities: (code) => `online/occupations/${code}/details/abilities`,
        education: (code) => `online/occupations/${code}/details/education`,
        jobZone: (code) => `online/occupations/${code}/details/job_zone`,
        interests: (code) => `online/occupations/${code}/details/interests`,
        workValues: (code) => `online/occupations/${code}/details/work_values`,
        workStyles: (code) => `online/occupations/${code}/details/work_styles`
    },
    rateLimit: {
        maxConcurrent: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 10,
        delayMs: parseInt(process.env.REQUEST_DELAY_MS) || 50
    }
    // Note: Occupation fetching now dynamically determines total count
};

// Validate configuration
export function validateConfig() {
    if (!onetConfig.apiKey) {
        throw new Error('O*NET API key not configured. Please set ONET_API_KEY in .env file');
    }
    return true;
}

export default onetConfig;