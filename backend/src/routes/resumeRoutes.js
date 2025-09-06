import express from 'express';
import resumeController from '../controllers/resumeController.js';
import upload, { handleUploadError } from '../middleware/uploadMiddleware.js';
import authMiddleware, { optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { requireIdentity, trackGuestSession } from '../middleware/sessionMiddleware.js';

const router = express.Router();

// Upload and process resume file - supports both guests and authenticated users
router.post(
    '/upload',
    upload.single('resume'),
    optionalAuthMiddleware,  // Try to authenticate but don't require it
    trackGuestSession,       // Track guest sessions
    requireIdentity,         // Ensure we have either user or session
    handleUploadError,
    (req, res) => resumeController.uploadResume(req, res)
);

// Parse raw text input - supports both guests and authenticated users
router.post('/parse-text', 
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    (req, res) => resumeController.parseText(req, res)
);

// Import from Google Docs - supports both guests and authenticated users
router.post('/import-google-doc',
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    (req, res) => resumeController.importGoogleDoc(req, res)
);

// Get all resumes - authenticated users only (see their own)
router.get('/', authMiddleware, (req, res) => resumeController.getAllResumes(req, res));

// Get resumes for current user or session - supports both guests and authenticated users  
router.get('/my-resumes',
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    (req, res) => resumeController.getMyResumes(req, res)
);

// Search resumes - authenticated users only (search their own)
router.get('/search', authMiddleware, (req, res) => resumeController.searchResumes(req, res));

// Get specific resume by ID - supports both guests and authenticated users (MUST BE AFTER STATIC ROUTES)
router.get('/:id', 
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    (req, res) => resumeController.getResume(req, res)
);

// Stream resume parsing with SSE - supports both guests and authenticated users
router.get('/:id/stream',
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    (req, res) => resumeController.streamResumeParsing(req, res)
);

// Status endpoint deprecated - using SSE streaming instead
// Kept for backward compatibility but returns static response
router.get('/:id/status',
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    (req, res) => res.json({ status: 'completed', message: 'Use /stream endpoint for real-time updates' })
);

// Get structured data only - supports both guests and authenticated users
router.get('/:id/structured',
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    (req, res) => resumeController.getStructuredData(req, res)
);

// Update structured data - supports both guests and authenticated users
router.put('/:id/structured',
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    (req, res) => resumeController.updateStructuredData(req, res)
);

// Extract key elements for O*NET mapping - supports both guests and authenticated users
router.get('/:id/key-elements',
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    (req, res) => resumeController.extractKeyElements(req, res)
);

// Delete resume - supports both guests and authenticated users
router.delete('/:id',
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    (req, res) => resumeController.deleteResume(req, res)
);

export default router;