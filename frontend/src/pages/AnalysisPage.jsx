import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import analysisService from '../services/analysisService';
import { useCredits } from '../contexts/CreditContext';
import { useAuth } from '../contexts/AuthContext';
import CreditPurchaseModal from '../components/credits/CreditPurchaseModal';
import { Loader2, AlertCircle, Coins } from 'lucide-react';

function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canAnalyze, consumeCredit, hasCredits, credits } = useCredits();
  const [error, setError] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [creditCheckDone, setCreditCheckDone] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  
  const resumeId = location.state?.resumeId;
  const selectedOccupation = location.state?.selectedOccupation;
  
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
        // Start analysis automatically if they have credits
        analyzeResume();
      } else {
        setError(availability.message);
        setCanProceed(false);
      }
    } catch (err) {
      setCreditCheckDone(true);
      setError('Failed to check credit availability');
    }
  };
  
  const analyzeResume = async () => {
    try {
      setError(null);
      
      const result = await analysisService.analyzeResume(
        resumeId,
        selectedOccupation.code
      );
      
      // Consume credit on successful analysis
      consumeCredit();
      
      // Navigate to results page
      navigate(`/results/${result.analysisId}`, {
        state: { analysisData: result }
      });
    } catch (err) {
      const errorData = err.response?.data;
      
      // Check if it's a credit error
      if (errorData?.error === 'INSUFFICIENT_CREDITS') {
        setError('You have no credits remaining. Please purchase credits to continue.');
        setCanProceed(false);
      } else if (errorData?.error === 'ANONYMOUS_LIMIT_REACHED') {
        setError(errorData.message || 'You have reached the free analysis limit. Please sign up to continue.');
        setCanProceed(false);
      } else {
        setError(errorData?.error || 'Analysis failed. Please try again.');
      }
    }
  };
  
  const handleRetry = () => {
    setError(null);
    analyzeResume();
  };
  
  const handleGoBack = () => {
    navigate('/upload', { 
      state: { selectedOccupation } 
    });
  };
  
  if (!resumeId || !selectedOccupation) {
    return null;
  }
  
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