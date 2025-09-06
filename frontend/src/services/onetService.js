import api from './api';

class OnetService {
  // Get all occupations with pagination
  async getOccupations(params = {}) {
    const { search = '', limit = 100, offset = 0 } = params;
    const response = await api.get('/onet/occupations', {
      params: { search, limit, offset }
    });
    return response.data;
  }
  
  // Get specific occupation details
  async getOccupationDetails(code) {
    const response = await api.get(`/onet/occupations/${code}`);
    return response.data;
  }
  
  // Get specific dimension for an occupation
  async getOccupationDimension(code, dimension) {
    const response = await api.get(`/onet/occupations/${code}/${dimension}`);
    return response.data;
  }
  
  // Search occupations with advanced filters
  async searchOccupations(searchData) {
    const response = await api.post('/onet/search', searchData);
    return response.data;
  }
  
  // Get fetch status
  async getStatus() {
    const response = await api.get('/onet/status');
    return response.data;
  }
  
  // Fetch specific occupation data on-demand
  async fetchOccupationData(code) {
    const response = await api.post(`/onet/fetch-occupation/${code}`);
    return response.data;
  }
  
  // Search occupations with debouncing support
  async searchWithDebounce(query, delay = 300) {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    return new Promise((resolve) => {
      this.searchTimeout = setTimeout(async () => {
        const results = await this.getOccupations({ search: query });
        resolve(results);
      }, delay);
    });
  }
  
  // Get popular occupations (cached client-side)
  getPopularOccupations() {
    return [
      { code: '15-1252.00', title: 'Software Developers' },
      { code: '13-1111.00', title: 'Management Analysts' },
      { code: '13-2011.00', title: 'Accountants and Auditors' },
      { code: '11-3031.00', title: 'Financial Managers' },
      { code: '41-3099.00', title: 'Sales Representatives' },
      { code: '11-9198.00', title: 'Project Management Specialists' },
      { code: '15-1299.00', title: 'Computer Occupations, All Other' },
      { code: '13-1161.00', title: 'Market Research Analysts' },
      { code: '11-1011.00', title: 'Chief Executives' },
      { code: '15-1211.00', title: 'Computer Systems Analysts' }
    ];
  }
}

export default new OnetService();