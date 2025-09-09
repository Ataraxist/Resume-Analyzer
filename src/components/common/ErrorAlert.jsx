import { XCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';

function ErrorAlert({ type = 'error', title, message, onClose }) {
  const config = {
    error: {
      icon: XCircle,
      bgColor: 'bg-danger-50',
      borderColor: 'border-danger-200',
      iconColor: 'text-danger-600',
      titleColor: 'text-danger-800',
      messageColor: 'text-danger-700'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      iconColor: 'text-warning-600',
      titleColor: 'text-warning-800',
      messageColor: 'text-warning-700'
    },
    info: {
      icon: Info,
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      iconColor: 'text-primary-600',
      titleColor: 'text-primary-800',
      messageColor: 'text-primary-700'
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-success-50',
      borderColor: 'border-success-200',
      iconColor: 'text-success-600',
      titleColor: 'text-success-800',
      messageColor: 'text-success-700'
    }
  };
  
  const alertConfig = config[type] || config.error;
  const Icon = alertConfig.icon;
  
  return (
    <div className={`p-4 rounded-lg border ${alertConfig.bgColor} ${alertConfig.borderColor}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${alertConfig.iconColor}`} />
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${alertConfig.titleColor}`}>
              {title}
            </h3>
          )}
          {message && (
            <p className={`text-sm mt-1 ${alertConfig.messageColor}`}>
              {message}
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0"
          >
            <span className="sr-only">Close</span>
            <XCircle className={`h-5 w-5 ${alertConfig.iconColor} hover:opacity-70`} />
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorAlert;