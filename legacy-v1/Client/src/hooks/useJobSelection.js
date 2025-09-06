import { useState, useCallback, useMemo } from 'react';

const useJobSelection = (initialJobListings = []) => {
  const [jobListings] = useState(initialJobListings);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [jobError, setJobError] = useState(null);

  // Filter job listings based on search term
  const filteredJobListings = useMemo(() => {
    if (!searchTerm.trim()) {
      return jobListings;
    }

    const term = searchTerm.toLowerCase();
    return jobListings.filter(job => 
      job.title?.toLowerCase().includes(term) ||
      job.description?.toLowerCase().includes(term) ||
      job.onetsoc_code?.toLowerCase().includes(term)
    );
  }, [jobListings, searchTerm]);

  const selectJob = useCallback((job) => {
    if (!job) {
      setJobError('Invalid job selection');
      return;
    }

    console.log('Selected job:', job.title || job.onetsoc_code);
    setSelectedJob(job);
    setJobError(null);
  }, []);

  const clearJobSelection = useCallback(() => {
    setSelectedJob(null);
    setJobError(null);
  }, []);

  const searchJobs = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Load jobs from API (for future implementation)
  const loadJobs = useCallback(async (searchQuery) => {
    setIsLoadingJobs(true);
    setJobError(null);

    try {
      // TODO: Implement API call to fetch job listings
      // This would replace the static job listings passed from Splash page
      console.log('Loading jobs for query:', searchQuery);
      
      // Placeholder for API implementation
      // const response = await fetch(`/api/jobs/search?q=${encodeURIComponent(searchQuery)}`);
      // const data = await response.json();
      // setJobListings(data.jobs);
      
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobError('Failed to load job listings. Please try again.');
    } finally {
      setIsLoadingJobs(false);
    }
  }, []);

  return {
    jobListings,
    filteredJobListings,
    selectedJob,
    searchTerm,
    isLoadingJobs,
    jobError,
    selectJob,
    clearJobSelection,
    searchJobs,
    clearSearch,
    loadJobs,
    hasJobListings: jobListings.length > 0,
    hasSelectedJob: !!selectedJob,
  };
};

export default useJobSelection;