import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import firebaseAnalysisService from '../services/firebaseAnalysisService';
import AnalysisDashboard from '../components/analysis/AnalysisDashboard';
import StreamingStatusDisplay from '../components/common/StreamingStatusDisplay';
import { getExpectedAnalysisDimensions } from '../utils/statusFormatters';
import { Loader2, AlertCircle } from 'lucide-react';

function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { analysisId } = useParams();
  const [error, setError] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [dimensionScores, setDimensionScores] = useState({});
  const [progress, setProgress] = useState(0);
  const [currentDimension, setCurrentDimension] = useState(null);
  const [completedDimensions, setCompletedDimensions] = useState([]);
  const [pendingDimensions, setPendingDimensions] = useState([]);
  const [isAnalysisInProgress, setIsAnalysisInProgress] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [loadingExistingAnalysis, setLoadingExistingAnalysis] = useState(false);
  const [existingAnalysisData, setExistingAnalysisData] = useState(null);
  
  const resumeId = location.state?.resumeId;
  const selectedOccupation = location.state?.selectedOccupation;
  
  const startStreamingAnalysis = useCallback(() => {
    // Prevent multiple simultaneous analyses
    if (isAnalysisInProgress) {
      return;
    }
    
    setIsAnalysisInProgress(true);
    setIsStreaming(true);
    setError(null);
    
    // Create new abort controller for this analysis
    const controller = new AbortController();
    setAbortController(controller);
    
    // Initialize dimension tracking
    const expectedDimensions = getExpectedAnalysisDimensions();
    setPendingDimensions(expectedDimensions);
    setCompletedDimensions([]);
    setCurrentDimension(null);
    
    // Initialize analysis data structure with new fields
    const initialData = {
      resumeId,
      occupationCode: selectedOccupation.code,
      occupationTitle: selectedOccupation.title,
      dimensionScores: {},
      overallFitScore: 0,
      fitCategory: null,
      fitCategoryDescription: null,
      recommendations: [],
      gaps: {},
      scoreBreakdown: null,
      improvementImpact: null,
      timeToQualify: null,
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
          return;
        }
        
        // Update progress
        if (chunk.progress !== undefined) {
          setProgress(chunk.progress);
        }
        
        // Handle dimension started
        if (chunk.type === 'dimension_started') {
          setCurrentDimension(chunk.dimension);
          setPendingDimensions(prev => prev.filter(d => d !== chunk.dimension));
        }
        
        // Handle dimension completion
        if (chunk.type === 'dimension_completed') {
          // Store the dimension scores directly from the chunk
          setDimensionScores(prev => ({
            ...prev,
            [chunk.dimension]: chunk.scores
          }));
          
          // Also update analysisData to ensure dashboard receives updates
          setAnalysisData(prev => ({
            ...prev,
            dimensionScores: {
              ...prev.dimensionScores,
              [chunk.dimension]: chunk.scores
            }
          }));
          
          // Update dimension tracking
          setCompletedDimensions(prev => [...prev, chunk.dimension]);
          setCurrentDimension(null);
        }
        
        // Handle analysis completion
        if (chunk.type === 'analysis_completed') {
          const completedAnalysis = {
            ...analysisData,
            analysisId: chunk.analysisId,
            overallFitScore: chunk.overallFitScore,
            fitCategory: chunk.fitCategory,
            fitCategoryDescription: chunk.fitCategoryDescription,
            recommendations: chunk.recommendations || [],
            timeToQualify: chunk.timeToQualify,
            narrativeSummary: chunk.narrativeSummary, // Add narrative summary
            status: 'completed',
            isStreaming: false
          };
          
          setAnalysisData(completedAnalysis);
          setIsStreaming(false);
          setIsAnalysisInProgress(false);
          setProgress(100);
          
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
      // Merge the full analysis data from the final result
      if (result && result.success && result.analysis) {
        // Update with complete analysis data including enriched fields
        setAnalysisData(prev => ({
          ...prev,
          ...result.analysis,
          recommendations: result.analysis.recommendations || prev.recommendations || [],
          gaps: result.analysis.gaps || {},
          scoreBreakdown: result.analysis.scoreBreakdown || null,
          improvementImpact: result.analysis.improvementImpact || null,
          timeToQualify: result.analysis.timeToQualify || null,
          fitCategoryDetails: result.analysis.fitCategoryDetails || null
        }));
        
        // Update dimension scores with full data
        if (result.analysis.dimensionScores) {
          setDimensionScores(result.analysis.dimensionScores);
        }
      }
    }).catch((error) => {
      setError(error.message);
      setIsStreaming(false);
      setIsAnalysisInProgress(false);
    });
    
    // Store cleanup function
    window.analysisCleanup = () => {
      controller.abort();
    };
  }, [resumeId, selectedOccupation, isAnalysisInProgress]);

  useEffect(() => {
    // Don't redirect if we're loading an existing analysis
    if (!analysisId && (!resumeId || !selectedOccupation)) {
      navigate('/upload');
      return;
    }
    
    // Only start streaming for new analyses (not when viewing historical ones)
    if (resumeId && selectedOccupation) {
      // Debounce to prevent rapid re-triggers
      const debounceTimer = setTimeout(() => {
        // Only start if not already in progress
        if (!isAnalysisInProgress) {
          startStreamingAnalysis();
        }
      }, 500);
      
      return () => {
        clearTimeout(debounceTimer);
      };
    }
    // Remove startStreamingAnalysis from dependencies to prevent loops
  }, [resumeId, selectedOccupation, navigate, analysisId]);
  
  const handleRetry = () => {
    // Abort any existing analysis
    if (abortController) {
      abortController.abort();
    }
    
    setError(null);
    setProgress(0);
    setDimensionScores({});
    setIsAnalysisInProgress(false);
    setCurrentDimension(null);
    setCompletedDimensions([]);
    setPendingDimensions(getExpectedAnalysisDimensions());
    
    // Small delay before retry to ensure cleanup
    setTimeout(() => {
      startStreamingAnalysis();
    }, 100);
  };
  
  // Load existing analysis if analysisId is provided
  useEffect(() => {
    const loadExistingAnalysis = async () => {
      if (!analysisId) return;
      
      try {
        setLoadingExistingAnalysis(true);
        setError(null);
        
        const analysis = await firebaseAnalysisService.getAnalysisById(analysisId);
        
        if (!analysis) {
          setError('Analysis not found');
          return;
        }
        
        // Set the analysis data
        setExistingAnalysisData(analysis);
        setAnalysisData(analysis);
        setDimensionScores(analysis.dimensionScores || {});
        
      } catch (err) {
        console.error('Error loading analysis:', err);
        setError('Failed to load analysis. Please try again.');
      } finally {
        setLoadingExistingAnalysis(false);
      }
    };
    
    loadExistingAnalysis();
  }, [analysisId]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.analysisCleanup) {
        window.analysisCleanup();
        delete window.analysisCleanup;
      }
      if (abortController) {
        abortController.abort();
      }
      setIsAnalysisInProgress(false);
    };
  }, [abortController]);
  
  const handleGoBack = () => {
    navigate('/upload', { 
      state: { selectedOccupation } 
    });
  };
  
  // Show loading state when fetching existing analysis
  if (loadingExistingAnalysis) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Loading Analysis...
          </h2>
          <p className="text-gray-600">
            Retrieving your saved analysis results
          </p>
        </div>
      </div>
    );
  }
  
  // If we have neither new analysis params nor an existing analysis, show error
  if (!analysisId && (!resumeId || !selectedOccupation)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-danger-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Analysis Data
          </h2>
          <p className="text-gray-600 mb-6">
            Unable to load analysis. Please start a new analysis from the careers page.
          </p>
          <button
            onClick={() => navigate('/careers')}
            className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Explore Careers
          </button>
        </div>
      </div>
    );
  }
  
  // Show analysis UI (streaming, completed, or loaded from history)
  if (analysisData && (isStreaming || analysisData.status === 'completed' || existingAnalysisData)) {
    // Use occupation data from either source
    const occupationTitle = selectedOccupation?.title || analysisData.occupationTitle || 'Career';
    const occupationCode = selectedOccupation?.code || analysisData.occupationCode || '';
    
    return (
      <div className="max-w-7xl mx-auto">
        {/* Real-time Analysis Status - only during streaming */}
        {isStreaming && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <StreamingStatusDisplay
                currentOperation={currentDimension}
                completedOperations={completedDimensions}
                pendingOperations={pendingDimensions}
                progress={progress}
                type="analysis"
              />
            </div>
          </div>
        )}
        
        {/* Show header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            {occupationTitle} Career Readiness Assessment
          </h1>
          <p className="text-sm text-gray-500">
            {isStreaming ? 'Assessing your career readiness in real-time...' : occupationCode}
          </p>
        </div>
        
        {/* Show dashboard - streaming or completed */}
        <AnalysisDashboard 
          data={{
            ...analysisData,
            dimensionScores: dimensionScores || analysisData.dimensionScores,
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
            {selectedOccupation && (
              <p className="text-gray-600">
                Preparing to assess your readiness for {selectedOccupation.title}
              </p>
            )}
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