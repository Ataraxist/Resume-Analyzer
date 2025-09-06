import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ResumeUpload from '../components/resume/ResumeUpload';
import ProcessingStatus from '../components/resume/ProcessingStatus';
import ResumeViewer from '../components/resume/ResumeViewer';
import PreviousResumes from '../components/resume/PreviousResumes';
import resumeService from '../services/resumeService';
import { Briefcase, ArrowLeft, Upload } from 'lucide-react';

function UploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [structuredData, setStructuredData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshResumes, setRefreshResumes] = useState(0);
  
  useEffect(() => {
    // Check if occupation was selected
    const occupation = location.state?.selectedOccupation || 
                      JSON.parse(sessionStorage.getItem('selectedOccupation') || 'null');
    
    if (!occupation) {
      // No occupation selected, redirect to job selection
      navigate('/jobs');
    } else {
      setSelectedOccupation(occupation);
    }
  }, [location, navigate]);
  
  const handleUpload = async (file) => {
    try {
      setError(null);
      setProcessingStatus('uploading');
      
      // Upload resume
      const uploadResult = await resumeService.uploadResume(file);
      setResumeId(uploadResult.resumeId);
      setProcessingStatus('processing');
      
      // Poll for processing status
      const statusResult = await resumeService.pollStatus(uploadResult.resumeId);
      
      if (statusResult.status === 'completed') {
        setProcessingStatus('completed');
        
        // Get structured data
        const structured = await resumeService.getStructuredData(uploadResult.resumeId);
        setStructuredData(structured);
        
        // Trigger refresh of previous resumes list
        setRefreshResumes(prev => prev + 1);
      } else {
        throw new Error('Resume processing failed');
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
      setProcessingStatus('failed');
    }
  };
  
  const handleSelectPreviousResume = (resumeData) => {
    // Set the resume data from the selected previous resume
    setResumeId(resumeData.resumeId);
    setStructuredData(resumeData.structuredData);
    setProcessingStatus('completed');
    setError(null);
  };
  
  const handleContinue = () => {
    if (resumeId && selectedOccupation) {
      // Go directly to analysis with both resume and job selected
      navigate('/analysis', { 
        state: { 
          resumeId, 
          structuredData,
          selectedOccupation 
        } 
      });
    }
  };
  
  const handleReset = () => {
    setResumeId(null);
    setProcessingStatus(null);
    setStructuredData(null);
    setError(null);
  };
  
  return (
    <>
      {/* Show upload interface when no resume is uploaded */}
      {!structuredData && (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
          <div className="w-full max-w-2xl">
            {/* Selected Job Banner */}
            {selectedOccupation && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Briefcase className="h-5 w-5 text-primary-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Target Job:</p>
                      <p className="font-semibold text-gray-900">{selectedOccupation.title}</p>
                    </div>
                  </div>
                  <Link
                    to="/jobs"
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Change job
                  </Link>
                </div>
              </div>
            )}
            
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Resume</h1>
              <p className="text-gray-600">
                Upload your resume to compare against <span className="font-medium">{selectedOccupation?.title || 'your selected job'}</span>.
                We support PDF, DOCX, and TXT formats.
              </p>
            </div>
            
            {!processingStatus && (
              <>
                <ResumeUpload onUpload={handleUpload} />
                
                {/* Show previous resumes below the upload box */}
                <div className="mt-6">
                  <PreviousResumes 
                    onSelectResume={handleSelectPreviousResume}
                    onRefresh={refreshResumes}
                  />
                </div>
              </>
            )}
            
            {processingStatus && !structuredData && (
              <ProcessingStatus 
                status={processingStatus}
                error={error}
                onReset={handleReset}
              />
            )}
          </div>
        </div>
      )}
      
      {/* Show full-width resume viewer when resume is uploaded */}
      {structuredData && (
        <div className="max-w-7xl mx-auto px-4">
          {/* Header with upload new document button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {selectedOccupation && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-2">
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 text-primary-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{selectedOccupation.title}</span>
                  </div>
                </div>
              )}
              <Link
                to="/jobs"
                className="flex items-center text-sm text-primary-600 hover:text-primary-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Change job
              </Link>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleReset}
                className="btn btn-secondary flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload New Document
              </button>
              
              <button
                onClick={handleContinue}
                className="btn btn-primary"
              >
                Continue to Analysis
              </button>
            </div>
          </div>
          
          {/* Full-width resume viewer */}
          <ResumeViewer data={structuredData} resumeId={resumeId} editable={true} />
        </div>
      )}
    </>
  );
}

export default UploadPage;