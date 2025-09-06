import React from 'react';

const ResumeViewer = ({ resumeText }) => {
  return (
    <div className='resume-viewer'>
      <h3>{resumeText}</h3>
      <div className='resume-content'></div>
    </div>
  );
};

export default ResumeViewer;
