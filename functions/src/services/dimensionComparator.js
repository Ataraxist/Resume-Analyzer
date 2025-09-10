const OpenAI = require('openai');

/**
 * Simplified Dimension Comparator
 * Sends full JSON objects to AI for analysis instead of preprocessing to text
 */

// Helper to strip markdown code blocks from OpenAI responses
function stripMarkdownJson(text) {
    const cleaned = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    return cleaned.trim();
}

// Helper function to add jitter to retry delays
function addJitter(delay) {
    const jitter = delay * (0.5 * Math.random() - 0.25);
    return Math.max(1000, delay + jitter);
}

// Retry wrapper with exponential backoff for transient errors + rate limits
async function retryWithBackoff(fn, opts = {}) {
    const {
        maxRetries = 5,
        baseMs = 1000,
        maxDelayMs = 60_000
    } = opts;

    const shouldRetry = (error) => {
        const status = error?.status ?? error?.response?.status;
        const code = (error?.code || '').toString().toUpperCase();
        const msg = (error?.message || '').toLowerCase();

        // HTTP statuses worth retrying
        const retryStatuses = new Set([408, 429, 500, 502, 503, 504, 529]);
        if (retryStatuses.has(Number(status))) return true;

        // OpenAI-style rate limit code or generic hints
        if (code === 'RATE_LIMIT_EXCEEDED' || msg.includes('rate limit')) return true;

        // Common transient network errors
        const transientCodes = new Set(['ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN']);
        if (transientCodes.has(code)) return true;
        if (msg.includes('socket hang up') || msg.includes('timeout')) return true;

        return false;
    };

    const parseRetryAfter = (error) => {
        const h =
            error?.response?.headers?.['retry-after'] ??
            error?.response?.headers?.['Retry-After'];
        if (!h) return null;
        // try seconds
        const secs = parseInt(h, 10);
        if (!Number.isNaN(secs)) return secs * 1000;
        // try HTTP-date
        const dateMs = Date.parse(h);
        if (!Number.isNaN(dateMs)) return Math.max(0, dateMs - Date.now());
        return null;
    };

    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (!shouldRetry(error) || attempt === maxRetries - 1) throw error;

            const retryAfterMs = parseRetryAfter(error);
            const expDelay = baseMs * Math.pow(2, attempt); // 1s, 2s, 4s...
            let delay = retryAfterMs != null ? Math.max(expDelay, retryAfterMs) : expDelay;
            delay = Math.min(maxDelayMs, addJitter(delay));

            await new Promise((r) => setTimeout(r, Math.max(1000, delay)));
        }
    }
    throw lastError;
}


class DimensionComparator {
    constructor() {
        this.openai = null;
        this.isConfigured = false;
        this.analysisModel = null;
    }

    initialize() {
        if (this.isConfigured) return;
        
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (apiKey) {
            this.openai = new OpenAI({ apiKey });
            this.isConfigured = true;
            this.analysisModel = process.env.OPENAI_ANALYSIS_MODEL || 'gpt-5';
        }
    }

    ensureInitialized() {
        if (!this.isConfigured) {
            this.initialize();
        }
    }

