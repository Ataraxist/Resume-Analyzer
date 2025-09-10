import { Target } from 'lucide-react';

function ImprovementImpactSkeleton() {
  // All 8 dimensions in order
  const dimensions = [
    'Tasks',
    'Skills', 
    'Education',
    'Work Activities',
    'Knowledge',
    'Technology Skills',
    'Tools',
    'Abilities'
  ];

  return (
    <div className="card animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
            <Target className="h-5 w-5 text-gray-400 dark:text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Improvement Opportunities</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Focus areas to maximize your job fit score
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Potential points</p>
        </div>
      </div>

      {/* Quick Summary skeleton */}
      <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* All 8 Dimension placeholders */}
      <div className="space-y-4">
        {dimensions.map((dimension, index) => (
          <div key={dimension} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {dimension}
                  </h4>
                  <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <span className="text-gray-400">→</span>
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded mb-1"></div>
                <div className="text-xs text-gray-600 dark:text-gray-400">points</div>
              </div>
            </div>

            {/* Visual Progress Bar skeleton */}
            <div className="relative">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full transition-all duration-500" 
                     style={{ width: `${Math.random() * 40 + 20}%` }}
                />
              </div>
              {/* Target marker at 80% */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-400 dark:bg-gray-600"
                style={{ left: '80%' }}
              >
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  80%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legend skeleton */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-sm"></div>
              <span>Current Score</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
              <span>Improvement Potential</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-0.5 h-3 bg-gray-400 dark:bg-gray-600"></div>
              <span>Target (80%)</span>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Impact scores show overall fit score increase
          </p>
        </div>
      </div>
      
      {/* Loading indicator */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 dark:border-gray-600 border-t-primary-600 dark:border-t-primary-400 mr-2"></div>
          Calculating improvement strategies...
        </div>
      </div>
    </div>
  );
}

export default ImprovementImpactSkeleton;