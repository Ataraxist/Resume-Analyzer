import resumeModel from '../models/resumeModel.js';
import fileExtractorService from '../services/fileExtractorService.js';
import resumeParserService from '../services/resumeParserService.js';

class ResumeController {
    // Helper to check resume ownership for both users and guests
    async checkResumeOwnership(resumeId, identity) {
        if (identity.userId) {
            return await resumeModel.isResumeOwnedByUser(resumeId, identity.userId);
        } else if (identity.sessionId) {
            return await resumeModel.isResumeOwnedBySession(resumeId, identity.sessionId);
        }
        return false;
    }
    // Upload and process resume
    async uploadResume(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const { originalname, mimetype, size, buffer } = req.file;

            // Check if format is supported
            if (!fileExtractorService.isFormatSupported(mimetype)) {
                return res.status(400).json({ 
                    error: 'Unsupported file format',
                    supportedFormats: fileExtractorService.getSupportedFormats()
                });
            }

            // Step 1: Create initial resume entry with user_id or session_id
            const resumeId = await resumeModel.createResume({
                userId: req.identity?.userId || null,
                sessionId: req.identity?.sessionId || null,
                filename: originalname,
                file_type: mimetype,
                file_size: size,
                raw_text: '',
                processing_status: 'processing'
            });

            // Send immediate response
            res.status(202).json({
                message: 'Resume uploaded and processing started',
                resumeId,
                status: 'processing'
            });

            // Continue processing asynchronously
            this.processResumeAsync(resumeId, buffer, mimetype);

        } catch (error) {
            console.error('Error uploading resume:', error);
            res.status(500).json({ error: 'Failed to upload resume' });
        }
    }

    // Async processing of resume
    async processResumeAsync(resumeId, buffer, mimetype) {
        try {
            // Step 2: Extract text from file
            const extractedText = await fileExtractorService.extractText(buffer, mimetype);

            // Update the database with extracted text and status
            await resumeModel.updateRawText(resumeId, extractedText);
            await resumeModel.updateResumeStatus(resumeId, 'processing');

            // Step 3: Parse resume with AI
            const structuredData = await resumeParserService.parseResume(extractedText);

            // Step 4: Update with structured data
            await resumeModel.updateStructuredData(resumeId, structuredData);

            console.log(`Resume ${resumeId} processed successfully`);

        } catch (error) {
            console.error(`Error processing resume ${resumeId}:`, error);
            await resumeModel.updateResumeStatus(resumeId, 'failed', error.message);
        }
    }

    // Parse raw text input
    async parseText(req, res) {
        try {
            const { text } = req.body;

            if (!text || text.trim().length === 0) {
                return res.status(400).json({ error: 'No text provided' });
            }

            // Create resume entry with user_id or session_id
            const resumeId = await resumeModel.createResume({
                userId: req.identity?.userId || null,
                sessionId: req.identity?.sessionId || null,
                filename: 'text-input.txt',
                file_type: 'text/plain',
                file_size: text.length,
                raw_text: text,
                processing_status: 'processing'
            });

            // Parse the text
            const structuredData = await resumeParserService.parseResume(text);

            // Update with structured data
            await resumeModel.updateStructuredData(resumeId, structuredData);

            res.json({
                message: 'Text parsed successfully',
                resumeId,
                structuredData
            });

        } catch (error) {
            console.error('Error parsing text:', error);
            res.status(500).json({ error: `Failed to parse text: ${error.message}` });
        }
    }

    // Get resume by ID
    async getResume(req, res) {
        try {
            const { id } = req.params;
            const resume = await resumeModel.getResumeById(id);

            if (!resume) {
                return res.status(404).json({ error: 'Resume not found' });
            }

            // Check ownership (works for both users and guests)
            const isOwner = await this.checkResumeOwnership(id, req.identity);
            if (!isOwner) {
                return res.status(403).json({ error: 'Access denied' });
            }

            res.json(resume);

        } catch (error) {
            console.error('Error fetching resume:', error);
            res.status(500).json({ error: 'Failed to fetch resume' });
        }
    }

    // Get structured data only
    async getStructuredData(req, res) {
        try {
            const { id } = req.params;
            
            // Check ownership (works for both users and guests)
            const isOwner = await this.checkResumeOwnership(id, req.identity);
            if (!isOwner) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            const structuredData = await resumeModel.getStructuredData(id);

            if (!structuredData) {
                return res.status(404).json({ error: 'Structured data not found' });
            }

            res.json(structuredData);

        } catch (error) {
            console.error('Error fetching structured data:', error);
            res.status(500).json({ error: 'Failed to fetch structured data' });
        }
    }

    // Update structured data
    async updateStructuredData(req, res) {
        try {
            const { id } = req.params;
            const updatedData = req.body;
            
            // Check ownership (works for both users and guests)
            const isOwner = await this.checkResumeOwnership(id, req.identity);
            if (!isOwner) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            // Update the structured data
            await resumeModel.updateStructuredData(id, updatedData);

            res.json({ 
                success: true, 
                message: 'Structured data updated successfully' 
            });

        } catch (error) {
            console.error('Error updating structured data:', error);
            res.status(500).json({ error: 'Failed to update structured data' });
        }
    }

    // Get all resumes
    async getAllResumes(req, res) {
        try {
            const { status, limit = 50, offset = 0 } = req.query;
            
            // This endpoint is for authenticated users only (remains unchanged)
            const filters = {
                userId: req.user.userId, // Filter by current user
                status,
                limit: parseInt(limit),
                offset: parseInt(offset)
            };

            const resumes = await resumeModel.getAllResumes(filters);
            const stats = await resumeModel.getResumeStatistics();

            res.json({
                data: resumes,
                statistics: stats,
                pagination: {
                    limit: filters.limit,
                    offset: filters.offset,
                    total: stats.total
                }
            });

        } catch (error) {
            console.error('Error fetching resumes:', error);
            res.status(500).json({ error: 'Failed to fetch resumes' });
        }
    }

    // Search resumes
    async searchResumes(req, res) {
        try {
            const { q, limit = 20 } = req.query;

            if (!q || q.trim().length === 0) {
                return res.status(400).json({ error: 'Search query required' });
            }

            const results = await resumeModel.searchResumes(q, parseInt(limit));

            res.json({
                query: q,
                results,
                count: results.length
            });

        } catch (error) {
            console.error('Error searching resumes:', error);
            res.status(500).json({ error: 'Failed to search resumes' });
        }
    }

    // Delete resume
    async deleteResume(req, res) {
        try {
            const { id } = req.params;
            
            // Check ownership (works for both users and guests)
            const isOwner = await this.checkResumeOwnership(id, req.identity);
            if (!isOwner) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            const deleted = await resumeModel.deleteResume(id);

            if (!deleted) {
                return res.status(404).json({ error: 'Resume not found' });
            }

            res.json({ message: 'Resume deleted successfully' });

        } catch (error) {
            console.error('Error deleting resume:', error);
            res.status(500).json({ error: 'Failed to delete resume' });
        }
    }

    // Get resume processing status
    async getResumeStatus(req, res) {
        try {
            const { id } = req.params;
            
            // Check ownership (works for both users and guests)
            const isOwner = await this.checkResumeOwnership(id, req.identity);
            if (!isOwner) {
                return res.status(403).json({ error: 'Access denied' });
            }
            
            const resume = await resumeModel.getResumeById(id);

            if (!resume) {
                return res.status(404).json({ error: 'Resume not found' });
            }

            res.json({
                id: resume.id,
                filename: resume.filename,
                status: resume.processing_status,
                error: resume.error_message,
                createdAt: resume.created_at,
                updatedAt: resume.updated_at
            });

        } catch (error) {
            console.error('Error fetching resume status:', error);
            res.status(500).json({ error: 'Failed to fetch resume status' });
        }
    }

    // Extract key elements for O*NET mapping (preparation for Phase 3)
    async extractKeyElements(req, res) {
        try {
            const { id } = req.params;
            const structuredData = await resumeModel.getStructuredData(id);

            if (!structuredData) {
                return res.status(404).json({ error: 'Structured data not found' });
            }

            const keyElements = resumeParserService.extractKeyElements(structuredData);

            res.json({
                resumeId: id,
                keyElements,
                message: 'Key elements extracted for O*NET mapping'
            });

        } catch (error) {
            console.error('Error extracting key elements:', error);
            res.status(500).json({ error: 'Failed to extract key elements' });
        }
    }

    // Get resumes for current user or session
    async getMyResumes(req, res) {
        try {
            const { limit = 10 } = req.query;
            let resumes = [];

            // Check if user is authenticated or is a guest
            if (req.identity.userId) {
                // Authenticated user - get their resumes
                resumes = await resumeModel.getResumesByUser(req.identity.userId, parseInt(limit));
            } else if (req.identity.sessionId) {
                // Guest user - get session resumes
                resumes = await resumeModel.getResumesBySession(req.identity.sessionId, parseInt(limit));
            }

            res.json({
                success: true,
                data: resumes,
                count: resumes.length
            });

        } catch (error) {
            console.error('Error fetching my resumes:', error);
            res.status(500).json({ 
                success: false,
                error: 'Failed to fetch your resumes' 
            });
        }
    }
}

// Create singleton instance
const resumeController = new ResumeController();
export default resumeController;