import express from 'express';
import oNetController from '../controllers/oNetController.js';

export const router = express.Router();

// * Router for getting up to date information from oNet
router.get('/titles', oNetController.getJobListings);

// * Router to get job specifics from oNet
router.get('/details/:code', oNetController.getJobDetails);

export default router;
