const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { HttpsError } = require('firebase-functions/v2/https');
const OpenAI = require('openai');
const { calculateFitScore } = require('./services/scoreCalculator.js');
const { generateRecommendations } = require('./services/gapAnalyzer.js');

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
      console.log(`Idempotent request detected: ${requestId}, returning existing analysis ${existing.id}`);
      return {
        analysisId: existing.id,
        ...existing.data(),
        idempotent: true
      };
    }
  }

  // Create a unique analysis ID upfront
  const analysisRef = db.collection('analyses').doc();
  const analysisId = analysisRef.id;
  
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
    
    // Send initial streaming chunk
    response.sendChunk({
      type: 'analysis_started',
      analysisId,
      resumeId,
      occupationCode,
      occupationTitle: occupationData.title,
      progress: 0
    });

    // Get related occupation dimensions
    const [tasks, skills, abilities, knowledge, workActivities] = await Promise.all([
      db.collection('occupations').doc(occupationCode).collection('tasks').get(),
      db.collection('occupations').doc(occupationCode).collection('skills').get(),
      db.collection('occupations').doc(occupationCode).collection('abilities').get(),
      db.collection('occupations').doc(occupationCode).collection('knowledge').get(),
      db.collection('occupations').doc(occupationCode).collection('work_activities').get()
    ]);

    const occupationDimensions = {
      tasks: tasks.docs.map(doc => doc.data()),
      skills: skills.docs.map(doc => doc.data()),
      abilities: abilities.docs.map(doc => doc.data()),
      knowledge: knowledge.docs.map(doc => doc.data()),
      workActivities: workActivities.docs.map(doc => doc.data())
    };

    // Initialize OpenAI for dimension comparison
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Send processing started chunk
    response.sendChunk({
      type: 'processing_started',
      progress: 10
    });

    // Perform dimension analysis with streaming
    const dimensionScores = await analyzeDimensions(
      resumeData.structuredData,
      occupationDimensions,
      openai,
      response
    );

    // Calculate overall fit score
    const overallFitScore = calculateFitScore(dimensionScores);
    
    // Generate recommendations
    const recommendations = generateRecommendations(
      dimensionScores,
      occupationDimensions,
      resumeData.structuredData
    );

    // Create analysis document
    const analysisData = {
      resumeId,
      userId,
      occupationCode,
      occupationTitle: occupationData.title,
      overallFitScore,
      dimensionScores,
      recommendations,
      fitCategory: getFitCategory(overallFitScore),
      createdAt: FieldValue.serverTimestamp(),
      resumeFileName: resumeData.fileName,
      analysisVersion: '2.0',
      requestId: requestId || null // Store request ID for idempotency
    };

    // Save analysis
    await analysisRef.set(analysisData);
    console.log(`Analysis completed for user ${userId}, analysis ${analysisId}`);
    
    // Send completion chunk
    response.sendChunk({
      type: 'analysis_completed',
      analysisId,
      overallFitScore,
      fitCategory: getFitCategory(overallFitScore),
      recommendations,
      progress: 100
    });

    return {
      analysisId,
      ...analysisData,
      createdAt: new Date() // Convert back for response
    };

  } catch (error) {
    console.error('Analysis error:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to analyze resume');
  }
}

async function analyzeDimensions(resumeData, occupationDimensions, openai, response) {
  const dimensions = {
    skills: { score: 0, matches: [], gaps: [] },
    experience: { score: 0, matches: [], gaps: [] },
    education: { score: 0, matches: [], gaps: [] },
    abilities: { score: 0, matches: [], gaps: [] },
    knowledge: { score: 0, matches: [], gaps: [] }
  };
  
  let completedDimensions = [];
  let progress = 10;

  // Analyze skills match
  if (resumeData.skills && occupationDimensions.skills) {
    response.sendChunk({
      type: 'dimension_started',
      dimension: 'skills',
      progress: 20
    });
    
    const skillsAnalysis = await compareSkills(
      resumeData.skills,
      occupationDimensions.skills,
      openai
    );
    dimensions.skills = skillsAnalysis;
    completedDimensions.push('skills');
    
    response.sendChunk({
      type: 'dimension_completed',
      dimension: 'skills',
      scores: skillsAnalysis,
      progress: 35
    });
  }

  // Analyze experience relevance
  if (resumeData.experience && occupationDimensions.tasks) {
    response.sendChunk({
      type: 'dimension_started',
      dimension: 'experience',
      progress: 40
    });
    
    const experienceAnalysis = await compareExperience(
      resumeData.experience,
      occupationDimensions.tasks,
      openai
    );
    dimensions.experience = experienceAnalysis;
    completedDimensions.push('experience');
    
    response.sendChunk({
      type: 'dimension_completed',
      dimension: 'experience',
      scores: experienceAnalysis,
      progress: 55
    });
  }

  // Analyze education requirements
  if (resumeData.education) {
    response.sendChunk({
      type: 'dimension_started',
      dimension: 'education',
      progress: 60
    });
    
    dimensions.education = analyzeEducation(
      resumeData.education,
      occupationDimensions
    );
    completedDimensions.push('education');
    
    response.sendChunk({
      type: 'dimension_completed',
      dimension: 'education',
      scores: dimensions.education,
      progress: 70
    });
  }

  // Analyze abilities
  if (occupationDimensions.abilities) {
    response.sendChunk({
      type: 'dimension_started',
      dimension: 'abilities',
      progress: 75
    });
    
    dimensions.abilities = await compareAbilities(
      resumeData,
      occupationDimensions.abilities,
      openai
    );
    completedDimensions.push('abilities');
    
    response.sendChunk({
      type: 'dimension_completed',
      dimension: 'abilities',
      scores: dimensions.abilities,
      progress: 85
    });
  }

  // Analyze knowledge areas
  if (resumeData.skills && occupationDimensions.knowledge) {
    response.sendChunk({
      type: 'dimension_started',
      dimension: 'knowledge',
      progress: 90
    });
    
    dimensions.knowledge = await compareKnowledge(
      resumeData,
      occupationDimensions.knowledge,
      openai
    );
    completedDimensions.push('knowledge');
    
    response.sendChunk({
      type: 'dimension_completed',
      dimension: 'knowledge',
      scores: dimensions.knowledge,
      progress: 95
    });
  }

  return dimensions;
}

