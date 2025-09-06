import React from 'react';

const ErrorMessage = ({ 
  error, 
  onRetry, 
  onDismiss, 
  variant = 'error', 
  showDetails = false 
}) => {
  if (!error) return null;

  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    return 'An unexpected error occurred';
  };

  const getVariantClass = (variant) => {
    const variants = {
      error: 'error-message--error',
      warning: 'error-message--warning', 
      info: 'error-message--info'
    };
    return variants[variant] || variants.error;
  };

  return (
    <div className={`error-message ${getVariantClass(variant)}`}>
      <div className="error-message__content">
        <div className="error-message__icon">
          {variant === 'error' && '❌'}
          {variant === 'warning' && '⚠️'}
          {variant === 'info' && 'ℹ️'}
        </div>
        
        <div className="error-message__text">
          <p className="error-message__primary">
            {getErrorMessage(error)}
          </p>
          
          {showDetails && error?.stack && (
            <details className="error-message__details">
              <summary>Technical Details</summary>
              <pre className="error-message__stack">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </div>
      
      <div className="error-message__actions">
        {onRetry && (
          <button 
            onClick={onRetry}
            className="btn btn-sm btn-primary"
          >
            Retry
          </button>
        )}
        
        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="btn btn-sm btn-secondary"
            aria-label="Dismiss error"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;