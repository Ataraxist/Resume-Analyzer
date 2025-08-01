import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import useFileUpload from '../../hooks/useFileUpload';
import useResumeAnalysis from '../../hooks/useResumeAnalysis';
import useJobSelection from '../../hooks/useJobSelection';

import Toolbar from './Toolbar';
import ResumeViewer from './ResumeViewer';
import PDFViewer from './PDFViewer';
import AnalysisPanel from './AnalysisPanel';
import DocxToHtml from './DocxToHtml';
import ErrorBoundary from '../../components/ErrorBoundary';
import ErrorMessage from '../../components/ErrorMessage';
import LoadingSpinner from '../../components/LoadingSpinner';

import './Dashboard.css';

const Dashboard = () => {
  const location = useLocation();
  const { setJobListings, setError, clearError } = useAppContext();
  
  // Initialize job listings from location state
  const initialJobListings = location.state?.jobListings || [];
  
  // Custom hooks for state management
  const fileUpload = useFileUpload();
  const resumeAnalysis = useResumeAnalysis();
  const jobSelection = useJobSelection(initialJobListings);

  // Set job listings in global context
  useEffect(() => {
    if (initialJobListings.length > 0) {
      setJobListings(initialJobListings);
    }
  }, [initialJobListings, setJobListings]);

  // Auto-analyze when both resume and job are ready
  useEffect(() => {
    if (fileUpload.hasFile && jobSelection.hasSelectedJob && !resumeAnalysis.isAnalyzing) {
      const resumeData = {
        file: fileUpload.file,
        resumeText: fileUpload.resumeText,
        fileType: fileUpload.fileType,
      };
      
      resumeAnalysis.analyzeResume(resumeData, jobSelection.selectedJob);
    }
  }, [
    fileUpload.hasFile, 
    fileUpload.file, 
    fileUpload.resumeText, 
    fileUpload.fileType,
    jobSelection.hasSelectedJob, 
    jobSelection.selectedJob,
    resumeAnalysis.isAnalyzing
  ]);

  // Handle errors from various hooks
  useEffect(() => {
    const errors = [
      fileUpload.uploadError,
      resumeAnalysis.analysisError,
      jobSelection.jobError
    ].filter(Boolean);

    if (errors.length > 0) {
      setError(errors[0]); // Show the first error
    } else {
      clearError();
    }
  }, [
    fileUpload.uploadError,
    resumeAnalysis.analysisError,
    jobSelection.jobError,
    setError,
    clearError
  ]);

  // Cleanup file URLs on unmount
  useEffect(() => {
    return () => {
      fileUpload.cleanupFileUrl();
    };
  }, [fileUpload.cleanupFileUrl]);

  const handleRetryAnalysis = () => {
    if (fileUpload.hasFile && jobSelection.hasSelectedJob) {
      const resumeData = {
        file: fileUpload.file,
        resumeText: fileUpload.resumeText,
        fileType: fileUpload.fileType,
      };
      
      resumeAnalysis.retryAnalysis(resumeData, jobSelection.selectedJob);
    }
  };

  const renderViewer = () => {
    if (fileUpload.isUploading) {
      return <LoadingSpinner message="Processing your resume..." />;
    }

    switch (fileUpload.fileType) {
      case 'pdf':
        return <PDFViewer pdfUrl={fileUpload.fileUrl} />;
      case 'docx':
        return <DocxToHtml file={fileUpload.file} />;
      case 'text':
      default:
        return <ResumeViewer resumeText={fileUpload.resumeText} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className='dashboard'>
        <Toolbar
          onResumeUpdate={fileUpload.handleTextInput}
          onUploadResume={fileUpload.handleFileUpload}
          onJobSelect={jobSelection.selectJob}
          jobListings={jobSelection.filteredJobListings}
          selectedJob={jobSelection.selectedJob}
          onSearchJobs={jobSelection.searchJobs}
          searchTerm={jobSelection.searchTerm}
          isUploading={fileUpload.isUploading}
        />
        
        <div className='dashboard-content'>
          <div className='dashboard-viewer'>
            {renderViewer()}
          </div>
          
          <div className='dashboard-analysis'>
            {resumeAnalysis.isAnalyzing && (
              <LoadingSpinner 
                message="Analyzing your resume against the job requirements..." 
                size="large"
              />
            )}
            
            {resumeAnalysis.analysisError && (
              <ErrorMessage 
                error={resumeAnalysis.analysisError}
                onRetry={handleRetryAnalysis}
                onDismiss={resumeAnalysis.clearAnalysis}
              />
            )}
            
            <AnalysisPanel 
              analysisData={resumeAnalysis.analysisData}
              metadata={resumeAnalysis.analysisMetadata}
              isLoading={resumeAnalysis.isAnalyzing}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
