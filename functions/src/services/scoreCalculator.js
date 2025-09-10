class ScoreCalculator {
    constructor() {
        this.dimensionWeights = {
            tasks: 0.20,           // Core work responsibilities
            skills: 0.20,          // Core competencies  
            technologySkills: 0.15, // Technical proficiencies
            education: 0.10,       // Academic qualifications
            tools: 0.10,           // Software/hardware proficiency
            workActivities: 0.10,  // Day-to-day activities
            abilities: 0.10,       // Cognitive/interpersonal abilities
            knowledge: 0.05        // Domain expertise
            // Total: 1.00
        };
    }

    calculateOverallScore(dimensionScores) {
        let weightedSum = 0;
        let totalWeight = 0;

        Object.entries(dimensionScores).forEach(([dimension, data]) => {
            const weight = this.getDimensionWeight(dimension);
            // Use raw score without confidence adjustment
            weightedSum += data.score * weight;
            totalWeight += weight;
        });

        const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
        return Math.round(overallScore * 10) / 10;
    }

    getDimensionWeight(dimension) {
        // Return the weight for the dimension
        return this.dimensionWeights[dimension];
    }

    calculateFitCategory(overallScore) {
        if (overallScore >= 85) {
            return {
                category: 'Excellent Match',
                color: 'green',
                description: 'You are highly qualified for this position!'
            };
        } else if (overallScore >= 70) {
            return {
                category: 'Good Match',
                color: 'blue',
                description: 'You meet most requirements with some areas for improvement.'
            };
        } else if (overallScore >= 55) {
            return {
                category: 'Moderate Match',
                color: 'yellow',
                description: 'You have foundational qualifications but need development in key areas.'
            };
        } else if (overallScore >= 40) {
            return {
                category: 'Developing Match',
                color: 'orange',
                description: 'Significant skill development needed to meet requirements.'
            };
        } else {
            return {
                category: 'Early Career Match',
                color: 'red',
                description: 'Consider this as a longer-term career goal requiring substantial preparation.'
            };
        }
    }

    calculateImprovementImpact(dimensionScores) {
        const improvements = [];

        Object.entries(dimensionScores).forEach(([dimension, data]) => {
            const currentWeight = this.getDimensionWeight(dimension);
            
            if (data.score < 80) {
                // Calculate improvement potential for dimensions below target
                const currentContribution = (data.score / 100) * currentWeight;
                const potentialContribution = 0.8 * currentWeight;
                const impact = potentialContribution - currentContribution;
                
                improvements.push({
                    dimension,
                    currentScore: data.score,
                    targetScore: 80,
                    potentialImpact: Math.round(impact * 100),
                    priority: this.calculatePriority(data.score, currentWeight)
                });
            } else {
                // Include dimensions already at or above target with no impact
                improvements.push({
                    dimension,
                    currentScore: data.score,
                    targetScore: 80,
                    potentialImpact: 0,
                    priority: 'achieved'
                });
            }
        });

        return improvements.sort((a, b) => b.potentialImpact - a.potentialImpact);
    }

    calculatePriority(score, weight) {
        const gap = 100 - score;
        const priority = gap * weight;
        
        if (priority > 15) return 'high';
        if (priority > 8) return 'medium';
        return 'low';
    }

    generateScoreBreakdown(dimensionScores) {
        const breakdown = {
            strengths: [],
            adequate: [],
            needsImprovement: [],
            critical: []
        };

        Object.entries(dimensionScores).forEach(([dimension, data]) => {
            const entry = {
                dimension: this.formatDimensionName(dimension),
                score: data.score,
                details: {
                    matches: data.matches ? data.matches.length : 0,
                    gaps: data.gaps ? data.gaps.length : 0,
                    strengthAreas: data.strengthAreas || [],
                    alternativeTools: data.alternativeTools || []
                }
            };

            if (data.score >= 80) {
                breakdown.strengths.push(entry);
            } else if (data.score >= 65) {
                breakdown.adequate.push(entry);
            } else if (data.score >= 50) {
                breakdown.needsImprovement.push(entry);
            } else {
                breakdown.critical.push(entry);
            }
        });

        // Sort each category by score
        Object.keys(breakdown).forEach(category => {
            breakdown[category].sort((a, b) => b.score - a.score);
        });

        return breakdown;
    }

    formatDimensionName(dimension) {
        const nameMap = {
            tasks: 'Job Tasks',
            skills: 'Core Skills',
            technologySkills: 'Technology Skills',
            education: 'Education',
            tools: 'Tools & Software',
            workActivities: 'Work Activities',
            abilities: 'Abilities',
            knowledge: 'Knowledge Areas'
        };
        return nameMap[dimension] || dimension;
    }

}

const scoreCalculator = new ScoreCalculator();

module.exports = {
    calculateOverallScore: (scores) => scoreCalculator.calculateOverallScore(scores),
    calculateFitCategory: (score) => scoreCalculator.calculateFitCategory(score),
    generateScoreBreakdown: (scores) => scoreCalculator.generateScoreBreakdown(scores),
    calculateImprovementImpact: (scores) => scoreCalculator.calculateImprovementImpact(scores),
    formatDimensionName: (dimension) => scoreCalculator.formatDimensionName(dimension)
};