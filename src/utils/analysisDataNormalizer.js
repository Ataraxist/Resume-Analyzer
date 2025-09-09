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