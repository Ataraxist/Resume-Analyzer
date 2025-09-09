import { Target, Clock } from 'lucide-react';

function RecommendationsPanel({ recommendations = [] }) {
  
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
  
  return (
    <div>
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
              return (
                <div key={idx} className="card">
                  <div className="mb-3">
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
                  
                  {rec.actions && Array.isArray(rec.actions) && rec.actions.length > 0 && (
                    <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                      {rec.actions.map((action, actionIdx) => {
                        return (
                          <div key={actionIdx} className="border-l-2 border-gray-200 pl-4">
                            <div className="flex items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
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