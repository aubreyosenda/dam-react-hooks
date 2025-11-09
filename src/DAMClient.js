/**
 * DAM Client - Core API client for DAM System
 * Handles API key authentication and HTTP requests
 */
class DAMClient {
  constructor(config) {
    if (!config || !config.apiUrl || !config.keyId || !config.keySecret) {
      throw new Error('DAMClient requires config with apiUrl, keyId, and keySecret');
    }

    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.keyId = config.keyId;
    this.keySecret = config.keySecret;
    this.baseUrl = `${this.apiUrl}/api`;
  }

  /**
   * Make authenticated request to DAM API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'X-API-Key-ID': this.keyId,
      'X-API-Key-Secret': this.keySecret,
      ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const fetchOptions = {
      method: options.method || 'GET',
      headers,
      ...options,
    };

    if (options.body && !(options.body instanceof FormData)) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  /**
   * Upload single file using API key
   */
  async uploadFile(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);

    if (options.folderId) {
      formData.append('folder_id', options.folderId);
    }

    if (options.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    return this.request('/public/single', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Upload multiple files using API key
   */
  async uploadMultipleFiles(files, options = {}) {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });

    if (options.folderId) {
      formData.append('folder_id', options.folderId);
    }

    if (options.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    return this.request('/public/multiple', {
      method: 'POST',
      body: formData,
    });
  }

  /**
   * Get user's files using API key
   */
  async getFiles(options = {}) {
    const params = new URLSearchParams();
    if (options.folderId) params.append('folder_id', options.folderId);
    if (options.mimeType) params.append('mime_type', options.mimeType);
    if (options.search) params.append('search', options.search);
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);

    const query = params.toString();
    return this.request(`/public/files${query ? '?' + query : ''}`);
  }

  /**
   * Get single file using API key
   */
  async getFile(fileId) {
    return this.request(`/public/files/${fileId}`);
  }

  /**
   * Delete file using API key
   */
  async deleteFile(fileId) {
    return this.request(`/public/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Generate file URL for display
   */
  getFileUrl(fileId, transformOptions = null) {
    if (!fileId) return null;

    if (!transformOptions) {
      return `${this.apiUrl}/api/transform/${fileId}`;
    }

    const params = new URLSearchParams();
    if (transformOptions.width) params.append('w', transformOptions.width);
    if (transformOptions.height) params.append('h', transformOptions.height);
    if (transformOptions.fit) params.append('fit', transformOptions.fit);
    if (transformOptions.format) params.append('format', transformOptions.format);
    if (transformOptions.quality) params.append('quality', transformOptions.quality);
    if (transformOptions.blur) params.append('blur', transformOptions.blur);
    if (transformOptions.grayscale) params.append('grayscale', 'true');
    if (transformOptions.rotate) params.append('rotate', transformOptions.rotate);

    const query = params.toString();
    return `${this.apiUrl}/api/transform/${fileId}${query ? '?' + query : ''}`;
  }

  /**
   * Test API connection
   */
  async testConnection() {
    return this.request('/public/files?limit=1');
  }
}

export default DAMClient;