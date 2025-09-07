import database from '../db/database.js';

class AnalysisModel {
    async createAnalysis(analysisData) {
        const sql = `
            INSERT INTO analyses (
                resume_id, occupation_code, occupation_title, analysis_date,
                overall_fit_score, dimension_scores, detailed_gaps, 
                recommendations, processing_time_ms, status, error_message
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            analysisData.resumeId,
            analysisData.occupationCode,
            analysisData.occupationTitle,
            analysisData.analysisDate || new Date().toISOString(),
            analysisData.overallFitScore,
            JSON.stringify(analysisData.dimensionScores),
            JSON.stringify(analysisData.gaps || {}),
            JSON.stringify(analysisData.recommendations || []),
            analysisData.processingTimeMs || 0,
            analysisData.status || 'completed',
            analysisData.errorMessage || null
        ];

        try {
            const result = await database.run(sql, params);
            return result.id;
        } catch (error) {
            console.error('Error creating analysis:', error);
            throw error;
        }
    }

    async getAnalysisById(id) {
        const sql = `
            SELECT * FROM analyses WHERE id = ?
        `;

        try {
            const analysis = await database.get(sql, [id]);
            
            if (analysis) {
                // Transform snake_case to camelCase for frontend consistency
                return {
                    id: analysis.id,
                    resumeId: analysis.resume_id,
                    occupationCode: analysis.occupation_code,
                    occupationTitle: analysis.occupation_title,
                    analysisDate: analysis.analysis_date,
                    overallFitScore: analysis.overall_fit_score,
                    fitCategory: analysis.fit_category,
                    dimensionScores: JSON.parse(analysis.dimension_scores || '{}'),
                    scoreBreakdown: JSON.parse(analysis.score_breakdown || '{}'),
                    detailedGaps: JSON.parse(analysis.detailed_gaps || '{}'),
                    recommendations: JSON.parse(analysis.recommendations || '[]'),
                    improvementImpact: JSON.parse(analysis.improvement_impact || '{}'),
                    timeToQualify: analysis.time_to_qualify,
                    processingTimeMs: analysis.processing_time_ms,
                    status: analysis.status,
                    errorMessage: analysis.error_message,
                    createdAt: analysis.created_at,
                    updatedAt: analysis.updated_at
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching analysis:', error);
            throw error;
        }
    }

    async getAnalysesByResumeId(resumeId) {
        const sql = `
            SELECT id, occupation_code, occupation_title, overall_fit_score, 
                   analysis_date, status
            FROM analyses 
            WHERE resume_id = ?
            ORDER BY analysis_date DESC
        `;

        try {
            return await database.query(sql, [resumeId]);
        } catch (error) {
            console.error('Error fetching analyses by resume:', error);
            throw error;
        }
    }

    async getAnalysesByOccupation(occupationCode) {
        const sql = `
            SELECT a.*, r.filename
            FROM analyses a
            JOIN resumes r ON a.resume_id = r.id
            WHERE a.occupation_code = ?
            ORDER BY a.analysis_date DESC
        `;

        try {
            const analyses = await database.query(sql, [occupationCode]);
            
            return analyses.map(analysis => ({
                ...analysis,
                dimension_scores: JSON.parse(analysis.dimension_scores || '{}'),
                detailed_gaps: JSON.parse(analysis.detailed_gaps || '{}'),
                recommendations: JSON.parse(analysis.recommendations || '[]')
            }));
        } catch (error) {
            console.error('Error fetching analyses by occupation:', error);
            throw error;
        }
    }

    async getLatestAnalysis(resumeId, occupationCode) {
        const sql = `
            SELECT * FROM analyses 
            WHERE resume_id = ? AND occupation_code = ?
            ORDER BY analysis_date DESC
            LIMIT 1
        `;

        try {
            const analysis = await database.get(sql, [resumeId, occupationCode]);
            
            if (analysis) {
                // Transform snake_case to camelCase for frontend consistency
                return {
                    id: analysis.id,
                    resumeId: analysis.resume_id,
                    occupationCode: analysis.occupation_code,
                    occupationTitle: analysis.occupation_title,
                    analysisDate: analysis.analysis_date,
                    overallFitScore: analysis.overall_fit_score,
                    fitCategory: analysis.fit_category,
                    dimensionScores: JSON.parse(analysis.dimension_scores || '{}'),
                    scoreBreakdown: JSON.parse(analysis.score_breakdown || '{}'),
                    detailedGaps: JSON.parse(analysis.detailed_gaps || '{}'),
                    recommendations: JSON.parse(analysis.recommendations || '[]'),
                    improvementImpact: JSON.parse(analysis.improvement_impact || '{}'),
                    timeToQualify: analysis.time_to_qualify,
                    processingTimeMs: analysis.processing_time_ms,
                    status: analysis.status,
                    errorMessage: analysis.error_message,
                    createdAt: analysis.created_at,
                    updatedAt: analysis.updated_at
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching latest analysis:', error);
            throw error;
        }
    }

    async updateAnalysisStatus(id, status, errorMessage = null) {
        const sql = `
            UPDATE analyses 
            SET status = ?, 
                error_message = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        try {
            const result = await database.run(sql, [status, errorMessage, id]);
            return result.changes > 0;
        } catch (error) {
            console.error('Error updating analysis status:', error);
            throw error;
        }
    }

