const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { HttpsError } = require('firebase-functions/v2/https');
const dimensionComparator = require('./services/dimensionComparator.js');
const { 
  calculateOverallScore, 
  calculateFitCategory, 
  generateScoreBreakdown,
  calculateImprovementImpact,
  calculateTimeToQualify 
} = require('./services/scoreCalculator.js');
const { 
  generateRecommendations, 
  analyzeGaps 
} = require('./services/gapAnalyzer.js');

const db = getFirestore();

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
    const dimensionScores = await analyzeDimensionsWithComparator(
      resumeData.structuredData,
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
    
    // Analyze gaps with prioritization
    const gaps = analyzeGaps(dimensionScores, occupationDimensions);
    
    // Generate recommendations with time estimates
    const recommendations = generateRecommendations(
      dimensionScores,
      gaps,
      occupationDimensions
    );
    
    // Calculate additional analytics
    const scoreBreakdown = generateScoreBreakdown(dimensionScores);
    const improvementImpact = calculateImprovementImpact(dimensionScores);
    const timeToQualify = calculateTimeToQualify(dimensionScores, gaps);

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
      
      // Add specific examples from matches and gaps
      const criticalGaps = gaps.critical || [];
      if (criticalGaps.length > 0 && criticalGaps[0].item) {
        strengthsAndGaps += `Specifically, gaining experience with ${criticalGaps[0].item} would have the highest impact on your candidacy.`;
      } else if (gaps.important && gaps.important.length > 0 && gaps.important[0].item) {
        strengthsAndGaps += `Building competency in ${gaps.important[0].item} would notably strengthen your profile.`;
      }
      
      // Path Forward
      let pathForward = '';
      if (timeToQualify.totalMonths === 0) {
        pathForward = `You're ready to apply now! Focus on tailoring your resume to highlight your strong alignment with the role requirements, particularly emphasizing your ${topStrengths[0] || 'relevant experience'}. In interviews, be prepared to discuss specific examples that demonstrate your qualifications.`;
      } else if (timeToQualify.totalMonths <= 6) {
        pathForward = `With approximately ${timeToQualify.totalMonths} months of focused development, you can become fully qualified for this role. Start with ${recommendations[0]?.actions?.[0]?.action || 'the high-priority recommendations'}, which will have the most immediate impact. Consider applying to similar roles now while continuing your development, as you're close enough to be considered with strong interview performance.`;
      } else if (timeToQualify.totalMonths <= 12) {
        pathForward = `Your qualification timeline of ${timeToQualify.totalMonths} months is very achievable with consistent effort. Begin by ${recommendations[0]?.actions?.[0]?.action || 'addressing the high-priority skill gaps'}, then progressively work through the medium-priority items. Consider seeking stretch assignments or projects in your current role that align with these development areas.`;
      } else {
        pathForward = `This role represents a longer-term career goal requiring approximately ${Math.round(timeToQualify.totalMonths / 12)} year${timeToQualify.totalMonths >= 24 ? 's' : ''} of development. Start by building a strong foundation in ${topGaps[0] || 'the core requirements'}, potentially through formal education or certifications. Consider intermediate roles that can serve as stepping stones while you build the necessary qualifications.`;
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
      gaps,
      recommendations,
      improvementImpact,
      timeToQualify,
      narrativeSummary, // Add narrative summary
      createdAt: FieldValue.serverTimestamp(),
      resumeFileName: resumeData.fileName,
      analysisVersion: '3.0', // Updated version
      analysisModel: process.env.OPENAI_ANALYSIS_MODEL || 'gpt-5',
      requestId: requestId || null // Store request ID for idempotency
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
      recommendations,
      timeToQualify: timeToQualify.qualificationLevel,
      narrativeSummary, // Add narrative summary to streaming
      progress: 100
    });

    return {
      analysisId,
      ...analysisData,
      createdAt: new Date() // Convert back for response
    };

  } catch (error) {
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to analyze resume');
  }
}

