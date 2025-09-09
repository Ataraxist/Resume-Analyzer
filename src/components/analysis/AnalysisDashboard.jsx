import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import DimensionRadarChart from './DimensionRadarChart';
import DimensionCard from './DimensionCard';
import DimensionCardSkeleton from './DimensionCardSkeleton';
import RecommendationsPanel from './RecommendationsPanel';
import { normalizeDimensionScore } from '../../utils/analysisDataNormalizer';

// Analysis helper functions
const getFitCategory = (score) => {
  if (score >= 80) return { label: 'Excellent Fit', color: 'text-green-600' };
  if (score >= 60) return { label: 'Good Fit', color: 'text-blue-600' };
  if (score >= 40) return { label: 'Fair Fit', color: 'text-yellow-600' };
  return { label: 'Needs Improvement', color: 'text-red-600' };
};

const formatDimensionScores = (scores) => {
  return Object.entries(scores).map(([key, value]) => {
    const normalized = normalizeDimensionScore(value);
    return {
      name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      score: normalized.score,
      matches: normalized.matches,
      gaps: normalized.gaps
    };
  });
};

// Dimension order for auto-cycling
const DIMENSION_ORDER = ['tasks', 'skills', 'education', 'workActivities', 'knowledge', 'tools'];

function AnalysisDashboard({ data }) {
  const [selectedDimension, setSelectedDimension] = useState('tasks');
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
  
  const fitCategory = getFitCategory(overallScore);
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
      if (radarChartRef.current) {
        observer.unobserve(radarChartRef.current);
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
                  <div className={`inline-flex items-center px-3 py-1 rounded-full bg-${fitCategory.color}-100 mb-3`}>
                    <Icon className={`h-4 w-4 mr-1 text-${fitCategory.color}-600`} />
                    <span className={`text-sm font-medium text-${fitCategory.color}-800`}>
                      {fitCategory.label}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Existing Summary Content */}
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Time to Qualify</p>
                  <p className="font-semibold text-gray-900">
                    {data.timeToQualify?.summary || 'Variable based on gaps'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Key Strengths</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(data.dimensionScores)
                      .filter(([, dimData]) => {
                        const normalized = normalizeDimensionScore(dimData);
                        return normalized.score >= 70;
                      })
                      .slice(0, 3)
                      .map(([dim]) => (
                        <span key={dim} className="badge badge-success">
                          {dim.charAt(0).toUpperCase() + dim.slice(1)}
                        </span>
                      ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Areas for Improvement</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(data.dimensionScores)
                      .filter(([, dimData]) => {
                        const normalized = normalizeDimensionScore(dimData);
                        return normalized.score < 50;
                      })
                      .slice(0, 3)
                      .map(([dim]) => (
                        <span key={dim} className="badge badge-danger">
                          {dim.charAt(0).toUpperCase() + dim.slice(1)}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Radar Chart */}
          <div ref={radarChartRef}>
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
      
      {/* Recommendations Section */}
      <section className="w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">Recommendations</h2>
        <RecommendationsPanel recommendations={data.recommendations} />
      </section>
    </div>
  );
}

export default AnalysisDashboard;