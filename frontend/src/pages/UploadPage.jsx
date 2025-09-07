import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ResumeUpload from '../components/resume/ResumeUpload';
import ProcessingStatus from '../components/resume/ProcessingStatus';
import ResumeViewer from '../components/resume/ResumeViewer';
import PreviousResumes from '../components/resume/PreviousResumes';
import resumeService from '../services/resumeService';
import { Briefcase, ArrowLeft, Upload, Info } from 'lucide-react';

// Whimsical loading messages
const loadingMessages = [
  'Reticulating splines...',
  'Calibrating quantum flux capacitors...',
  'Harmonizing temporal matrices...',
  'Initializing synergy protocols...',
  'Defragmenting neural pathways...',
  'Optimizing blockchain parameters...',
  'Synthesizing digital essence...',
  'Triangulating career vectors...',
  'Compiling professional aura...',
  'Reversing polarity of skill nodes...',
  'Energizing talent crystals...',
  'Aligning chakra databases...',
  'Parsing excellence wavelengths...',
  'Quantizing achievement particles...',
  'Virtualizing competency cores...',
  'Bootstrapping wisdom engines...',
  'Normalizing experience gradients...',
  'Tokenizing professional karma...',
  'Computing destiny algorithms...',
  'Activating neural handshake...',
  'Establishing quantum entanglement...',
  'Downloading more RAM...',
  'Consulting the ancient scrolls...',
  'Appeasing the algorithm gods...',
  'Charging talent capacitors...'
];

function UploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [structuredData, setStructuredData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshResumes, setRefreshResumes] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  
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

  // Rotate through whimsical messages during processing
  useEffect(() => {
    if (processingStatus === 'processing') {
      // Start with a random message
      let messageIndex = Math.floor(Math.random() * loadingMessages.length);
      setCurrentStatus(loadingMessages[messageIndex]);
      
      // Rotate through messages
      const timer = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setCurrentStatus(loadingMessages[messageIndex]);
      }, 2500); // Change every 2.5 seconds
      
      return () => clearInterval(timer);
    } else {
      setCurrentStatus('');
    }
  }, [processingStatus]);
  
  const handleUpload = async (file) => {
    try {
      setError(null);
      setProcessingStatus('uploading');
      
      // Upload resume
      const uploadResult = await resumeService.uploadResume(file);
      setResumeId(uploadResult.resumeId);
      setProcessingStatus('processing');
      
      // Initialize empty structured data for progressive updates
      setStructuredData({
        detected_profession: null,
        personal_information: null,
        education: [],
        experience: [],
        skills: null,
        achievements: null,
        credentials: null,
        summary: null
      });
      
      // Stream parsing results
      const cleanup = resumeService.streamParsing(
        uploadResult.resumeId,
        // On field update
        (field, value) => {
          setStructuredData(prev => ({
            ...prev,
            [field]: value
          }));
        },
        // On complete
        (finalData) => {
          setStructuredData(finalData);
          setProcessingStatus('completed');
          // Trigger refresh of previous resumes list
          setRefreshResumes(prev => prev + 1);
        },
        // On error
        (errorMessage) => {
          setError(errorMessage);
          setProcessingStatus('failed');
        }
      );
      
      // Store cleanup function for component unmount
      return cleanup;
    } catch (err) {
      setError(err.message || 'Upload failed');
      setProcessingStatus('failed');
    }
  };
  
  const handleGoogleDocsImport = async (url) => {
    try {
      setError(null);
      setProcessingStatus('uploading');
      
      // Import from Google Docs
      const importResult = await resumeService.importFromGoogleDoc(url);
      setResumeId(importResult.resumeId);
      setProcessingStatus('processing');
      
      // Initialize empty structured data for progressive updates
      setStructuredData({
        detected_profession: null,
        personal_information: null,
        education: [],
        experience: [],
        skills: null,
        achievements: null,
        credentials: null,
        summary: null
      });
      
      // Stream parsing results
      const cleanup = resumeService.streamParsing(
        importResult.resumeId,
        // On field update
        (field, value) => {
          setStructuredData(prev => ({
            ...prev,
            [field]: value
          }));
        },
        // On complete
        (finalData) => {
          setStructuredData(finalData);
          setProcessingStatus('completed');
          // Trigger refresh of previous resumes list
          setRefreshResumes(prev => prev + 1);
        },
        // On error
        (errorMessage) => {
          setError(errorMessage);
          setProcessingStatus('failed');
        }
      );
      
      // Store cleanup function for component unmount
      return cleanup;
    } catch (err) {
      setError(err.message || 'Google Docs import failed');
      setProcessingStatus('failed');
      throw err; // Re-throw to be caught by ResumeUpload component
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
      // Go to analysis with all necessary data for streaming
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
      {/* Show upload interface when no resume is being processed */}
      {!structuredData && processingStatus !== 'processing' && (
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
                <ResumeUpload 
                  onUpload={handleUpload} 
                  onGoogleDocsImport={handleGoogleDocsImport}
                />
                
                {/* Show previous resumes below the upload box */}
                <div className="mt-6">
                  <PreviousResumes 
                    onSelectResume={handleSelectPreviousResume}
                    onRefresh={refreshResumes}
                  />
                </div>
              </>
            )}
            
          </div>
        </div>
      )}
      
      {/* Show full-width resume viewer when resume is uploaded or being processed */}
      {(structuredData || processingStatus === 'processing') && (
        <div className="max-w-7xl mx-auto px-4">
          {/* Whimsical Processing Status Banner */}
          {processingStatus === 'processing' && currentStatus && (
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-11/12 md:w-auto max-w-md animate-fade-in">
              <div className="bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-200 rounded-full shadow-lg px-4 md:px-6 py-2 md:py-3">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-200 border-t-primary-600"></div>
                    <div className="absolute inset-0 animate-ping rounded-full h-5 w-5 border border-primary-400 opacity-20"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 italic">
                    {currentStatus}
                  </span>
                  
                  {/* Info icon with tooltip */}
                  <div className="relative">
                    <button
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      onClick={() => setShowTooltip(!showTooltip)}
                      className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                      aria-label="What's happening?"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                    
                    {/* Tooltip */}
                    {showTooltip && (
                      <div className="absolute md:left-1/2 md:transform md:-translate-x-1/2 right-0 md:right-auto top-8 w-72 max-w-[calc(100vw-2rem)] p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10">
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-gray-900"></div>
                        <p className="font-semibold mb-1">What's actually happening:</p>
                        <p className="leading-relaxed">
                          Our AI is analyzing your resume text and extracting structured data 
                          (contact info, experience, skills, education, etc.) into a standardized 
                          format. This allows us to perform detailed comparisons with job requirements 
                          and provide personalized recommendations.
                        </p>
                        <p className="mt-2 text-gray-300 text-[10px]">
                          The fun messages are just for entertainment while you wait!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {processingStatus === 'processing' && (
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-primary-400 to-indigo-500 h-1.5 rounded-full animate-pulse"
                     style={{
                       width: `${Math.min((Object.keys(structuredData || {}).filter(k => structuredData?.[k] !== null).length / 8) * 100, 95)}%`,
                       transition: 'width 0.5s ease-out'
                     }}>
                </div>
              </div>
            </div>
          )}

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
                disabled={processingStatus === 'processing'}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload New Document
              </button>
              
              <button
                onClick={handleContinue}
                className="btn btn-primary"
                disabled={processingStatus === 'processing' || !structuredData?.personal_information}
              >
                {processingStatus === 'processing' ? 'Processing...' : 'Continue to Analysis'}
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