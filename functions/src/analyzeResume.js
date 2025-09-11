const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { HttpsError } = require('firebase-functions/v2/https');
const dimensionComparator = require('./services/dimensionComparator.js');
const { 
  calculateOverallScore, 
  calculateFitCategory, 
  generateScoreBreakdown,
  calculateImprovementImpact,
  formatDimensionName
} = require('./services/scoreCalculator.js');

const db = getFirestore();

/**
 * Recursively removes empty objects, arrays, and null values from nested data
 * This reduces the size of data sent to AI analysis APIs
 * @param {any} obj - The object to clean
 * @returns {any} - The cleaned object, or null if empty
 */
function removeEmptyNested(obj) {
  // Handle null/undefined
  if (obj === null || obj === undefined) return null;
  
  // Handle arrays - filter out empty items
  if (Array.isArray(obj)) {
    const filtered = obj
      .map(item => removeEmptyNested(item))
      .filter(item => {
        if (item === null || item === undefined) return false;
        if (typeof item === 'string' && item.trim() === '') return false;
        if (Array.isArray(item) && item.length === 0) return false;
        if (typeof item === 'object' && Object.keys(item).length === 0) return false;
        return true;
      });
    return filtered.length > 0 ? filtered : null;
  }
  
  // Handle objects - remove empty properties
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = removeEmptyNested(value);
      
      // Only keep properties with meaningful values
      if (cleanedValue !== null && cleanedValue !== undefined) {
        // Skip empty strings, arrays, and objects
        if (typeof cleanedValue === 'string' && cleanedValue.trim() === '') continue;
        if (Array.isArray(cleanedValue) && cleanedValue.length === 0) continue;
        if (typeof cleanedValue === 'object' && Object.keys(cleanedValue).length === 0) continue;
        
        cleaned[key] = cleanedValue;
      }
    }
    return Object.keys(cleaned).length > 0 ? cleaned : null;
  }
  
  // Handle primitives (string, number, boolean)
  if (typeof obj === 'string') {
    return obj.trim() || null;
  }
  
  return obj;
}

