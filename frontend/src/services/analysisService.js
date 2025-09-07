import api from './api';

class AnalysisService {
  // Stream analysis with SSE
  streamAnalysis(resumeId, occupationCode, onDimensionUpdate, onComplete, onError) {
    const baseURL = api.defaults.baseURL || '';
    const token = localStorage.getItem('token');
    
    // Create EventSource for SSE streaming
    const url = `${baseURL}/analysis/stream/${resumeId}/${occupationCode}`;
    const eventSource = new EventSource(url, {
      withCredentials: true,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    
    // Handle connection
    eventSource.addEventListener('connected', (event) => {
      console.log('SSE analysis connected:', JSON.parse(event.data));
    });
    
    // Handle dimension updates
    eventSource.addEventListener('dimension_update', (event) => {
      const { dimension, scores, cached } = JSON.parse(event.data);
      if (onDimensionUpdate) {
        onDimensionUpdate(dimension, scores, cached);
      }
    });
    
    // Handle completion
    eventSource.addEventListener('completed', (event) => {
      const analysisData = JSON.parse(event.data);
      if (onComplete) {
        onComplete(analysisData);
      }
      eventSource.close();
    });
    
    // Handle errors
    eventSource.addEventListener('error', (event) => {
      if (event.data) {
        const errorData = JSON.parse(event.data);
        if (onError) {
          onError(errorData.error);
        }
      }
      eventSource.close();
    });
    
    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error('SSE analysis connection error:', error);
      if (onError) {
        onError('Connection lost. Please try again.');
      }
      eventSource.close();
    };
    
    // Return cleanup function
    return () => {
      eventSource.close();
    };
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
      key: dim,  // Original key for filtering
      dimension: dim.charAt(0).toUpperCase() + dim.slice(1).replace(/([A-Z])/g, ' $1'),
      score: dimensionScores[dim]?.score || 0,
      fullMark: 100
    }));
  }
}

export default new AnalysisService();