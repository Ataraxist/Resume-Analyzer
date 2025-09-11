function AnalysisSummarySkeleton() {
  return (
    <div className="card animate-pulse">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Analysis Summary</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Fit Score Skeleton */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Overall Fit Score</p>
            <div className="h-12 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
            <div className="mb-3">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded-full mr-1"></div>
                <div className="h-4 w-20 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-2"></div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Summary Content Skeleton */}
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Time to Qualify</p>
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mt-1"></div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Key Strengths</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="h-6 w-18 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Areas for Improvement</p>
            <div className="flex flex-wrap gap-2 mt-1">
              <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading indicator */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 dark:border-gray-600 border-t-primary-600 dark:border-t-primary-400 mr-2"></div>
          Calculating overall fit score...
        </div>
      </div>
    </div>
  );
}

export default AnalysisSummarySkeleton;