import { useState, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const useResumeAnalysis = () => {
  const [analysisData, setAnalysisData] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisMetadata, setAnalysisMetadata] = useState(null);

  const analyzeResume = useCallback(async (resumeData, selectedJob) => {
    if (!selectedJob) {
      setAnalysisError('Please select a job before analyzing your resume');
      return;
    }

    if (!resumeData.file && !resumeData.resumeText) {
      setAnalysisError('Please upload a resume or enter resume text before analyzing');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisData([]);

    try {
      const formData = new FormData();
      formData.append('onetsoc_code', selectedJob.onetsoc_code);

      // Add resume data based on type
      if (resumeData.resumeText) {
        formData.append('resumeText', resumeData.resumeText);
      } else if (resumeData.file) {
        formData.append('resumeFile', resumeData.file);
      }

      console.log('Analyzing resume with job:', selectedJob.title);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalysisData(data.analysis || []);
        setAnalysisMetadata(data.metadata || null);
        console.log('Analysis completed successfully');
      } else {
        throw new Error(data.message || 'Analysis failed');
      }

    } catch (error) {
      console.error('Error analyzing resume:', error);
      setAnalysisError(error.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysisData([]);
    setAnalysisError(null);
    setAnalysisMetadata(null);
  }, []);

  const retryAnalysis = useCallback((resumeData, selectedJob) => {
    analyzeResume(resumeData, selectedJob);
  }, [analyzeResume]);

  return {
    analysisData,
    analysisMetadata,
    isAnalyzing,
    analysisError,
    analyzeResume,
    clearAnalysis,
    retryAnalysis,
    hasAnalysis: analysisData.length > 0,
  };
};

export default useResumeAnalysis;