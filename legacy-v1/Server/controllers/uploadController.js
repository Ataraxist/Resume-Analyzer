import yaml from 'js-yaml';
import ResumeProcessingService from '../services/ResumeProcessingService.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';

const uploadController = {};

uploadController.processUpload = asyncHandler(async (req, res, next) => {
  console.log('👓 Processing File Upload!');
  
  const { buffer, mimetype } = req.file;
  const { resumeText } = req.body;

  try {
    let processedData;

    // Handle file upload
    if (buffer && mimetype) {
      processedData = await ResumeProcessingService.processResumeFile(buffer, mimetype);
    } 
    // Handle text input
    else if (resumeText) {
      const yamlData = await ResumeProcessingService.processResumeText(resumeText);
      processedData = {
        yamlData,
        yamlString: yaml.dump(yamlData),
        extractedText: resumeText
      };
    } 
    else {
      throw new AppError('No file or text provided for processing.', 400);
    }

    res.locals.yamlResume = processedData.yamlData;
    res.locals.extractedText = processedData.extractedText;
    
    return next();

  } catch (error) {
    console.error("❌ Error in processUpload:", error);
    return next(error);
  } 
});

export default uploadController;

