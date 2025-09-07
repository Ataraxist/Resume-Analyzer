import database from '../db/database.js';
import resumeModel from '../models/resumeModel.js';
import dimensionComparator from './dimensionComparator.js';
import gapAnalyzer from './gapAnalyzer.js';
import scoreCalculator from './scoreCalculator.js';

class AnalysisService {
    constructor() {
        this.analysisCache = new Map();
        this.cacheTimeout = 3600000; // 1 hour
    }

    async analyzeResumeStream(resumeId, occupationCode, onDimensionUpdate) {
        const startTime = Date.now();
        
        try {
            console.log(`Starting streaming analysis: Resume ${resumeId} vs Occupation ${occupationCode}`);

            const resumeData = await this.getResumeData(resumeId);
            if (!resumeData) {
                throw new Error(`Resume ${resumeId} not found or not processed`);
            }

            const occupationData = await this.getOccupationData(occupationCode);
            if (!occupationData) {
                throw new Error(`Occupation ${occupationCode} not found`);
            }

            // Perform dimension comparisons with streaming updates
            const dimensionScores = await this.performDimensionComparisonsStream(
                resumeData, 
                occupationData,
                onDimensionUpdate
            );

            const overallScore = scoreCalculator.calculateOverallScore(dimensionScores);
            const fitCategory = scoreCalculator.calculateFitCategory(overallScore);
            const scoreBreakdown = scoreCalculator.generateScoreBreakdown(dimensionScores);
            
            const gaps = gapAnalyzer.analyzeGaps(dimensionScores, occupationData);
            const recommendations = gapAnalyzer.generateRecommendations(dimensionScores, gaps, occupationData);
            const improvementImpact = scoreCalculator.calculateImprovementImpact(dimensionScores);
            const timeToQualify = scoreCalculator.calculateTimeToQualify(dimensionScores, gaps);

            const processingTime = Date.now() - startTime;

            const analysis = {
                resumeId,
                occupationCode,
                occupationTitle: occupationData.occupation.title,
                analysisDate: new Date().toISOString(),
                overallFitScore: overallScore,
                fitCategory,
                dimensionScores,
                scoreBreakdown,
                gaps,
                recommendations,
                improvementImpact,
                timeToQualify,
                processingTimeMs: processingTime,
                status: 'completed'
            };

            const cacheKey = `${resumeId}_${occupationCode}`;
            this.cacheAnalysis(cacheKey, analysis);

            console.log(`Streaming analysis completed in ${processingTime}ms. Overall score: ${overallScore}`);
            return analysis;

        } catch (error) {
            console.error('Error during streaming analysis:', error);
            throw error;
        }
    }

    async getResumeData(resumeId) {
        const resume = await resumeModel.getResumeById(resumeId);
        
        if (!resume || !resume.structured_data) {
            return null;
        }

        return resume.structured_data;
    }

    async getOccupationData(occupationCode) {
        try {
            const occupation = await database.get(
                'SELECT * FROM occupations WHERE code = ?',
                [occupationCode]
            );

            if (!occupation) return null;

            const [tasks, skills, techSkills, tools, workActivities, knowledge, education, jobZone] = 
                await Promise.all([
                    database.query('SELECT * FROM tasks WHERE occupation_code = ?', [occupationCode]),
                    database.query('SELECT * FROM skills WHERE occupation_code = ?', [occupationCode]),
                    database.query('SELECT * FROM technology_skills WHERE occupation_code = ?', [occupationCode]),
                    database.query('SELECT * FROM tools_used WHERE occupation_code = ?', [occupationCode]),
                    database.query('SELECT * FROM work_activities WHERE occupation_code = ?', [occupationCode]),
                    database.query('SELECT * FROM knowledge WHERE occupation_code = ?', [occupationCode]),
                    database.query('SELECT * FROM education WHERE occupation_code = ?', [occupationCode]),
                    database.get('SELECT * FROM job_zones WHERE occupation_code = ?', [occupationCode])
                ]);

            return {
                occupation,
                tasks,
                skills,
                technologySkills: techSkills,
                tools,
                workActivities,
                knowledge,
                education,
                jobZone
            };
        } catch (error) {
            console.error('Error fetching occupation data:', error);
            throw error;
        }
    }

