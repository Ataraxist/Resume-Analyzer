import analysisModel from '../models/analysisModel.js';
import analysisService from '../services/analysisService.js';

class AnalysisController {
    async analyzeResume(req, res) {
        try {
            const { resumeId, occupationCode } = req.body;

            if (!resumeId || !occupationCode) {
                return res.status(400).json({ 
                    error: 'Both resumeId and occupationCode are required' 
                });
            }

            const existingAnalysis = await analysisModel.getLatestAnalysis(resumeId, occupationCode);
            
            if (existingAnalysis && 
                new Date() - new Date(existingAnalysis.analysis_date) < 3600000) {
                console.log('Returning recent analysis from database');
                return res.json({
                    message: 'Analysis retrieved from recent results',
                    analysisId: existingAnalysis.id,
                    ...existingAnalysis
                });
            }

            const analysis = await analysisService.analyzeResumeAgainstOccupation(
                resumeId, 
                occupationCode
            );

            const analysisId = await analysisModel.createAnalysis(analysis);

            res.json({
                message: 'Analysis completed successfully',
                analysisId,
                ...analysis
            });

        } catch (error) {
            console.error('Error analyzing resume:', error);
            res.status(500).json({ 
                error: `Failed to analyze resume: ${error.message}` 
            });
        }
    }

    async getAnalysis(req, res) {
        try {
            const { id } = req.params;
            const analysis = await analysisModel.getAnalysisById(id);

            if (!analysis) {
                return res.status(404).json({ error: 'Analysis not found' });
            }

            res.json(analysis);

        } catch (error) {
            console.error('Error fetching analysis:', error);
            res.status(500).json({ error: 'Failed to fetch analysis' });
        }
    }

    async compareDimension(req, res) {
        try {
            const { resumeId, occupationCode, dimension } = req.body;

            if (!resumeId || !occupationCode || !dimension) {
                return res.status(400).json({ 
                    error: 'resumeId, occupationCode, and dimension are required' 
                });
            }

            const validDimensions = ['tasks', 'skills', 'education', 'workActivities', 'knowledge', 'tools'];
            if (!validDimensions.includes(dimension)) {
                return res.status(400).json({ 
                    error: `Invalid dimension. Valid options: ${validDimensions.join(', ')}` 
                });
            }

            const result = await analysisService.compareSingleDimension(
                resumeId, 
                occupationCode, 
                dimension
            );

            res.json(result);

        } catch (error) {
            console.error('Error comparing dimension:', error);
            res.status(500).json({ 
                error: `Failed to compare dimension: ${error.message}` 
            });
        }
    }

    async getRecommendations(req, res) {
        try {
            const { id } = req.params;
            const analysis = await analysisModel.getAnalysisById(id);

            if (!analysis) {
                return res.status(404).json({ error: 'Analysis not found' });
            }

            res.json({
                analysisId: id,
                occupationTitle: analysis.occupation_title,
                overallScore: analysis.overall_fit_score,
                recommendations: analysis.recommendations,
                gaps: analysis.detailed_gaps,
                timeToQualify: analysis.dimension_scores.timeToQualify || null
            });

        } catch (error) {
            console.error('Error fetching recommendations:', error);
            res.status(500).json({ error: 'Failed to fetch recommendations' });
        }
    }

    async getResumeAnalyses(req, res) {
        try {
            const { resumeId } = req.params;
            const analyses = await analysisModel.getAnalysesByResumeId(resumeId);

            res.json({
                resumeId,
                analyses,
                count: analyses.length
            });

        } catch (error) {
            console.error('Error fetching resume analyses:', error);
            res.status(500).json({ error: 'Failed to fetch resume analyses' });
        }
    }

    async getOccupationAnalyses(req, res) {
        try {
            const { occupationCode } = req.params;
            const analyses = await analysisModel.getAnalysesByOccupation(occupationCode);

            res.json({
                occupationCode,
                analyses,
                count: analyses.length
            });

        } catch (error) {
            console.error('Error fetching occupation analyses:', error);
            res.status(500).json({ error: 'Failed to fetch occupation analyses' });
        }
    }

    async getAnalysisStatistics(req, res) {
        try {
            const stats = await analysisModel.getAnalysisStatistics();
            const recent = await analysisModel.getRecentAnalyses(5);

            res.json({
                statistics: stats,
                recentAnalyses: recent
            });

        } catch (error) {
            console.error('Error fetching analysis statistics:', error);
            res.status(500).json({ error: 'Failed to fetch statistics' });
        }
    }

    async searchAnalyses(req, res) {
        try {
            const { 
                minScore, 
                maxScore, 
                occupationCode, 
                status, 
                startDate, 
                endDate, 
                limit = 50 
            } = req.query;

            const filters = {
                minScore: minScore ? parseFloat(minScore) : undefined,
                maxScore: maxScore ? parseFloat(maxScore) : undefined,
                occupationCode,
                status,
                startDate,
                endDate,
                limit: parseInt(limit)
            };

            const analyses = await analysisModel.searchAnalyses(filters);

            res.json({
                filters,
                results: analyses,
                count: analyses.length
            });

        } catch (error) {
            console.error('Error searching analyses:', error);
            res.status(500).json({ error: 'Failed to search analyses' });
        }
    }

    async deleteAnalysis(req, res) {
        try {
            const { id } = req.params;
            const deleted = await analysisModel.deleteAnalysis(id);

            if (!deleted) {
                return res.status(404).json({ error: 'Analysis not found' });
            }

            res.json({ message: 'Analysis deleted successfully' });

        } catch (error) {
            console.error('Error deleting analysis:', error);
            res.status(500).json({ error: 'Failed to delete analysis' });
        }
    }

    async getTopMatches(req, res) {
        try {
            const { resumeId } = req.params;
            const { limit = 10 } = req.query;

            const matches = await analysisModel.getTopOccupationMatches(
                resumeId, 
                parseInt(limit)
            );

            res.json({
                resumeId,
                topMatches: matches,
                count: matches.length
            });

        } catch (error) {
            console.error('Error fetching top matches:', error);
            res.status(500).json({ error: 'Failed to fetch top matches' });
        }
    }
}

const analysisController = new AnalysisController();
export default analysisController;