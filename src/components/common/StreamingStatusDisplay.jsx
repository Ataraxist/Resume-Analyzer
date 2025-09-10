import { Compass } from 'lucide-react';
import { formatFieldName, formatDimensionName } from '../../utils/statusFormatters';

function StreamingStatusDisplay({ 
  currentOperation, 
  progress = 0,
  type = 'parsing' // 'parsing' or 'analysis'
}) {
  const formatter = type === 'parsing' ? formatFieldName : formatDimensionName;
  
  // Determine the action verb based on type
  const actionVerb = type === 'parsing' ? 'Extracting' : 'Analyzing';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Semi-transparent backdrop */}
      <div className="absolute inset-0 bg-black/20" style={{ backdropFilter: 'blur(2px)' }} />
      
      {/* Floating progress card */}
      <div className="relative bg-white rounded-lg shadow-2xl border border-gray-200 p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Spinner Icon */}
          <div className="relative">
            <Compass className="h-10 w-10 text-primary-600 animate-spin" />
            <div className="absolute inset-0 h-10 w-10 bg-primary-600 opacity-20 rounded-full animate-ping" />
          </div>
          
          {/* Status Text */}
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 transition-all duration-300">
              {currentOperation ? (
                <>
                  {actionVerb} {formatter(currentOperation)}...
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
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-primary-600 h-full rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
            </div>
            <p className="text-center mt-2 text-sm text-gray-500">
              {Math.round(progress)}% complete
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StreamingStatusDisplay;