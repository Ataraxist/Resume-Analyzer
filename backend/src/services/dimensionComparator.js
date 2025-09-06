import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Helper to strip markdown code blocks from OpenAI responses
function stripMarkdownJson(text) {
    // Remove ```json prefix and ``` suffix if present
    const cleaned = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    return cleaned.trim();
}

class DimensionComparator {
    constructor() {
        this.openai = null;
        this.isConfigured = false;
        this.initialize();
    }

    initialize() {
        const apiKey = process.env.OPENAI_API_KEY;
        
        if (apiKey && apiKey !== 'your_openai_api_key_here') {
            this.openai = new OpenAI({ apiKey });
            this.isConfigured = true;
        } else {
            console.warn('⚠️  OpenAI API key not configured for dimension comparison');
        }
    }

    async compareTasksFit(resumeExperience, onetTasks) {
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        const experienceText = resumeExperience.map(exp => 
            `${exp.position} at ${exp.company}: ${exp.responsibilities.join(', ')} ${exp.achievements.join(', ')}`
        ).join('\n');

        const tasksText = onetTasks.map(task => task.task_text).join('\n');

        const prompt = `Compare the following resume experience with O*NET job tasks and provide a detailed analysis.

RESUME EXPERIENCE:
${experienceText}

O*NET JOB TASKS:
${tasksText}

Analyze and return a JSON response with:
1. score: Overall match percentage (0-100)
2. matches: Array of tasks the candidate has experience with
3. gaps: Array of tasks the candidate lacks experience in
4. confidence: How confident you are in the assessment (low/medium/high)

Return ONLY valid JSON without any markdown formatting.`;

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are an expert career counselor analyzing resume fit against O*NET job requirements.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 1000
            });

            const content = stripMarkdownJson(response.choices[0].message.content);
            const result = JSON.parse(content);
            return {
                dimension: 'tasks',
                score: result.score || 0,
                matches: result.matches || [],
                gaps: result.gaps || [],
                confidence: result.confidence || 'medium',
                importance: 'high'
            };
        } catch (error) {
            console.error('Error comparing tasks:', error);
            throw error;
        }
    }

    async compareSkillsFit(resumeSkills, onetSkills, onetTechSkills) {
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        // Extract all skills from the universal schema
        const allResumeSkills = [
            ...resumeSkills.core_competencies,
            ...resumeSkills.technical_skills,
            ...resumeSkills.soft_skills,
            ...resumeSkills.tools_equipment,
            ...resumeSkills.certifications,
            ...(resumeSkills.languages?.spoken || []),
            ...(resumeSkills.languages?.programming || [])
        ];
        
        const allResumeSkillsText = allResumeSkills.join(', ');

        const requiredSkills = onetSkills.map(s => s.skill_name).join(', ');
        const requiredTech = onetTechSkills.map(t => t.skill_name).join(', ');

        const prompt = `Compare resume skills with O*NET required skills.

RESUME SKILLS:
${allResumeSkillsText}

O*NET REQUIRED SKILLS:
${requiredSkills}

O*NET TECHNOLOGY SKILLS:
${requiredTech}

Analyze and return a JSON response with:
1. score: Overall skills match percentage (0-100)
2. matches: Array of matching skills
3. gaps: Array of missing critical skills
4. additionalSkills: Skills the candidate has that aren't required but may be valuable

Return ONLY valid JSON without any markdown formatting.`;

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are an expert skills analyst comparing candidate skills to job requirements.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 1000
            });

            const content = stripMarkdownJson(response.choices[0].message.content);
            const result = JSON.parse(content);
            return {
                dimension: 'skills',
                score: result.score || 0,
                matches: result.matches || [],
                gaps: result.gaps || [],
                additionalSkills: result.additionalSkills || [],
                importance: 'high'
            };
        } catch (error) {
            console.error('Error comparing skills:', error);
            throw error;
        }
    }

    async compareEducationFit(resumeEducation, onetEducation, onetJobZone) {
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        const educationText = resumeEducation.map(edu => 
            `${edu.degree} in ${edu.field_of_study} from ${edu.institution}`
        ).join(', ');

        const requiredEducation = onetEducation.map(e => 
            `${e.category}: ${e.percentage}%`
        ).join(', ');

        const jobZoneInfo = onetJobZone ? 
            `Job Zone ${onetJobZone.job_zone}: ${onetJobZone.education_needed}` : 
            'No specific job zone information';

        const prompt = `Compare candidate education with O*NET requirements.

CANDIDATE EDUCATION:
${educationText || 'No formal education listed'}

O*NET EDUCATION REQUIREMENTS:
${requiredEducation}

JOB ZONE:
${jobZoneInfo}

Analyze and return a JSON response with:
1. score: Education match percentage (0-100)
2. meetsRequirements: Boolean indicating if minimum requirements are met
3. educationLevel: Candidate's highest education level
4. requiredLevel: Required education level
5. gaps: Any education gaps or recommendations

Return ONLY valid JSON without any markdown formatting.`;

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are an education requirements analyst.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 800
            });

            const content = stripMarkdownJson(response.choices[0].message.content);
            const result = JSON.parse(content);
            return {
                dimension: 'education',
                score: result.score || 0,
                meetsRequirements: result.meetsRequirements || false,
                educationLevel: result.educationLevel || 'Unknown',
                requiredLevel: result.requiredLevel || 'Unknown',
                gaps: result.gaps || [],
                importance: 'medium'
            };
        } catch (error) {
            console.error('Error comparing education:', error);
            throw error;
        }
    }

    async compareWorkActivitiesFit(resumeExperience, onetWorkActivities) {
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        const experienceText = resumeExperience.map(exp => 
            `${exp.responsibilities.join(', ')} ${exp.achievements.join(', ')}`
        ).join(' ');

        const activitiesText = onetWorkActivities
            .filter(a => a.importance_score > 50)
            .map(a => `${a.activity_name}: ${a.activity_description}`)
            .join('\n');

        const prompt = `Compare resume work experience with O*NET work activities.

RESUME EXPERIENCE:
${experienceText}

O*NET WORK ACTIVITIES (Important ones):
${activitiesText}

Analyze and return a JSON response with:
1. score: Work activities match percentage (0-100)
2. matches: Array of matching work activities
3. gaps: Array of missing important activities
4. strengthAreas: Areas where candidate shows strong experience

Return ONLY valid JSON without any markdown formatting.`;

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a work activity analyst comparing experience to job requirements.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 1000
            });

            const content = stripMarkdownJson(response.choices[0].message.content);
            const result = JSON.parse(content);
            return {
                dimension: 'workActivities',
                score: result.score || 0,
                matches: result.matches || [],
                gaps: result.gaps || [],
                strengthAreas: result.strengthAreas || [],
                importance: 'medium'
            };
        } catch (error) {
            console.error('Error comparing work activities:', error);
            throw error;
        }
    }

    async compareKnowledgeFit(resumeData, onetKnowledge) {
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        const resumeKnowledgeAreas = [
            ...resumeData.education.map(e => e.field_of_study),
            ...resumeData.skills.technical_skills,
            ...resumeData.skills.core_competencies,
            resumeData.summary
        ].join(', ');

        const requiredKnowledge = onetKnowledge
            .filter(k => k.importance_score > 50)
            .map(k => `${k.knowledge_name}: ${k.knowledge_description}`)
            .join('\n');

        const prompt = `Compare candidate's knowledge areas with O*NET requirements.

CANDIDATE KNOWLEDGE AREAS:
${resumeKnowledgeAreas}

O*NET REQUIRED KNOWLEDGE:
${requiredKnowledge}

Analyze and return a JSON response with:
1. score: Knowledge match percentage (0-100)
2. matches: Array of matching knowledge areas
3. gaps: Array of missing knowledge areas
4. recommendations: Specific recommendations for knowledge gaps

Return ONLY valid JSON without any markdown formatting.`;

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a knowledge requirements analyst.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 1000
            });

            const content = stripMarkdownJson(response.choices[0].message.content);
            const result = JSON.parse(content);
            return {
                dimension: 'knowledge',
                score: result.score || 0,
                matches: result.matches || [],
                gaps: result.gaps || [],
                recommendations: result.recommendations || [],
                importance: 'low'
            };
        } catch (error) {
            console.error('Error comparing knowledge:', error);
            throw error;
        }
    }

    async compareToolsFit(resumeTools, onetTools) {
        if (!this.isConfigured) {
            throw new Error('OpenAI API key not configured');
        }

        const candidateTools = resumeTools.tools_equipment.join(', ');
        const requiredTools = onetTools.map(t => t.tool_name).join(', ');

        const prompt = `Compare candidate's tools/software experience with O*NET requirements.

CANDIDATE TOOLS:
${candidateTools || 'No specific tools listed'}

O*NET REQUIRED TOOLS:
${requiredTools}

Analyze and return a JSON response with:
1. score: Tools match percentage (0-100)
2. matches: Array of matching tools
3. gaps: Array of missing critical tools
4. alternativeTools: Tools candidate has that could substitute for missing ones

Return ONLY valid JSON without any markdown formatting.`;

        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a technical tools analyst.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 800
            });

            const content = stripMarkdownJson(response.choices[0].message.content);
            const result = JSON.parse(content);
            return {
                dimension: 'tools',
                score: result.score || 0,
                matches: result.matches || [],
                gaps: result.gaps || [],
                alternativeTools: result.alternativeTools || [],
                importance: 'medium'
            };
        } catch (error) {
            console.error('Error comparing tools:', error);
            throw error;
        }
    }
}

const dimensionComparator = new DimensionComparator();
export default dimensionComparator;