function calculateFitScore(dimensionScores) {
  // Weight different dimensions
  const weights = {
    skills: 0.30,
    experience: 0.25,
    education: 0.15,
    abilities: 0.15,
    knowledge: 0.15
  };

  let totalScore = 0;
  let totalWeight = 0;

  for (const [dimension, weight] of Object.entries(weights)) {
    if (dimensionScores[dimension]) {
      totalScore += (dimensionScores[dimension].score || 0) * weight;
      totalWeight += weight;
    }
  }

  // Normalize if not all dimensions present
  if (totalWeight > 0) {
    return Math.round((totalScore / totalWeight));
  }

  return 0;
}

function calculateDimensionScore(matches, total, importance = 1) {
  if (total === 0) return 0;
  
  const baseScore = (matches / total) * 100;
  return Math.round(baseScore * importance);
}

function categorizeScore(score) {
  if (score >= 85) return { level: 'excellent', color: '#10b981' };
  if (score >= 70) return { level: 'strong', color: '#3b82f6' };
  if (score >= 55) return { level: 'good', color: '#8b5cf6' };
  if (score >= 40) return { level: 'moderate', color: '#f59e0b' };
  return { level: 'developing', color: '#ef4444' };
}

module.exports = {
  calculateFitScore,
  calculateDimensionScore,
  categorizeScore
};