import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import DimensionRadarChart from './DimensionRadarChart';
import DimensionRadarChartSkeleton from './DimensionRadarChartSkeleton';
import DimensionCard from './DimensionCard';
import DimensionCardSkeleton from './DimensionCardSkeleton';
import AnalysisSummarySkeleton from './AnalysisSummarySkeleton';
import NarrativeSummary from './NarrativeSummary';
import NarrativeSummarySkeleton from './NarrativeSummarySkeleton';
import ImprovementImpact from './ImprovementImpact';
import { normalizeDimensionScore } from '../../utils/analysisDataNormalizer';
import { formatDimensionName } from '../../utils/statusFormatters';

// Helper to get color class based on fit category
const getFitCategoryColor = (category) => {
  const categoryLower = (category || '').toLowerCase();
  if (categoryLower.includes('excellent')) return 'text-green-600';
  if (categoryLower.includes('good') || categoryLower.includes('strong')) return 'text-blue-600';
  if (categoryLower.includes('moderate') || categoryLower.includes('fair')) return 'text-yellow-600';
  if (categoryLower.includes('developing') || categoryLower.includes('early')) return 'text-orange-600';
  return 'text-red-600';
};

const formatDimensionScores = (scores) => {
  return Object.entries(scores).map(([key, value]) => {
    const normalized = normalizeDimensionScore(value);
    return {
      dimension: formatDimensionName(key),
      key: key,
      score: normalized.score,
      matches: normalized.matches,
      gaps: normalized.gaps,
      confidence: value.confidence || 'medium',
      strengthAreas: value.strengthAreas || [],
      alternativeTools: value.alternativeTools || []
    };
  });
};

// Dimension order for auto-cycling - now includes 6 dimensions
const DIMENSION_ORDER = ['tasks', 'skills', 'education', 'workActivities', 'knowledge', 'tools'];

