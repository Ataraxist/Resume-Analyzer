class ScoreCalculator {
    constructor() {
        this.dimensionWeights = {
            tasks: 0.25,
            skills: 0.25,
            technology: 0.20,
            education: 0.15,
            workActivities: 0.10,
            knowledge: 0.05,
            tools: 0.10,
            // Fallback weights for simpler dimensions
            experience: 0.25,
            abilities: 0.15
        };
        
        this.confidenceMultipliers = {
            high: 1.0,
            medium: 0.9,
            low: 0.8
        };
    }

    calculateOverallScore(dimensionScores) {
        let weightedSum = 0;
        let totalWeight = 0;

        Object.entries(dimensionScores).forEach(([dimension, data]) => {
            const weight = this.getDimensionWeight(dimension);
            const confidence = data.confidence || 'medium';
            const confidenceMultiplier = this.confidenceMultipliers[confidence];
            
            const adjustedScore = data.score * confidenceMultiplier;
            weightedSum += adjustedScore * weight;
            totalWeight += weight;
        });

        const overallScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
        return Math.round(overallScore * 10) / 10;
    }

    getDimensionWeight(dimension) {
        if (dimension === 'technology' || dimension === 'technologySkills') {
            return this.dimensionWeights.technology;
        }
        return this.dimensionWeights[dimension] || 0.1;
    }

    calculateDimensionScore(matches, total, importance = 'medium') {
        if (total === 0) return 0;
        
        const baseScore = (matches / total) * 100;
        const importanceMultiplier = this.getImportanceMultiplier(importance);
        
        return Math.min(100, Math.round(baseScore * importanceMultiplier));
    }

    getImportanceMultiplier(importance) {
        const multipliers = {
            critical: 1.2,
            high: 1.1,
            medium: 1.0,
            low: 0.9
        };
        return multipliers[importance] || 1.0;
    }

    calculateFitCategory(overallScore) {
        if (overallScore >= 85) {
            return {
                category: 'Excellent Match',
                color: 'green',
                description: 'You are highly qualified for this position'
            };
        } else if (overallScore >= 70) {
            return {
                category: 'Good Match',
                color: 'blue',
                description: 'You meet most requirements with some areas for improvement'
            };
        } else if (overallScore >= 55) {
            return {
                category: 'Moderate Match',
                color: 'yellow',
                description: 'You have foundational qualifications but need development in key areas'
            };
        } else if (overallScore >= 40) {
            return {
                category: 'Developing Match',
                color: 'orange',
                description: 'Significant skill development needed to meet requirements'
            };
        } else {
            return {
                category: 'Early Career Match',
                color: 'red',
                description: 'Consider this as a longer-term career goal requiring substantial preparation'
            };
        }
    }

    calculateImprovementImpact(dimensionScores) {
        const improvements = [];

        Object.entries(dimensionScores).forEach(([dimension, data]) => {
            if (data.score < 80) {
                const currentWeight = this.getDimensionWeight(dimension);
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
                importance: data.importance || 'medium',
                confidence: data.confidence || 'medium',
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
            technology: 'Technology Skills',
            technologySkills: 'Technology Skills',
            education: 'Education',
            workActivities: 'Work Activities',
            knowledge: 'Knowledge Areas',
            tools: 'Tools & Software',
            experience: 'Experience',
            abilities: 'Abilities'
        };
        return nameMap[dimension] || dimension;
    }

    calculateTimeToQualify(dimensionScores, _gaps) {
        let totalMonths = 0;
        const timeEstimates = [];

        // Check education requirements
        if (dimensionScores.education && !dimensionScores.education.meetsRequirements) {
            const educationTime = this.estimateEducationTime(dimensionScores.education);
            totalMonths += educationTime;
            timeEstimates.push({
                category: 'Education',
                months: educationTime,
                description: 'Time to complete required education'
            });
        }

        // Check skills development
        if (dimensionScores.skills && dimensionScores.skills.score < 70) {
            const skillsTime = this.estimateSkillsTime(dimensionScores.skills);
            totalMonths += skillsTime;
            timeEstimates.push({
                category: 'Skills Development',
                months: skillsTime,
                description: 'Time to develop required skills'
            });
        }

        // Check experience requirements
        if (dimensionScores.tasks && dimensionScores.tasks.score < 60) {
            const experienceTime = this.estimateExperienceTime(dimensionScores.tasks);
            totalMonths += experienceTime;
            timeEstimates.push({
                category: 'Experience',
                months: experienceTime,
                description: 'Time to gain relevant experience'
            });
        }

        // Check tools/technology learning
        if (dimensionScores.tools && dimensionScores.tools.score < 70) {
            const toolsTime = this.estimateToolsTime(dimensionScores.tools);
            totalMonths += toolsTime;
            timeEstimates.push({
                category: 'Tools & Technology',
                months: toolsTime,
                description: 'Time to learn required tools'
            });
        }

        return {
            totalMonths,
            timeEstimates,
            qualificationLevel: this.getQualificationLevel(totalMonths)
        };
    }

    estimateEducationTime(educationData) {
        const gap = educationData.requiredLevel?.toLowerCase() || '';
        const current = educationData.educationLevel?.toLowerCase() || '';
        
        if (gap.includes('master') && !current.includes('master')) return 24;
        if (gap.includes('bachelor') && !current.includes('bachelor')) return 48;
        if (gap.includes('associate') && !current.includes('associate')) return 24;
        return 0;
    }

    estimateSkillsTime(skillsData) {
        const score = skillsData.score || 0;
        const gapCount = skillsData.gaps ? skillsData.gaps.length : 0;
        
        if (score < 30) return 12; // Major skills gap
        if (score < 50) return 6;  // Moderate skills gap
        if (score < 70) return 3;  // Minor skills gap
        return Math.min(gapCount, 3); // 1 month per critical skill
    }

    estimateExperienceTime(tasksData) {
        const score = tasksData.score || 0;
        
        if (score < 30) return 24; // 2+ years experience needed
        if (score < 50) return 12; // 1 year experience needed
        if (score < 70) return 6;  // 6 months experience needed
        return 0;
    }

    estimateToolsTime(toolsData) {
        const gapCount = toolsData.gaps ? toolsData.gaps.length : 0;
        return Math.min(gapCount * 0.5, 6); // 0.5 months per tool, max 6 months
    }

    getQualificationLevel(totalMonths) {
        if (totalMonths === 0) return 'Ready Now';
        if (totalMonths <= 3) return 'Nearly Ready';
        if (totalMonths <= 6) return 'Short-term Development';
        if (totalMonths <= 12) return 'Medium-term Development';
        if (totalMonths <= 24) return 'Long-term Development';
        return 'Extended Preparation Required';
    }
}

// For backward compatibility, export individual functions and the class instance
const scoreCalculator = new ScoreCalculator();

module.exports = {
    calculateFitScore: (scores) => scoreCalculator.calculateOverallScore(scores),
    calculateDimensionScore: (matches, total, importance) => 
        scoreCalculator.calculateDimensionScore(matches, total, importance),
    categorizeScore: (score) => {
        const category = scoreCalculator.calculateFitCategory(score);
        return { 
            level: category.category.toLowerCase().replace(' ', '_'), 
            color: category.color 
        };
    },
    // New exports
    calculateOverallScore: (scores) => scoreCalculator.calculateOverallScore(scores),
    calculateFitCategory: (score) => scoreCalculator.calculateFitCategory(score),
    generateScoreBreakdown: (scores) => scoreCalculator.generateScoreBreakdown(scores),
    calculateImprovementImpact: (scores) => scoreCalculator.calculateImprovementImpact(scores),
    calculateTimeToQualify: (scores, gaps) => scoreCalculator.calculateTimeToQualify(scores, gaps),
    ScoreCalculator // Export the class itself too
};