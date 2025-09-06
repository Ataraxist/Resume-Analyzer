import express from 'express';
import analysisController from '../controllers/analysisController.js';

const router = express.Router();

// Main analysis endpoint - analyze resume against selected occupation
router.post('/analyze', (req, res) => analysisController.analyzeResume(req, res));

// Compare specific dimension
router.post('/compare-dimension', (req, res) => analysisController.compareDimension(req, res));

// Get all analyses
router.get('/search', (req, res) => analysisController.searchAnalyses(req, res));

// Get analysis statistics
router.get('/statistics', (req, res) => analysisController.getAnalysisStatistics(req, res));

// Get specific analysis by ID
router.get('/:id', (req, res) => analysisController.getAnalysis(req, res));

// Get recommendations for specific analysis
router.get('/:id/recommendations', (req, res) => analysisController.getRecommendations(req, res));

// Delete analysis
router.delete('/:id', (req, res) => analysisController.deleteAnalysis(req, res));

// Get all analyses for a specific resume
router.get('/resume/:resumeId', (req, res) => analysisController.getResumeAnalyses(req, res));

// Get top occupation matches for a resume
router.get('/resume/:resumeId/top-matches', (req, res) => analysisController.getTopMatches(req, res));

// Get all analyses for a specific occupation
router.get('/occupation/:occupationCode', (req, res) => analysisController.getOccupationAnalyses(req, res));

export default router;