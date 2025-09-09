import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { formatFieldName, formatDimensionName } from '../../utils/statusFormatters';

function StreamingStatusDisplay({ 
  currentOperation, 
  completedOperations = [], 
  pendingOperations = [],
  progress = 0,
  type = 'parsing' // 'parsing' or 'analysis'
}) {
  const formatter = type === 'parsing' ? formatFieldName : formatDimensionName;
  
  // Combine all operations for display
  const allOperations = [
    ...completedOperations.map(op => ({ name: op, status: 'completed' })),
    ...(currentOperation ? [{ name: currentOperation, status: 'in_progress' }] : []),
    ...pendingOperations.map(op => ({ name: op, status: 'pending' }))
  ];

  return (
    <div className="w-full space-y-4">
      {/* Current Status Message */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-900">
          {currentOperation ? (
            <>
              {type === 'parsing' ? 'Parsing' : 'Analyzing'} {formatter(currentOperation)}...
            </>
          ) : (
            <>
              {type === 'parsing' ? 'Preparing to parse resume' : 'Preparing analysis'}...
            </>
          )}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Operations Checklist */}
      {allOperations.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            {type === 'parsing' ? 'Parsing Steps' : 'Analysis Dimensions'}
          </h4>
          <div className="space-y-2">
            {allOperations.map((operation, index) => (
              <div 
                key={`${operation.name}-${index}`}
                className="flex items-center space-x-2"
              >
                {operation.status === 'completed' && (
                  <>
                    <CheckCircle className="h-4 w-4 text-success-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700 line-through">
                      {formatter(operation.name)}
                    </span>
                  </>
                )}
                {operation.status === 'in_progress' && (
                  <>
                    <Loader2 className="h-4 w-4 text-primary-600 animate-spin flex-shrink-0" />
                    <span className="text-sm font-medium text-primary-700">
                      {formatter(operation.name)}
                    </span>
                  </>
                )}
                {operation.status === 'pending' && (
                  <>
                    <Circle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-500">
                      {formatter(operation.name)}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default StreamingStatusDisplay;