class GapAnalyzer {
    constructor() {
        this.priorityWeights = {
            critical: 1.0,
            important: 0.7,
            nice_to_have: 0.3
        };
    }

    analyzeGaps(dimensionScores, occupationData = null) {
        const gaps = {
            critical: [],
            important: [],
            nice_to_have: []
        };

        Object.entries(dimensionScores).forEach(([dimension, data]) => {
            if (data.gaps && data.gaps.length > 0) {
                const prioritizedGaps = this.prioritizeGapsByImportance(
                    dimension, 
                    data.gaps, 
                    occupationData
                );
                
                prioritizedGaps.forEach(gap => {
                    const priority = gap.priority || this.determinePriority(dimension, data.score);
                    gaps[priority].push({
                        dimension,
                        item: gap.item,
                        score: data.score,
                        importance: gap.importance || data.importance || 'medium',
                        importanceScore: gap.importanceScore
                    });
                });
            }
        });

        return gaps;
    }

    prioritizeGapsByImportance(dimension, gaps, occupationData) {
        if (!occupationData) {
            return gaps.map(gap => ({ 
                item: gap, 
                priority: this.determinePriority(dimension, 50) 
            }));
        }

        const gapsWithScores = [];
        
        gaps.forEach(gapItem => {
            let importanceScore = 50; // Default medium importance
            let priority = 'nice_to_have';
            
            // Match gap items with O*NET data to get importance scores
            if (dimension === 'skills' && occupationData.skills) {
                const match = occupationData.skills.find(s => 
                    s.skill_name.toLowerCase().includes(gapItem.toLowerCase()) ||
                    gapItem.toLowerCase().includes(s.skill_name.toLowerCase())
                );
                if (match) importanceScore = match.importance_score || 50;
            } else if (dimension === 'tasks' && occupationData.tasks) {
                const match = occupationData.tasks.find(t => 
                    t.task_text.toLowerCase().includes(gapItem.toLowerCase()) ||
                    gapItem.toLowerCase().includes(t.task_text.toLowerCase())
                );
                if (match) importanceScore = match.importance || 50;
            } else if (dimension === 'knowledge' && occupationData.knowledge) {
                const match = occupationData.knowledge.find(k => 
                    k.knowledge_name.toLowerCase().includes(gapItem.toLowerCase()) ||
                    gapItem.toLowerCase().includes(k.knowledge_name.toLowerCase())
                );
                if (match) importanceScore = match.importance_score || 50;
            } else if (dimension === 'workActivities' && occupationData.workActivities) {
                const match = occupationData.workActivities.find(w => 
                    w.activity_name.toLowerCase().includes(gapItem.toLowerCase()) ||
                    gapItem.toLowerCase().includes(w.activity_name.toLowerCase())
                );
                if (match) importanceScore = match.importance_score || 50;
            }
            
            // Determine priority based on importance score
            if (importanceScore >= 80) {
                priority = 'critical';
            } else if (importanceScore >= 60) {
                priority = 'important';
            } else {
                priority = 'nice_to_have';
            }
            
            gapsWithScores.push({
                item: gapItem,
                importanceScore,
                priority,
                importance: importanceScore >= 80 ? 'high' : importanceScore >= 60 ? 'medium' : 'low'
            });
        });
        
        // Sort by importance score descending
        return gapsWithScores.sort((a, b) => b.importanceScore - a.importanceScore);
    }
    
    determinePriority(dimension, score) {
        const criticalDimensions = ['tasks', 'skills'];
        const importantDimensions = ['education', 'technology', 'tools'];
        
        if (score < 50) {
            return criticalDimensions.includes(dimension) ? 'critical' : 'important';
        } else if (score < 70) {
            return importantDimensions.includes(dimension) ? 'important' : 'nice_to_have';
        } else {
            return 'nice_to_have';
        }
    }