    async performDimensionComparisonsStream(resumeData, occupationData, onDimensionUpdate) {
        console.log('Performing streaming dimension-by-dimension comparisons...');
        
        const dimensionScores = {};
        const dimensions = ['tasks', 'skills', 'education', 'workActivities', 'knowledge', 'tools'];
        
        // Process dimensions sequentially for streaming
        for (const dimension of dimensions) {
            try {
                let result;
                
                switch (dimension) {
                    case 'tasks':
                        result = await this.compareTasksDimension(resumeData, occupationData);
                        break;
                    case 'skills':
                        result = await this.compareSkillsDimension(resumeData, occupationData);
                        break;
                    case 'education':
                        result = await this.compareEducationDimension(resumeData, occupationData);
                        break;
                    case 'workActivities':
                        result = await this.compareWorkActivitiesDimension(resumeData, occupationData);
                        break;
                    case 'knowledge':
                        result = await this.compareKnowledgeDimension(resumeData, occupationData);
                        break;
                    case 'tools':
                        result = await this.compareToolsDimension(resumeData, occupationData);
                        break;
                }
                
                dimensionScores[dimension] = result;
                
                // Stream the dimension update
                if (onDimensionUpdate) {
                    onDimensionUpdate(dimension, result);
                }
                
                // Add small delay between dimensions for better UX
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`Failed to compare ${dimension}:`, error);
                dimensionScores[dimension] = {
                    score: 0,
                    error: error.message,
                    matches: [],
                    gaps: []
                };
                
                // Still send update for failed dimension
                if (onDimensionUpdate) {
                    onDimensionUpdate(dimension, dimensionScores[dimension]);
                }
            }
        }

        return dimensionScores;
    }


    async compareTasksDimension(resumeData, occupationData) {
        if (!occupationData.tasks || occupationData.tasks.length === 0) {
            return { score: 50, matches: [], gaps: [], note: 'No task data available' };
        }
        
        return await dimensionComparator.compareTasksFit(
            resumeData.experience || [],
            occupationData.tasks
        );
    }

    async compareSkillsDimension(resumeData, occupationData) {
        if (!occupationData.skills || occupationData.skills.length === 0) {
            return { score: 50, matches: [], gaps: [], note: 'No skills data available' };
        }
        
        return await dimensionComparator.compareSkillsFit(
            resumeData.skills || { technical: [], soft: [], tools: [], languages: [] },
            occupationData.skills,
            occupationData.technologySkills || []
        );
    }

    async compareEducationDimension(resumeData, occupationData) {
        if (!occupationData.education || occupationData.education.length === 0) {
            return { score: 75, meetsRequirements: true, note: 'No specific education requirements' };
        }
        
        return await dimensionComparator.compareEducationFit(
            resumeData.education || [],
            occupationData.education,
            occupationData.jobZone
        );
    }

    async compareWorkActivitiesDimension(resumeData, occupationData) {
        if (!occupationData.workActivities || occupationData.workActivities.length === 0) {
            return { score: 50, matches: [], gaps: [], note: 'No work activities data available' };
        }
        
        return await dimensionComparator.compareWorkActivitiesFit(
            resumeData.experience || [],
            occupationData.workActivities
        );
    }

    async compareKnowledgeDimension(resumeData, occupationData) {
        if (!occupationData.knowledge || occupationData.knowledge.length === 0) {
            return { score: 50, matches: [], gaps: [], note: 'No knowledge data available' };
        }
        
        return await dimensionComparator.compareKnowledgeFit(
            resumeData,
            occupationData.knowledge
        );
    }

    async compareToolsDimension(resumeData, occupationData) {
        if (!occupationData.tools || occupationData.tools.length === 0) {
            return { score: 50, matches: [], gaps: [], note: 'No tools data available' };
        }
        
        return await dimensionComparator.compareToolsFit(
            resumeData.skills || { tools: [] },
            occupationData.tools
        );
    }

    async compareSingleDimension(resumeId, occupationCode, dimension) {
        const resumeData = await this.getResumeData(resumeId);
        if (!resumeData) {
            throw new Error(`Resume ${resumeId} not found or not processed`);
        }

        const occupationData = await this.getOccupationData(occupationCode);
        if (!occupationData) {
            throw new Error(`Occupation ${occupationCode} not found`);
        }

        const dimensionComparisons = {
            tasks: () => this.compareTasksDimension(resumeData, occupationData),
            skills: () => this.compareSkillsDimension(resumeData, occupationData),
            education: () => this.compareEducationDimension(resumeData, occupationData),
            workActivities: () => this.compareWorkActivitiesDimension(resumeData, occupationData),
            knowledge: () => this.compareKnowledgeDimension(resumeData, occupationData),
            tools: () => this.compareToolsDimension(resumeData, occupationData)
        };

        if (!dimensionComparisons[dimension]) {
            throw new Error(`Invalid dimension: ${dimension}`);
        }

        const result = await dimensionComparisons[dimension]();
        
        return {
            dimension,
            occupationCode,
            occupationTitle: occupationData.occupation.title,
            result,
            timestamp: new Date().toISOString()
        };
    }

    cacheAnalysis(key, analysis) {
        this.analysisCache.set(key, {
            data: analysis,
            timestamp: Date.now()
        });

        setTimeout(() => {
            this.analysisCache.delete(key);
        }, this.cacheTimeout);
    }

    getCachedAnalysis(key) {
        const cached = this.analysisCache.get(key);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }
        
        return null;
    }

    clearCache() {
        this.analysisCache.clear();
    }
}

const analysisService = new AnalysisService();
export default analysisService;