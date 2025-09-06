import React, { useState } from 'react';
import JobListings from './JobListings';

const Toolbar = ({
  onResumeUpdate,
  onUploadResume,
  onJobSelect,
  jobListings,
}) => {
  const [tempResumeText, setTempResumeText] = useState('');

  const handleTextChange = (e) => {
    setTempResumeText(e.target.value);
  };

  const handleUpdateClick = () => {
    onResumeUpdate(tempResumeText);
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUploadResume(e.target.files[0]);
    }
  };

  return (
    <div className='toolbar'>
      <div className='toolbar-left'>
        <input
          type='file'
          accept='.txt,.pdf,.docx'
          onChange={handleFileUpload}
        />
        <input
          type='text'
          placeholder='Paste or type resume text here...'
          value={tempResumeText}
          onChange={handleTextChange}
        />
        <button onClick={handleUpdateClick}>Update Resume</button>
      </div>
      <div className='toolbar-right'>
        <JobListings onJobSelect={onJobSelect} jobListings={jobListings} />
      </div>
    </div>
  );
};

export default Toolbar;
