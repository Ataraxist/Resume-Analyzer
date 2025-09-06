import { AppError } from './errorHandler.js';
import config from '../config/config.js';

const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return next(new AppError('No file uploaded. Please select a file to upload.', 400));
  }

  const { buffer, mimetype, size } = req.file;

  // Check file size
  if (size > config.upload.maxFileSize) {
    return next(new AppError(`File too large. Maximum size is ${config.upload.maxFileSize / (1024 * 1024)}MB.`, 400));
  }

  // Check file type
  if (!config.upload.allowedMimeTypes.includes(mimetype)) {
    return next(new AppError('Unsupported file format. Please upload a PDF, text, or Word document.', 400));
  }

  // Check if buffer is empty
  if (!buffer || buffer.length === 0) {
    return next(new AppError('Empty file uploaded. Please select a valid file.', 400));
  }

  next();
};

const validateJobSelection = (req, res, next) => {
  const { onetsoc_code } = req.body;

  if (!onetsoc_code) {
    return next(new AppError('Job selection is required. Please select a job before uploading your resume.', 400));
  }

  // Basic format validation for O*NET SOC code
  const socCodeRegex = /^\d{2}-\d{4}\.\d{2}$/;
  if (!socCodeRegex.test(onetsoc_code)) {
    return next(new AppError('Invalid job code format. Please select a valid job.', 400));
  }

  next();
};

const validateTextInput = (req, res, next) => {
  const { resumeText } = req.body;

  if (resumeText) {
    // Check if text is not empty and has reasonable length
    if (typeof resumeText !== 'string' || resumeText.trim().length === 0) {
      return next(new AppError('Resume text cannot be empty.', 400));
    }

    if (resumeText.length < 50) {
      return next(new AppError('Resume text is too short. Please provide more detailed information.', 400));
    }

    if (resumeText.length > 50000) {
      return next(new AppError('Resume text is too long. Please keep it under 50,000 characters.', 400));
    }
  }

  next();
};

const sanitizeInput = (req, res, next) => {
  // Basic sanitization for string inputs
  if (req.body.resumeText) {
    req.body.resumeText = req.body.resumeText.trim();
  }

  if (req.body.onetsoc_code) {
    req.body.onetsoc_code = req.body.onetsoc_code.trim();
  }

  next();
};

export {
  validateFileUpload,
  validateJobSelection,
  validateTextInput,
  sanitizeInput
};