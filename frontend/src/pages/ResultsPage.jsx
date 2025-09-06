import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AnalysisDashboard from '../components/analysis/AnalysisDashboard';
import analysisService from '../services/analysisService';
import { Loader2 } from 'lucide-react';

function ResultsPage() {
  const { analysisId } = useParams();
  const location = useLocation();
  const [analysisData, setAnalysisData] = useState(location.state?.analysisData || null);
  const [isLoading, setIsLoading] = useState(!analysisData);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (analysisData) return;
      
      try {
        setIsLoading(true);
        const data = await analysisService.getAnalysis(analysisId);
        setAnalysisData(data);
      } catch (err) {
        setError('Failed to load analysis results');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnalysis();
  }, [analysisId, analysisData]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analysis results...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card bg-danger-50 border-danger-200">
          <h2 className="text-xl font-bold text-danger-800 mb-2">Error Loading Results</h2>
          <p className="text-danger-600">{error}</p>
        </div>
      </div>
    );
  }
  
  if (!analysisData) {
    return null;
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis Results</h1>
        <p className="text-lg text-gray-600">
          {analysisData.occupationTitle} Analysis
        </p>
      </div>
      
      <AnalysisDashboard data={analysisData} />
    </div>
  );
}

export default ResultsPage;