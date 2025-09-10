import { User, Target, TrendingUp } from 'lucide-react';

function NarrativeSummary({ narrativeSummary }) {
  if (!narrativeSummary) return null;

  const { whereYouStand, strengthsAndGaps, pathForward } = narrativeSummary;

  return (
    <div className="card">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Your Career Analysis Summary</h3>
      
      <div className="space-y-6">
        {/* Where You Stand */}
        <div className="space-y-2">
          <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <User className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
            WHERE YOU STAND
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {whereYouStand}
          </p>
        </div>

        {/* Key Strengths & Gaps */}
        <div className="space-y-2">
          <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <Target className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
            STRENGTHS & OPPORTUNITIES
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {strengthsAndGaps}
          </p>
        </div>

        {/* Path Forward */}
        <div className="space-y-2">
          <div className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <TrendingUp className="h-4 w-4 mr-2 text-primary-600 dark:text-primary-400" />
            YOUR PATH FORWARD
          </div>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {pathForward}
          </p>
        </div>
      </div>
    </div>
  );
}

export default NarrativeSummary;