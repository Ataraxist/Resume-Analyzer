import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import analysisService from '../services/analysisService';
import { Loader2 } from 'lucide-react';

function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  
  const resumeId = location.state?.resumeId;
  const selectedOccupation = location.state?.selectedOccupation;
  
  useEffect(() => {
    if (!resumeId || !selectedOccupation) {
      navigate('/upload');
      return;
    }
    
    // Start analysis automatically
    analyzeResume();
  }, [resumeId, selectedOccupation, navigate]);
  
  const analyzeResume = async () => {
    try {
      setError(null);
      
      const result = await analysisService.analyzeResume(
        resumeId,
        selectedOccupation.code
      );
      
      // Navigate to results page
      navigate(`/results/${result.analysisId}`, {
        state: { analysisData: result }
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Please try again.');
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
        {!error ? (
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
            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-800">{error}</p>
            </div>
            <div className="space-x-3">
              <button
                onClick={handleRetry}
                className="btn btn-primary"
              >
                Try Again
              </button>
              <button
                onClick={handleGoBack}
                className="btn btn-secondary"
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