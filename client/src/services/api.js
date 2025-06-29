const API_BASE_URL = 'https://studymate-ara8.onrender.com';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async healthCheck() {
    return this.request('/health');
  }

  async summarizeText(text) {
    return this.request('/api/summarize', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async generateRap(text, style = 'hip-hop') {
    return this.request('/api/generate-rap', {
      method: 'POST',
      body: JSON.stringify({ text, style }),
    });
  }

  async getRhymes(word) {
    return this.request('/api/rhymes', {
      method: 'POST',
      body: JSON.stringify({ word }),
    });
  }

  async textToSpeech(text) {
    return this.request('/api/text-to-speech', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async batchProcess(texts) {
    return this.request('/api/batch-process', {
      method: 'POST',
      body: JSON.stringify({ texts }),
    });
  }

  async getStyles() {
    return this.request('/api/styles');
  }
}

export default new ApiService();