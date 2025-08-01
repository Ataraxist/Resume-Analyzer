import React from 'react';

const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Loading...', 
  overlay = false,
  className = '' 
}) => {
  const getSizeClass = (size) => {
    const sizes = {
      small: 'loading-spinner--small',
      medium: 'loading-spinner--medium',
      large: 'loading-spinner--large'
    };
    return sizes[size] || sizes.medium;
  };

  const spinner = (
    <div className={`loading-spinner ${getSizeClass(size)} ${className}`}>
      <div className="loading-spinner__circle">
        <div className="loading-spinner__dot loading-spinner__dot--1"></div>
        <div className="loading-spinner__dot loading-spinner__dot--2"></div>
        <div className="loading-spinner__dot loading-spinner__dot--3"></div>
      </div>
      {message && (
        <p className="loading-spinner__message">{message}</p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="loading-overlay">
        <div className="loading-overlay__backdrop"></div>
        <div className="loading-overlay__content">
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;