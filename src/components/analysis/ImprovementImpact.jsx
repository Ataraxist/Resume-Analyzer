import { TrendingUp, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { formatDimensionName } from '../../utils/statusFormatters';

function ImprovementImpact({ improvementImpact }) {
  if (!improvementImpact || improvementImpact.length === 0) {
    return null;
  }

  // Separate achieved dimensions from those needing improvement
  const achievedDimensions = improvementImpact.filter(item => item.priority === 'achieved');
  const needsImprovement = improvementImpact.filter(item => item.priority !== 'achieved');
  
  // Filter improvements that would have meaningful impact
  const significantImprovements = needsImprovement.filter(item => item.potentialImpact >= 1);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800';
      case 'medium':
        return 'text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800';
      case 'low':
        return 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800';
      case 'achieved':
        return 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high':
        return 'High Priority';
      case 'medium':
        return 'Medium Priority';
      case 'low':
        return 'Low Priority';
      case 'achieved':
        return 'Target Met';
      default:
        return 'Priority';
    }
  };

  // Get the top 3 for summary
  const topImprovements = significantImprovements.slice(0, 3);
  const totalPotentialGain = significantImprovements.reduce((sum, item) => sum + item.potentialImpact, 0);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-lg">
            <Target className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Improvement Opportunities</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Focus areas to maximize your job fit score
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">+{totalPotentialGain}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Potential points</p>
        </div>
      </div>

      {/* Quick Summary */}
      {significantImprovements.length > 0 ? (
        <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/50 border border-primary-200 dark:border-primary-800 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-primary-600 dark:text-primary-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-primary-800 dark:text-primary-200">
              <p className="font-semibold mb-1">Quick Win Strategy:</p>
              <p>
                Focus on improving <span className="font-semibold">{formatDimensionName(topImprovements[0].dimension)}</span>
                {topImprovements.length > 1 && (
                  <> and <span className="font-semibold">{formatDimensionName(topImprovements[1].dimension)}</span></>
                )}
                {' '}for the biggest score boost. These areas alone could add {' '}
                <span className="font-semibold">
                  +{topImprovements.slice(0, 2).reduce((sum, item) => sum + item.potentialImpact, 0)} points
                </span> to your overall score.
              </p>
            </div>
          </div>
        </div>
      ) : achievedDimensions.length > 0 && (
        <div className="mb-6 p-4 bg-success-50 dark:bg-success-900/50 border border-success-200 dark:border-success-800 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-success-600 dark:text-success-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-success-800 dark:text-success-200">
              <p className="font-semibold mb-1">Excellent Performance!</p>
              <p>
                All dimensions meet or exceed the target threshold of 80%. 
                You have strong qualifications across all areas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All Dimensions */}
      <div className="space-y-4">
        {/* Show dimensions needing improvement first */}
        {significantImprovements.map((item, index) => {
          const improvementGap = item.targetScore - item.currentScore;
          
          return (
            <div key={item.dimension} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {formatDimensionName(item.dimension)}
                    </h4>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityColor(item.priority)}`}>
                      {getPriorityLabel(item.priority)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Current: <span className="font-semibold text-gray-900 dark:text-white">{item.currentScore}%</span></span>
                    <span>→</span>
                    <span>Target: <span className="font-semibold text-success-600 dark:text-success-400">{item.targetScore}%</span></span>
                    <span className="text-primary-600 dark:text-primary-400 font-semibold">
                      (+{improvementGap}% needed)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary-600 dark:text-primary-400">+{item.potentialImpact}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">points</div>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="relative">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="relative h-2">
                    {/* Current progress */}
                    <div 
                      className="absolute top-0 left-0 h-2 bg-primary-500 rounded-full transition-all duration-500"
                      style={{ width: `${item.currentScore}%` }}
                    />
                    {/* Potential progress */}
                    <div 
                      className="absolute top-0 left-0 h-2 bg-primary-200 dark:bg-primary-700 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${item.targetScore}%`,
                        clipPath: `inset(0 0 0 ${item.currentScore}%)`
                      }}
                    />
                  </div>
                </div>
                {/* Target marker */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-success-600"
                  style={{ left: `${item.targetScore}%` }}
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-medium text-success-600 dark:text-success-400 whitespace-nowrap">
                    80%
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Show achieved dimensions */}
        {achievedDimensions.map((item) => {
          return (
            <div key={item.dimension} className="border border-success-200 dark:border-success-800 bg-success-50/30 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {formatDimensionName(item.dimension)}
                    </h4>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityColor(item.priority)}`}>
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      {getPriorityLabel(item.priority)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Score: <span className="font-semibold text-success-600 dark:text-success-400">{item.currentScore}%</span></span>
                    <span className="text-success-600 dark:text-success-400">✓ Exceeds target of {item.targetScore}%</span>
                  </div>
                </div>
              </div>
              
              {/* Visual Progress Bar for achieved dimensions */}
              <div className="relative mt-3">
                <div className="w-full bg-success-100 dark:bg-success-900/30 rounded-full h-2">
                  <div 
                    className="h-2 bg-success-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(item.currentScore, 100)}%` }}
                  />
                </div>
                {/* Target marker at 80% */}
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-success-700"
                  style={{ left: '80%' }}
                >
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-medium text-success-700 dark:text-success-300 whitespace-nowrap">
                    Target
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-primary-500 rounded-sm"></div>
              <span>Current Score</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-primary-200 rounded-sm"></div>
              <span>Improvement Potential</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3 bg-success-600"></div>
              <span>Target (80%)</span>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Impact scores show overall fit score increase
          </p>
        </div>
      </div>
    </div>
  );
}

export default ImprovementImpact;