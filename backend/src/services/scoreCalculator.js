class ScoreCalculator {
    constructor() {
        this.dimensionWeights = {
            tasks: 0.25,
            skills: 0.25,
            technology: 0.20,
            education: 0.15,
            workActivities: 0.10,
            knowledge: 0.05,
            tools: 0.10
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
                details: {
                    matches: data.matches ? data.matches.length : 0,
                    gaps: data.gaps ? data.gaps.length : 0,
                    confidence: data.confidence || 'medium'
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
            tools: 'Tools & Software'
        };
        return nameMap[dimension] || dimension;
    }

    calculateTimeToQualify(dimensionScores, gaps) {
        let totalMonths = 0;
        const timeEstimates = [];

        if (dimensionScores.education && !dimensionScores.education.meetsRequirements) {
            const educationTime = this.estimateEducationTime(dimensionScores.education);
            totalMonths += educationTime;
            timeEstimates.push({
                category: 'Education',
                months: educationTime
            });
        }

        if (dimensionScores.skills && dimensionScores.skills.score < 70) {
            const skillsTime = this.estimateSkillsTime(dimensionScores.skills);
            totalMonths += skillsTime;
            timeEstimates.push({
                category: 'Skills Development',
                months: skillsTime
            });
        }

        if (dimensionScores.tasks && dimensionScores.tasks.score < 60) {
            const experienceTime = this.estimateExperienceTime(dimensionScores.tasks);
            totalMonths += experienceTime;
            timeEstimates.push({
                category: 'Experience Building',
                months: experienceTime
            });
        }

        return {
            totalMonths,
            timeEstimates,
            summary: this.getTimeframeSummary(totalMonths)
        };
    }

    estimateEducationTime(educationData) {
        const gap = educationData.requiredLevel;
        if (!gap) return 0;
        
        if (gap.toLowerCase().includes('bachelor')) return 48;
        if (gap.toLowerCase().includes('master')) return 24;
        if (gap.toLowerCase().includes('associate')) return 24;
        if (gap.toLowerCase().includes('certification')) return 6;
        return 12;
    }

    estimateSkillsTime(skillsData) {
        const gapCount = skillsData.gaps ? skillsData.gaps.length : 0;
        const scoreGap = 70 - skillsData.score;
        
        return Math.min(24, Math.ceil((gapCount * 2) + (scoreGap / 10)));
    }

    estimateExperienceTime(tasksData) {
        const scoreGap = 60 - tasksData.score;
        return Math.min(36, Math.ceil(scoreGap / 5) * 3);
    }

    getTimeframeSummary(months) {
        if (months === 0) return 'Ready now';
        if (months <= 3) return 'Short-term (1-3 months)';
        if (months <= 6) return 'Medium-term (3-6 months)';
        if (months <= 12) return 'Long-term (6-12 months)';
        if (months <= 24) return 'Extended (1-2 years)';
        return 'Multi-year journey (2+ years)';
    }
}

const scoreCalculator = new ScoreCalculator();
export default scoreCalculator;