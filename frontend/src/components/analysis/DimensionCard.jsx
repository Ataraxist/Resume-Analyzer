import { CheckCircle, XCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

function DimensionCard({ dimension, data }) {
  const formatDimensionName = (name) => {
    return name.charAt(0).toUpperCase() + 
           name.slice(1).replace(/([A-Z])/g, ' $1').trim();
  };
  
  // Determine gap priority
  const getGapPriority = () => {
    if (data.score < 50 && ['tasks', 'skills'].includes(dimension)) {
      return { level: 'critical', icon: AlertCircle, color: 'text-danger-600', bgColor: 'bg-danger-50' };
    } else if (data.score < 70 && ['education', 'tools', 'workActivities'].includes(dimension)) {
      return { level: 'important', icon: AlertTriangle, color: 'text-warning-600', bgColor: 'bg-warning-50' };
    } else {
      return { level: 'nice-to-have', icon: Info, color: 'text-primary-600', bgColor: 'bg-primary-50' };
    }
  };
  
  const gapPriority = data.gaps && data.gaps.length > 0 ? getGapPriority() : null;
  
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
      {/* Header with dimension name and score */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">
          O*NET Occupation {formatDimensionName(dimension)} Overlap
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
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-success-600" />
          <span className="text-sm font-medium text-gray-700">
            Matches: <span className="font-bold text-success-700">{data.matches?.length || 0}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-danger-600" />
          <span className="text-sm font-medium text-gray-700">
            Gaps: <span className="font-bold text-danger-700">{data.gaps?.length || 0}</span>
          </span>
          {gapPriority && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              gapPriority.level === 'critical' ? 'bg-danger-100 text-danger-800' :
              gapPriority.level === 'important' ? 'bg-warning-100 text-warning-800' :
              'bg-primary-100 text-primary-800'
            }`}>
              {gapPriority.level === 'critical' ? 'Critical' :
               gapPriority.level === 'important' ? 'Important' :
               'Nice to Have'}
            </span>
          )}
        </div>
      </div>
      
      {/* Side-by-side Matches and Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
        {/* Matches Column */}
        <div>
          {data.matches && data.matches.length > 0 ? (
            <div className="space-y-2">
              {data.matches.map((match, idx) => (
                <div key={idx} className="flex items-start">
                  <CheckCircle className="h-3 w-3 text-success-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">{match}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No matches found</p>
          )}
        </div>
        
        {/* Gaps Column */}
        <div>
          {data.gaps && data.gaps.length > 0 ? (
            <div className="space-y-2">
              {data.gaps.map((gap, idx) => {
                const GapIcon = gapPriority?.icon || XCircle;
                const iconColor = gapPriority?.color || 'text-danger-500';
                return (
                  <div key={idx} className="flex items-start">
                    <GapIcon className={`h-3 w-3 ${iconColor} mr-2 mt-0.5 flex-shrink-0`} />
                    <p className="text-sm text-gray-600">{gap}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No gaps identified</p>
          )}
        </div>
      </div>
      
      {/* Special Cases for Education */}
      {dimension === 'education' && data.meetsRequirements !== undefined && (
        <div className={`mt-4 p-3 rounded-lg ${
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
  );
}

export default DimensionCard;