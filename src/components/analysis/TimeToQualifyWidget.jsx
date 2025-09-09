import { Clock, TrendingUp, Calendar, CheckCircle } from 'lucide-react';

function TimeToQualifyWidget({ timeToQualify }) {
  if (!timeToQualify) return null;

  const { totalMonths, timeEstimates, qualificationLevel } = timeToQualify;

  const getQualificationColor = (level) => {
    const colors = {
      'Ready Now': 'text-green-600 bg-green-50 border-green-200',
      'Nearly Ready': 'text-blue-600 bg-blue-50 border-blue-200',
      'Short-term Development': 'text-indigo-600 bg-indigo-50 border-indigo-200',
      'Medium-term Development': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'Long-term Development': 'text-orange-600 bg-orange-50 border-orange-200',
      'Extended Preparation Required': 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[level] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const formatTimeframe = (months) => {
    if (months === 0) return 'Ready now';
    if (months < 12) return `${months} month${months > 1 ? 's' : ''}`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Clock className="h-5 w-5 mr-2 text-primary-600" />
          Time to Qualify
        </h3>
        <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getQualificationColor(qualificationLevel)}`}>
          {qualificationLevel}
        </span>
      </div>

      {totalMonths === 0 ? (
        <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <p className="font-medium text-green-900">You're ready to apply!</p>
            <p className="text-sm text-green-700 mt-1">
              You meet all the requirements for this position.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Estimated preparation time</span>
              <span className="text-lg font-bold text-gray-900">
                {formatTimeframe(totalMonths)}
              </span>
            </div>
            
            {/* Progress bar visualization */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.max(5, Math.min(95, 100 - (totalMonths / 48) * 100))}%` 
                }}
              />
            </div>
          </div>

          {/* Breakdown by category */}
          {timeEstimates && timeEstimates.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Development Timeline</h4>
              {timeEstimates.map((estimate, idx) => (
                <div key={idx} className="flex items-start">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {estimate.category}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatTimeframe(estimate.months)}
                      </span>
                    </div>
                    {estimate.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {estimate.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Encouragement message */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start">
              <TrendingUp className="h-4 w-4 text-blue-600 mr-2 mt-0.5" />
              <p className="text-sm text-blue-900">
                {totalMonths <= 6 
                  ? "You're close! A focused effort can get you qualified quickly."
                  : totalMonths <= 12
                  ? "With consistent development, you can reach your goal within a year."
                  : "This is a longer-term goal, but every step forward counts. Start with the high-priority recommendations."}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TimeToQualifyWidget;