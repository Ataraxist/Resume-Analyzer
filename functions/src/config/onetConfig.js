const onetConfig = {
    baseUrl: 'https://api-v2.onetcenter.org/',
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
        delayMs: parseInt(process.env.REQUEST_DELAY_MS) || 200 // O*NET recommends 200ms minimum
    }
};

// Validate configuration
function validateConfig() {
    const apiKey = process.env.ONET_API_KEY;
    if (!apiKey) {
        throw new Error('O*NET API key not configured. Please set ONET_API_KEY in environment variables');
    }
    return true;
}

// Get headers for O*NET API requests
function getOnetHeaders() {
    return {
        'X-API-Key': process.env.ONET_API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'nodejs-OnetWebService/2.00 (bot)'
    };
}

module.exports = {
    onetConfig,
    validateConfig,
    getOnetHeaders
};