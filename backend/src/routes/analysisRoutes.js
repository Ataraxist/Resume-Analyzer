import express from 'express';
import analysisController from '../controllers/analysisController.js';
import authMiddleware, { optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { requireIdentity, trackGuestSession } from '../middleware/sessionMiddleware.js';
import { requireCredits, consumeCredits } from '../middleware/creditMiddleware.js';

const router = express.Router();

// SSE streaming analysis endpoint - supports both guests and authenticated users with credit checks
router.get('/stream/:resumeId/:occupationCode',
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    requireCredits,  // Check if user has credits before proceeding
    consumeCredits,  // Consume credits after successful analysis
    (req, res) => analysisController.streamAnalysis(req, res)
);

// Compare specific dimension - supports both guests and authenticated users
router.post('/compare-dimension',
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    (req, res) => analysisController.compareDimension(req, res)
);

// Get all analyses - authenticated users only
router.get('/search', 
    authMiddleware,
    (req, res) => analysisController.searchAnalyses(req, res)
);

// Get analysis statistics - authenticated users only
router.get('/statistics',
    authMiddleware,
    (req, res) => analysisController.getAnalysisStatistics(req, res)
);

// Get specific analysis by ID - supports both guests and authenticated users
router.get('/:id',
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    (req, res) => analysisController.getAnalysis(req, res)
);

// Get recommendations for specific analysis - supports both guests and authenticated users
router.get('/:id/recommendations',
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    (req, res) => analysisController.getRecommendations(req, res)
);

// Delete analysis - supports both guests and authenticated users
router.delete('/:id',
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    (req, res) => analysisController.deleteAnalysis(req, res)
);

// Get all analyses for a specific resume - supports both guests and authenticated users
router.get('/resume/:resumeId',
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    (req, res) => analysisController.getResumeAnalyses(req, res)
);

// Get top occupation matches for a resume - supports both guests and authenticated users
router.get('/resume/:resumeId/top-matches',
    optionalAuthMiddleware,
    trackGuestSession,
    requireIdentity,
    (req, res) => analysisController.getTopMatches(req, res)
);

// Get all analyses for a specific occupation - public endpoint
router.get('/occupation/:occupationCode', 
    (req, res) => analysisController.getOccupationAnalyses(req, res)
);

export default router;