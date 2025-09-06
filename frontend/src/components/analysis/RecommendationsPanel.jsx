import { useState } from 'react';
import { Target, Clock, ExternalLink, CheckSquare, Square, ChevronRight } from 'lucide-react';

function RecommendationsPanel({ recommendations = [] }) {
  const [expandedItems, setExpandedItems] = useState({});
  const [completedActions, setCompletedActions] = useState(new Set());
  
  const toggleExpanded = (index) => {
    setExpandedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  const toggleCompleted = (actionId) => {
    setCompletedActions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
      case 'critical':
        return 'bg-danger-100 text-danger-800 border-danger-300';
      case 'medium':
        return 'bg-warning-100 text-warning-800 border-warning-300';
      case 'low':
        return 'bg-primary-100 text-primary-800 border-primary-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const getImpactBadge = (impact) => {
    const colors = {
      high: 'bg-danger-100 text-danger-700',
      critical: 'bg-danger-100 text-danger-700',
      medium: 'bg-warning-100 text-warning-700',
      low: 'bg-success-100 text-success-700'
    };
    
    return colors[impact] || 'bg-gray-100 text-gray-700';
  };
  
  const groupedRecommendations = recommendations.reduce((acc, rec) => {
    const priority = rec.priority || 'medium';
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(rec);
    return acc;
  }, {});
  
  const priorityOrder = ['high', 'critical', 'medium', 'low'];
  const sortedPriorities = priorityOrder.filter(p => groupedRecommendations[p]);
  
  // Calculate progress
  const totalActions = recommendations.reduce((sum, rec) => 
    sum + (rec.actions?.length || 0), 0
  );
  const completedCount = completedActions.size;
  const progressPercentage = totalActions > 0 ? (completedCount / totalActions) * 100 : 0;
  
  return (
    <div>
      {/* Progress Overview */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Your Progress</h3>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Actions Completed</span>
            <span className="font-medium text-gray-900">
              {completedCount} of {totalActions}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-primary-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-danger-600">
              {groupedRecommendations.high?.length || 0}
            </p>
            <p className="text-xs text-gray-600">High Priority</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-warning-600">
              {groupedRecommendations.medium?.length || 0}
            </p>
            <p className="text-xs text-gray-600">Medium Priority</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary-600">
              {groupedRecommendations.low?.length || 0}
            </p>
            <p className="text-xs text-gray-600">Low Priority</p>
          </div>
        </div>
      </div>
      
      {/* Recommendations by Priority */}
      {sortedPriorities.map((priority) => (
        <div key={priority} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className={`px-2 py-1 text-xs font-medium rounded-md mr-3 border ${getPriorityColor(priority)}`}>
              {priority.toUpperCase()} PRIORITY
            </span>
            <span className="text-gray-500 text-sm font-normal">
              ({groupedRecommendations[priority].length} recommendations)
            </span>
          </h3>
          
          <div className="space-y-4">
            {groupedRecommendations[priority].map((rec, idx) => {
              const globalIdx = `${priority}-${idx}`;
              const isExpanded = expandedItems[globalIdx];
              
              return (
                <div key={idx} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {rec.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">
                          {rec.category}
                        </span>
                        {rec.actions && (
                          <span className="text-gray-400">•</span>
                        )}
                        {rec.actions && (
                          <span className="text-gray-500">
                            {rec.actions.length} actions
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {rec.actions && rec.actions.length > 0 && (
                      <button
                        onClick={() => toggleExpanded(globalIdx)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <ChevronRight 
                          className={`h-5 w-5 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`} 
                        />
                      </button>
                    )}
                  </div>
                  
                  {isExpanded && rec.actions && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                      {rec.actions.map((action, actionIdx) => {
                        const actionId = `${globalIdx}-${actionIdx}`;
                        const isCompleted = completedActions.has(actionId);
                        
                        return (
                          <div key={actionIdx} className="border-l-2 border-gray-200 pl-4">
                            <div className="flex items-start">
                              <button
                                onClick={() => toggleCompleted(actionId)}
                                className="mr-3 mt-0.5 flex-shrink-0"
                              >
                                {isCompleted ? (
                                  <CheckSquare className="h-5 w-5 text-success-600" />
                                ) : (
                                  <Square className="h-5 w-5 text-gray-400" />
                                )}
                              </button>
                              
                              <div className={`flex-1 ${isCompleted ? 'opacity-60' : ''}`}>
                                <p className={`text-sm font-medium text-gray-900 ${
                                  isCompleted ? 'line-through' : ''
                                }`}>
                                  {action.action}
                                </p>
                                
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {action.timeframe && (
                                    <div className="flex items-center text-xs text-gray-500">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {action.timeframe}
                                    </div>
                                  )}
                                  
                                  {action.impact && (
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${getImpactBadge(action.impact)}`}>
                                      {action.impact} impact
                                    </span>
                                  )}
                                </div>
                                
                                {action.resources && action.resources.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Resources:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {action.resources.map((resource, resIdx) => (
                                        <span 
                                          key={resIdx}
                                          className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md"
                                        >
                                          {resource}
                                          <ExternalLink className="h-3 w-3 ml-1 opacity-50" />
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      {recommendations.length === 0 && (
        <div className="card text-center py-12">
          <Target className="h-16 w-16 text-success-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Outstanding Match!
          </h3>
          <p className="text-gray-600">
            You're already well-qualified for this position. Keep up the excellent work!
          </p>
        </div>
      )}
    </div>
  );
}

export default RecommendationsPanel;