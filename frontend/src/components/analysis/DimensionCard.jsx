import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';

function DimensionCard({ dimension, data }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formatDimensionName = (name) => {
    return name.charAt(0).toUpperCase() + 
           name.slice(1).replace(/([A-Z])/g, ' $1').trim();
  };
  
  const getScoreColor = (score) => {
    if (score >= 70) return 'bg-success-500';
    if (score >= 50) return 'bg-warning-500';
    return 'bg-danger-500';
  };
  
  const getScoreTextColor = (score) => {
    if (score >= 70) return 'text-success-600';
    if (score >= 50) return 'text-warning-600';
    return 'text-danger-600';
  };
  
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">
          {formatDimensionName(dimension)}
        </h4>
        <span className={`text-2xl font-bold ${getScoreTextColor(data.score)}`}>
          {data.score}%
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div 
          className={`h-3 rounded-full transition-all duration-500 ${getScoreColor(data.score)}`}
          style={{ width: `${data.score}%` }}
        />
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-success-50 rounded-lg">
          <CheckCircle className="h-5 w-5 text-success-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-success-700">
            {data.matches?.length || 0}
          </p>
          <p className="text-xs text-success-600">Matches</p>
        </div>
        
        <div className="text-center p-3 bg-danger-50 rounded-lg">
          <XCircle className="h-5 w-5 text-danger-600 mx-auto mb-1" />
          <p className="text-2xl font-bold text-danger-700">
            {data.gaps?.length || 0}
          </p>
          <p className="text-xs text-danger-600">Gaps</p>
        </div>
      </div>
      
      {/* Expandable Details */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <span>View Details</span>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* Matches */}
          {data.matches && data.matches.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                ✓ Matches ({data.matches.length})
              </h5>
              <div className="space-y-1">
                {data.matches.slice(0, 5).map((match, idx) => (
                  <div key={idx} className="flex items-start">
                    <CheckCircle className="h-3 w-3 text-success-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">{match}</p>
                  </div>
                ))}
                {data.matches.length > 5 && (
                  <p className="text-xs text-gray-400 ml-5">
                    +{data.matches.length - 5} more matches
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Gaps */}
          {data.gaps && data.gaps.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                ✗ Gaps ({data.gaps.length})
              </h5>
              <div className="space-y-1">
                {data.gaps.slice(0, 5).map((gap, idx) => (
                  <div key={idx} className="flex items-start">
                    <XCircle className="h-3 w-3 text-danger-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-600">{gap}</p>
                  </div>
                ))}
                {data.gaps.length > 5 && (
                  <p className="text-xs text-gray-400 ml-5">
                    +{data.gaps.length - 5} more gaps
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Special Cases */}
          {dimension === 'education' && data.meetsRequirements !== undefined && (
            <div className={`p-3 rounded-lg ${
              data.meetsRequirements ? 'bg-success-50' : 'bg-warning-50'
            }`}>
              <p className={`text-sm font-medium ${
                data.meetsRequirements ? 'text-success-800' : 'text-warning-800'
              }`}>
                {data.meetsRequirements 
                  ? '✓ Meets education requirements'
                  : '⚠ Additional education may be beneficial'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DimensionCard;