/**
 * Normalizes analysis data to ensure consistent structure
 * Handles both old format (dimension scores as numbers) and new format (dimension scores as objects)
 */

/**
 * Normalizes a single dimension score to ensure it's an object with score, matches, and gaps
 * @param {number|Object} value - The dimension score (either number or object)
 * @returns {Object} Normalized dimension object with score, matches, and gaps
 */
export const normalizeDimensionScore = (value) => {
  if (typeof value === 'number') {
    // Old format: just a number
    return {
      score: value,
      matches: [],
      gaps: []
    };
  } else if (typeof value === 'object' && value !== null) {
    // New format: already an object, ensure all properties exist
    return {
      score: value.score || 0,
      matches: value.matches || [],
      gaps: value.gaps || []
    };
  }
  // Invalid format, return default
  return {
    score: 0,
    matches: [],
    gaps: []
  };
};

/**
 * Normalizes the entire analysis data structure
 * @param {Object} data - The analysis data to normalize
 * @returns {Object} Normalized analysis data
 */
export const normalizeAnalysisData = (data) => {
  if (!data) return null;
  
  // Create a shallow copy to avoid mutating original
  const normalized = { ...data };
  
  // Normalize dimension scores if they exist
  if (data.dimensionScores) {
    normalized.dimensionScores = {};
    
    Object.entries(data.dimensionScores).forEach(([key, value]) => {
      normalized.dimensionScores[key] = normalizeDimensionScore(value);
    });
  }
  
  // Ensure recommendations is always an array
  normalized.recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
  
  return normalized;
};

/**
 * Extracts just the numeric scores from dimension data
 * Useful for components that only need the score values
 * @param {Object} dimensionScores - The dimension scores object
 * @returns {Object} Object with dimension names as keys and numeric scores as values
 */
export const extractNumericScores = (dimensionScores) => {
  if (!dimensionScores) return {};
  
  const scores = {};
  Object.entries(dimensionScores).forEach(([key, value]) => {
    const normalized = normalizeDimensionScore(value);
    scores[key] = normalized.score;
  });
  
  return scores;
};

/**
 * Calculates the overall score from dimension scores
 * Handles both old and new formats
 * @param {Object} dimensionScores - The dimension scores object
 * @returns {number} The calculated overall score
 */
export const calculateOverallScore = (dimensionScores) => {
  if (!dimensionScores || Object.keys(dimensionScores).length === 0) {
    return 0;
  }
  
  const scores = Object.values(dimensionScores).map(value => {
    const normalized = normalizeDimensionScore(value);
    return normalized.score;
  });
  
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / scores.length);
};

/**
 * Dimension weights for calculating improvement impact
 * Based on backend scoreCalculator.js weights
 */
const DIMENSION_WEIGHTS = {
  tasks: 0.25,
  skills: 0.20,
  education: 0.15,
  workActivities: 0.10,
  knowledge: 0.10,
  technologySkills: 0.10,
  tools: 0.05,
  abilities: 0.05
};

/**
 * Calculates priority level based on score and weight
 * @param {number} score - Current dimension score
 * @param {number} weight - Dimension weight
 * @returns {string} Priority level: 'high', 'medium', or 'low'
 */
const calculatePriority = (score, weight) => {
  const gap = 100 - score;
  const priority = gap * weight;
  
  if (priority > 15) return 'high';
  if (priority > 8) return 'medium';
  return 'low';
};

/**
 * Calculates improvement impact for each dimension
 * This mirrors the backend calculateImprovementImpact function
 * @param {Object} dimensionScores - The dimension scores object
 * @returns {Array} Array of improvement recommendations sorted by impact
 */
export const calculateImprovementImpact = (dimensionScores) => {
  if (!dimensionScores || Object.keys(dimensionScores).length === 0) {
    return [];
  }
  
  const improvements = [];
  
  // Process each dimension
  Object.entries(dimensionScores).forEach(([dimension, data]) => {
    const normalized = normalizeDimensionScore(data);
    const currentWeight = DIMENSION_WEIGHTS[dimension] || 0.10;
    
    if (normalized.score < 80) {
      // Calculate improvement potential for dimensions below target
      const currentContribution = (normalized.score / 100) * currentWeight;
      const potentialContribution = 0.8 * currentWeight; // Target is 80%
      const impact = potentialContribution - currentContribution;
      
      improvements.push({
        dimension,
        currentScore: normalized.score,
        targetScore: 80,
        potentialImpact: Math.round(impact * 100),
        priority: calculatePriority(normalized.score, currentWeight)
      });
    } else {
      // Include dimensions already at or above target
      improvements.push({
        dimension,
        currentScore: normalized.score,
        targetScore: 80,
        potentialImpact: 0,
        priority: 'achieved'
      });
    }
  });
  
  // Sort by potential impact (highest first)
  return improvements.sort((a, b) => b.potentialImpact - a.potentialImpact);
};