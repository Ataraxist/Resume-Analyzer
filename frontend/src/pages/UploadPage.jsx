import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResumeUpload from '../components/resume/ResumeUpload';
import ProcessingStatus from '../components/resume/ProcessingStatus';
import ResumeViewer from '../components/resume/ResumeViewer';
import resumeService from '../services/resumeService';

function UploadPage() {
  const navigate = useNavigate();
  const [resumeId, setResumeId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [structuredData, setStructuredData] = useState(null);
  const [error, setError] = useState(null);
  
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
      } else {
        throw new Error('Resume processing failed');
      }
    } catch (err) {
      setError(err.message || 'Upload failed');
      setProcessingStatus('failed');
    }
  };
  
  const handleContinue = () => {
    if (resumeId) {
      navigate('/analysis', { state: { resumeId, structuredData } });
    }
  };
  
  const handleReset = () => {
    setResumeId(null);
    setProcessingStatus(null);
    setStructuredData(null);
    setError(null);
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Resume</h1>
        <p className="text-gray-600">
          Upload your resume to begin the analysis process. We support PDF, DOCX, and TXT formats.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {!processingStatus && (
            <ResumeUpload onUpload={handleUpload} />
          )}
          
          {processingStatus && (
            <ProcessingStatus 
              status={processingStatus}
              error={error}
              onReset={handleReset}
            />
          )}
          
          {processingStatus === 'completed' && (
            <div className="mt-6">
              <button
                onClick={handleContinue}
                className="w-full btn btn-primary"
              >
                Continue to Occupation Selection
              </button>
            </div>
          )}
        </div>
        
        <div>
          {structuredData && (
            <ResumeViewer data={structuredData} />
          )}
        </div>
      </div>
    </div>
  );
}

export default UploadPage;