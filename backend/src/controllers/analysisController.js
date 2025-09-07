import analysisModel from '../models/analysisModel.js';
import analysisService from '../services/analysisService.js';

class AnalysisController {
    // Stream analysis with SSE
    async streamAnalysis(req, res) {
        const { resumeId, occupationCode } = req.params;
        
        try {
            if (!resumeId || !occupationCode) {
                return res.status(400).json({ 
                    error: 'Both resumeId and occupationCode are required' 
                });
            }

            // Check for recent existing analysis
            const existingAnalysis = await analysisModel.getLatestAnalysis(resumeId, occupationCode);
            
            if (existingAnalysis && 
                new Date() - new Date(existingAnalysis.analysis_date) < 3600000) {
                console.log('Returning recent analysis from database via SSE');
                
                // Set SSE headers
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no'
                });

                // Send existing data immediately
                res.write(`event: connected\ndata: ${JSON.stringify({ resumeId, occupationCode })}\n\n`);
                
                // Send all dimensions at once for cached data
                Object.entries(existingAnalysis.dimensionScores || {}).forEach(([dimension, scores]) => {
                    res.write(`event: dimension_update\ndata: ${JSON.stringify({ 
                        dimension, 
                        scores,
                        cached: true 
                    })}\n\n`);
                });

                // Send completion
                res.write(`event: completed\ndata: ${JSON.stringify({
                    analysisId: existingAnalysis.id,
                    ...existingAnalysis
                })}\n\n`);
                
                res.end();
                return;
            }

            // Set SSE headers for new analysis
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'
            });

            // Send initial connection event
            res.write(`event: connected\ndata: ${JSON.stringify({ resumeId, occupationCode })}\n\n`);

            // Keep connection alive with heartbeat
            const heartbeat = setInterval(() => {
                res.write(`event: heartbeat\ndata: ${Date.now()}\n\n`);
            }, 30000);

            // Clean up on client disconnect
            req.on('close', () => {
                clearInterval(heartbeat);
            });

            // Stream analysis with dimension updates
            const analysis = await analysisService.analyzeResumeStream(
                resumeId,
                occupationCode,
                (dimension, scores) => {
                    // Send dimension update via SSE
                    res.write(`event: dimension_update\ndata: ${JSON.stringify({ dimension, scores })}\n\n`);
                }
            );

            // Create analysis record
            const analysisId = await analysisModel.createAnalysis(analysis);

            // Send completion event
            res.write(`event: completed\ndata: ${JSON.stringify({
                analysisId,
                ...analysis
            })}\n\n`);

            // Clean up
            clearInterval(heartbeat);
            res.end();

        } catch (error) {
            console.error('Error streaming analysis:', error);
            res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
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