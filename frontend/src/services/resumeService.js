import api from './api';

class ResumeService {
  // Upload resume file
  async uploadResume(file) {
    const formData = new FormData();
    formData.append('resume', file);
    
    // Don't set Content-Type header - axios will set it automatically with the correct boundary
    const response = await api.post('/resume/upload', formData);
    
    return response.data;
  }
  
  // Parse text input
  async parseText(text) {
    const response = await api.post('/resume/parse-text', { text });
    return response.data;
  }
  
  // Import resume from Google Docs
  async importFromGoogleDoc(url) {
    const response = await api.post('/resume/import-google-doc', { url });
    return response.data;
  }
  
  // Get all resumes
  async getAllResumes(params = {}) {
    const response = await api.get('/resume', { params });
    return response.data;
  }
  
  // Get resumes for current user or session
  async getMyResumes(limit = 10) {
    const response = await api.get('/resume/my-resumes', { params: { limit } });
    return response.data;
  }
  
  // Search resumes
  async searchResumes(query) {
    const response = await api.get('/resume/search', { params: { query } });
    return response.data;
  }
  
  // Get resume by ID
  async getResume(id) {
    const response = await api.get(`/resume/${id}`);
    return response.data;
  }
  
  // Get processing status
  async getStatus(id) {
    const response = await api.get(`/resume/${id}/status`);
    return response.data;
  }
  
  // Get structured data
  async getStructuredData(id) {
    const response = await api.get(`/resume/${id}/structured`);
    return response.data;
  }
  
  // Update structured data
  async updateStructuredData(id, data) {
    const response = await api.put(`/resume/${id}/structured`, data);
    return response.data;
  }
  
  // Get key elements
  async getKeyElements(id) {
    const response = await api.get(`/resume/${id}/key-elements`);
    return response.data;
  }
  
  // Delete resume
  async deleteResume(id) {
    const response = await api.delete(`/resume/${id}`);
    return response.data;
  }
  
  // Stream resume parsing with SSE
  streamParsing(id, onFieldUpdate, onComplete, onError) {
    const baseURL = api.defaults.baseURL || '';
    const token = localStorage.getItem('token');
    
    // Create EventSource with auth token if available
    const url = `${baseURL}/resume/${id}/stream`;
    const eventSource = new EventSource(url, {
      withCredentials: true,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    
    // Handle different event types
    eventSource.addEventListener('connected', (event) => {
      console.log('SSE connected:', JSON.parse(event.data));
    });
    
    eventSource.addEventListener('field_update', (event) => {
      const { field, value } = JSON.parse(event.data);
      if (onFieldUpdate) {
        onFieldUpdate(field, value);
      }
    });
    
    eventSource.addEventListener('completed', (event) => {
      const structuredData = JSON.parse(event.data);
      if (onComplete) {
        onComplete(structuredData);
      }
      eventSource.close();
    });
    
    eventSource.addEventListener('error', (event) => {
      if (event.data) {
        const errorData = JSON.parse(event.data);
        if (onError) {
          onError(errorData.error);
        }
      }
      eventSource.close();
    });
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
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
}

export default new ResumeService();