    /**
     * Generic comparison method that sends full JSON to AI
     * @param {Object} fullResumeData - Complete parsed resume object
     * @param {Array} onetData - O*NET requirements for this dimension
     * @param {Object} config - Configuration for this comparison
     * @returns {Object} Standardized comparison results
     */
    async compareGeneric(fullResumeData, onetData, config) {
        this.ensureInitialized();
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        const {
            dimension,
            systemRole,
            outputExample
        } = config;

        const prompt = 
`Analyze occupational readiness by comparing the provided resume data against O*NET ${dimension} Occupation-Specific Information. 
Use the entirety of the resume data to evaluate if any given O*NET requirement can reasonably be inferred as satisfied.
It is entirely possible that the resume data does not explicitly reference an O*NET requirement but the contextual information provided in the resume can be used to infer the requirement is met. 

COMPLETE RESUME DATA:
${JSON.stringify(fullResumeData)}

O*NET ${dimension.toUpperCase()} REQUIREMENTS:
${JSON.stringify(onetData)}

Return a JSON response with EXACTLY these fields:
${JSON.stringify(outputExample)}

CRITICAL REQUIREMENTS:
- score: number between 0-100 representing the career readiness of the applicant
- matches: array of O*NET requirements that are met
- gaps: array of O*NET requirements that are not met
- confidence: exactly one of "low", "medium", or "high" representing your confidence in your assessment

All values from the O*NET requirements should exist in either your matches or gaps arrays. Return ONLY valid JSON without any markdown formatting.`;

        // --- Structured Outputs schema (flat) + fallback to json_object ---
        const schema = {
            name: 'dimension_result',
            strict: true,
            schema: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    score: { type: 'integer', minimum: 0, maximum: 100 },
                    matches: { type: 'array', items: { type: 'string' } },
                    gaps: { type: 'array', items: { type: 'string' } },
                    confidence: { type: 'string', enum: ['low', 'medium', 'high'] }
                },
                required: ['score', 'matches', 'gaps', 'confidence']
            }
        };

        const callWithFormat = async (response_format) => {
            return await this.openai.chat.completions.create({
                model: this.analysisModel,
                messages: [
                    { role: 'system', content: systemRole },
                    { role: 'user', content: prompt }
                ],
                response_format,
                seed: 12345
            });
        };

        const response = await retryWithBackoff(async () => {
            try {
                // Try strict schema first
                return await callWithFormat({ type: 'json_schema', json_schema: schema });
            } catch (e) {
                // Fallback for models/snapshots without json_schema support or formatting errors
                const msg = (e?.message || '').toLowerCase();
                const unsupported =
                    e?.status === 400 ||
                    msg.includes('response_format') ||
                    msg.includes('json_schema') ||
                    msg.includes('unsupported') ||
                    msg.includes('schema');
                if (!unsupported) throw e;
                return await callWithFormat({ type: 'json_object' });
            }
        });

        const content = stripMarkdownJson(response.choices[0].message.content);
        const result = JSON.parse(content);
        
        // Ensure arrays contain only strings
        ['matches', 'gaps'].forEach(field => {
            if (result[field] && Array.isArray(result[field])) {
                result[field] = result[field].map(item => {
                    if (typeof item === 'string') return item;
                    if (typeof item === 'object') {
                        return item.task || item.evidence || item.item || 
                               item.name || item.title || item.description || 
                               JSON.stringify(item);
                    }
                    return String(item);
                });
            }
        });

        // #4: Clamp & normalize
        let score = Number(result.score);
        if (!Number.isFinite(score)) score = 0;
        score = Math.max(0, Math.min(100, Math.round(score)));

        const ALLOWED_CONF = new Set(['low', 'medium', 'high']);
        let confidence = String(result.confidence || 'medium').toLowerCase();
        if (!ALLOWED_CONF.has(confidence)) confidence = 'medium';

        return {
            dimension,
            score,
            matches: result.matches || [],
            gaps: result.gaps || [],
            confidence
        };
    }

    async compareTasksFit(fullResumeData, onetTasks) {
        return this.compareGeneric(fullResumeData, onetTasks, {
            dimension: 'tasks',
            systemRole: 'You are an expert career counselor analyzing occupational preparedness regarding work tasks and responsibilities.',
            outputExample: {
                score: 95,
                matches: ["Maintain and follow standard quality, safety, environmental, and infection control policies and procedures.", "Treat patients using tools, such as needles, cups, ear balls, seeds, pellets, or nutritional supplements.", "Adhere to local, state, and federal laws, regulations, and statutes."],
                gaps: ["Identify correct anatomical and proportional point locations based on patients' anatomy and positions, contraindications, and precautions related to treatments, such as intradermal needles, moxibustion, electricity, guasha, or bleeding.", "Develop individual treatment plans and strategies."],
                confidence: "high"
            }
        });
    }

    async compareSkillsFit(fullResumeData, onetSkills) {
        return this.compareGeneric(fullResumeData, onetSkills, {
            dimension: 'skills',
            systemRole: 'You are an expert career counselor analyzing occupational preparedness regarding basic and cross-functional skills.',
            outputExample: {
                score: 80,
                matches: ["Active Listening", "Critical Thinking", "Team Service Orientation", "Social Perceptiveness"],
                gaps: ["Speaking", "Judgment and Decision Making", "Complex Problem Solving", "Monitoring"],
                confidence: "high"
            }
        });
    }

    async compareEducationFit(fullResumeData, onetEducation) {
        return this.compareGeneric(fullResumeData, onetEducation, {
            dimension: 'education',
            systemRole: 'You are an expert career counselor analyzing occupational preparedness regarding academic and professional qualifications. Educational thresholds are hierarchical and cumulative. If a higher-level threshold is satisfied (e.g., Master’s), treat every lower threshold (e.g., Bachelor’s, Associate, High School) as satisfied. Never mark a lower threshold as a gap once a higher one is met.',
            outputExample: {
                score: 85,
                matches: ["Master’s degree required", "Post-secondary certificate required", "Professional certifications"],
                gaps: ["Doctoral degree required", "Additional industry certifications"],
                confidence: "high"
            }
        });
    }

    async compareWorkActivitiesFit(fullResumeData, onetWorkActivities) {
        // Filter for important activities only
        const importantActivities = onetWorkActivities.filter(a => (a.importance || 0) > 50);

        return this.compareGeneric(fullResumeData, importantActivities, {
            dimension: 'workActivities',
            systemRole: 'You are an expert career counselor analyzing occupational preparedness regarding day-to-day work activities.',
            outputExample: {
                score: 90,
                matches: ["Assisting and Caring for Others", "Documenting/Recording Information", "Getting Information"],
                gaps: ["Updating and Using Relevant Knowledge", "Establishing and Maintaining Interpersonal Relationships", "Performing for or Working Directly with the Public"],
                confidence: "high"
            }
        });
    }

    async compareKnowledgeFit(fullResumeData, onetKnowledge) {
        // Filter for important knowledge areas only
        const importantKnowledge = onetKnowledge.filter(k => (k.importance_score || 0) > 20);

        return this.compareGeneric(fullResumeData, importantKnowledge, {
            dimension: 'knowledge',
            systemRole: 'You are an expert career counselor analyzing occupational preparedness regarding domain expertise.',
            outputExample: {
                score: 95,
                matches: ["Customer and Personal Service", "Medicine and Dentistry", "Psychology"],
                gaps: ["Biology", "English Language", "Administrative"],
                confidence: "high"
            }
        });
    }

    async compareTechnologySkillsFit(fullResumeData, onetTechSkills) {
        return this.compareGeneric(fullResumeData, onetTechSkills, {
            dimension: 'technologySkills',
            systemRole: 
`You are an expert career counselor analyzing occupational preparedness regarding technical proficiencies.

IMPORTANT: Apply realistic judgment when evaluating technology skills:
- No professional knows every technology listed - focus on having SUFFICIENT coverage of relevant technologies
- Many technologies are ALTERNATIVES to each other (different brands/versions of similar tools)
- Consider transferable skills: proficiency in one technology often indicates ability to learn similar ones
- Score based on breadth and depth across technology CATEGORIES, not total count of individual tools
- Having strong expertise in one ecosystem/stack is more valuable than superficial knowledge of many
- Consider technologies by their relevance and importance to the specific occupation when determining the occupation readiness score`,
            outputExample: {
                score: 85,
                matches: ["Electronic mail software", "Medical software", "Office suite software", "Operating system software"],
                gaps: ["Spreadsheet software", "Word processing software"],
                confidence: "high"
            }
        });
    }

    async compareToolsFit(fullResumeData, onetTools) {
        return this.compareGeneric(fullResumeData, onetTools, {
            dimension: 'tools',
            systemRole: 
`You are an expert career counselor analyzing occupational preparedness regarding digital and physical tool proficiency.

IMPORTANT: Apply common sense when evaluating tools:
- Distinguish between SPECIALIZED tools (specific to this occupation) and GENERIC tools (standard office/computing equipment everyone uses)
- Do NOT penalize candidates for not explicitly mentioning ubiquitous tools (e.g., computers, phones, basic office supplies) unless they have specialized requirements for that occupation
- Focus on tools that actually differentiate capability in the specific profession
- Consider implicit tool usage - if someone describes work that obviously requires certain tools, count those as matches even if not explicitly listed
- Consider specialized/critical tools more heavily than generic ones when determining the occupation readiness score`,
            outputExample: {
                score: 90,
                matches: ["Hypodermic needle", "Medical heat lamps", "Neuromuscular stimulators or kits", "Reflex hammers or mallets", "Surgical clamps or clips or forceps"],
                gaps: ["Surgical scissors", "Therapeutic balls", "Therapeutic heating or cooling pads or compresses or packs"],
                confidence: "high"
            }
        });
    }

    async compareAbilitiesFit(fullResumeData, onetAbilities) {
        // Filter for important abilities only
        const importantAbilities = onetAbilities.filter(a => (a.importance || 0) > 20);

        return this.compareGeneric(fullResumeData, importantAbilities, {
            dimension: 'abilities',
            systemRole: 'You are an expert career counselor analyzing occupational preparedness regarding cognitive and interpersonal abilities.',
            outputExample: {
                score: 85,
                matches: ["Deductive Reasoning", "Near Vision", "Oral Comprehension", "Oral Expression"],
                gaps: ["Problem Sensitivity", "Written Comprehension", "Inductive Reasoning"],
                confidence: "medium"
            }
        });
    }
}

const dimensionComparator = new DimensionComparator();
module.exports = dimensionComparator;
