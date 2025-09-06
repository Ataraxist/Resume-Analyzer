import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Splash.css';

const Splash = () => {
  const navigate = useNavigate();
  //get all job listings and store in this state
  const [jobListings, setJobListings] = useState([]);

  useEffect(() => {
    const fetchJobListings = async () => {
      try {
        const response = await fetch('http://localhost:3000/job/titles');
        const data = await response.json();
        const formattedJobs = data.map((job) => ({
          onetsoc_code: job.onetsoc_code,
          title: job.title,
        }));

        setJobListings(formattedJobs);
      } catch (error) {
        console.log('Error fetching job listings:', error);
        setJobListings([]);
      }
    };
    fetchJobListings();
  }, []);

  //navigate after time period
  useEffect(() => {
    // Delay navigation to allow time for the animation
    const timer = setTimeout(() => {
      navigate('/dashboard', { state: { jobListings } });
    }, 10000); // Adjust time as needed for your animation
    return () => clearTimeout(timer);
  }, [navigate, jobListings]);

  return (
    <div className='splash-screen'>
      <div className='logo'>ResumeReview</div>
      <p className='tagline'>Sharper Resumes, Smarter Careers</p>
      <p className='description'>
        Welcome to ResumeReview – your AI-powered career companion. We're
        analyzing your resume and matching your skills with the best job
        opportunities.
      </p>
    </div>
  );
};

export default Splash;
