const OpenAI = require('openai');

// Helper to strip markdown code blocks from OpenAI responses
function stripMarkdownJson(text) {
    // Remove ```json prefix and ``` suffix if present
    const cleaned = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    return cleaned.trim();
}

// Helper function to add jitter to retry delays
function addJitter(delay) {
    // Add random jitter between -25% to +25% of delay
    const jitter = delay * (0.5 * Math.random() - 0.25);
    return Math.max(1000, delay + jitter); // Minimum 1 second
}

// Helper function to validate and clean AI responses
// Ensures all array fields contain only strings, not objects
function validateAndCleanResponse(result) {
    // Ensure all array fields contain only strings
    const arrayFields = ['matches', 'gaps'];
    
    arrayFields.forEach(field => {
        if (result[field] && Array.isArray(result[field])) {
            result[field] = result[field].map(item => {
                if (typeof item === 'string') return item;
                if (typeof item === 'object') {
                    // Extract text from various possible object structures
                    // This handles the {task, evidence} case and other variations
                    return item.task || item.evidence || item.item || 
                           item.name || item.title || item.description || 
                           JSON.stringify(item);
                }
                return String(item);
            });
        }
    });
    
    return result;
}

// Retry wrapper with exponential backoff for rate limits
async function retryWithBackoff(fn, fnName, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            // Check if it's a rate limit error
            const isRateLimit = 
                error.status === 429 || 
                error.code === 'rate_limit_exceeded' ||
                (error.message && error.message.includes('Rate limit'));
            
            // Only retry on rate limit errors
            if (!isRateLimit) {
                throw error;
            }
            
            // If we've exhausted retries, throw the error
            if (attempt === maxRetries - 1) {
                throw new Error(`Rate limit exceeded after ${maxRetries} attempts. Please try again later.`);
            }
            
            // Calculate exponential backoff with jitter
            const baseDelay = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
            const delay = addJitter(baseDelay);
            
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    // Should never reach here, but just in case
    throw lastError;
}

class DimensionComparator {
    constructor() {
        this.openai = null;
        this.isConfigured = false;
        this.analysisModel = null;
        // Don't initialize in constructor to avoid deployment warnings
    }