async function analyzeResume(request, response) {
  // Extract data and auth from the v2 request object
  const { data, auth } = request;
  
  // Check authentication
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { resumeId, occupationCode, requestId } = data;
  const userId = auth.uid;

  if (!resumeId || !occupationCode) {
    throw new HttpsError('invalid-argument', 'Resume ID and occupation code are required');
  }

  // Check for idempotency - if this request was already processed
  if (requestId) {
    const existingAnalysis = await db.collection('analyses')
      .where('requestId', '==', requestId)
      .where('userId', '==', userId)
      .limit(1)
      .get();
    
    if (!existingAnalysis.empty) {
      const existing = existingAnalysis.docs[0];
      return {
        analysisId: existing.id,
        ...existing.data(),
        idempotent: true
      };
    }
  }

  // Don't create analysis document yet - wait for first success
  let analysisRef = null;
  let analysisId = null;
  let analysisCreated = false;
  
  try {
    // Verify user exists
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }

    // Get resume data
    const resumeDoc = await db.collection('resumes').doc(resumeId).get();
    if (!resumeDoc.exists) {
      throw new HttpsError('not-found', 'Resume not found');
    }
    
    const resumeData = resumeDoc.data();
    if (resumeData.userId !== userId) {
      throw new HttpsError('permission-denied', 'Access denied to this resume');
    }
    
    // Clean the resume data by removing empty nested objects/arrays
    // This reduces the payload size sent to AI analysis
    if (resumeData.structuredData) {
      const cleanedStructuredData = removeEmptyNested(resumeData.structuredData);
      // Create a cleaned copy for analysis while preserving original
      resumeData.structuredDataForAnalysis = cleanedStructuredData || {};
    }

    // Get occupation data
    const occupationDoc = await db.collection('occupations').doc(occupationCode).get();
    if (!occupationDoc.exists) {
      throw new HttpsError('not-found', 'Occupation not found');
    }
    
    const occupationData = occupationDoc.data();
    
    // Generate temporary analysis ID (will create document later)
    const tempAnalysisId = db.collection('analyses').doc().id;
    
    // Send initial streaming chunk with temporary ID
    response.sendChunk({
      type: 'analysis_started',
      analysisId: tempAnalysisId,
      resumeId,
      occupationCode,
      occupationTitle: occupationData.title,
      progress: 0
    });

    // Get related occupation dimensions - including tools now
    const [tasks, skills, abilities, knowledge, workActivities, tools, technologySkills, education, jobZone] = await Promise.all([
      db.collection('occupations').doc(occupationCode).collection('tasks').get(),
      db.collection('occupations').doc(occupationCode).collection('skills').get(),
      db.collection('occupations').doc(occupationCode).collection('abilities').get(),
      db.collection('occupations').doc(occupationCode).collection('knowledge').get(),
      db.collection('occupations').doc(occupationCode).collection('work_activities').get(),
      db.collection('occupations').doc(occupationCode).collection('tools_used').get(),
      db.collection('occupations').doc(occupationCode).collection('technology_skills').get(),
      db.collection('occupations').doc(occupationCode).collection('education').get(),
      db.collection('occupations').doc(occupationCode).collection('job_zone').get()
    ]);

    const occupationDimensions = {
      tasks: tasks.docs.map(doc => doc.data()),
      skills: skills.docs.map(doc => doc.data()),
      abilities: abilities.docs.map(doc => doc.data()),
      knowledge: knowledge.docs.map(doc => doc.data()),
      workActivities: workActivities.docs.map(doc => doc.data()),
      tools: tools.docs.map(doc => doc.data()),
      technologySkills: technologySkills.docs.map(doc => doc.data()),
      education: education.docs.map(doc => doc.data()),
      jobZone: jobZone.docs.length > 0 ? jobZone.docs[0].data() : null
    };

    // Note: OpenAI is now initialized in dimensionComparator service
    
    // Send processing started chunk
    response.sendChunk({
      type: 'processing_started',
      progress: 10
    });

    // Perform dimension analysis with streaming using new comparator
    // Use cleaned data for analysis to reduce API payload size
    const dimensionScores = await analyzeDimensionsWithComparator(
      resumeData.structuredDataForAnalysis || resumeData.structuredData,
      occupationDimensions,
      response,
      async () => {
        // Callback to create analysis document after first successful dimension
        if (!analysisCreated) {
          analysisRef = db.collection('analyses').doc(tempAnalysisId);
          analysisId = tempAnalysisId;
          analysisCreated = true;
        }
      }
    );

    // Calculate overall fit score with confidence weighting
    const overallFitScore = calculateOverallScore(dimensionScores);
    const fitCategoryDetails = calculateFitCategory(overallFitScore);
    
    // Calculate additional analytics
    const scoreBreakdown = generateScoreBreakdown(dimensionScores);
    const improvementImpact = calculateImprovementImpact(dimensionScores);

    // Generate narrative summary
    const generateNarrativeSummary = () => {
      const topStrengths = Object.entries(dimensionScores)
        .filter(([, data]) => data.score >= 70)
        .sort((a, b) => b[1].score - a[1].score)
        .slice(0, 2)
        .map(([dim]) => dim);
      
      const topGaps = Object.entries(dimensionScores)
        .filter(([, data]) => data.score < 50)
        .sort((a, b) => a[1].score - b[1].score)
        .slice(0, 2)
        .map(([dim]) => dim);
      
      // Where You Stand
      let whereYouStand = '';
      if (overallFitScore >= 85) {
        whereYouStand = `You're an exceptional match for the ${occupationData.title} role with a ${overallFitScore}% fit score. Your qualifications significantly exceed the requirements, positioning you as a highly competitive candidate who could make immediate contributions and potentially take on advanced responsibilities.`;
      } else if (overallFitScore >= 70) {
        whereYouStand = `You're a strong candidate for the ${occupationData.title} position with a ${overallFitScore}% fit score. Your profile aligns well with the core requirements, and you possess the foundational qualifications needed to succeed in this role with minimal ramp-up time.`;
      } else if (overallFitScore >= 50) {
        whereYouStand = `You show moderate alignment with the ${occupationData.title} role at ${overallFitScore}% fit. While you have relevant experience and skills that transfer to this position, there are key areas where additional development would strengthen your candidacy and ensure long-term success.`;
      } else {
        whereYouStand = `Your current profile shows ${overallFitScore}% alignment with the ${occupationData.title} role. This represents an aspirational career move that would require significant skill development and experience building. However, with focused effort and strategic planning, this goal is achievable.`;
      }
      
      // Key Strengths & Gaps
      let strengthsAndGaps = '';
      if (topStrengths.length > 0) {
        const strengthsList = topStrengths.map(s => {
          const score = dimensionScores[s].score;
          if (s === 'skills') return `technical skills (${score}% match)`;
          if (s === 'tasks') return `relevant experience (${score}% match)`;
          if (s === 'education') return `educational background (${score}% match)`;
          if (s === 'tools') return `software proficiency (${score}% match)`;
          if (s === 'knowledge') return `domain knowledge (${score}% match)`;
          if (s === 'workActivities') return `work activities (${score}% match)`;
          return `${s} (${score}% match)`;
        }).join(' and ');
        strengthsAndGaps = `Your strongest assets include ${strengthsList}, which directly align with what employers seek for this role. `;
      }
      
      if (topGaps.length > 0) {
        const gapsList = topGaps.map(g => {
          if (g === 'skills') return 'technical skills';
          if (g === 'tasks') return 'hands-on experience';
          if (g === 'education') return 'formal education';
          if (g === 'tools') return 'software tools';
          if (g === 'knowledge') return 'specialized knowledge';
          if (g === 'workActivities') return 'specific work activities';
          return g;
        }).join(' and ');
        
        if (strengthsAndGaps) {
          strengthsAndGaps += `However, focusing on ${gapsList} will be crucial for closing the qualification gap. `;
        } else {
          strengthsAndGaps += `The primary areas for development include ${gapsList}. Addressing these gaps will significantly improve your qualification level. `;
        }
      }
      
      // Add specific examples from dimension gaps
      const lowestScoringDimension = Object.entries(dimensionScores)
        .sort((a, b) => a[1].score - b[1].score)[0];
      if (lowestScoringDimension && lowestScoringDimension[1].gaps && lowestScoringDimension[1].gaps.length > 0) {
        const topGap = lowestScoringDimension[0];
        strengthsAndGaps += `Specifically, gaining experience with O*NET's suggested ${formatDimensionName(topGap)} would have the highest impact on your candidacy.`;
      }
      
      // Path Forward
      let pathForward = '';
      if (overallFitScore >= 80) {
        pathForward = `You're ready to apply now! Focus on tailoring your resume to highlight your strong alignment with the role requirements, particularly emphasizing your ${topStrengths[0] || 'relevant experience'}. In interviews, be prepared to discuss specific examples that demonstrate your qualifications.`;
      } else if (overallFitScore >= 60) {
        pathForward = `You're a competitive candidate for this role. Focus on strengthening your ${topGaps[0] || 'weaker areas'} to improve your qualification. Consider applying to similar roles now while continuing your development, as you're close enough to be considered with strong interview performance.`;
      } else if (overallFitScore >= 40) {
        pathForward = `Your qualification is achievable with consistent effort. Begin by addressing gaps in ${topGaps[0] || 'the core requirements'}, then progressively strengthen other areas. Consider seeking stretch assignments or projects in your current role that align with these development areas.`;
      } else {
        pathForward = `This role represents a longer-term career goal. Start by building a strong foundation in ${topGaps[0] || 'the core requirements'}, potentially through formal education or certifications. Consider intermediate roles that can serve as stepping stones while you build the necessary qualifications.`;
      }
      
      return {
        whereYouStand,
        strengthsAndGaps,
        pathForward
      };
    };
    
    const narrativeSummary = generateNarrativeSummary();

    // Create enhanced analysis document
    const analysisData = {
      resumeId,
      userId,
      occupationCode,
      occupationTitle: occupationData.title,
      overallFitScore,
      fitCategory: fitCategoryDetails.category,
      fitCategoryDetails,
      dimensionScores,
      scoreBreakdown,
      improvementImpact,
      narrativeSummary, 
      createdAt: FieldValue.serverTimestamp(),
      resumeFileName: resumeData.fileName,
      analysisVersion: '3.1', 
      analysisModel: process.env.OPENAI_ANALYSIS_MODEL,
      requestId: requestId || null 
    };

    // Only save analysis if document was created (at least one dimension succeeded)
    if (analysisCreated && analysisRef) {
      await analysisRef.set(analysisData);
    } else {
      // No dimensions succeeded, throw error
      throw new Error('Analysis failed - no dimensions could be analyzed');
    }
    
    // Send completion chunk with enhanced data
    response.sendChunk({
      type: 'analysis_completed',
      analysisId,
      overallFitScore,
      fitCategory: fitCategoryDetails.category,
      fitCategoryDescription: fitCategoryDetails.description,
      narrativeSummary, 
      progress: 100
    });

    return {
      analysisId,
      ...analysisData,
      createdAt: new Date() // Convert back for response
    };

  } catch (error) {
    console.error('Error in analyzeResume:', error);
    console.error('Error stack:', error.stack);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to analyze resume');
  }
}

