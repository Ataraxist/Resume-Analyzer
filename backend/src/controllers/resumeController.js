import resumeModel from '../models/resumeModel.js';
import fileExtractorService from '../services/fileExtractorService.js';
import resumeParserService from '../services/resumeParserService.js';
import googleDocsService from '../services/googleDocsService.js';

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

    // Stream resume parsing with SSE
    async streamResumeParsing(req, res) {
        const { id } = req.params;
        
        try {
            // Check ownership
            const isOwner = await this.checkResumeOwnership(id, req.identity);
            if (!isOwner) {
                return res.status(403).json({ error: 'Access denied' });
            }

            // Get resume with raw text
            const resume = await resumeModel.getResumeById(id);
            if (!resume) {
                return res.status(404).json({ error: 'Resume not found' });
            }

            if (!resume.raw_text) {
                return res.status(400).json({ error: 'Resume text not available' });
            }

            // Set SSE headers
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no' // Disable Nginx buffering
            });

            // Send initial connection event
            res.write(`event: connected\ndata: ${JSON.stringify({ resumeId: id })}\n\n`);

            // Keep connection alive with heartbeat
            const heartbeat = setInterval(() => {
                res.write(`event: heartbeat\ndata: ${Date.now()}\n\n`);
            }, 30000);

            // Clean up on client disconnect
            req.on('close', () => {
                clearInterval(heartbeat);
            });

            // Parse resume with streaming
            const structuredData = await resumeParserService.parseResumeStream(
                resume.raw_text,
                (field, value) => {
                    // Send field update via SSE
                    res.write(`event: field_update\ndata: ${JSON.stringify({ field, value })}\n\n`);
                    
                    // Update database with partial data (optional - can be removed if not needed)
                    // resumeModel.updatePartialStructuredData(id, field, value).catch(err => {
                    //     console.error(`Error updating partial data for ${id}:`, err);
                    // });
                }
            );

            // Send completion event
            res.write(`event: completed\ndata: ${JSON.stringify(structuredData)}\n\n`);

            // Update final structured data
            await resumeModel.updateStructuredData(id, structuredData);

            // Clean up
            clearInterval(heartbeat);
            res.end();

        } catch (error) {
            console.error('Error streaming resume parse:', error);
            res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
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

            // Step 2: Extract text from file
            const extractedText = await fileExtractorService.extractText(buffer, mimetype);
            
            // Update the database with extracted text
            await resumeModel.updateRawText(resumeId, extractedText);
            
            // Send response with resumeId for SSE connection
            res.json({
                message: 'Resume uploaded successfully',
                resumeId,
                status: 'ready_for_streaming'
            });

        } catch (error) {
            console.error('Error uploading resume:', error);
            res.status(500).json({ error: 'Failed to upload resume' });
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

    // Import resume from Google Docs
    async importGoogleDoc(req, res) {
        try {
            const { url } = req.body;

            if (!url || url.trim().length === 0) {
                return res.status(400).json({ error: 'No Google Docs URL provided' });
            }

            // Fetch document from Google Docs
            const documentData = await googleDocsService.fetchDocument(url);
            
            let extractedText = '';
            let filename = `google-doc-${documentData.documentId}.${documentData.format}`;
            let fileType = documentData.format === 'pdf' ? 'application/pdf' : 'text/plain';
            let fileSize = 0;

            // Handle different formats returned by Google Docs service
            if (documentData.format === 'txt') {
                extractedText = documentData.text;
                fileSize = documentData.text.length;
            } else if (documentData.format === 'pdf' && documentData.buffer) {
                // Extract text from PDF buffer
                extractedText = await fileExtractorService.extractText(
                    documentData.buffer, 
                    documentData.mimeType
                );
                fileSize = documentData.buffer.length;
            }

            if (!extractedText || extractedText.trim().length === 0) {
                return res.status(400).json({ 
                    error: 'Could not extract text from the document. Please ensure it contains readable text.' 
                });
            }

            // Create resume entry
            const resumeId = await resumeModel.createResume({
                userId: req.identity?.userId || null,
                sessionId: req.identity?.sessionId || null,
                filename: filename,
                file_type: fileType,
                file_size: fileSize,
                raw_text: extractedText,
                processing_status: 'processing'
            });

            // Send response with resumeId for SSE connection
            res.json({
                message: 'Google Docs document imported successfully',
                resumeId,
                status: 'ready_for_streaming',
                documentId: documentData.documentId
            });

        } catch (error) {
            console.error('Error importing Google Docs document:', error);
            
            // Send user-friendly error messages
            if (error.message.includes('publicly accessible') || 
                error.message.includes('Access denied')) {
                res.status(403).json({ 
                    error: error.message,
                    help: 'To make your document public: Open Google Docs → Click Share → Change to "Anyone with the link can view"'
                });
            } else if (error.message.includes('Invalid Google Docs URL')) {
                res.status(400).json({ 
                    error: error.message,
                    help: 'Please provide a valid Google Docs or Google Drive link'
                });
            } else if (error.message.includes('Document not found')) {
                res.status(404).json({ error: error.message });
            } else if (error.message.includes('timed out')) {
                res.status(504).json({ error: error.message });
            } else {
                res.status(500).json({ 
                    error: 'Failed to import document from Google Docs',
                    details: error.message
                });
            }
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