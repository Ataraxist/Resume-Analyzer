import { CheckCircle, XCircle, Loader2, Upload } from 'lucide-react';

function ProcessingStatus({ status, error, onReset }) {
  const statusConfig = {
    uploading: {
      icon: Upload,
      color: 'primary',
      title: 'Uploading Resume',
      description: 'Your resume is being uploaded...'
    },
    processing: {
      icon: Loader2,
      color: 'primary',
      title: 'Processing Resume',
      description: 'AI is extracting and structuring your resume data...'
    },
    completed: {
      icon: CheckCircle,
      color: 'success',
      title: 'Processing Complete',
      description: 'Your resume has been successfully processed!'
    },
    failed: {
      icon: XCircle,
      color: 'danger',
      title: 'Processing Failed',
      description: error || 'An error occurred while processing your resume.'
    }
  };
  
  const config = statusConfig[status] || statusConfig.processing;
  const Icon = config.icon;
  
  return (
    <div className="card">
      <div className="flex flex-col items-center text-center">
        <div className={`p-4 rounded-full mb-4 bg-${config.color}-100`}>
          <Icon 
            className={`h-12 w-12 text-${config.color}-600 ${
              status === 'processing' ? 'animate-spin' : ''
            }`} 
          />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {config.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-6">
          {config.description}
        </p>
        
        {status === 'processing' && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        )}
        
        {status === 'failed' && (
          <button
            onClick={onReset}
            className="btn btn-secondary"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export default ProcessingStatus;