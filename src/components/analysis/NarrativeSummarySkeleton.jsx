import { User, Target, TrendingUp } from 'lucide-react';

function NarrativeSummarySkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-7 bg-gray-200 rounded w-64 mb-6"></div>
      
      <div className="space-y-6">
        {/* Where You Stand */}
        <div className="space-y-2">
          <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <User className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-11/12"></div>
            <div className="h-4 bg-gray-200 rounded w-10/12"></div>
          </div>
        </div>

        {/* Key Strengths & Gaps */}
        <div className="space-y-2">
          <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <Target className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-10/12"></div>
            <div className="h-4 bg-gray-200 rounded w-11/12"></div>
            <div className="h-4 bg-gray-200 rounded w-9/12"></div>
          </div>
        </div>

        {/* Path Forward */}
        <div className="space-y-2">
          <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <TrendingUp className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
            <div className="h-4 bg-gray-200 rounded w-40"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-11/12"></div>
            <div className="h-4 bg-gray-200 rounded w-10/12"></div>
            <div className="h-4 bg-gray-200 rounded w-9/12"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NarrativeSummarySkeleton;