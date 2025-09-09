const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const OpenAI = require('openai');

const db = getFirestore();

// Helper to check if a value has actual content (not empty)
function hasContent(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    // Check if object has at least one property with content
    return Object.keys(value).some(key => hasContent(value[key]));
  }
  return true;
}

// Attempt to parse incomplete JSON by intelligently adding closing brackets
function attemptPartialParse(jsonString) {
  try {
    // First, try to fix any incomplete strings by adding quotes
    let tentative = jsonString;
    
    // Check if we're in the middle of a string value
    const lastQuoteIndex = tentative.lastIndexOf('"');
    if (lastQuoteIndex > -1) {
      // Check if there's an odd number of quotes after the last colon
      const afterLastColon = tentative.substring(tentative.lastIndexOf(':') + 1);
      const quoteCount = (afterLastColon.match(/"/g) || []).length;
      if (quoteCount % 2 === 1) {
        // We're in the middle of a string, close it
        tentative += '"';
      }
    }
    
    // Count open brackets to determine what needs closing
    const openCurly = (tentative.match(/{/g) || []).length;
    const closeCurly = (tentative.match(/}/g) || []).length;
    const openSquare = (tentative.match(/\[/g) || []).length;
    const closeSquare = (tentative.match(/]/g) || []).length;
    
    // Add missing closing brackets
    for (let i = 0; i < openSquare - closeSquare; i++) {
      tentative += ']';
    }
    for (let i = 0; i < openCurly - closeCurly; i++) {
      tentative += '}';
    }
    
    return JSON.parse(tentative);
  } catch (e) {
    // Still not parseable
    return null;
  }
}

// Extract granular updates from partial JSON for streaming
function extractGranularUpdates(currentJson, previousState, streamCallback) {
  const updates = [];
  
  // Check for array fields (experience, education)
  ['experience', 'education'].forEach(field => {
    if (currentJson[field] && Array.isArray(currentJson[field])) {
      const prevLength = previousState[field]?.length || 0;
      const currLength = currentJson[field].length;
      
      // Send updates for new array items
      for (let i = prevLength; i < currLength; i++) {
        const item = currentJson[field][i];
        if (hasContent(item)) {
          updates.push({
            type: 'array_item_completed',
            field,
            index: i,
            value: item,
            itemCount: currLength
          });
        }
      }
    }
  });
  
  // Check for skills object with arrays
  if (currentJson.skills && typeof currentJson.skills === 'object') {
    const skillCategories = ['core_competencies', 'technical_skills', 'soft_skills', 'tools_equipment', 'certifications'];
    
    skillCategories.forEach(category => {
      if (currentJson.skills[category] && Array.isArray(currentJson.skills[category])) {
        const prevSkills = previousState.skills?.[category] || [];
        const currSkills = currentJson.skills[category];
        
        // Send updates for new skills in this category
        currSkills.forEach(skill => {
          if (!prevSkills.includes(skill) && skill && skill.trim()) {
            updates.push({
              type: 'skill_added',
              category,
              skill,
              totalInCategory: currSkills.length
            });
          }
        });
      }
    });
  }
  
  // Check for achievements object with arrays
  if (currentJson.achievements && typeof currentJson.achievements === 'object') {
    ['projects', 'publications', 'awards_honors', 'volunteer_work', 'professional_memberships'].forEach(field => {
      if (currentJson.achievements[field] && Array.isArray(currentJson.achievements[field])) {
        const prevLength = previousState.achievements?.[field]?.length || 0;
        const currLength = currentJson.achievements[field].length;
        
        for (let i = prevLength; i < currLength; i++) {
          const item = currentJson.achievements[field][i];
          if (hasContent(item)) {
            updates.push({
              type: 'achievement_added',
              category: field,
              index: i,
              value: item
            });
          }
        }
      }
    });
  }
  
  return updates;
}

function getSystemPrompt() {
  return `You are an expert resume parser that handles ALL professions - from software developers to carpenters, from nuclear physicists to artists. Extract structured data from the resume text and return it in JSON format.

IMPORTANT: The JSON structure must EXACTLY match this universal schema:

{
  "detected_profession": "string describing the person's primary profession",
  "personal_information": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "professional_links": {
      "portfolio": "string or null",
      "linkedin": "string or null",
      "github": "string or null",
      "website": "string or null",
      "other": ["array of other professional links"]
    }
  },
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "field_of_study": "string",
      "dates": "string",
      "gpa": "string or null"
    }
  ],
  "experience": [
    {
      "company": "string",
      "position": "string",
      "dates": "string",
      "responsibilities": ["array of responsibility strings"],
      "achievements": ["array of achievement strings"]
    }
  ],
  "skills": {
    "core_competencies": ["primary professional skills for their field"],
    "technical_skills": ["specialized/technical skills"],
    "soft_skills": ["interpersonal and general skills"],
    "tools_equipment": ["software, hardware, or physical tools used"],
    "certifications": ["professional certifications"],
    "languages": {
      "spoken": ["human languages with proficiency levels if mentioned"],
      "programming": ["programming languages - only for tech professionals"]
    }
  },
  "achievements": {
    "projects": ["work samples, builds, exhibitions, performances"],
    "publications": ["papers, articles, books, research"],
    "awards_honors": ["recognition, awards, honors like Eagle Scout"],
    "volunteer_work": ["community service, pro bono work"],
    "professional_memberships": ["associations, unions, guilds"]
  },
  "credentials": {
    "licenses": ["professional licenses (medical, contractor, pilot, etc.)"],
    "security_clearances": ["government or security clearances"],
    "work_authorization": {
      "status": "string or null",
      "details": "string or null"
    }
  },
  "summary": "professional summary text extracted or synthesized"
}

PARSING RULES:
1. Detect the person's profession from their job titles and experience
2. Adapt skill categorization based on profession:
   - For developers: programming languages go in languages.programming
   - For non-tech: "languages" means spoken languages only
   - For trades: tools_equipment includes physical tools (saws, drills, etc.)
   - For academics: emphasize publications and research in achievements
3. CRITICAL: Extract EVERY piece of information from the resume - nothing should be lost
   - If unsure where something belongs, place it in the most relevant category
   - Use the "summary" field to capture any context that doesn't fit elsewhere
   - Better to duplicate information than to lose it
4. Use null for missing strings, empty arrays for missing lists
5. Don't force tech-specific items (like GitHub) for non-tech professionals
6. Recognize diverse achievements (art exhibitions = projects, research papers = publications)
7. Before finalizing, review the original resume to ensure NO information was omitted
8. Return ONLY valid JSON without any markdown formatting`;
}

function validateStructure(data) {
  const requiredFields = [
    'detected_profession',
    'personal_information',
    'education',
    'experience',
    'skills',
    'achievements',
    'credentials',
    'summary'
  ];

  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate skills structure
  if (!data.skills || typeof data.skills !== 'object') {
    throw new Error('Skills must be an object');
  }

  const skillCategories = ['core_competencies', 'technical_skills', 'soft_skills', 'tools_equipment', 'certifications'];
  for (const category of skillCategories) {
    if (!Array.isArray(data.skills[category])) {
      data.skills[category] = [];
    }
  }

  // Validate languages structure
  if (!data.skills.languages || typeof data.skills.languages !== 'object') {
    data.skills.languages = { spoken: [], programming: [] };
  }

  // Ensure arrays are arrays
  const arrayFields = ['education', 'experience'];
  for (const field of arrayFields) {
    if (!Array.isArray(data[field])) {
      data[field] = [];
    }
  }

  // Validate achievements structure
  if (!data.achievements || typeof data.achievements !== 'object') {
    data.achievements = {
      projects: [],
      publications: [],
      awards_honors: [],
      volunteer_work: [],
      professional_memberships: []
    };
  }

  // Validate credentials structure
  if (!data.credentials || typeof data.credentials !== 'object') {
    data.credentials = {
      licenses: [],
      security_clearances: [],
      work_authorization: {}
    };
  }

  return true;
}

/**
 * Core resume parsing function with streaming support
 * @param {string} resumeText - The resume text to parse
 * @param {string} userId - The user ID
 * @param {string} fileName - The file name
 * @param {Object} metadata - Additional metadata (source, fileType, etc.)
 * @param {Function} streamCallback - Optional callback for streaming updates
 * @returns {Object} - Resume ID, structured data, and status
 */
async function parseResumeWithStreaming(resumeText, userId, fileName = 'Direct Input', metadata = {}, streamCallback = null) {
  // Create a unique parse ID for status tracking
  const parseRef = db.collection('resumes').doc();
  const resumeId = parseRef.id;
  
  try {

    // Check for required environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not configured');
    }
    if (!process.env.OPENAI_PARSING_MODEL) {
      throw new Error('OPENAI_PARSING_MODEL environment variable is not configured');
    }
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const systemPrompt = getSystemPrompt();
    
    // Log that processing is starting
    console.log('Starting resume parsing for:', fileName);

    // Use streaming with gpt-5-mini model (no temperature or max_tokens)
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_PARSING_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Parse this resume:\n\n${resumeText}` }
      ],
      response_format: { type: 'json_object' },
      stream: true
    });

    let fullContent = '';
    let currentObject = {};
    let previousState = {};
    let completedFields = [];
    let chunkCount = 0;
    let totalUpdates = 0;
    
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        chunkCount++;
        
        // Try to parse accumulated JSON and extract completed fields
        try {
          // Attempt to parse partial JSON by adding closing braces
          const tentativeJson = attemptPartialParse(fullContent);
          if (tentativeJson) {
            // First, check for newly completed top-level fields
            for (const [field, value] of Object.entries(tentativeJson)) {
              // For simple fields (not arrays/objects), send as before
              if (!currentObject[field] && hasContent(value) && 
                  field !== 'experience' && field !== 'education' && 
                  field !== 'skills' && field !== 'achievements' && field !== 'credentials') {
                currentObject[field] = value;
                completedFields.push(field);
                console.log(`Field completed: ${field}`);
                
                if (streamCallback) {
                  streamCallback({
                    type: 'field_completed',
                    field,
                    value,
                    progress: Math.min(10 + (totalUpdates * 2), 90),
                    completedFields
                  });
                  totalUpdates++;
                }
              }
            }
            
            // Extract granular updates for arrays and nested objects
            const granularUpdates = extractGranularUpdates(tentativeJson, previousState, streamCallback);
            
            // Send each granular update
            for (const update of granularUpdates) {
              if (streamCallback) {
                console.log(`Granular update: ${update.type} - ${update.field || update.category}`);
                streamCallback({
                  ...update,
                  progress: Math.min(10 + (totalUpdates * 2), 90),
                  completedFields
                });
                totalUpdates++;
              }
            }
            
            // Update previous state for next comparison
            previousState = JSON.parse(JSON.stringify(tentativeJson));
            
            // Mark complex fields as completed when they're fully done
            ['experience', 'education', 'skills', 'achievements', 'credentials'].forEach(field => {
              if (tentativeJson[field] && !currentObject[field] && hasContent(tentativeJson[field])) {
                currentObject[field] = tentativeJson[field];
                if (!completedFields.includes(field)) {
                  completedFields.push(field);
                }
              }
            });
          }
        } catch (e) {
          // Partial JSON not yet parseable, continue accumulating
        }
      }
    }

    // Parse final complete JSON
    const parsedData = JSON.parse(fullContent);
    
    // Validate the structure
    validateStructure(parsedData);
    
    // Save parsed resume to Firestore with consistent field names
    // Validate required metadata fields
    if (!metadata.source) {
      throw new Error('metadata.source is required');
    }
    
    const resumeData = {
      userId,
      fileName,
      fileType: metadata.fileType || 'text/plain', // Default for text input only
      fileSize: resumeText.length,
      extractedText: resumeText.substring(0, 5000), // Limit stored text
      structuredData: parsedData,
      processingStatus: 'completed',
      parsedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      aiModel: process.env.OPENAI_PARSING_MODEL,
      source: metadata.source,
      ...metadata // Include any additional metadata
    };

    // Remove duplicate fields from metadata if they exist
    delete resumeData.metadata;

    await parseRef.set(resumeData);
    
    // Log completion
    console.log('Resume parsing completed for:', fileName);

    return {
      resumeId,
      structuredData: parsedData,
      processingStatus: 'completed'
    };

  } catch (error) {
    console.error('Parse error:', error);
    
    // Log the error
    console.error('Parse error details:', error.message);

    // Update resume document if it was created
    if (parseRef) {
      await parseRef.update({
        processingStatus: 'failed',
        errorMessage: error.message,
        updatedAt: FieldValue.serverTimestamp()
      }).catch(() => {
        // Document might not exist yet, create it with error
        parseRef.set({
          userId,
          fileName,
          processingStatus: 'failed',
          errorMessage: error.message,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      });
    }
    
    throw error;
  }
}

module.exports = {
  parseResumeWithStreaming,
  validateStructure,
  getSystemPrompt
};