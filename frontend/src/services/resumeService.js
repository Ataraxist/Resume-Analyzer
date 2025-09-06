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
  
  // Poll for processing status
  async pollStatus(id, maxAttempts = 30, interval = 2000) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const status = await this.getStatus(id);
      
      if (status.status === 'completed' || status.status === 'failed') {
        return status;
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
      attempts++;
    }
    
    throw new Error('Processing timeout');
  }
}

export default new ResumeService();