function AnalysisDashboard({ data }) {
  // Default to first available dimension or 'skills'
  const availableDimensions = Object.keys(data.dimensionScores || {});
  const defaultDimension = availableDimensions.includes('skills') ? 'skills' : 
                           availableDimensions[0] || 'skills';
  const [selectedDimension, setSelectedDimension] = useState(defaultDimension);
  const [previewDimension, setPreviewDimension] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [autoCycleIndex, setAutoCycleIndex] = useState(0);
  const [cycleProgress, setCycleProgress] = useState(0);
  const [isRadarChartVisible, setIsRadarChartVisible] = useState(true);
  const radarChartRef = useRef(null);
  
  // Calculate overall score from available dimensions if streaming
  const overallScore = data.isStreaming && Object.keys(data.dimensionScores || {}).length > 0
    ? Math.round(
        Object.values(data.dimensionScores).reduce((sum, dim) => {
          const normalized = normalizeDimensionScore(dim);
          return sum + normalized.score;
        }, 0) / 
        Math.max(Object.keys(data.dimensionScores).length, 1)
      )
    : data.overallFitScore || 0;
  
  // Use fitCategoryDetails from backend if available, otherwise derive from score
  const fitCategory = data.fitCategoryDetails || {
    category: data.fitCategory || 'Calculating...',
    description: data.fitCategoryDescription || '',
    color: getFitCategoryColor(data.fitCategory)
  };
  const dimensionData = formatDimensionScores(data.dimensionScores || {});
  
  // Get icon based on score
  const getIcon = () => {
    if (overallScore >= 70) return TrendingUp;
    if (overallScore >= 50) return Minus;
    return TrendingDown;
  };
  
  // Get color based on score
  const getScoreColor = () => {
    if (overallScore >= 85) return 'text-success-600';
    if (overallScore >= 70) return 'text-primary-600';
    if (overallScore >= 50) return 'text-warning-600';
    return 'text-danger-600';
  };
  
  const Icon = getIcon();
  
  // Set up Intersection Observer for radar chart visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsRadarChartVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1 // Consider visible if at least 10% is in viewport
      }
    );

    if (radarChartRef.current) {
      observer.observe(radarChartRef.current);
    }

    return () => {
      const element = radarChartRef.current;
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);
  
  // Simple increment-based auto-cycling (disabled during streaming)
  useEffect(() => {
    if (userHasInteracted || data.isStreaming) {
      setCycleProgress(0);
      return;
    }
    
    const interval = setInterval(() => {
      if (!isHovering && isRadarChartVisible) {
        setCycleProgress(prev => {
          const next = prev + 1.25; // 1.25% per 100ms = 100% in 8 seconds
          if (next >= 100) {
            // Advance to next dimension
            const nextIndex = (autoCycleIndex + 1) % DIMENSION_ORDER.length;
            setAutoCycleIndex(nextIndex);
            setSelectedDimension(DIMENSION_ORDER[nextIndex]);
            return 0; // Reset progress for next cycle
          }
          return next;
        });
      }
    }, 100); // Run every 100ms
    
    return () => clearInterval(interval);
  }, [userHasInteracted, isHovering, isRadarChartVisible, autoCycleIndex, data.isStreaming]);
  
  // Handle manual dimension selection
  const handleDimensionSelect = (dimension) => {
    setUserHasInteracted(true);
    setSelectedDimension(dimension);
    setPreviewDimension(null);
  };
  
  // Handle dimension hover for preview
  const handleDimensionHover = (dimension) => {
    if (!userHasInteracted) {
      setIsHovering(!!dimension);
      setPreviewDimension(dimension);
    }
  };
  
  // Determine which dimension to display
  const displayDimension = previewDimension || selectedDimension;
  
  return (
    <div className="space-y-12">
      {/* Overview Section */}
      <section className="w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">Overview</h2>
        <div className="space-y-6">
          {/* Analysis Summary Card with Fit Score */}
          {data.isStreaming && !data.overallFitScore && Object.keys(data.dimensionScores || {}).length === 0 ? (
            <AnalysisSummarySkeleton />
          ) : (
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Analysis Summary</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Fit Score */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Overall Fit Score</p>
                    <div className={`text-5xl font-bold ${getScoreColor()} mb-4`}>
                      {Math.round(overallScore)}%
                    </div>
                    <div className="mb-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full ${fitCategory.color || getFitCategoryColor(fitCategory.category)}`}>
                        <Icon className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">
                          {fitCategory.category}
                        </span>
                      </span>
                      {fitCategory.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {fitCategory.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Existing Summary Content */}
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Key Strengths</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {data.scoreBreakdown?.strengths?.slice(0, 3).map((item) => (
                        <span key={item.dimension} className="badge badge-success">
                          {item.dimension}
                        </span>
                      )) || 
                      // Fallback to inline calculation if scoreBreakdown not available (during streaming)
                      Object.entries(data.dimensionScores || {})
                        .filter(([, dimData]) => {
                          const normalized = normalizeDimensionScore(dimData);
                          return normalized.score >= 80;
                        })
                        .slice(0, 3)
                        .map(([dim]) => (
                          <span key={dim} className="badge badge-success">
                            {formatDimensionName(dim)}
                          </span>
                        ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Areas for Improvement</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {data.scoreBreakdown?.critical?.slice(0, 3).map((item) => (
                        <span key={item.dimension} className="badge badge-danger">
                          {item.dimension}
                        </span>
                      )) ||
                      // Fallback to inline calculation if scoreBreakdown not available (during streaming)
                      Object.entries(data.dimensionScores || {})
                        .filter(([, dimData]) => {
                          const normalized = normalizeDimensionScore(dimData);
                          return normalized.score < 50;
                        })
                        .slice(0, 3)
                        .map(([dim]) => (
                          <span key={dim} className="badge badge-danger">
                            {formatDimensionName(dim)}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Career Summary */}
          {data.isStreaming && !data.narrativeSummary ? (
            <NarrativeSummarySkeleton />
          ) : (
            <NarrativeSummary narrativeSummary={data.narrativeSummary} />
          )}
          
          {/* Radar Chart */}
          <div ref={radarChartRef}>
            {data.isStreaming && Object.keys(data.dimensionScores || {}).length === 0 ? (
              <DimensionRadarChartSkeleton />
            ) : (
              <DimensionRadarChart 
                data={dimensionData} 
                selectedDimension={selectedDimension}
                onDimensionSelect={handleDimensionSelect}
                onDimensionHover={handleDimensionHover}
                hoveredDimension={previewDimension}
                isAutoCycling={!userHasInteracted && !isHovering && isRadarChartVisible && !data.isStreaming}
                showProgress={!userHasInteracted && !data.isStreaming}
                cycleProgress={cycleProgress}
              />
            )}
          </div>
        </div>
      </section>
      
      {/* Dimension Analysis Section */}
      <section className="w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">Dimension Analysis</h2>
        <div className="w-full">
          {/* Show skeleton if streaming and dimension not ready, otherwise show card */}
          {data.isStreaming && !data.dimensionScores[displayDimension] ? (
            <DimensionCardSkeleton dimension={displayDimension} />
          ) : data.dimensionScores[displayDimension] ? (
            <DimensionCard
              dimension={displayDimension}
              data={data.dimensionScores[displayDimension]}
            />
          ) : null}
        </div>
      </section>
      
      {/* Improvement Impact Section */}
      {data.improvementImpact && data.improvementImpact.length > 0 && (
        <section className="w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">Score Improvement Strategy</h2>
          <ImprovementImpact improvementImpact={data.improvementImpact} />
        </section>
      )}
    </div>
  );
}

export default AnalysisDashboard;