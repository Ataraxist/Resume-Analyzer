import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

class ResumeParserService {
    constructor() {
        // Don't initialize in constructor to avoid startup issues
        this.openai = null;
        this.isConfigured = false;
    }

    initialize() {
        const apiKey = process.env.OPENAI_API_KEY || process.env.YAML_KEY;
        
        if (apiKey && apiKey !== 'your_openai_api_key_here') {
            this.openai = new OpenAI({ apiKey });
            this.isConfigured = true;
            console.log('✅ OpenAI API configured for resume parsing');
        } else {
            this.openai = null;
            this.isConfigured = false;
            console.warn('⚠️  OpenAI API key not configured. Resume parsing will not work until OPENAI_API_KEY is set in .env');
        }
    }

    async parseResume(resumeText) {
        // Initialize on first use if not already done
        if (!this.isConfigured && !this.openai) {
            this.initialize();
        }
        
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in .env file');
        }

        const systemPrompt = `You are an expert resume parser that handles ALL professions - from software developers to carpenters, from nuclear physicists to artists. Extract structured data from the resume text and return it in JSON format.

IMPORTANT: The JSON structure must EXACTLY match this universal schema:

{
  "detected_profession": "string describing the person's primary profession",
  "personal_information": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "professional_links": {
      "portfolio": "string or null",
      "linkedin": "string or null",
      "github": "string or null",
      "website": "string or null",
      "other": ["array of other professional links"]
    }
  },
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "field_of_study": "string",
      "dates": "string",
      "gpa": "string or null"
    }
  ],
  "experience": [
    {
      "company": "string",
      "position": "string",
      "dates": "string",
      "responsibilities": ["array of responsibility strings"],
      "achievements": ["array of achievement strings"]
    }
  ],
  "skills": {
    "core_competencies": ["primary professional skills for their field"],
    "technical_skills": ["specialized/technical skills"],
    "soft_skills": ["interpersonal and general skills"],
    "tools_equipment": ["software, hardware, or physical tools used"],
    "certifications": ["professional certifications"],
    "languages": {
      "spoken": ["human languages with proficiency levels if mentioned"],
      "programming": ["programming languages - only for tech professionals"]
    }
  },
  "achievements": {
    "projects": ["work samples, builds, exhibitions, performances"],
    "publications": ["papers, articles, books, research"],
    "awards_honors": ["recognition, awards, honors like Eagle Scout"],
    "volunteer_work": ["community service, pro bono work"],
    "professional_memberships": ["associations, unions, guilds"]
  },
  "credentials": {
    "licenses": ["professional licenses (medical, contractor, pilot, etc.)"],
    "security_clearances": ["government or security clearances"],
    "work_authorization": {
      "status": "string or null",
      "details": "string or null"
    }
  },
  "summary": "professional summary text extracted or synthesized"
}

PARSING RULES:
1. Detect the person's profession from their job titles and experience
2. Adapt skill categorization based on profession:
   - For developers: programming languages go in languages.programming
   - For non-tech: "languages" means spoken languages only
   - For trades: tools_equipment includes physical tools (saws, drills, etc.)
   - For academics: emphasize publications and research in achievements
3. Extract ALL information, even if fields seem tech-specific
4. Use null for missing strings, empty arrays for missing lists
5. Don't force tech-specific items (like GitHub) for non-tech professionals
6. Recognize diverse achievements (art exhibitions = projects, research papers = publications)
7. Return ONLY valid JSON without any markdown formatting`;

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Parse this resume:\n\n${resumeText}` }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.2,
                max_tokens: 4000
            });

            const parsedData = JSON.parse(response.choices[0].message.content);
            
            // Validate the structure
            this.validateStructure(parsedData);
            
            return parsedData;
        } catch (error) {
            console.error('Error parsing resume with AI:', error);
            
            // If it's an API key issue, provide helpful message
            if (error.message?.includes('API key')) {
                throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to .env file');
            }
            
            throw new Error(`Resume parsing failed: ${error.message}`);
        }
    }

    validateStructure(data) {
        const requiredFields = [
            'detected_profession',
            'personal_information',
            'education',
            'experience',
            'skills',
            'achievements',
            'credentials',
            'summary'
        ];

        for (const field of requiredFields) {
            if (!(field in data)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate skills structure
        if (!data.skills || typeof data.skills !== 'object') {
            throw new Error('Skills must be an object');
        }

        const skillCategories = ['core_competencies', 'technical_skills', 'soft_skills', 'tools_equipment', 'certifications'];
        for (const category of skillCategories) {
            if (!Array.isArray(data.skills[category])) {
                data.skills[category] = [];
            }
        }

        // Validate languages structure
        if (!data.skills.languages || typeof data.skills.languages !== 'object') {
            data.skills.languages = { spoken: [], programming: [] };
        }

        // Ensure arrays are arrays
        const arrayFields = ['education', 'experience'];
        for (const field of arrayFields) {
            if (!Array.isArray(data[field])) {
                data[field] = [];
            }
        }

        // Validate achievements structure
        if (!data.achievements || typeof data.achievements !== 'object') {
            data.achievements = {
                projects: [],
                publications: [],
                awards_honors: [],
                volunteer_work: [],
                professional_memberships: []
            };
        }

        // Validate credentials structure
        if (!data.credentials || typeof data.credentials !== 'object') {
            data.credentials = {
                licenses: [],
                security_clearances: [],
                work_authorization: {}
            };
        }

        return true;
    }

    // Helper method to extract key elements for O*NET mapping
    extractKeyElements(structuredData) {
        // Combine all skills regardless of category for broader matching
        const allSkills = [
            ...structuredData.skills.core_competencies,
            ...structuredData.skills.technical_skills,
            ...structuredData.skills.soft_skills,
            ...structuredData.skills.tools_equipment,
            ...structuredData.skills.certifications,
            ...structuredData.skills.languages.spoken.map(l => `${l} (language)`),
            ...structuredData.skills.languages.programming.map(l => `${l} (programming)`)
        ];

        // Include credentials and achievements for comprehensive matching
        const additionalQualifications = [
            ...structuredData.credentials.licenses,
            ...structuredData.achievements.awards_honors,
            ...structuredData.achievements.professional_memberships
        ];

        return {
            // Detected profession helps with initial occupation matching
            detectedProfession: structuredData.detected_profession,
            
            // Extract all job titles for O*NET occupation matching
            jobTitles: structuredData.experience.map(exp => exp.position),
            
            // Comprehensive skills list for matching
            allSkills: allSkills,
            
            // Additional qualifications that might match O*NET requirements
            additionalQualifications: additionalQualifications,
            
            // Extract education level for O*NET education requirements
            educationLevel: this.determineHighestEducation(structuredData.education),
            
            // Extract years of experience
            totalExperience: this.calculateTotalExperience(structuredData.experience),
            
            // Extract industries from experience
            industries: this.extractIndustries(structuredData.experience),
            
            // Check for specialized credentials
            hasLicenses: structuredData.credentials.licenses.length > 0,
            hasCertifications: structuredData.skills.certifications.length > 0,
            hasPublications: structuredData.achievements.publications.length > 0,
            hasSecurityClearance: structuredData.credentials.security_clearances.length > 0
        };
    }

    determineHighestEducation(education) {
        const levels = {
            'phd': 5,
            'doctorate': 5,
            'master': 4,
            'bachelor': 3,
            'associate': 2,
            'diploma': 1,
            'certificate': 1,
            'high school': 0
        };

        let highest = -1;
        let highestDegree = 'Not specified';

        for (const edu of education) {
            const degreeLower = edu.degree.toLowerCase();
            for (const [key, level] of Object.entries(levels)) {
                if (degreeLower.includes(key) && level > highest) {
                    highest = level;
                    highestDegree = edu.degree;
                }
            }
        }

        return highestDegree;
    }

    calculateTotalExperience(experiences) {
        // Enhanced calculation could parse dates, but for now return count
        // This could be improved to calculate actual years from date ranges
        return experiences.length;
    }

    extractIndustries(experiences) {
        // Extract unique company names/industries
        return [...new Set(experiences.map(exp => exp.company))];
    }
}

// Create singleton instance
const resumeParserService = new ResumeParserService();
export default resumeParserService;