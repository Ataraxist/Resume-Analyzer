import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import analysisService from '../services/analysisService';
import { useCredits } from '../contexts/CreditContext';
import { useAuth } from '../contexts/AuthContext';
import CreditPurchaseModal from '../components/credits/CreditPurchaseModal';
import AnalysisDashboard from '../components/analysis/AnalysisDashboard';
import { MessageCycler, analysisMessages } from '../utils/loadingMessages';
import { Loader2, AlertCircle, Coins, Info } from 'lucide-react';

function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canAnalyze, consumeCredit } = useCredits();
  const [error, setError] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [creditCheckDone, setCreditCheckDone] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [dimensionScores, setDimensionScores] = useState({});
  const [currentMessage, setCurrentMessage] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [messageCycler] = useState(() => new MessageCycler(analysisMessages));
  const [progress, setProgress] = useState(0);
  
  const resumeId = location.state?.resumeId;
  const selectedOccupation = location.state?.selectedOccupation;
  const structuredData = location.state?.structuredData;
  
  useEffect(() => {
    if (!resumeId || !selectedOccupation) {
      navigate('/upload');
      return;
    }
    
    // Check credits first
    checkCreditsAndProceed();
  }, [resumeId, selectedOccupation, navigate]);
  
  const checkCreditsAndProceed = async () => {
    try {
      const availability = await canAnalyze();
      setCreditCheckDone(true);
      
      if (availability.canAnalyze) {
        setCanProceed(true);
        // Start streaming analysis immediately
        startStreamingAnalysis();
      } else {
        setError(availability.message);
        setCanProceed(false);
      }
    } catch (err) {
      setCreditCheckDone(true);
      setError('Failed to check credit availability');
    }
  };
  
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
    
    // Start SSE connection
    const cleanup = analysisService.streamAnalysis(
      resumeId,
      selectedOccupation.code,
      // On dimension update
      (dimension, scores, cached) => {
        setDimensionScores(prev => ({
          ...prev,
          [dimension]: scores
        }));
        
        // Update progress (6 dimensions total)
        setProgress(prev => Math.min(prev + (100 / 6), 95));
      },
      // On complete
      (finalData) => {
        setAnalysisData(finalData);
        setIsStreaming(false);
        setProgress(100);
        messageCycler.stop();
        consumeCredit(); // Consume credit on successful completion
        
        // Navigate to results page with completed analysis
        setTimeout(() => {
          navigate(`/results/${finalData.analysisId}`, { 
            state: { analysisData: finalData }
          });
        }, 500); // Small delay to show completion
      },
      // On error
      (errorMessage) => {
        setError(errorMessage);
        setIsStreaming(false);
        messageCycler.stop();
      }
    );
    
    // Store cleanup function
    window.analysisCleanup = cleanup;
  };
  
  const handleRetry = () => {
    setError(null);
    setProgress(0);
    setDimensionScores({});
    checkCreditsAndProceed();
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
  
  // Show streaming UI when analyzing
  if (isStreaming && analysisData) {
    return (
      <div className="max-w-7xl mx-auto">
        {/* Whimsical Processing Status Banner */}
        {currentMessage && (
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
        
        {/* Progress bar */}
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
        
        {/* Show header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {selectedOccupation.title} Resume Fit Analysis
          </h1>
          <p className="text-sm text-gray-500">
            Analyzing your qualifications in real-time...
          </p>
        </div>
        
        {/* Show partial dashboard with loading states */}
        <AnalysisDashboard 
          data={{
            ...analysisData,
            dimensionScores,
            overallFitScore: analysisData?.overallFitScore || 0,
            isStreaming: true
          }} 
        />
      </div>
    );
  }
  
  // Show credit check/error UI when not streaming
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        {!creditCheckDone ? (
          <>
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Checking availability...
            </h2>
          </>
        ) : !error && canProceed ? (
          <>
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Analyzing your resume...
            </h2>
            <p className="text-gray-600">
              Comparing your qualifications against {selectedOccupation.title}
            </p>
          </>
        ) : (
          <>
            <div className="mb-6">
              {/* Credit Error Icon */}
              {(error?.includes('credit') || error?.includes('limit')) && (
                <div className="inline-flex items-center justify-center w-16 h-16 bg-warning-100 rounded-full mb-4">
                  <Coins className="h-8 w-8 text-warning-600" />
                </div>
              )}
              
              {/* Error Message */}
              <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-danger-600 inline mr-2" />
                <p className="text-sm text-danger-800 inline">{error}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Show purchase button for credit errors */}
              {error?.includes('credit') && user && (
                <button
                  onClick={() => setShowPurchaseModal(true)}
                  className="btn btn-primary w-full"
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Purchase Credits
                </button>
              )}
              
              {/* Show signup for anonymous limit */}
              {error?.includes('sign up') && !user && (
                <Link
                  to="/signup"
                  className="btn btn-primary w-full inline-block"
                >
                  Sign Up for 5 Free Credits
                </Link>
              )}
              
              {/* Retry and Go Back buttons */}
              <div className="flex space-x-3">
                {canProceed && (
                  <button
                    onClick={handleRetry}
                    className="btn btn-secondary flex-1"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={handleGoBack}
                  className="btn btn-secondary flex-1"
                >
                  Go Back
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Purchase Modal */}
      {showPurchaseModal && (
        <CreditPurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => {
            setShowPurchaseModal(false);
            // Recheck credits after purchase
            checkCreditsAndProceed();
          }}
        />
      )}
    </div>
  );
}

export default AnalysisPage;