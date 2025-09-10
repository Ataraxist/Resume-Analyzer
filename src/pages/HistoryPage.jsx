import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/FirebaseAuthContext';
import firebaseAnalysisService from '../services/firebaseAnalysisService';
import { 
  Calendar, 
  Briefcase, 
  TrendingUp, 
  Search, 
  Trash2, 
  Eye,
  Clock,
  AlertCircle
} from 'lucide-react';

function HistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      fetchAnalyses();
    }
  }, [user]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = analyses.filter(analysis => 
        analysis.occupationTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analysis.resumeTitle?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAnalyses(filtered);
    } else {
      setFilteredAnalyses(analyses);
    }
  }, [searchTerm, analyses]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      setError(null);
      const userAnalyses = await firebaseAnalysisService.getUserAnalyses(user.uid);
      setAnalyses(userAnalyses);
      setFilteredAnalyses(userAnalyses);
    } catch (err) {
      console.error('Failed to load analyses:', err);
      setError('Failed to load your analysis history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalysis = (analysisId) => {
    navigate(`/analysis/${analysisId}`);
  };

  const handleDeleteAnalysis = async (analysisId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleteLoading(analysisId);
      await firebaseAnalysisService.deleteAnalysis(analysisId, user.uid);
      setAnalyses(prev => prev.filter(a => a.id !== analysisId));
    } catch (err) {
      console.error('Failed to delete analysis:', err);
      alert('Failed to delete analysis. Please try again.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFitScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600 dark:text-gray-300">Loading your analysis history...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={fetchAnalyses}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analysis History</h1>
          <p className="text-gray-600 dark:text-gray-300">View and manage your past career analyses</p>
        </div>

        {analyses.length > 0 ? (
          <>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by occupation or resume title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>

            {filteredAnalyses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300">No analyses found matching your search.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAnalyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    onClick={() => handleViewAnalysis(analysis.id)}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                            {analysis.occupationTitle || 'Unknown Occupation'}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(analysis.createdAt)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteAnalysis(analysis.id, e)}
                          disabled={deleteLoading === analysis.id}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          title="Delete analysis"
                        >
                          {deleteLoading === analysis.id ? (
                            <Clock className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </button>
                      </div>

                      <div className="space-y-3">
                        {analysis.overallFitScore !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Fit Score</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getFitScoreColor(analysis.overallFitScore)}`}>
                              {Math.round(analysis.overallFitScore)}%
                            </span>
                          </div>
                        )}

                        {analysis.resumeTitle && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Briefcase className="h-4 w-4 mr-2" />
                            <span className="truncate">{analysis.resumeTitle}</span>
                          </div>
                        )}

                        {analysis.status && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                            <span className={`text-sm font-medium ${
                              analysis.status === 'completed' ? 'text-green-600 dark:text-green-400' : 
                              analysis.status === 'processing' ? 'text-yellow-600 dark:text-yellow-400' : 
                              'text-gray-600 dark:text-gray-400'
                            }`}>
                              {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button className="w-full flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Analyses Yet</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Start by selecting a career to analyze your qualifications.</p>
            <button
              onClick={() => navigate('/careers')}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Explore Careers
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;