async function compareSkills(resumeSkills, occupationSkills, openai) {
  const importantSkills = occupationSkills
    .filter(s => s.importance_level === 'Core' || s.importance_score >= 3.5)
    .slice(0, 10);

  const prompt = `Compare these resume skills with required occupation skills.
Resume skills: ${JSON.stringify(resumeSkills)}
Required skills: ${JSON.stringify(importantSkills.map(s => s.skill_name))}

Return a JSON object with:
- score (0-100)
- matches (array of matched skills)
- gaps (array of missing critical skills)`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Skills comparison error:', error);
    return { score: 0, matches: [], gaps: [] };
  }
}

async function compareExperience(experience, tasks, openai) {
  const topTasks = tasks
    .filter(t => t.importance_score >= 3.5)
    .slice(0, 10);

  const prompt = `Analyze how well this work experience matches the required tasks.
Experience: ${JSON.stringify(experience)}
Required tasks: ${JSON.stringify(topTasks.map(t => t.task))}

Return a JSON object with:
- score (0-100)
- matches (array of relevant experience points)
- gaps (array of missing experience areas)`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Experience comparison error:', error);
    return { score: 0, matches: [], gaps: [] };
  }
}

function analyzeEducation(resumeEducation, _occupationDimensions) {
  // Simple education scoring based on level
  const _educationLevels = {
    'high school': 1,
    'associate': 2,
    'bachelor': 3,
    'master': 4,
    'doctorate': 5
  };

  let score = 50; // Base score
  const matches = [];
  const gaps = [];

  if (resumeEducation && resumeEducation.length > 0) {
    const highestDegree = resumeEducation[0].degree?.toLowerCase() || '';
    
    if (highestDegree.includes('bachelor')) score = 70;
    if (highestDegree.includes('master')) score = 85;
    if (highestDegree.includes('doctorate') || highestDegree.includes('phd')) score = 95;
    
    matches.push(`${resumeEducation[0].degree} from ${resumeEducation[0].institution}`);
  }

  return { score, matches, gaps };
}

async function compareAbilities(resumeData, abilities, openai) {
  const topAbilities = abilities
    .filter(a => a.importance_score >= 3.5)
    .slice(0, 8);

  const prompt = `Based on this resume, evaluate the candidate's abilities.
Resume: ${JSON.stringify(resumeData)}
Required abilities: ${JSON.stringify(topAbilities.map(a => a.ability_name))}

Return a JSON object with:
- score (0-100)
- matches (array of demonstrated abilities)
- gaps (array of missing abilities)`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Abilities comparison error:', error);
    return { score: 0, matches: [], gaps: [] };
  }
}

async function compareKnowledge(resumeData, knowledge, openai) {
  const topKnowledge = knowledge
    .filter(k => k.importance_score >= 3.5)
    .slice(0, 8);

  const prompt = `Evaluate the candidate's knowledge areas based on their resume.
Resume: ${JSON.stringify(resumeData)}
Required knowledge: ${JSON.stringify(topKnowledge.map(k => k.knowledge_area))}

Return a JSON object with:
- score (0-100)
- matches (array of demonstrated knowledge areas)
- gaps (array of missing knowledge areas)`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Knowledge comparison error:', error);
    return { score: 0, matches: [], gaps: [] };
  }
}

function getFitCategory(score) {
  if (score >= 85) return 'Excellent Match';
  if (score >= 70) return 'Strong Match';
  if (score >= 55) return 'Good Match';
  if (score >= 40) return 'Moderate Match';
  return 'Developing Match';
}

module.exports = { analyzeResume };