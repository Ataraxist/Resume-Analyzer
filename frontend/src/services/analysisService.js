import api from './api';

class AnalysisService {
  // Analyze resume against occupation
  async analyzeResume(resumeId, occupationCode) {
    const response = await api.post('/analysis/analyze', {
      resumeId,
      occupationCode
    });
    return response.data;
  }
  
  // Compare specific dimension
  async compareDimension(data) {
    const response = await api.post('/analysis/compare-dimension', data);
    return response.data;
  }
  
  // Search analyses
  async searchAnalyses(params = {}) {
    const response = await api.get('/analysis/search', { params });
    return response.data;
  }
  
  // Get analysis statistics
  async getStatistics() {
    const response = await api.get('/analysis/statistics');
    return response.data;
  }
  
  // Get specific analysis by ID
  async getAnalysis(id) {
    const response = await api.get(`/analysis/${id}`);
    return response.data;
  }
  
  // Get recommendations for specific analysis
  async getRecommendations(id) {
    const response = await api.get(`/analysis/${id}/recommendations`);
    return response.data;
  }
  
  // Delete analysis
  async deleteAnalysis(id) {
    const response = await api.delete(`/analysis/${id}`);
    return response.data;
  }
  
  // Get all analyses for a specific resume
  async getResumeAnalyses(resumeId) {
    const response = await api.get(`/analysis/resume/${resumeId}`);
    return response.data;
  }
  
  // Get top occupation matches for a resume
  async getTopMatches(resumeId) {
    const response = await api.get(`/analysis/resume/${resumeId}/top-matches`);
    return response.data;
  }
  
  // Get all analyses for a specific occupation
  async getOccupationAnalyses(occupationCode) {
    const response = await api.get(`/analysis/occupation/${occupationCode}`);
    return response.data;
  }
  
  // Calculate fit category based on score
  getFitCategory(score) {
    if (score >= 85) {
      return {
        category: 'Excellent Match',
        color: 'success',
        description: 'You are highly qualified for this position'
      };
    } else if (score >= 70) {
      return {
        category: 'Good Match',
        color: 'primary',
        description: 'You have strong qualifications with minor gaps'
      };
    } else if (score >= 50) {
      return {
        category: 'Moderate Match',
        color: 'warning',
        description: 'You have foundational qualifications but need development'
      };
    } else {
      return {
        category: 'Poor Match',
        color: 'danger',
        description: 'Significant skill development needed for this role'
      };
    }
  }
  
  // Format dimension scores for visualization
  formatDimensionScores(dimensionScores) {
    const dimensions = ['tasks', 'skills', 'education', 'workActivities', 'knowledge', 'tools'];
    return dimensions.map(dim => ({
      dimension: dim.charAt(0).toUpperCase() + dim.slice(1).replace(/([A-Z])/g, ' $1'),
      score: dimensionScores[dim]?.score || 0,
      fullMark: 100
    }));
  }
}

export default new AnalysisService();