async function analyzeDimensionsWithComparator(resumeData, occupationDimensions, response, onFirstSuccess) {
  const dimensions = {};
  let firstSuccessTriggered = false;

  // Debug logging to understand the data structure
  console.log('analyzeDimensionsWithComparator received resumeData with keys:', Object.keys(resumeData || {}));
  console.log('resumeData.experience exists?', !!resumeData?.experience);
  console.log('resumeData.skills exists?', !!resumeData?.skills);
  console.log('First 200 chars of resumeData:', JSON.stringify(resumeData).substring(0, 200));

  // Prepare all dimension analysis tasks
  const dimensionTasks = [];

  // Tasks/experience analysis
  if (occupationDimensions.tasks && occupationDimensions.tasks.length > 0) {
    dimensionTasks.push({
      name: 'tasks',
      startProgress: 20,
      endProgress: 30,
      promise: dimensionComparator.compareTasksFit(resumeData, occupationDimensions.tasks)
    });
  }

  // Skills analysis
  if (occupationDimensions.skills && occupationDimensions.skills.length > 0) {
    dimensionTasks.push({
      name: 'skills',
      startProgress: 35,
      endProgress: 40,
      promise: dimensionComparator.compareSkillsFit(
        resumeData,
        occupationDimensions.skills,
        occupationDimensions.technologySkills
      )
    });
  }

  // Technology skills analysis
  if (occupationDimensions.technologySkills && occupationDimensions.technologySkills.length > 0) {
    dimensionTasks.push({
      name: 'technologySkills',
      startProgress: 45,
      endProgress: 50,
      promise: dimensionComparator.compareTechnologySkillsFit(
        resumeData,
        occupationDimensions.technologySkills
      )
    });
  }

  // Education analysis
  if ((occupationDimensions.education && occupationDimensions.education.length > 0) || occupationDimensions.jobZone) {
    dimensionTasks.push({
      name: 'education',
      startProgress: 55,
      endProgress: 60,
      promise: dimensionComparator.compareEducationFit(
        resumeData,
        occupationDimensions.education,
        occupationDimensions.jobZone
      )
    });
  }

  // Work activities analysis
  if (occupationDimensions.workActivities && occupationDimensions.workActivities.length > 0) {
    dimensionTasks.push({
      name: 'workActivities',
      startProgress: 65,
      endProgress: 70,
      promise: dimensionComparator.compareWorkActivitiesFit(
        resumeData,
        occupationDimensions.workActivities
      )
    });
  }

  // Abilities analysis
  if (occupationDimensions.abilities && occupationDimensions.abilities.length > 0) {
    dimensionTasks.push({
      name: 'abilities',
      startProgress: 75,
      endProgress: 80,
      promise: dimensionComparator.compareAbilitiesFit(
        resumeData,
        occupationDimensions.abilities
      )
    });
  }

  // Knowledge analysis
  if (occupationDimensions.knowledge && occupationDimensions.knowledge.length > 0) {
    dimensionTasks.push({
      name: 'knowledge',
      startProgress: 85,
      endProgress: 90,
      promise: dimensionComparator.compareKnowledgeFit(
        resumeData,
        occupationDimensions.knowledge
      )
    });
  }

  // Tools analysis
  if (occupationDimensions.tools && occupationDimensions.tools.length > 0) {
    dimensionTasks.push({
      name: 'tools',
      startProgress: 95,
      endProgress: 100,
      promise: dimensionComparator.compareToolsFit(
        resumeData,
        occupationDimensions.tools
      )
    });
  }

  // Send start notifications for all dimensions
  dimensionTasks.forEach(task => {
    response.sendChunk({
      type: 'dimension_started',
      dimension: task.name,
      progress: task.startProgress
    });
  });

  // Track completion
  let completedCount = 0;
  const totalTasks = dimensionTasks.length;

  // Create a promise that resolves when all tasks are done
  return new Promise((resolve) => {
    // Process each dimension as it completes
    dimensionTasks.forEach(task => {
      task.promise
        .then(result => {
          // Success case
          dimensions[task.name] = result;
          
          // Trigger first success callback
          if (!firstSuccessTriggered && onFirstSuccess) {
            onFirstSuccess().catch(err => console.error('Error in onFirstSuccess:', err));
            firstSuccessTriggered = true;
          }
          
          // Send completion chunk immediately
          response.sendChunk({
            type: 'dimension_completed',
            dimension: task.name,
            scores: result,
            progress: task.endProgress
          });
        })
        .catch(error => {
          // Error case
          console.error(`Error analyzing ${task.name}:`, error);
          dimensions[task.name] = { 
            score: 0, 
            matches: [], 
            gaps: [], 
            error: error?.message || 'Unknown error' 
          };
          
          // Send completion chunk even for errors
          response.sendChunk({
            type: 'dimension_completed',
            dimension: task.name,
            scores: dimensions[task.name],
            progress: task.endProgress
          });
        })
        .finally(() => {
          // Track completion
          completedCount++;
          if (completedCount === totalTasks) {
            // All tasks done, resolve with dimensions
            resolve(dimensions);
          }
        });
    });
  });
}

// Old comparison functions have been replaced by dimensionComparator service
// The getFitCategory function is now handled by scoreCalculator.calculateFitCategory

module.exports = { analyzeResume };