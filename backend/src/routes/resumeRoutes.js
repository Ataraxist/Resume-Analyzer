import express from 'express';
import resumeController from '../controllers/resumeController.js';
import upload, { handleUploadError } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Upload and process resume file
router.post(
    '/upload',
    upload.single('resume'),
    handleUploadError,
    (req, res) => resumeController.uploadResume(req, res)
);

// Parse raw text input
router.post('/parse-text', (req, res) => resumeController.parseText(req, res));

// Get all resumes with optional filtering
router.get('/', (req, res) => resumeController.getAllResumes(req, res));

// Search resumes by text content
router.get('/search', (req, res) => resumeController.searchResumes(req, res));

// Get specific resume by ID
router.get('/:id', (req, res) => resumeController.getResume(req, res));

// Get resume processing status
router.get('/:id/status', (req, res) => resumeController.getResumeStatus(req, res));

// Get structured data only
router.get('/:id/structured', (req, res) => resumeController.getStructuredData(req, res));

// Extract key elements for O*NET mapping (Phase 3 preparation)
router.get('/:id/key-elements', (req, res) => resumeController.extractKeyElements(req, res));

// Delete resume
router.delete('/:id', (req, res) => resumeController.deleteResume(req, res));

export default router;