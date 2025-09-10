import { CheckCircle, XCircle, AlertCircle, AlertTriangle, Info, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { normalizeDimensionScore } from '../../utils/analysisDataNormalizer';
import { formatDimensionName } from '../../utils/statusFormatters';

function DimensionCard({ dimension, data }) {
  // Normalize the data to ensure consistent structure
  const normalizedData = normalizeDimensionScore(data);
  const score = normalizedData.score;
  const matches = normalizedData.matches;
  const gaps = normalizedData.gaps;
  const confidence = data.confidence || 'medium';
  
  // Get confidence display info
  const getConfidenceInfo = () => {
    switch (confidence) {
      case 'high':
        return {
          icon: ShieldCheck,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          label: 'High Confidence',
          tooltip: 'Strong evidence found for assessment accuracy'
        };
      case 'medium':
        return {
          icon: Shield,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          label: 'Medium Confidence',
          tooltip: 'Moderate evidence found for assessment accuracy'
        };
      case 'low':
        return {
          icon: ShieldAlert,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          label: 'Low Confidence',
          tooltip: 'Limited evidence available for assessment'
        };
      default:
        return {
          icon: Shield,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          label: 'Confidence Unknown',
          tooltip: 'Assessment confidence not determined'
        };
    }
  };
  
  const confidenceInfo = getConfidenceInfo();
  
  // Determine gap priority
  const getGapPriority = () => {
    if (score < 50 && ['skills', 'experience'].includes(dimension)) {
      return { level: 'critical', icon: AlertCircle, color: 'text-danger-600', bgColor: 'bg-danger-50' };
    } else if (score < 70 && ['education', 'abilities', 'knowledge'].includes(dimension)) {
      return { level: 'important', icon: AlertTriangle, color: 'text-warning-600', bgColor: 'bg-warning-50' };
    } else {
      return { level: 'nice-to-have', icon: Info, color: 'text-primary-600', bgColor: 'bg-primary-50' };
    }
  };
  
  const gapPriority = gaps && gaps.length > 0 ? getGapPriority() : null;
  
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
  
  const ConfidenceIcon = confidenceInfo.icon;
  
  return (
    <div className="card">
      {/* Header with dimension name and score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h4 className="text-lg font-semibold text-gray-900">
            O*NET Occupation {formatDimensionName(dimension)} Overlap
          </h4>
          <div className="group relative">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${confidenceInfo.bgColor}`}>
              <ConfidenceIcon className={`h-4 w-4 ${confidenceInfo.color}`} />
              <span className={`text-xs font-medium ${confidenceInfo.color}`}>
                {confidenceInfo.label}
              </span>
            </div>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
              {confidenceInfo.tooltip}
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                <div className="border-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
        </div>
        <span className={`text-2xl font-bold ${getScoreTextColor(score)}`}>
          {score}%
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div 
          className={`h-3 rounded-full transition-all duration-500 ${getScoreColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      
      {/* Summary Stats */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-success-600" />
          <span className="text-sm font-medium text-gray-700">
            Matches: <span className="font-bold text-success-700">{matches?.length || 0}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-danger-600" />
          <span className="text-sm font-medium text-gray-700">
            Gaps: <span className="font-bold text-danger-700">{gaps?.length || 0}</span>
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
      
      {/* Confidence explanation for low confidence */}
      {confidence === 'low' && (
        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex gap-2">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Low assessment confidence:</span> Your resume may not contain explicit evidence for all {formatDimensionName(dimension).toLowerCase()} requirements. Consider adding more specific examples and details related to this area to improve assessment accuracy.
            </p>
          </div>
        </div>
      )}
      
      {/* Side-by-side Matches and Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
        {/* Matches Column */}
        <div>
          {matches && matches.length > 0 ? (
            <div className="space-y-2">
              {matches.map((match, idx) => (
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
          {gaps && gaps.length > 0 ? (
            <div className="space-y-2">
              {gaps.map((gap, idx) => {
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
    </div>
  );
}

export default DimensionCard;