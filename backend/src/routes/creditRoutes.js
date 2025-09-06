import express from 'express';
import creditController from '../controllers/creditController.js';
import authMiddleware, { optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import { attachCreditInfo } from '../middleware/creditMiddleware.js';

const router = express.Router();

// Get current credit balance (works for both authenticated and anonymous users)
router.get('/balance', 
    optionalAuthMiddleware,
    attachCreditInfo,
    (req, res) => creditController.getBalance(req, res)
);

// Get available credit packages
router.get('/packages', 
    (req, res) => creditController.getPackages(req, res)
);

// Check if user can perform analysis
router.get('/check-availability',
    optionalAuthMiddleware,
    (req, res) => creditController.checkAvailability(req, res)
);

// Purchase credits (authenticated users only)
router.post('/purchase',
    authMiddleware,
    (req, res) => creditController.purchaseCredits(req, res)
);

// Get credit history (authenticated users only)
router.get('/history',
    authMiddleware,
    (req, res) => creditController.getHistory(req, res)
);

export default router;