function RecommendationsPanelSkeleton() {
  const priorities = ['HIGH', 'MEDIUM', 'LOW'];
  
  return (
    <div className="animate-pulse">
      {/* Priority sections */}
      {priorities.map((priority, idx) => (
        <div key={priority} className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="px-2 py-1 text-xs font-medium rounded-md mr-3 border bg-gray-200 text-gray-400 border-gray-300">
              {priority} PRIORITY
            </span>
            <span className="text-gray-400 text-sm font-normal">
              <div className="inline-block h-4 w-24 bg-gray-200 rounded"></div>
            </span>
          </h3>
          
          <div className="space-y-4">
            {/* Mock recommendation cards */}
            {[1, 2].slice(0, idx === 0 ? 2 : idx === 1 ? 2 : 1).map((item) => (
              <div key={item} className="card">
                <div className="mb-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <span className="text-gray-400">•</span>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
                
                {/* Mock actions */}
                <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                  {[1, 2].map((actionIdx) => (
                    <div key={actionIdx} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-start">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            <div className="flex items-center text-xs">
                              <div className="h-3 w-3 bg-gray-200 rounded-full mr-1"></div>
                              <div className="h-3 w-16 bg-gray-200 rounded"></div>
                            </div>
                            
                            <div className="h-4 w-20 bg-gray-200 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Loading indicator */}
      <div className="text-center mt-4">
        <div className="inline-flex items-center text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-600 mr-2"></div>
          Generating personalized recommendations...
        </div>
      </div>
    </div>
  );
}

export default RecommendationsPanelSkeleton;