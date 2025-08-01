import ResumeProcessingService from '../services/ResumeProcessingService.js';
import JobAnalysisService from '../services/JobAnalysisService.js';
import AIAnalysisService from '../services/AIAnalysisService.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const openAiController = {};

openAiController.analyzeContent = asyncHandler(async (req, res, next) => {
  const yamlResume = typeof res.locals.yamlResume === 'string' 
    ? JSON.parse(res.locals.yamlResume) 
    : res.locals.yamlResume;
  const jobQueryData = res.locals.jobQuery;
  
  console.log('✅ Processing resume analysis');

  try {
    // Parse resume and job data using services
    const resumeData = ResumeProcessingService.parseResumeData(yamlResume);
    const jobData = JobAnalysisService.parseJobData(jobQueryData);

    // Build comparison sections
    const comparisonSections = JobAnalysisService.buildComparisonSections(resumeData, jobData);

    // Analyze all sections using AI service
    const analysisResults = await AIAnalysisService.analyzeAllSections(comparisonSections);

    // Format response for client
    const formattedResults = Object.entries(analysisResults).map(([section, feedback], index) => ({
      id: index + 1,
      category: section.replace(/([A-Z])/g, ' $1').trim(),
      score: feedback.score,
      body: feedback.body
    }));

    res.json({
      success: true,
      analysis: formattedResults,
      metadata: {
        totalSections: formattedResults.length,
        averageScore: Math.round(formattedResults.reduce((sum, item) => sum + item.score, 0) / formattedResults.length),
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in analyzeContent:', error);
    return next(error);
  }
});

export default openAiController.analyzeContent;
