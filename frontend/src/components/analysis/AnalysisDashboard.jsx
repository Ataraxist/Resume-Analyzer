import { useState } from 'react';
import FitScoreGauge from './FitScoreGauge';
import DimensionRadarChart from './DimensionRadarChart';
import DimensionCard from './DimensionCard';
import GapAnalysisView from './GapAnalysisView';
import RecommendationsPanel from './RecommendationsPanel';
import analysisService from '../../services/analysisService';

function AnalysisDashboard({ data }) {
  const [activeView, setActiveView] = useState('overview');
  
  const fitCategory = analysisService.getFitCategory(data.overallFitScore);
  const dimensionData = analysisService.formatDimensionScores(data.dimensionScores);
  
  const views = [
    { id: 'overview', label: 'Overview' },
    { id: 'dimensions', label: 'Dimension Analysis' },
    { id: 'gaps', label: 'Gap Analysis' },
    { id: 'recommendations', label: 'Recommendations' }
  ];
  
  return (
    <div>
      {/* View Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200 pb-4">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
              activeView === view.id
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>
      
      {/* Overview View */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Fit Score and Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FitScoreGauge 
              score={data.overallFitScore} 
              category={fitCategory}
            />
            
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Analysis Summary</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Occupation</p>
                  <p className="font-semibold text-gray-900">{data.occupationTitle}</p>
                  <p className="text-xs text-gray-500">Code: {data.occupationCode}</p>
                </div>
                
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
                      .filter(([_, score]) => score.score >= 70)
                      .slice(0, 3)
                      .map(([dim, _]) => (
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
                      .filter(([_, score]) => score.score < 50)
                      .slice(0, 3)
                      .map(([dim, _]) => (
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
          <DimensionRadarChart data={dimensionData} />
        </div>
      )}
      
      {/* Dimensions View */}
      {activeView === 'dimensions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(data.dimensionScores).map(([dimension, scores]) => (
            <DimensionCard
              key={dimension}
              dimension={dimension}
              data={scores}
            />
          ))}
        </div>
      )}
      
      {/* Gap Analysis View */}
      {activeView === 'gaps' && (
        <GapAnalysisView dimensionScores={data.dimensionScores} />
      )}
      
      {/* Recommendations View */}
      {activeView === 'recommendations' && (
        <RecommendationsPanel recommendations={data.recommendations} />
      )}
    </div>
  );
}

export default AnalysisDashboard;