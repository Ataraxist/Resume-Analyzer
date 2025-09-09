function generateRecommendations(dimensionScores, _occupationDimensions, _resumeData) {
  const recommendations = {
    immediate: [],
    shortTerm: [],
    longTerm: []
  };

  // Analyze skill gaps
  if (dimensionScores.skills && dimensionScores.skills.gaps.length > 0) {
    const topGaps = dimensionScores.skills.gaps.slice(0, 3);
    topGaps.forEach(gap => {
      recommendations.immediate.push({
        type: 'skill',
        title: `Develop ${gap}`,
        description: `This is a critical skill for the role. Consider online courses or certifications.`,
        impact: 'high',
        timeframe: '1-3 months'
      });
    });
  }

  // Analyze experience gaps
  if (dimensionScores.experience && dimensionScores.experience.score < 60) {
    recommendations.shortTerm.push({
      type: 'experience',
      title: 'Gain relevant experience',
      description: 'Look for projects or volunteer opportunities that align with the role responsibilities.',
      impact: 'high',
      timeframe: '3-6 months'
    });
  }

  // Analyze education requirements
  if (dimensionScores.education && dimensionScores.education.score < 50) {
    recommendations.longTerm.push({
      type: 'education',
      title: 'Consider additional education',
      description: 'This role typically requires advanced education. Consider relevant certifications or degrees.',
      impact: 'medium',
      timeframe: '6-24 months'
    });
  }

  // Add general recommendations based on overall score
  const overallScore = calculateOverallScore(dimensionScores);
  
  if (overallScore < 70) {
    recommendations.immediate.push({
      type: 'resume',
      title: 'Optimize your resume',
      description: 'Tailor your resume to better highlight relevant skills and experiences for this role.',
      impact: 'medium',
      timeframe: 'Immediate'
    });
  }

  if (overallScore >= 70) {
    recommendations.immediate.push({
      type: 'application',
      title: 'Ready to apply',
      description: 'Your profile shows strong alignment with this role. Consider applying with a tailored cover letter.',
      impact: 'high',
      timeframe: 'Immediate'
    });
  }

  return recommendations;
}

function calculateOverallScore(dimensionScores) {
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

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

function identifyTopGaps(dimensionScores, limit = 5) {
  const allGaps = [];

  // Collect all gaps from all dimensions
  Object.entries(dimensionScores).forEach(([dimension, data]) => {
    if (data.gaps && Array.isArray(data.gaps)) {
      data.gaps.forEach(gap => {
        allGaps.push({
          dimension,
          gap,
          score: data.score || 0
        });
      });
    }
  });

  // Sort by dimension score (lower score = higher priority)
  allGaps.sort((a, b) => a.score - b.score);

  return allGaps.slice(0, limit);
}

function calculateImprovementPotential(dimensionScores) {
  const improvements = {};

  Object.entries(dimensionScores).forEach(([dimension, data]) => {
    const currentScore = data.score || 0;
    const potential = 100 - currentScore;
    
    improvements[dimension] = {
      current: currentScore,
      potential: potential,
      impact: potential > 30 ? 'high' : potential > 15 ? 'medium' : 'low'
    };
  });

  return improvements;
}

module.exports = {
  generateRecommendations,
  identifyTopGaps,
  calculateImprovementPotential
};