    generateRecommendations(dimensionScores, gaps, occupationData = null) {
        const recommendations = [];

        if (dimensionScores.skills && dimensionScores.skills.gaps && dimensionScores.skills.gaps.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'skills',
                title: 'Skill Development',
                actions: this.generateSkillRecommendations(dimensionScores.skills.gaps)
            });
        }

        if (dimensionScores.education && !dimensionScores.education.meetsRequirements) {
            recommendations.push({
                priority: 'high',
                category: 'education',
                title: 'Education Requirements',
                actions: this.generateEducationRecommendations(dimensionScores.education)
            });
        }

        if (dimensionScores.tools && dimensionScores.tools.gaps && dimensionScores.tools.gaps.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'tools',
                title: 'Technical Tools',
                actions: this.generateToolsRecommendations(dimensionScores.tools.gaps)
            });
        }

        if (dimensionScores.tasks && dimensionScores.tasks.gaps && dimensionScores.tasks.gaps.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'experience',
                title: 'Experience Gaps',
                actions: this.generateExperienceRecommendations(dimensionScores.tasks.gaps)
            });
        }

        if (dimensionScores.knowledge && dimensionScores.knowledge.gaps && dimensionScores.knowledge.gaps.length > 0) {
            recommendations.push({
                priority: 'low',
                category: 'knowledge',
                title: 'Knowledge Areas',
                actions: this.generateKnowledgeRecommendations(dimensionScores.knowledge.gaps)
            });
        }

        if (dimensionScores.workActivities && dimensionScores.workActivities.gaps && dimensionScores.workActivities.gaps.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'workActivities',
                title: 'Work Activities',
                actions: this.generateWorkActivitiesRecommendations(dimensionScores.workActivities.gaps)
            });
        }

        return this.sortRecommendations(recommendations);
    }

    generateSkillRecommendations(skillGaps) {
        if (!skillGaps || skillGaps.length === 0) return [];

        const recommendations = [];
        // Sort skills by priority if they have importance scores
        const sortedSkills = skillGaps.sort((a, b) => {
            if (typeof a === 'object' && a.importanceScore && typeof b === 'object' && b.importanceScore) {
                return b.importanceScore - a.importanceScore;
            }
            return 0;
        });
        
        const topSkills = sortedSkills.slice(0, 5);

        topSkills.forEach(skill => {
            const skillName = typeof skill === 'object' ? skill.item || skill : skill;
            const importance = typeof skill === 'object' && skill.importanceScore ? 
                (skill.importanceScore >= 80 ? 'critical' : skill.importanceScore >= 60 ? 'high' : 'medium') : 
                'high';
            
            recommendations.push({
                action: `Learn ${skillName}`,
                timeframe: this.estimateTimeframe(skillName),
                impact: importance
            });
        });

        return recommendations;
    }

    generateEducationRecommendations(educationData) {
        const recommendations = [];

        if (!educationData.meetsRequirements) {
            const gap = educationData.requiredLevel;
            recommendations.push({
                action: `Consider pursuing ${gap}`,
                timeframe: 'Long-term (6-24 months)',
                impact: 'critical'
            });
        }

        if (educationData.gaps && educationData.gaps.length > 0) {
            educationData.gaps.forEach(gap => {
                recommendations.push({
                    action: `Study ${gap}`,
                    timeframe: 'Short to medium-term',
                    impact: 'medium'
                });
            });
        }

        return recommendations;
    }

    generateToolsRecommendations(toolGaps) {
        if (!toolGaps || toolGaps.length === 0) return [];

        const sortedTools = toolGaps.sort((a, b) => {
            if (typeof a === 'object' && a.importanceScore && typeof b === 'object' && b.importanceScore) {
                return b.importanceScore - a.importanceScore;
            }
            return 0;
        });
        
        return sortedTools.slice(0, 5).map(tool => {
            const toolName = typeof tool === 'object' ? tool.item || tool : tool;
            const importance = typeof tool === 'object' && tool.importanceScore ? 
                (tool.importanceScore >= 80 ? 'high' : tool.importanceScore >= 60 ? 'medium' : 'low') : 
                'medium';
            
            return {
                action: `Gain hands-on experience with ${toolName}`,
                timeframe: 'Short-term (1-3 months)',
                impact: importance
            };
        });
    }

    generateExperienceRecommendations(taskGaps) {
        if (!taskGaps || taskGaps.length === 0) return [];

        const recommendations = [];
        const priorityTasks = taskGaps.slice(0, 3);

        priorityTasks.forEach(task => {
            const taskName = typeof task === 'object' ? task.item || task : task;
            const importance = typeof task === 'object' && task.importanceScore ? 
                (task.importanceScore >= 80 ? 'critical' : task.importanceScore >= 60 ? 'high' : 'medium') : 
                'high';
            
            recommendations.push({
                action: `Seek opportunities to gain experience in: ${taskName}`,
                timeframe: 'Medium-term (3-6 months)',
                impact: importance
            });
        });

        return recommendations;
    }

    generateKnowledgeRecommendations(knowledgeGaps) {
        if (!knowledgeGaps || knowledgeGaps.length === 0) return [];

        const sortedKnowledge = knowledgeGaps.sort((a, b) => {
            if (typeof a === 'object' && a.importanceScore && typeof b === 'object' && b.importanceScore) {
                return b.importanceScore - a.importanceScore;
            }
            return 0;
        });
        
        return sortedKnowledge.slice(0, 3).map(area => {
            const areaName = typeof area === 'object' ? area.item || area : area;
            const importance = typeof area === 'object' && area.importanceScore ? 
                (area.importanceScore >= 80 ? 'medium' : area.importanceScore >= 60 ? 'low' : 'low') : 
                'low';
            
            return {
                action: `Study ${areaName}`,
                timeframe: 'Short to medium-term',
                impact: importance
            };
        });
    }

    generateWorkActivitiesRecommendations(activityGaps) {
        if (!activityGaps || activityGaps.length === 0) return [];

        const sortedActivities = activityGaps.sort((a, b) => {
            if (typeof a === 'object' && a.importanceScore && typeof b === 'object' && b.importanceScore) {
                return b.importanceScore - a.importanceScore;
            }
            return 0;
        });

        return sortedActivities.slice(0, 3).map(activity => {
            const activityName = typeof activity === 'object' ? activity.item || activity : activity;
            const importance = typeof activity === 'object' && activity.importanceScore ? 
                (activity.importanceScore >= 80 ? 'high' : activity.importanceScore >= 60 ? 'medium' : 'low') : 
                'medium';
            
            return {
                action: `Develop skills in: ${activityName}`,
                timeframe: 'Medium-term (3-6 months)',
                impact: importance
            };
        });
    }


    estimateTimeframe(skill) {
        const complexSkills = ['machine learning', 'artificial intelligence', 'blockchain', 
                              'advanced statistics', 'system architecture'];
        const mediumSkills = ['cloud computing', 'docker', 'kubernetes', 'react', 'angular'];
        
        const skillLower = skill.toLowerCase();
        
        if (complexSkills.some(s => skillLower.includes(s))) {
            return 'Long-term (6-12 months)';
        }
        
        if (mediumSkills.some(s => skillLower.includes(s))) {
            return 'Medium-term (3-6 months)';
        }
        
        return 'Short-term (1-3 months)';
    }

    sortRecommendations(recommendations) {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return recommendations.sort((a, b) => 
            priorityOrder[a.priority] - priorityOrder[b.priority]
        );
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    calculateImprovementPotential(currentScore, gaps, importance) {
        const gapCount = gaps ? gaps.length : 0;
        const scoreGap = 100 - currentScore;
        const importanceMultiplier = importance === 'high' ? 1.5 : importance === 'medium' ? 1.0 : 0.5;
        
        return Math.min(100, (scoreGap * 0.7 + gapCount * 3) * importanceMultiplier);
    }

    prioritizeGaps(gaps, maxItems = 10) {
        const allGaps = [];
        
        Object.entries(gaps).forEach(([priority, gapList]) => {
            gapList.forEach(gap => {
                allGaps.push({
                    ...gap,
                    priority,
                    weight: this.priorityWeights[priority]
                });
            });
        });
        
        return allGaps
            .sort((a, b) => b.weight - a.weight)
            .slice(0, maxItems);
    }
}

const gapAnalyzer = new GapAnalyzer();
export default gapAnalyzer;