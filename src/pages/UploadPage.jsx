import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ResumeUpload from '../components/resume/ResumeUpload';
import ProcessingStatus from '../components/resume/ProcessingStatus';
import ResumeViewer from '../components/resume/ResumeViewer';
import PreviousResumes from '../components/resume/PreviousResumes';
import StreamingStatusDisplay from '../components/common/StreamingStatusDisplay';
import firebaseResumeService from '../services/firebaseResumeService';
import { useAuth } from '../contexts/FirebaseAuthContext';
import { getExpectedParsingFields } from '../utils/statusFormatters';
import toastService from '../services/toastService';
import { logError } from '../utils/errorHandler';
import { Briefcase, ArrowLeft, Upload } from 'lucide-react';

function UploadPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, createAnonymousSession } = useAuth();
  const [selectedOccupation, setSelectedOccupation] = useState(null);
  const [resumeId, setResumeId] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [structuredData, setStructuredData] = useState(null);
  const [refreshResumes, setRefreshResumes] = useState(0);
  const [parseProgress, setParseProgress] = useState(0);
  const [completedFields, setCompletedFields] = useState([]);
  const [currentParsingField, setCurrentParsingField] = useState(null);
  const [pendingFields, setPendingFields] = useState([]);
  
  useEffect(() => {
    // Check if occupation was selected
    const occupation = location.state?.selectedOccupation || 
                      JSON.parse(sessionStorage.getItem('selectedOccupation') || 'null');
    
    if (!occupation) {
      // No occupation selected, redirect to job selection
      navigate('/careers');
    } else {
      setSelectedOccupation(occupation);
    }
  }, [location, navigate]);


  // Set up expected fields when processing starts
  useEffect(() => {
    if (processingStatus === 'processing') {
      const expectedFields = getExpectedParsingFields();
      setPendingFields(expectedFields.filter(field => !completedFields.includes(field)));
    }
  }, [processingStatus]);
  
  const handleUpload = async (file) => {
    try {
      setProcessingStatus('uploading');
      
      // Create anonymous session if no user exists
      let currentUser = user;
      if (!currentUser) {
        const result = await createAnonymousSession();
        if (!result.success) {
          setProcessingStatus(null);
          return;
        }
        currentUser = result.user;
      }
      
      // Initialize empty structure for progressive updates
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
      
      setProcessingStatus('processing');
      setCompletedFields([]);
      setCurrentParsingField(null);
      setPendingFields(getExpectedParsingFields());
      
      // Upload and process resume with streaming
      const result = await firebaseResumeService.uploadResume(
        file,
        currentUser.uid,
        (chunk) => {
          // Handle different types of streaming chunks
          if (chunk.type === 'field_completed') {
            // Simple field update
            setStructuredData(prev => ({
              ...prev,
              [chunk.field]: chunk.value
            }));
            setParseProgress(chunk.progress || 0);
            
            // Update field tracking
            setCompletedFields(prev => [...prev, chunk.field]);
            setCurrentParsingField(null);
            setPendingFields(prev => prev.filter(f => f !== chunk.field));
            
            // Set next field as current if available
            const expectedFields = getExpectedParsingFields();
            const nextFieldIndex = expectedFields.indexOf(chunk.field) + 1;
            if (nextFieldIndex < expectedFields.length) {
              setCurrentParsingField(expectedFields[nextFieldIndex]);
            }
          } else if (chunk.type === 'array_item_completed') {
            // Add item to array (experience, education)
            setStructuredData(prev => ({
              ...prev,
              [chunk.field]: [
                ...(prev[chunk.field] || []),
                chunk.value
              ]
            }));
            setParseProgress(chunk.progress || 0);
            
            // Update current parsing field
            if (!currentParsingField || currentParsingField !== chunk.field) {
              setCurrentParsingField(chunk.field);
            }
          } else if (chunk.type === 'skill_added') {
            // Add individual skill to category
            setStructuredData(prev => ({
              ...prev,
              skills: {
                ...(prev.skills || {}),
                [chunk.category]: [
                  ...(prev.skills?.[chunk.category] || []),
                  chunk.skill
                ]
              }
            }));
            setParseProgress(chunk.progress || 0);
            
            // Update current parsing field
            if (!currentParsingField || currentParsingField !== 'skills') {
              setCurrentParsingField('skills');
            }
          } else if (chunk.type === 'achievement_added') {
            // Add achievement to category
            setStructuredData(prev => ({
              ...prev,
              achievements: {
                ...(prev.achievements || {}),
                [chunk.category]: [
                  ...(prev.achievements?.[chunk.category] || []),
                  chunk.value
                ]
              }
            }));
            setParseProgress(chunk.progress || 0);
            
            // Update current parsing field
            if (!currentParsingField || currentParsingField !== 'achievements') {
              setCurrentParsingField('achievements');
            }
          }
        }
      );
      
      // Process completed
      if (result.resumeId && result.structuredData) {
        setResumeId(result.resumeId);
        setStructuredData(result.structuredData);
        setProcessingStatus('completed');
        setParseProgress(100);
        setRefreshResumes(prev => prev + 1);
      } else {
        setProcessingStatus('failed');
      }
    } catch (error) {
      logError(error, 'upload', { fileName: file?.name });
      toastService.error(error, 'upload');
      setProcessingStatus('failed');
    }
  };
  
  const handleGoogleDocsImport = async (url) => {
    try {
      setProcessingStatus('uploading');
      
      // Create anonymous session if no user exists
      let currentUser = user;
      if (!currentUser) {
        const result = await createAnonymousSession();
        if (!result.success) {
          setProcessingStatus(null);
          return;
        }
        currentUser = result.user;
      }
      
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
      
      setProcessingStatus('processing');
      setCompletedFields([]);
      setCurrentParsingField(null);
      setPendingFields(getExpectedParsingFields());
      
      // Import from Google Docs with streaming
      const importResult = await firebaseResumeService.importFromGoogleDocs(
        url,
        null,
        (chunk) => {
          // Handle different types of streaming chunks
          if (chunk.type === 'field_completed') {
            // Simple field update
            setStructuredData(prev => ({
              ...prev,
              [chunk.field]: chunk.value
            }));
            setParseProgress(chunk.progress || 0);
            
            // Update field tracking
            setCompletedFields(prev => [...prev, chunk.field]);
            setCurrentParsingField(null);
            setPendingFields(prev => prev.filter(f => f !== chunk.field));
            
            // Set next field as current if available
            const expectedFields = getExpectedParsingFields();
            const nextFieldIndex = expectedFields.indexOf(chunk.field) + 1;
            if (nextFieldIndex < expectedFields.length) {
              setCurrentParsingField(expectedFields[nextFieldIndex]);
            }
          } else if (chunk.type === 'array_item_completed') {
            // Add item to array (experience, education)
            setStructuredData(prev => ({
              ...prev,
              [chunk.field]: [
                ...(prev[chunk.field] || []),
                chunk.value
              ]
            }));
            setParseProgress(chunk.progress || 0);
            
            // Update current parsing field
            if (!currentParsingField || currentParsingField !== chunk.field) {
              setCurrentParsingField(chunk.field);
            }
          } else if (chunk.type === 'skill_added') {
            // Add individual skill to category
            setStructuredData(prev => ({
              ...prev,
              skills: {
                ...(prev.skills || {}),
                [chunk.category]: [
                  ...(prev.skills?.[chunk.category] || []),
                  chunk.skill
                ]
              }
            }));
            setParseProgress(chunk.progress || 0);
            
            // Update current parsing field
            if (!currentParsingField || currentParsingField !== 'skills') {
              setCurrentParsingField('skills');
            }
          } else if (chunk.type === 'achievement_added') {
            // Add achievement to category
            setStructuredData(prev => ({
              ...prev,
              achievements: {
                ...(prev.achievements || {}),
                [chunk.category]: [
                  ...(prev.achievements?.[chunk.category] || []),
                  chunk.value
                ]
              }
            }));
            setParseProgress(chunk.progress || 0);
            
            // Update current parsing field
            if (!currentParsingField || currentParsingField !== 'achievements') {
              setCurrentParsingField('achievements');
            }
          }
        }
      );
      
      // Process completed
      if (importResult.resumeId && importResult.structuredData) {
        setResumeId(importResult.resumeId);
        setStructuredData(importResult.structuredData);
        setProcessingStatus('completed');
        setParseProgress(100);
        setRefreshResumes(prev => prev + 1);
      } else {
        setProcessingStatus('failed');
      }
    } catch (error) {
      logError(error, 'google-docs-import', { url });
      toastService.error(error, 'upload');
      setProcessingStatus('failed');
      // Don't re-throw, let toast handle the error display
    }
  };
  
  const handleSelectPreviousResume = (resumeData) => {
    // Set the resume data from the selected previous resume
    setResumeId(resumeData.resumeId);
    setStructuredData(resumeData.structuredData);
    setProcessingStatus('completed');
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
    setParseProgress(0);
    setCompletedFields([]);
    setCurrentParsingField(null);
    setPendingFields([]);
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
                    to="/careers"
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Change career
                  </Link>
                </div>
              </div>
            )}
            
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Your Resume</h1>
              <p className="text-gray-600">
                Upload your resume to compare against <span className="font-medium">{selectedOccupation?.title || 'your selected job'}</span>.
                <br />
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
          {/* Real-time Processing Status */}
          {processingStatus === 'processing' && (
            <StreamingStatusDisplay
              currentOperation={currentParsingField}
              completedOperations={completedFields}
              pendingOperations={pendingFields}
              progress={parseProgress}
              type="parsing"
            />
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
                to="/careers"
                className="flex items-center text-sm text-primary-600 hover:text-primary-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Change career
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