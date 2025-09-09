import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import firebaseAnalysisService from '../services/firebaseAnalysisService';
import { useAuth } from '../contexts/FirebaseAuthContext';
import AnalysisDashboard from '../components/analysis/AnalysisDashboard';
import { MessageCycler, analysisMessages } from '../utils/loadingMessages';
import { normalizeDimensionScore } from '../utils/analysisDataNormalizer';
import { Loader2, AlertCircle, Info } from 'lucide-react';

function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [dimensionScores, setDimensionScores] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [messageCycler] = useState(() => new MessageCycler(analysisMessages));
  const [progress, setProgress] = useState(0);
  
  const resumeId = location.state?.resumeId;
  const selectedOccupation = location.state?.selectedOccupation;
  
  useEffect(() => {
    if (!resumeId || !selectedOccupation) {
      navigate('/upload');
      return;
    }
    
    // Start streaming analysis immediately
    startStreamingAnalysis();
  }, [resumeId, selectedOccupation, navigate]);
  
  const startStreamingAnalysis = () => {
    setIsStreaming(true);
    setError(null);
    
    // Start message cycling
    messageCycler.onChange(setCurrentMessage);
    messageCycler.start();
    
    // Initialize analysis data structure
    const initialData = {
      resumeId,
      occupationCode: selectedOccupation.code,
      occupationTitle: selectedOccupation.title,
      dimensionScores: {},
      overallFitScore: 0,
      fitCategory: null,
      recommendations: [],
      gaps: {},
      status: 'processing'
    };
    setAnalysisData(initialData);
    
    // Call Firebase Cloud Function with real-time streaming
    firebaseAnalysisService.analyzeResumeWithStream(
      resumeId,
      selectedOccupation.code,
      // Real-time update callback
      (chunk) => {
        // Handle streaming chunks based on type
        if (chunk.type === 'error') {
          setError(chunk.error || 'Analysis failed');
          setIsStreaming(false);
          messageCycler.stop();
          return;
        }
        
        // Update progress
        if (chunk.progress !== undefined) {
          setProgress(chunk.progress);
        }
        
        // Handle dimension completion
        if (chunk.type === 'dimension_completed') {
          // Normalize the dimension score to ensure consistent structure
          const normalizedScore = normalizeDimensionScore(chunk.scores);
          
          setDimensionScores(prev => ({
            ...prev,
            [chunk.dimension]: normalizedScore
          }));
          setAnalysisData(prev => ({
            ...prev,
            dimensionScores: {
              ...prev.dimensionScores,
              [chunk.dimension]: normalizedScore
            }
          }));
        }
        
        // Handle analysis completion
        if (chunk.type === 'analysis_completed') {
          const completedAnalysis = {
            ...analysisData,
            analysisId: chunk.analysisId,
            overallFitScore: chunk.overallFitScore,
            fitCategory: chunk.fitCategory,
            recommendations: chunk.recommendations || [],
            dimensionScores,
            status: 'completed',
            isStreaming: false
          };
          
          setAnalysisData(completedAnalysis);
          setIsStreaming(false);
          setProgress(100);
          messageCycler.stop();
          
          // Update URL with analysisId for bookmarking/sharing
          // Use replace to avoid adding to history stack
          window.history.replaceState(
            { analysisData: completedAnalysis },
            '',
            `/analysis/${chunk.analysisId}`
          );
        }
      }
    ).then((result) => {
      // No unsubscribe needed for streaming
      console.log('Analysis completed:', result);
    }).catch((error) => {
      setError(error.message);
      setIsStreaming(false);
      messageCycler.stop();
    });
    
    // Store cleanup function
    window.analysisCleanup = () => {
      messageCycler.stop();
    };
  };
  
  const handleRetry = () => {
    setError(null);
    setProgress(0);
    setDimensionScores({});
    startStreamingAnalysis();
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.analysisCleanup) {
        window.analysisCleanup();
        delete window.analysisCleanup;
      }
      messageCycler.stop();
    };
  }, []);
  
  const handleGoBack = () => {
    navigate('/upload', { 
      state: { selectedOccupation } 
    });
  };
  
  if (!resumeId || !selectedOccupation) {
    return null;
  }
  
  // Show analysis UI (streaming or completed)
  if (analysisData && (isStreaming || analysisData.status === 'completed')) {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Whimsical Processing Status Banner - only during streaming */}
        {isStreaming && currentMessage && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-11/12 md:w-auto max-w-md animate-fade-in">
            <div className="bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-200 rounded-full shadow-lg px-4 md:px-6 py-2 md:py-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-200 border-t-primary-600"></div>
                  <div className="absolute inset-0 animate-ping rounded-full h-5 w-5 border border-primary-400 opacity-20"></div>
                </div>
                <span className="text-sm font-medium text-gray-700 italic">
                  {currentMessage}
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
                        Our AI is analyzing your resume against the job requirements across 
                        6 key dimensions: tasks, skills, education, work activities, knowledge, 
                        and tools. Each dimension is being evaluated in real-time to calculate 
                        your overall fit score and provide personalized recommendations.
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
        
        {/* Progress bar - only during streaming */}
        {isStreaming && (
          <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-400 to-indigo-500 h-1.5 rounded-full animate-pulse"
                 style={{
                   width: `${progress}%`,
                   transition: 'width 0.5s ease-out'
                 }}>
            </div>
          </div>
        </div>
        )}
        
        {/* Show header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {selectedOccupation.title} Career Readiness Assessment
          </h1>
          <p className="text-sm text-gray-500">
            {isStreaming ? 'Assessing your career readiness in real-time...' : selectedOccupation.code}
          </p>
        </div>
        
        {/* Show dashboard - streaming or completed */}
        <AnalysisDashboard 
          data={{
            ...analysisData,
            dimensionScores: analysisData.status === 'completed' ? analysisData.dimensionScores : dimensionScores,
            overallFitScore: analysisData?.overallFitScore,
            isStreaming: isStreaming
          }} 
        />
      </div>
    );
  }
  
  // Show loading/error UI when not streaming
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        {!error ? (
          <>
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Initializing analysis...
            </h2>
            <p className="text-gray-600">
              Preparing to assess your readiness for {selectedOccupation.title}
            </p>
          </>
        ) : (
          <>
            <div className="mb-6">
              {/* Error Message */}
              <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-danger-600 inline mr-2" />
                <p className="text-sm text-danger-800 inline">{error}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleRetry}
                className="btn btn-secondary flex-1"
              >
                Try Again
              </button>
              <button
                onClick={handleGoBack}
                className="btn btn-secondary flex-1"
              >
                Go Back
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AnalysisPage;