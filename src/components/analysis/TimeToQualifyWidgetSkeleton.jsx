import { Clock } from 'lucide-react';

function TimeToQualifyWidgetSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-gray-400" />
          Time to Qualify
        </h3>
        <div className="h-6 w-32 bg-gray-200 rounded-full"></div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Estimated preparation time</span>
          <div className="h-6 w-24 bg-gray-200 rounded"></div>
        </div>
        
        {/* Progress bar skeleton */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-gray-300 h-2 rounded-full w-1/3"></div>
        </div>
      </div>

      {/* Timeline breakdown skeleton */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Development Timeline</h4>
        {[1, 2, 3].map((idx) => (
          <div key={idx} className="flex items-start">
            <div className="h-4 w-4 bg-gray-200 rounded mr-2 mt-0.5"></div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mt-1"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Encouragement message skeleton */}
      <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-200">
        <div className="flex items-start">
          <div className="h-4 w-4 bg-gray-300 rounded mr-2 mt-0.5"></div>
          <div className="space-y-1 flex-1">
            <div className="h-3 bg-gray-300 rounded w-full"></div>
            <div className="h-3 bg-gray-300 rounded w-4/5"></div>
          </div>
        </div>
      </div>
      
      {/* Loading indicator */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-600 mr-2"></div>
          Calculating career timeline...
        </div>
      </div>
    </div>
  );
}

export default TimeToQualifyWidgetSkeleton;