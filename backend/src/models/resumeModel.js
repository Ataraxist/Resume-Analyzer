import database from '../db/database.js';

class ResumeModel {
    // Create a new resume entry
    async createResume(resumeData) {
        const sql = `
            INSERT INTO resumes (
                filename, file_type, file_size, raw_text, 
                structured_data, processing_status, error_message
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
            resumeData.filename,
            resumeData.file_type,
            resumeData.file_size || 0,
            resumeData.raw_text,
            resumeData.structured_data ? JSON.stringify(resumeData.structured_data) : null,
            resumeData.processing_status || 'pending',
            resumeData.error_message || null
        ];

        try {
            const result = await database.run(sql, params);
            return result.id;
        } catch (error) {
            console.error('Error creating resume:', error);
            throw error;
        }
    }

    // Get resume by ID
    async getResumeById(id) {
        const sql = `
            SELECT * FROM resumes WHERE id = ?
        `;

        try {
            const resume = await database.get(sql, [id]);
            
            if (resume && resume.structured_data) {
                resume.structured_data = JSON.parse(resume.structured_data);
            }
            
            return resume;
        } catch (error) {
            console.error('Error fetching resume:', error);
            throw error;
        }
    }

    // Get all resumes with optional filtering
    async getAllResumes(filters = {}) {
        let sql = 'SELECT id, filename, file_type, processing_status, created_at FROM resumes';
        const params = [];
        const conditions = [];

        if (filters.status) {
            conditions.push('processing_status = ?');
            params.push(filters.status);
        }

        if (filters.startDate) {
            conditions.push('created_at >= ?');
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            conditions.push('created_at <= ?');
            params.push(filters.endDate);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY created_at DESC';

        if (filters.limit) {
            sql += ' LIMIT ?';
            params.push(filters.limit);
        }

        if (filters.offset) {
            sql += ' OFFSET ?';
            params.push(filters.offset);
        }

        try {
            return await database.query(sql, params);
        } catch (error) {
            console.error('Error fetching resumes:', error);
            throw error;
        }
    }

    // Update resume processing status
    async updateResumeStatus(id, status, errorMessage = null) {
        const sql = `
            UPDATE resumes 
            SET processing_status = ?, 
                error_message = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        try {
            const result = await database.run(sql, [status, errorMessage, id]);
            return result.changes > 0;
        } catch (error) {
            console.error('Error updating resume status:', error);
            throw error;
        }
    }

    // Update raw text
    async updateRawText(id, rawText) {
        const sql = `
            UPDATE resumes 
            SET raw_text = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        try {
            const result = await database.run(sql, [rawText, id]);
            return result.changes > 0;
        } catch (error) {
            console.error('Error updating raw text:', error);
            throw error;
        }
    }

    // Update structured data
    async updateStructuredData(id, structuredData) {
        const sql = `
            UPDATE resumes 
            SET structured_data = ?,
                processing_status = 'completed',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        try {
            const result = await database.run(sql, [JSON.stringify(structuredData), id]);
            return result.changes > 0;
        } catch (error) {
            console.error('Error updating structured data:', error);
            throw error;
        }
    }

    // Delete resume
    async deleteResume(id) {
        const sql = 'DELETE FROM resumes WHERE id = ?';

        try {
            const result = await database.run(sql, [id]);
            return result.changes > 0;
        } catch (error) {
            console.error('Error deleting resume:', error);
            throw error;
        }
    }

    // Get resume statistics
    async getResumeStatistics() {
        const sql = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN processing_status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN processing_status = 'failed' THEN 1 END) as failed,
                COUNT(CASE WHEN processing_status = 'processing' THEN 1 END) as processing,
                COUNT(CASE WHEN processing_status = 'pending' THEN 1 END) as pending
            FROM resumes
        `;

        try {
            return await database.get(sql);
        } catch (error) {
            console.error('Error fetching resume statistics:', error);
            throw error;
        }
    }

    // Search resumes by text content
    async searchResumes(searchTerm, limit = 20) {
        const sql = `
            SELECT id, filename, file_type, processing_status, created_at
            FROM resumes 
            WHERE raw_text LIKE ? OR filename LIKE ?
            ORDER BY created_at DESC
            LIMIT ?
        `;

        const searchPattern = `%${searchTerm}%`;

        try {
            return await database.query(sql, [searchPattern, searchPattern, limit]);
        } catch (error) {
            console.error('Error searching resumes:', error);
            throw error;
        }
    }

    // Get structured data only
    async getStructuredData(id) {
        const sql = 'SELECT structured_data FROM resumes WHERE id = ?';

        try {
            const result = await database.get(sql, [id]);
            
            if (result && result.structured_data) {
                return JSON.parse(result.structured_data);
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching structured data:', error);
            throw error;
        }
    }

    // Batch update for processing multiple resumes
    async markAsProcessing(ids) {
        const placeholders = ids.map(() => '?').join(',');
        const sql = `
            UPDATE resumes 
            SET processing_status = 'processing',
                updated_at = CURRENT_TIMESTAMP
            WHERE id IN (${placeholders})
        `;

        try {
            const result = await database.run(sql, ids);
            return result.changes;
        } catch (error) {
            console.error('Error marking resumes as processing:', error);
            throw error;
        }
    }
}

// Create singleton instance
const resumeModel = new ResumeModel();
export default resumeModel;