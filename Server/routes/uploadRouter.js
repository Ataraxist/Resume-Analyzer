import express from 'express';
import multer from 'multer';
import config from '../config/config.js';
import uploadController from '../controllers/uploadController.js';
import openAIAnalysisController from '../controllers/openAIController.js';
import oNetController from '../controllers/oNetController.js';
import { 
  validateFileUpload, 
  validateJobSelection, 
  validateTextInput, 
  sanitizeInput 
} from '../middleware/validation.js';

const router = express.Router();

// Configure multer with limits and validation
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload a PDF, text, or Word document.'), false);
    }
  }
});

// Router to handle file uploads
router.post(
  '/',
  upload.single('resumeFile'), // User uploads a file
  sanitizeInput, // Sanitize inputs
  validateJobSelection, // Validate job selection
  validateFileUpload, // Validate file upload (if file provided)
  validateTextInput, // Validate text input (if text provided)
  uploadController.processUpload, // Process the resume
  oNetController.getJobDetails, // Get relevant job details
  openAIAnalysisController // Analyze with AI and return results
);

export default router;
