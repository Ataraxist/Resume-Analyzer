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
                    s.skill_name?.toLowerCase().includes(gapItem.toLowerCase()) ||
                    gapItem.toLowerCase().includes(s.skill_name?.toLowerCase() || '')
                );
                if (match) importanceScore = match.importance_score || 50;
            } else if (dimension === 'tasks' && occupationData.tasks) {
                const match = occupationData.tasks.find(t => 
                    t.task?.toLowerCase().includes(gapItem.toLowerCase()) ||
                    t.task_text?.toLowerCase().includes(gapItem.toLowerCase()) ||
                    gapItem.toLowerCase().includes(t.task?.toLowerCase() || '') ||
                    gapItem.toLowerCase().includes(t.task_text?.toLowerCase() || '')
                );
                if (match) importanceScore = match.importance_score || match.importance || 50;
            } else if (dimension === 'knowledge' && occupationData.knowledge) {
                const match = occupationData.knowledge.find(k => 
                    k.knowledge_name?.toLowerCase().includes(gapItem.toLowerCase()) ||
                    k.knowledge_area?.toLowerCase().includes(gapItem.toLowerCase()) ||
                    gapItem.toLowerCase().includes(k.knowledge_name?.toLowerCase() || '') ||
                    gapItem.toLowerCase().includes(k.knowledge_area?.toLowerCase() || '')
                );
                if (match) importanceScore = match.importance_score || 50;
            } else if (dimension === 'workActivities' && occupationData.workActivities) {
                const match = occupationData.workActivities.find(w => 
                    w.activity_name?.toLowerCase().includes(gapItem.toLowerCase()) ||
                    gapItem.toLowerCase().includes(w.activity_name?.toLowerCase() || '')
                );
                if (match) importanceScore = match.importance_score || 50;
            } else if (dimension === 'tools' && occupationData.tools) {
                const match = occupationData.tools.find(t => 
                    t.tool_name?.toLowerCase().includes(gapItem.toLowerCase()) ||
                    gapItem.toLowerCase().includes(t.tool_name?.toLowerCase() || '')
                );
                if (match) importanceScore = 75; // Tools are generally important
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
        const importantDimensions = ['education', 'technology', 'tools', 'experience'];
        
        if (score < 50) {
            return criticalDimensions.includes(dimension) ? 'critical' : 'important';
        } else if (score < 70) {
            return importantDimensions.includes(dimension) ? 'important' : 'nice_to_have';
        } else {
            return 'nice_to_have';
        }
    }

    generateRecommendations(dimensionScores, gaps, _occupationData = null) {
        const recommendations = [];

        // Skills recommendations
        if (dimensionScores.skills && dimensionScores.skills.gaps && dimensionScores.skills.gaps.length > 0) {
            recommendations.push({
                priority: 'high',
                category: 'skills',
                title: 'Skill Development',
                actions: this.generateSkillRecommendations(dimensionScores.skills.gaps)
            });
        }

        // Education recommendations
        if (dimensionScores.education && !dimensionScores.education.meetsRequirements) {
            recommendations.push({
                priority: 'high',
                category: 'education',
                title: 'Education Requirements',
                actions: this.generateEducationRecommendations(dimensionScores.education)
            });
        }

        // Tools recommendations
        if (dimensionScores.tools && dimensionScores.tools.gaps && dimensionScores.tools.gaps.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'tools',
                title: 'Technical Tools',
                actions: this.generateToolsRecommendations(dimensionScores.tools.gaps)
            });
        }

        // Experience/Tasks recommendations
        if (dimensionScores.tasks && dimensionScores.tasks.gaps && dimensionScores.tasks.gaps.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'experience',
                title: 'Experience Gaps',
                actions: this.generateExperienceRecommendations(dimensionScores.tasks.gaps)
            });
        } else if (dimensionScores.experience && dimensionScores.experience.gaps && dimensionScores.experience.gaps.length > 0) {
            recommendations.push({
                priority: 'medium',
                category: 'experience',
                title: 'Experience Gaps',
                actions: this.generateExperienceRecommendations(dimensionScores.experience.gaps)
            });
        }

        // Knowledge recommendations
        if (dimensionScores.knowledge && dimensionScores.knowledge.gaps && dimensionScores.knowledge.gaps.length > 0) {
            recommendations.push({
                priority: 'low',
                category: 'knowledge',
                title: 'Knowledge Areas',
                actions: this.generateKnowledgeRecommendations(dimensionScores.knowledge.gaps)
            });
        }

        // Work activities recommendations
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
        const topSkills = skillGaps.slice(0, 5);

        topSkills.forEach((skill, index) => {
            const skillName = typeof skill === 'object' ? skill.item || skill : skill;
            const importanceScore = typeof skill === 'object' && skill.importanceScore ? skill.importanceScore : (75 - index * 5);
            const importance = importanceScore >= 80 ? 'critical' : importanceScore >= 60 ? 'high' : 'medium';
            
            recommendations.push({
                action: `Learn ${skillName}`,
                timeframe: this.estimateTimeframe(skillName),
                impact: importance,
                resources: this.suggestResources(skillName)
            });
        });

        return recommendations;
    }

    generateEducationRecommendations(educationData) {
        const recommendations = [];
        const requiredLevel = educationData.requiredLevel?.toLowerCase() || '';
        const currentLevel = educationData.educationLevel?.toLowerCase() || '';

        if (requiredLevel.includes('master') && !currentLevel.includes('master')) {
            recommendations.push({
                action: 'Pursue a Master\'s degree in relevant field',
                timeframe: '2 years',
                impact: 'critical'
            });
        } else if (requiredLevel.includes('bachelor') && !currentLevel.includes('bachelor')) {
            recommendations.push({
                action: 'Complete a Bachelor\'s degree program',
                timeframe: '3-4 years',
                impact: 'critical'
            });
        } else if (educationData.gaps && educationData.gaps.length > 0) {
            educationData.gaps.forEach(gap => {
                recommendations.push({
                    action: gap,
                    timeframe: 'Varies',
                    impact: 'high'
                });
            });
        }

        return recommendations;
    }

    generateToolsRecommendations(toolGaps) {
        if (!toolGaps || toolGaps.length === 0) return [];

        const recommendations = [];
        const topTools = toolGaps.slice(0, 5);

        topTools.forEach((tool, index) => {
            const toolName = typeof tool === 'object' ? tool.item || tool : tool;
            const importanceScore = typeof tool === 'object' && tool.importanceScore ? tool.importanceScore : (70 - index * 5);
            const impact = importanceScore >= 75 ? 'high' : importanceScore >= 50 ? 'medium' : 'low';
            
            recommendations.push({
                action: `Learn ${toolName}`,
                timeframe: this.estimateToolTimeframe(toolName),
                impact: impact,
                resources: `Online tutorials, documentation, hands-on practice`
            });
        });

        return recommendations;
    }

    generateExperienceRecommendations(experienceGaps) {
        if (!experienceGaps || experienceGaps.length === 0) return [];

        const recommendations = [];
        const topGaps = experienceGaps.slice(0, 3);

        topGaps.forEach((gap, index) => {
            const gapText = typeof gap === 'object' ? gap.item || gap : gap;
            const complexity = this.assessExperienceComplexity(gapText);
            const timeframe = complexity === 'high' ? '6-12 months' : complexity === 'medium' ? '3-6 months' : '1-3 months';
            const importanceScore = typeof gap === 'object' && gap.importanceScore ? gap.importanceScore : (80 - index * 10);
            const impact = importanceScore >= 75 ? 'high' : importanceScore >= 50 ? 'medium' : 'low';
            
            recommendations.push({
                action: `Gain experience in ${gapText}`,
                timeframe: timeframe,
                impact: impact,
                approach: 'Look for projects, freelance work, or volunteer opportunities'
            });
        });

        return recommendations;
    }

    generateKnowledgeRecommendations(knowledgeGaps) {
        if (!knowledgeGaps || knowledgeGaps.length === 0) return [];

        const recommendations = [];
        const topGaps = knowledgeGaps.slice(0, 3);

        topGaps.forEach((gap, index) => {
            const gapText = typeof gap === 'object' ? gap.item || gap : gap;
            const depth = this.assessKnowledgeDepth(gapText);
            const timeframe = depth === 'comprehensive' ? '3-6 months' : depth === 'intermediate' ? '1-3 months' : '2-4 weeks';
            const importanceScore = typeof gap === 'object' && gap.importanceScore ? gap.importanceScore : (60 - index * 10);
            const impact = importanceScore >= 70 ? 'medium' : 'low';
            
            recommendations.push({
                action: `Study ${gapText}`,
                timeframe: timeframe,
                impact: impact,
                resources: 'Textbooks, online courses, industry publications'
            });
        });

        return recommendations;
    }

    generateWorkActivitiesRecommendations(activityGaps) {
        if (!activityGaps || activityGaps.length === 0) return [];

        const recommendations = [];
        const topGaps = activityGaps.slice(0, 3);

        topGaps.forEach((gap, index) => {
            const gapText = typeof gap === 'object' ? gap.item || gap : gap;
            const complexity = this.assessActivityComplexity(gapText);
            const timeframe = complexity === 'high' ? '4-6 months' : complexity === 'medium' ? '2-4 months' : '1-2 months';
            const importanceScore = typeof gap === 'object' && gap.importanceScore ? gap.importanceScore : (70 - index * 10);
            const impact = importanceScore >= 70 ? 'high' : importanceScore >= 50 ? 'medium' : 'low';
            
            recommendations.push({
                action: `Develop skills in ${gapText}`,
                timeframe: timeframe,
                impact: impact,
                approach: 'Seek opportunities in current role or side projects'
            });
        });

        return recommendations;
    }

    estimateTimeframe(skillName) {
        const skill = skillName.toLowerCase();
        
        // Programming languages
        if (skill.includes('python') || skill.includes('javascript') || skill.includes('java') ||
            skill.includes('c++') || skill.includes('ruby') || skill.includes('go')) {
            return '3-6 months';
        }
        
        // Complex frameworks
        if (skill.includes('react') || skill.includes('angular') || skill.includes('vue') ||
            skill.includes('django') || skill.includes('spring') || skill.includes('.net')) {
            return '2-4 months';
        }
        
        // Cloud & Infrastructure
        if (skill.includes('aws') || skill.includes('azure') || skill.includes('kubernetes')) {
            return '3-5 months';
        }
        
        // Office software
        if (skill.includes('excel') || skill.includes('word') || skill.includes('powerpoint') ||
            skill.includes('office') || skill.includes('outlook')) {
            return '1-2 weeks';
        }
        
        // Specialized software
        if (skill.includes('quickbooks') || skill.includes('salesforce') || skill.includes('sap')) {
            return '1-3 months';
        }
        
        // Social media
        if (skill.includes('youtube') || skill.includes('facebook') || skill.includes('instagram')) {
            return '1 week';
        }
        
        // Soft skills
        if (skill.includes('communication') || skill.includes('leadership') || skill.includes('management')) {
            return '6-12 months';
        }
        
        // Default
        return '1-2 months';
    }
    
    estimateToolTimeframe(toolName) {
        const tool = toolName.toLowerCase();
        
        // Physical tools (hairdressing, etc.)
        if (tool.includes('scissors') || tool.includes('brush') || tool.includes('clipper') ||
            tool.includes('razor') || tool.includes('comb')) {
            return '2-4 weeks';
        }
        
        // Simple software tools
        if (tool.includes('calculator') || tool.includes('notepad') || tool.includes('basic')) {
            return '1-3 days';
        }
        
        // Complex software tools
        if (tool.includes('photoshop') || tool.includes('autocad') || tool.includes('maya')) {
            return '2-3 months';
        }
        
        // Medical/specialized equipment
        if (tool.includes('medical') || tool.includes('diagnostic') || tool.includes('surgical')) {
            return '3-6 months';
        }
        
        return '1-2 months';
    }
    
    assessExperienceComplexity(experience) {
        const exp = experience.toLowerCase();
        
        if (exp.includes('manage') || exp.includes('lead') || exp.includes('strategic') ||
            exp.includes('complex') || exp.includes('senior')) {
            return 'high';
        }
        
        if (exp.includes('coordinate') || exp.includes('analyze') || exp.includes('develop')) {
            return 'medium';
        }
        
        return 'low';
    }
    
    assessKnowledgeDepth(knowledge) {
        const know = knowledge.toLowerCase();
        
        if (know.includes('comprehensive') || know.includes('advanced') || know.includes('expert') ||
            know.includes('extensive') || know.includes('in-depth')) {
            return 'comprehensive';
        }
        
        if (know.includes('intermediate') || know.includes('moderate') || know.includes('working')) {
            return 'intermediate';
        }
        
        return 'basic';
    }
    
    assessActivityComplexity(activity) {
        const act = activity.toLowerCase();
        
        if (act.includes('manage') || act.includes('direct') || act.includes('lead') ||
            act.includes('strategic') || act.includes('architect')) {
            return 'high';
        }
        
        if (act.includes('coordinate') || act.includes('implement') || act.includes('develop')) {
            return 'medium';
        }
        
        return 'low';
    }

    suggestResources(skillName) {
        const skill = skillName.toLowerCase();
        
        if (skill.includes('python')) {
            return 'Coursera, Codecademy, Python.org tutorials';
        }
        if (skill.includes('javascript')) {
            return 'freeCodeCamp, MDN Web Docs, JavaScript.info';
        }
        if (skill.includes('management') || skill.includes('leadership')) {
            return 'LinkedIn Learning, Harvard Business Review, management books';
        }
        
        return 'Online courses, documentation, hands-on practice';
    }

    sortRecommendations(recommendations) {
        const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
        return recommendations.sort((a, b) => 
            priorityOrder[a.priority] - priorityOrder[b.priority]
        );
    }

    identifyTopGaps(dimensionScores, limit = 5) {
        const allGaps = [];

        Object.entries(dimensionScores).forEach(([dimension, data]) => {
            if (data.gaps && Array.isArray(data.gaps)) {
                data.gaps.forEach(gap => {
                    allGaps.push({
                        dimension,
                        gap,
                        score: data.score || 0,
                        importance: data.importance || 'medium'
                    });
                });
            }
        });

        // Sort by dimension score (lower score = higher priority)
        allGaps.sort((a, b) => a.score - b.score);

        return allGaps.slice(0, limit);
    }

    calculateImprovementPotential(dimensionScores) {
        const improvements = {};

        Object.entries(dimensionScores).forEach(([dimension, data]) => {
            const currentScore = data.score || 0;
            const potential = 100 - currentScore;
            
            improvements[dimension] = {
                current: currentScore,
                potential: potential,
                impact: potential > 30 ? 'high' : potential > 15 ? 'medium' : 'low',
                confidence: data.confidence || 'medium'
            };
        });

        return improvements;
    }
}

// Create instance and export
const gapAnalyzer = new GapAnalyzer();

// For backward compatibility
module.exports = {
    generateRecommendations: (scores, dims, _resume) => {
        const gaps = gapAnalyzer.analyzeGaps(scores, dims);
        return gapAnalyzer.generateRecommendations(scores, gaps, dims);
    },
    identifyTopGaps: (scores, limit) => gapAnalyzer.identifyTopGaps(scores, limit),
    calculateImprovementPotential: (scores) => gapAnalyzer.calculateImprovementPotential(scores),
    // New exports
    analyzeGaps: (scores, data) => gapAnalyzer.analyzeGaps(scores, data),
    GapAnalyzer // Export the class too
};