import React, { useState, useEffect } from 'react';

const JobListings = ({ onJobSelect, jobListings }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredJobs, setFilteredJobs] = useState([]);

  useEffect(() => {
    if (!jobListings) return;

    const results = jobListings.filter((job) => {
      return job.title.toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredJobs(results);
  }, [searchQuery, jobListings]);

  const handleSelect = (job) => {
    console.log('Job selected:', job.title); // This should log whenever a job is clicked
    setSearchQuery(job.title); // Update the search query with the selected job's title
    onJobSelect(job); // Notify the parent (Dashboard) with the selected job
  };

  return (
    <div className='job-search'>
      <input
        type='text'
        placeholder='Search job listings'
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {filteredJobs.length > 0 && (
        <ul className='job-results'>
          {filteredJobs.map((job) => (
            <li key={job.onetsoc_code} onClick={() => handleSelect(job)}>
              {job.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default JobListings;
