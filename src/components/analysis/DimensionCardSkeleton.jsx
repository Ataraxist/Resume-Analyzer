import { formatDimensionName } from '../../utils/statusFormatters';

function DimensionCardSkeleton({ dimension }) {
  return (
    <div className="card animate-pulse">
      {/* Header with dimension name and score */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">
          O*NET Occupation {formatDimensionName(dimension)} Overlap
        </h4>
        <div className="h-8 w-12 bg-gray-200 rounded"></div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div className="h-3 bg-gray-300 rounded-full w-0"></div>
      </div>
      
      {/* Summary Stats */}
      <div className="flex items-center gap-6 mb-6">
        <div className="h-5 w-24 bg-gray-200 rounded"></div>
        <div className="h-5 w-20 bg-gray-200 rounded"></div>
      </div>
      
      {/* Content Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matches Section */}
        <div>
          <h5 className="text-sm font-semibold text-gray-700 mb-3">What You Have</h5>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
        
        {/* Gaps Section */}
        <div>
          <h5 className="text-sm font-semibold text-gray-700 mb-3">What's Missing</h5>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-4/5"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
      
      {/* Loading indicator */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-600 mr-2"></div>
          Analyzing {formatDimensionName(dimension).toLowerCase()}...
        </div>
      </div>
    </div>
  );
}

export default DimensionCardSkeleton;