async function analyzeDimensionsWithComparator(resumeData, occupationDimensions, response, onFirstSuccess) {
  const dimensions = {};
  let firstSuccessTriggered = false;

  // Analyze tasks/experience match
  if (resumeData.experience && occupationDimensions.tasks) {
    response.sendChunk({
      type: 'dimension_started',
      dimension: 'tasks',
      progress: 20
    });
    
    try {
      const tasksAnalysis = await dimensionComparator.compareTasksFit(
        resumeData.experience,
        occupationDimensions.tasks
      );
      dimensions.tasks = tasksAnalysis;
      
      // Trigger first success callback
      if (!firstSuccessTriggered && onFirstSuccess) {
        await onFirstSuccess();
        firstSuccessTriggered = true;
      }
      
      response.sendChunk({
        type: 'dimension_completed',
        dimension: 'tasks',
        scores: tasksAnalysis,
        progress: 30
      });
    } catch (error) {
      dimensions.tasks = { score: 0, matches: [], gaps: [], error: error.message };
    }
  }

  // Analyze skills match
  if (resumeData.skills && occupationDimensions.skills) {
    response.sendChunk({
      type: 'dimension_started',
      dimension: 'skills',
      progress: 35
    });
    
    try {
      const skillsAnalysis = await dimensionComparator.compareSkillsFit(
        resumeData.skills,
        occupationDimensions.skills,
        occupationDimensions.technologySkills
      );
      dimensions.skills = skillsAnalysis;
      
      // Trigger first success callback
      if (!firstSuccessTriggered && onFirstSuccess) {
        await onFirstSuccess();
        firstSuccessTriggered = true;
      }
      
      response.sendChunk({
        type: 'dimension_completed',
        dimension: 'skills',
        scores: skillsAnalysis,
        progress: 40
      });
    } catch (error) {
      dimensions.skills = { score: 0, matches: [], gaps: [], error: error.message };
    }
  }

  // Analyze technology skills separately
  if (resumeData.skills && occupationDimensions.technologySkills) {
    response.sendChunk({
      type: 'dimension_started',
      dimension: 'technologySkills',
      progress: 45
    });
    
    try {
      const technologySkillsAnalysis = await dimensionComparator.compareTechnologySkillsFit(
        resumeData.skills,
        occupationDimensions.technologySkills
      );
      dimensions.technologySkills = technologySkillsAnalysis;
      
      // Trigger first success callback
      if (!firstSuccessTriggered && onFirstSuccess) {
        await onFirstSuccess();
        firstSuccessTriggered = true;
      }
      
      response.sendChunk({
        type: 'dimension_completed',
        dimension: 'technologySkills',
        scores: technologySkillsAnalysis,
        progress: 50
      });
    } catch (error) {
      dimensions.technologySkills = { score: 0, matches: [], gaps: [], error: error.message };
    }
  }

  // Analyze education requirements
  if (resumeData.education) {
    response.sendChunk({
      type: 'dimension_started',
      dimension: 'education',
      progress: 55
    });
    
    try {
      const educationAnalysis = await dimensionComparator.compareEducationFit(
        resumeData.education,
        occupationDimensions.education,
        null  // Remove job_zone from comparison
      );
      dimensions.education = educationAnalysis;
      
      // Trigger first success callback
      if (!firstSuccessTriggered && onFirstSuccess) {
        await onFirstSuccess();
        firstSuccessTriggered = true;
      }
      
      response.sendChunk({
        type: 'dimension_completed',
        dimension: 'education',
        scores: educationAnalysis,
        progress: 60
      });
    } catch (error) {
      dimensions.education = { score: 50, meetsRequirements: true, error: error.message };
    }
  }

  // Analyze work activities
  if (resumeData.experience && occupationDimensions.workActivities) {
    response.sendChunk({
      type: 'dimension_started',
      dimension: 'workActivities',
      progress: 65
    });
    
    try {
      const workActivitiesAnalysis = await dimensionComparator.compareWorkActivitiesFit(
        resumeData.experience,
        occupationDimensions.workActivities
      );
      dimensions.workActivities = workActivitiesAnalysis;
      
      // Trigger first success callback
      if (!firstSuccessTriggered && onFirstSuccess) {
        await onFirstSuccess();
        firstSuccessTriggered = true;
      }
      
      response.sendChunk({
        type: 'dimension_completed',
        dimension: 'workActivities',
        scores: workActivitiesAnalysis,
        progress: 70
      });
    } catch (error) {
      dimensions.workActivities = { score: 0, matches: [], gaps: [], error: error.message };
    }
  }

  // Analyze abilities
  if (occupationDimensions.abilities) {
    response.sendChunk({
      type: 'dimension_started',
      dimension: 'abilities',
      progress: 75
    });
    
    try {
      const abilitiesAnalysis = await dimensionComparator.compareAbilitiesFit(
        resumeData,
        occupationDimensions.abilities
      );
      dimensions.abilities = abilitiesAnalysis;
      
      // Trigger first success callback
      if (!firstSuccessTriggered && onFirstSuccess) {
        await onFirstSuccess();
        firstSuccessTriggered = true;
      }
      
      response.sendChunk({
        type: 'dimension_completed',
        dimension: 'abilities',
        scores: abilitiesAnalysis,
        progress: 80
      });
    } catch (error) {
      dimensions.abilities = { score: 0, matches: [], gaps: [], error: error.message };
    }
  }

  // Analyze knowledge areas
  if (occupationDimensions.knowledge) {
    response.sendChunk({
      type: 'dimension_started',
      dimension: 'knowledge',
      progress: 85
    });
    
    try {
      const knowledgeAnalysis = await dimensionComparator.compareKnowledgeFit(
        resumeData,
        occupationDimensions.knowledge
      );
      dimensions.knowledge = knowledgeAnalysis;
      
      // Trigger first success callback
      if (!firstSuccessTriggered && onFirstSuccess) {
        await onFirstSuccess();
        firstSuccessTriggered = true;
      }
      
      response.sendChunk({
        type: 'dimension_completed',
        dimension: 'knowledge',
        scores: knowledgeAnalysis,
        progress: 90
      });
    } catch (error) {
      dimensions.knowledge = { score: 0, matches: [], gaps: [], error: error.message };
    }
  }

  // Analyze tools
  if (occupationDimensions.tools) {
    response.sendChunk({
      type: 'dimension_started',
      dimension: 'tools',
      progress: 95
    });
    
    try {
      // Pass both skills and experience for better tool detection
      const toolsAnalysis = await dimensionComparator.compareToolsFit(
        resumeData.skills,
        occupationDimensions.tools,
        resumeData.experience
      );
      dimensions.tools = toolsAnalysis;
      
      // Trigger first success callback
      if (!firstSuccessTriggered && onFirstSuccess) {
        await onFirstSuccess();
        firstSuccessTriggered = true;
      }
      
      response.sendChunk({
        type: 'dimension_completed',
        dimension: 'tools',
        scores: toolsAnalysis,
        progress: 100
      });
    } catch (error) {
      dimensions.tools = { score: 0, matches: [], gaps: [], error: error.message };
    }
  }

  return dimensions;
}

// Old comparison functions have been replaced by dimensionComparator service
// The getFitCategory function is now handled by scoreCalculator.calculateFitCategory

module.exports = { analyzeResume };