import React, { useState } from 'react';
import LoadingSpinner from '../../components/LoadingSpinner';

const AnalysisPanel = ({ analysisData = [], metadata, isLoading }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const handleCategorySelect = (item) => {
    setSelectedCategoryId(selectedCategoryId === item.id ? null : item.id);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-fair';
    return 'score-poor';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Needs Improvement';
    return 'Poor Match';
  };

  if (isLoading) {
    return (
      <div className='analysis-panel'>
        <h3>Analysis Results</h3>
        <LoadingSpinner message="Analyzing your resume..." />
      </div>
    );
  }

  if (!analysisData || analysisData.length === 0) {
    return (
      <div className='analysis-panel'>
        <h3>Analysis Results</h3>
        <div className='analysis-empty'>
          <p>Upload a resume and select a job to see the analysis results.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='analysis-panel'>
      <div className='analysis-header'>
        <h3>Analysis Results</h3>
        {metadata && (
          <div className='analysis-metadata'>
            <span className='metadata-item'>
              Overall Score: <strong className={getScoreColor(metadata.averageScore)}>
                {metadata.averageScore}% ({getScoreLabel(metadata.averageScore)})
              </strong>
            </span>
            <span className='metadata-item'>
              {metadata.totalSections} categories analyzed
            </span>
          </div>
        )}
      </div>
      
      <div className='analysis-items'>
        {analysisData.map((item) => {
          const isActive = item.id === selectedCategoryId;
          return (
            <div
              key={item.id}
              className={`analysis-item ${isActive ? 'active' : ''}`}
              onClick={() => handleCategorySelect(item)}
            >
              <div className='analysis-category'>
                <div className='category-info'>
                  <strong className='category-title'>{item.category}</strong>
                  <span className={`analysis-score ${getScoreColor(item.score)}`}>
                    {item.score}% - {getScoreLabel(item.score)}
                  </span>
                </div>
                <div className='category-toggle'>
                  {isActive ? '▼' : '▶'}
                </div>
              </div>
              
              {isActive && (
                <div className='analysis-details'>
                  <div className='analysis-body'>
                    {item.body}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {metadata && (
        <div className='analysis-footer'>
          <small>
            Analysis completed on {new Date(metadata.timestamp).toLocaleString()}
          </small>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;