    async deleteAnalysis(id) {
        const sql = 'DELETE FROM analyses WHERE id = ?';

        try {
            const result = await database.run(sql, [id]);
            return result.changes > 0;
        } catch (error) {
            console.error('Error deleting analysis:', error);
            throw error;
        }
    }

    async getAnalysisStatistics() {
        const sql = `
            SELECT 
                COUNT(*) as total,
                AVG(overall_fit_score) as average_score,
                MIN(overall_fit_score) as min_score,
                MAX(overall_fit_score) as max_score,
                COUNT(CASE WHEN overall_fit_score >= 70 THEN 1 END) as good_matches,
                COUNT(CASE WHEN overall_fit_score < 50 THEN 1 END) as poor_matches,
                AVG(processing_time_ms) as avg_processing_time
            FROM analyses
            WHERE status = 'completed'
        `;

        try {
            return await database.get(sql);
        } catch (error) {
            console.error('Error fetching analysis statistics:', error);
            throw error;
        }
    }

    async getTopOccupationMatches(resumeId, limit = 10) {
        const sql = `
            SELECT occupation_code, occupation_title, overall_fit_score,
                   dimension_scores, analysis_date
            FROM analyses
            WHERE resume_id = ? AND status = 'completed'
            ORDER BY overall_fit_score DESC
            LIMIT ?
        `;

        try {
            const matches = await database.query(sql, [resumeId, limit]);
            
            return matches.map(match => ({
                ...match,
                dimension_scores: JSON.parse(match.dimension_scores || '{}')
            }));
        } catch (error) {
            console.error('Error fetching top matches:', error);
            throw error;
        }
    }

    async searchAnalyses(filters = {}) {
        let sql = `
            SELECT a.*, r.filename
            FROM analyses a
            JOIN resumes r ON a.resume_id = r.id
            WHERE 1=1
        `;
        const params = [];

        if (filters.minScore !== undefined) {
            sql += ' AND a.overall_fit_score >= ?';
            params.push(filters.minScore);
        }

        if (filters.maxScore !== undefined) {
            sql += ' AND a.overall_fit_score <= ?';
            params.push(filters.maxScore);
        }

        if (filters.occupationCode) {
            sql += ' AND a.occupation_code = ?';
            params.push(filters.occupationCode);
        }

        if (filters.status) {
            sql += ' AND a.status = ?';
            params.push(filters.status);
        }

        if (filters.startDate) {
            sql += ' AND a.analysis_date >= ?';
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            sql += ' AND a.analysis_date <= ?';
            params.push(filters.endDate);
        }

        sql += ' ORDER BY a.analysis_date DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(filters.limit);
        }

        try {
            const analyses = await database.query(sql, params);
            
            return analyses.map(analysis => ({
                ...analysis,
                dimension_scores: JSON.parse(analysis.dimension_scores || '{}'),
                detailed_gaps: JSON.parse(analysis.detailed_gaps || '{}'),
                recommendations: JSON.parse(analysis.recommendations || '[]')
            }));
        } catch (error) {
            console.error('Error searching analyses:', error);
            throw error;
        }
    }

    async getRecentAnalyses(limit = 10) {
        const sql = `
            SELECT a.id, a.resume_id, a.occupation_code, a.occupation_title,
                   a.overall_fit_score, a.analysis_date, a.status, r.filename
            FROM analyses a
            JOIN resumes r ON a.resume_id = r.id
            ORDER BY a.analysis_date DESC
            LIMIT ?
        `;

        try {
            return await database.query(sql, [limit]);
        } catch (error) {
            console.error('Error fetching recent analyses:', error);
            throw error;
        }
    }
}

const analysisModel = new AnalysisModel();
export default analysisModel;