    initialize() {
        // Lazy initialization - only run when actually needed
        if (this.isConfigured) return;
        
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
            this.isConfigured = true;
            
            // Use configurable model for analysis, default to gpt-5 for best quality
            this.analysisModel = process.env.OPENAI_ANALYSIS_MODEL || 'gpt-5';
        }
    }

    ensureInitialized() {
        if (!this.isConfigured) {
            this.initialize();
        }
    }

    async compareTasksFit(resumeExperience, onetTasks) {
        this.ensureInitialized();
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        const experienceText = resumeExperience.map(exp => 
            `${exp.position} at ${exp.company}: ${exp.responsibilities.join(', ')} ${exp.achievements.join(', ')}`
        ).join('\n');

        const tasksText = onetTasks.map(task => task.title || task.task_text || task.description).join('\n');

        const prompt = `Compare the following resume experience with O*NET job tasks and provide a detailed analysis.

RESUME EXPERIENCE:
${experienceText}

O*NET JOB TASKS:
${tasksText}

Analyze and return a JSON response with EXACTLY these fields:
{
  "score": 75,
  "matches": ["Managing team projects", "Code review processes", "Technical documentation"],
  "gaps": ["Budget planning", "Strategic planning", "Vendor management"],
  "confidence": "high"
}

CRITICAL REQUIREMENTS:
- score: number between 0-100
- matches: array of brief strings describing matching tasks
- gaps: array of brief strings describing missing tasks
- confidence: exactly one of "low", "medium", or "high"
- Arrays must contain ONLY strings, never objects or nested data

Return ONLY valid JSON without any markdown formatting.`;

        try {
            // Wrap OpenAI call in retry logic
            const response = await retryWithBackoff(async () => {
                return await this.openai.chat.completions.create({
                    model: this.analysisModel,
                    messages: [
                        { role: 'system', content: 'You are an expert career counselor analyzing resume fit. Return ONLY the exact JSON fields requested. Arrays must contain ONLY simple strings - never objects, just brief task descriptions.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: 'json_object' }
                });
            }, 'compareTasksFit');

            const content = stripMarkdownJson(response.choices[0].message.content);
            let result = JSON.parse(content);
            result = validateAndCleanResponse(result);
            return {
                dimension: 'tasks',
                score: result.score || 0,
                matches: result.matches || [],
                gaps: result.gaps || [],
                confidence: result.confidence || 'medium',
                importance: 'high'
            };
        } catch (error) {
            throw error;
        }
    }

    async compareSkillsFit(resumeSkills, onetSkills, onetTechSkills) {
        this.ensureInitialized();
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        // Extract all skills from the universal schema
        const allResumeSkills = [
            ...(resumeSkills.core_competencies || []),
            ...(resumeSkills.technical_skills || []),
            ...(resumeSkills.soft_skills || []),
            ...(resumeSkills.tools_equipment || []),
            ...(resumeSkills.certifications || []),
            ...(resumeSkills.languages?.spoken || []),
            ...(resumeSkills.languages?.programming || [])
        ];
        
        const allResumeSkillsText = allResumeSkills.join(', ');

        const requiredSkills = onetSkills.map(s => s.skill_name || s.name).join(', ');
        const requiredTech = onetTechSkills ? onetTechSkills.map(t => t.skill_name || t.name).join(', ') : '';

        const prompt = `Compare resume skills with O*NET required skills.

RESUME SKILLS:
${allResumeSkillsText}

O*NET REQUIRED SKILLS:
${requiredSkills}

O*NET TECHNOLOGY SKILLS:
${requiredTech}

Analyze and return a JSON response with EXACTLY these fields:
{
  "score": 80,
  "matches": ["Python", "JavaScript", "SQL", "Git"],
  "gaps": ["React", "Docker", "AWS", "Kubernetes"],
  "confidence": "medium"
}

CRITICAL REQUIREMENTS:
- score: number between 0-100
- matches: array of brief skill names
- gaps: array of brief skill names  
- confidence: exactly one of "low", "medium", or "high"
- Arrays must contain ONLY strings, never objects or nested data

Return ONLY valid JSON without any markdown formatting.`;

        try {
            // Wrap OpenAI call in retry logic
            const response = await retryWithBackoff(async () => {
                return await this.openai.chat.completions.create({
                    model: this.analysisModel,
                    messages: [
                        { role: 'system', content: 'You are an expert skills analyst. Return ONLY the exact JSON fields requested. Arrays must contain ONLY simple strings - never objects, just brief skill names.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: 'json_object' }
                });
            }, 'compareSkillsFit');

            const content = stripMarkdownJson(response.choices[0].message.content);
            let result = JSON.parse(content);
            result = validateAndCleanResponse(result);
            return {
                dimension: 'skills',
                score: result.score || 0,
                matches: result.matches || [],
                gaps: result.gaps || [],
                confidence: result.confidence || 'medium',
                importance: 'high'
            };
        } catch (error) {
            throw error;
        }
    }

    async compareEducationFit(resumeEducation, onetEducation, _onetJobZone) {
        this.ensureInitialized();
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        // Extract candidate's education levels
        const candidateEducation = resumeEducation.map(edu => 
            `${edu.degree} in ${edu.field_of_study}`
        );
        const candidateEducationText = candidateEducation.join(', ');

        // Format O*NET education levels with percentages
        const onetEducationLevels = onetEducation ? onetEducation.map(e => ({
            level: e.category || e.title,
            percentage: e.percentage || 0
        })) : [];
        
        const onetEducationText = onetEducationLevels
            .map(e => `${e.level} (${e.percentage}% of workers)`)
            .join('\n');

        const prompt = `Compare candidate's education levels with O*NET occupation education distribution.

CANDIDATE EDUCATION:
${candidateEducationText || 'No formal education listed'}

O*NET EDUCATION DISTRIBUTION (percentage of workers with each level):
${onetEducationText || 'No education data available'}

Match the candidate's education against ALL the education levels shown in the O*NET data.
For each O*NET education level, determine if the candidate has it or not.

Return a JSON response with EXACTLY these fields:
{
  "score": 85,
  "matches": ["Bachelor's in Computer Science", "Relevant degree field"],
  "gaps": [],
  "meetsRequirements": true,
  "confidence": "high"
}

CRITICAL REQUIREMENTS:
- score: number between 0-100
- matches: array of brief education descriptions
- gaps: array of missing education requirements (empty array if none)
- meetsRequirements: boolean (true/false)
- confidence: exactly one of "low", "medium", or "high"
- Arrays must contain ONLY strings, never objects or nested data

Return ONLY valid JSON without any markdown formatting.`;

        try {
            // Wrap OpenAI call in retry logic
            const response = await retryWithBackoff(async () => {
                return await this.openai.chat.completions.create({
                    model: this.analysisModel,
                    messages: [
                        { role: 'system', content: 'You are an education analyst. Return ONLY the exact JSON fields requested. Arrays must contain ONLY simple strings - never objects, just brief descriptions.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: 'json_object' }
                });
            }, 'compareEducationFit');

            const content = stripMarkdownJson(response.choices[0].message.content);
            let result = JSON.parse(content);
            result = validateAndCleanResponse(result);
            return {
                dimension: 'education',
                score: result.score || 0,
                matches: result.matches || [],
                gaps: result.gaps || [],
                meetsRequirements: result.meetsRequirements || false,
                onetDistribution: onetEducationLevels, // Include raw data for UI display
                confidence: result.confidence || 'medium',
                importance: 'high'
            };
        } catch (error) {
            throw error;
        }
    }

    async compareWorkActivitiesFit(resumeExperience, onetWorkActivities) {
        this.ensureInitialized();
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        const experienceText = resumeExperience.map(exp => 
            `${exp.responsibilities.join(', ')} ${exp.achievements.join(', ')}`
        ).join(' ');

        const activitiesText = onetWorkActivities
            .filter(a => (a.importance || 0) > 50)
            .map(a => `${a.name}: ${a.description}`)
            .join('\n');

        const prompt = `Compare resume work experience with O*NET work activities.

RESUME EXPERIENCE:
${experienceText}

O*NET WORK ACTIVITIES (Important ones):
${activitiesText}

Analyze and return a JSON response with EXACTLY these fields:
{
  "score": 70,
  "matches": ["Analyzing data", "Writing reports", "Team collaboration"],
  "gaps": ["Managing budgets", "Training staff", "Vendor negotiations"],
  "confidence": "medium"
}

CRITICAL REQUIREMENTS:
- score: number between 0-100
- matches: array of brief activity descriptions
- gaps: array of missing activities
- confidence: exactly one of "low", "medium", or "high"
- Arrays must contain ONLY strings, never objects or nested data

Return ONLY valid JSON without any markdown formatting.`;

        try {
            // Wrap OpenAI call in retry logic
            const response = await retryWithBackoff(async () => {
                return await this.openai.chat.completions.create({
                    model: this.analysisModel,
                    messages: [
                        { role: 'system', content: 'You are a work activity analyst. Return ONLY the exact JSON fields requested. Arrays must contain ONLY simple strings - never objects, just brief activity descriptions.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: 'json_object' }
                });
            }, 'compareWorkActivitiesFit');

            const content = stripMarkdownJson(response.choices[0].message.content);
            let result = JSON.parse(content);
            result = validateAndCleanResponse(result);
            return {
                dimension: 'workActivities',
                score: result.score || 0,
                matches: result.matches || [],
                gaps: result.gaps || [],
                confidence: result.confidence || 'medium',
                importance: 'medium'
            };
        } catch (error) {
            throw error;
        }
    }

    async compareKnowledgeFit(resumeData, onetKnowledge) {
        this.ensureInitialized();
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        const resumeKnowledgeAreas = [
            ...(resumeData.education || []).map(e => e.field_of_study),
            ...(resumeData.skills?.technical_skills || []),
            ...(resumeData.skills?.core_competencies || []),
            resumeData.summary
        ].filter(Boolean).join(', ');

        const requiredKnowledge = onetKnowledge
            .filter(k => (k.importance_score || 0) > 50)
            .map(k => `${k.knowledge_name || k.knowledge_area || k.name}: ${k.knowledge_description || k.description || ''}`)
            .join('\n');

        const prompt = `Compare candidate's knowledge areas with O*NET requirements.

CANDIDATE KNOWLEDGE AREAS:
${resumeKnowledgeAreas}

O*NET REQUIRED KNOWLEDGE:
${requiredKnowledge}

Analyze and return a JSON response with EXACTLY these fields:
{
  "score": 65,
  "matches": ["Software Engineering", "Computer Science", "Mathematics"],
  "gaps": ["Cloud Architecture", "Machine Learning", "DevOps"],
  "confidence": "medium"
}

CRITICAL REQUIREMENTS:
- score: number between 0-100
- matches: array of brief knowledge area names
- gaps: array of missing knowledge areas
- confidence: exactly one of "low", "medium", or "high"
- Arrays must contain ONLY strings, never objects or nested data

Return ONLY valid JSON without any markdown formatting.`;

        try {
            // Wrap OpenAI call in retry logic
            const response = await retryWithBackoff(async () => {
                return await this.openai.chat.completions.create({
                    model: this.analysisModel,
                    messages: [
                        { role: 'system', content: 'You are a knowledge requirements analyst. Return ONLY the exact JSON fields requested. Arrays must contain ONLY simple strings - never objects, just brief knowledge area names.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: 'json_object' }
                });
            }, 'compareKnowledgeFit');

            const content = stripMarkdownJson(response.choices[0].message.content);
            let result = JSON.parse(content);
            result = validateAndCleanResponse(result);
            return {
                dimension: 'knowledge',
                score: result.score || 0,
                matches: result.matches || [],
                gaps: result.gaps || [],
                confidence: result.confidence || 'medium',
                importance: 'low'
            };
        } catch (error) {
            throw error;
        }
    }

    async compareTechnologySkillsFit(resumeSkills, onetTechSkills) {
        this.ensureInitialized();
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        // Extract technical skills from resume
        const candidateTechSkills = [
            ...(resumeSkills?.technical_skills || []),
            ...(resumeSkills?.languages?.programming || []),
            ...(resumeSkills?.tools_equipment || [])
        ].join(', ');
        
        // O*NET technology skills have 'title' field
        const requiredTechSkills = onetTechSkills.map(s => s.title || s.skill_name || s.name).join(', ');

        const prompt = `Compare candidate's technology skills with O*NET requirements.

CANDIDATE TECHNOLOGY SKILLS:
${candidateTechSkills || 'No specific technology skills listed'}

O*NET REQUIRED TECHNOLOGY SKILLS:
${requiredTechSkills}

Analyze and return a JSON response with EXACTLY these fields:
{
  "score": 85,
  "matches": ["Git", "Docker", "VS Code", "Linux"],
  "gaps": ["Kubernetes", "Terraform", "Jenkins"],
  "confidence": "high"
}

CRITICAL REQUIREMENTS:
- score: number between 0-100
- matches: array of brief technology/tool names
- gaps: array of missing technologies
- confidence: exactly one of "low", "medium", or "high"
- Arrays must contain ONLY strings, never objects or nested data

Return ONLY valid JSON without any markdown formatting.`;

        try {
            // Wrap OpenAI call in retry logic
            const response = await retryWithBackoff(async () => {
                return await this.openai.chat.completions.create({
                    model: this.analysisModel,
                    messages: [
                        { role: 'system', content: 'You are a technology skills analyst. Return ONLY the exact JSON fields requested. Arrays must contain ONLY simple strings - never objects, just brief technology names.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: 'json_object' }
                });
            }, 'compareTechnologySkillsFit');

            const content = stripMarkdownJson(response.choices[0].message.content);
            let result = JSON.parse(content);
            result = validateAndCleanResponse(result);
            return {
                dimension: 'technologySkills',
                score: result.score || 0,
                matches: result.matches || [],
                gaps: result.gaps || [],
                confidence: result.confidence || 'medium',
                importance: 'high'
            };
        } catch (error) {
            throw error;
        }
    }

    async compareToolsFit(resumeTools, onetTools, resumeExperience = []) {
        this.ensureInitialized();
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        // Extract tools from multiple fields in the resume
        const candidateToolsList = [
            ...(resumeTools?.tools_equipment || []),
            ...(resumeTools?.technical_skills || []),
            ...(resumeTools?.languages?.programming || [])
        ];
        const candidateTools = candidateToolsList.join(', ');
        
        // Also extract experience text to find tools mentioned in context
        const experienceText = resumeExperience.map(exp => 
            `${exp.responsibilities.join(', ')} ${exp.achievements.join(', ')}`
        ).join(' ');
        
        // Use the correct field name 'title' from O*NET data
        const requiredTools = onetTools.map(t => t.title || t.tool_name || t.name).join(', ');

        const prompt = `Compare candidate's tools/software experience with O*NET requirements.

CANDIDATE TOOLS (from skills section):
${candidateTools || 'No specific tools listed'}

CANDIDATE EXPERIENCE (may contain tool mentions):
${experienceText}

O*NET REQUIRED TOOLS:
${requiredTools}

Look for tools mentioned both explicitly in skills and implicitly in experience descriptions.
Analyze and return a JSON response with EXACTLY these fields:
{
  "score": 90,
  "matches": ["Microsoft Office", "Slack", "Jira", "Zoom"],
  "gaps": ["Salesforce", "Tableau", "SAP"],
  "confidence": "high"
}

CRITICAL REQUIREMENTS:
- score: number between 0-100
- matches: array of brief tool/software names
- gaps: array of missing tools
- confidence: exactly one of "low", "medium", or "high"
- Arrays must contain ONLY strings, never objects or nested data

Return ONLY valid JSON without any markdown formatting.`;

        try {
            // Wrap OpenAI call in retry logic
            const response = await retryWithBackoff(async () => {
                return await this.openai.chat.completions.create({
                    model: this.analysisModel,
                    messages: [
                        { role: 'system', content: 'You are a technical tools analyst. Return ONLY the exact JSON fields requested. Arrays must contain ONLY simple strings - never objects, just brief tool names.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: 'json_object' }
                });
            }, 'compareToolsFit');

            const content = stripMarkdownJson(response.choices[0].message.content);
            let result = JSON.parse(content);
            result = validateAndCleanResponse(result);
            return {
                dimension: 'tools',
                score: result.score || 0,
                matches: result.matches || [],
                gaps: result.gaps || [],
                confidence: result.confidence || 'medium',
                importance: 'medium'
            };
        } catch (error) {
            throw error;
        }
    }
    async compareAbilitiesFit(resumeData, onetAbilities) {
        this.ensureInitialized();
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        // Build a comprehensive picture from resume for abilities inference
        const resumeContext = {
            experience: resumeData.experience?.map(exp => 
                `${exp.position}: ${exp.responsibilities.join(', ')} ${exp.achievements.join(', ')}`
            ).join(' '),
            skills: [
                ...(resumeData.skills?.technical_skills || []),
                ...(resumeData.skills?.soft_skills || []),
                ...(resumeData.skills?.core_competencies || [])
            ].join(', '),
            education: resumeData.education?.map(edu => 
                `${edu.degree} in ${edu.field_of_study}`
            ).join(', ')
        };

        const abilitiesText = onetAbilities
            .filter(a => (a.importance || 0) > 50)
            .map(a => `${a.name}: ${a.description}`)
            .join('\n');

        const prompt = `Analyze candidate's demonstrated abilities based on their experience, skills, and education against O*NET required abilities.

CANDIDATE BACKGROUND:
Experience: ${resumeContext.experience}
Skills: ${resumeContext.skills}
Education: ${resumeContext.education}

O*NET REQUIRED ABILITIES (Important ones):
${abilitiesText}

Analyze what abilities the candidate demonstrates through their background.
Return a JSON response with EXACTLY these fields:
{
  "score": 75,
  "matches": ["Problem solving", "Critical thinking", "Communication"],
  "gaps": ["Public speaking", "Negotiation", "Leadership"],
  "confidence": "medium"
}

CRITICAL REQUIREMENTS:
- score: number between 0-100
- matches: array of brief ability names
- gaps: array of missing abilities
- confidence: exactly one of "low", "medium", or "high"
- Arrays must contain ONLY strings, never objects or nested data

Return ONLY valid JSON without any markdown formatting.`;

        try {
            // Wrap OpenAI call in retry logic
            const response = await retryWithBackoff(async () => {
                return await this.openai.chat.completions.create({
                    model: this.analysisModel,
                    messages: [
                        { role: 'system', content: 'You are an abilities analyst. Return ONLY the exact JSON fields requested. Arrays must contain ONLY simple strings - never objects, just brief ability names.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: 'json_object' }
                });
            }, 'compareAbilitiesFit');

            const content = stripMarkdownJson(response.choices[0].message.content);
            let result = JSON.parse(content);
            result = validateAndCleanResponse(result);
            return {
                dimension: 'abilities',
                score: result.score || 0,
                matches: result.matches || [],
                gaps: result.gaps || [],
                confidence: result.confidence || 'medium',
                importance: 'medium'
            };
        } catch (error) {
            throw error;
        }
    }
}

const dimensionComparator = new DimensionComparator();
module.exports = dimensionComparator;