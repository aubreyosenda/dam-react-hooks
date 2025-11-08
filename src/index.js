/**
 * DAM React Hooks Library
 * React hooks and components for DAM System integration
 * 
 * @author Aubrey Osenda
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// ==================== DAM CONTEXT ====================

const DAMContext = createContext(null);

/**
 * DAM Provider Component
 * Wrap your app with this provider to use DAM hooks
 * 
 * @example
 * <DAMProvider config={{ apiUrl, keyId, keySecret }}>
 *   <App />
 * </DAMProvider>
 */
export function DAMProvider({ config, children }) {
  if (!config || !config.apiUrl || !config.keyId || !config.keySecret) {
    throw new Error('DAMProvider requires config with apiUrl, keyId, and keySecret');
  }

  const [client] = useState(() => {
    // Create client instance (assumes DAMClient is imported or available)
    return {
      apiUrl: config.apiUrl.replace(/\/$/, ''),
      keyId: config.keyId,
      keySecret: config.keySecret,
      baseUrl: `${config.apiUrl.replace(/\/$/, '')}/api`,
    };
  });

  return (
    <DAMContext.Provider value={client}>
      {children}
    </DAMContext.Provider>
  );
}

/**
 * Hook to access DAM client configuration
 */
export function useDAMClient() {
  const context = useContext(DAMContext);
  if (!context) {
    throw new Error('useDAMClient must be used within a DAMProvider');
  }
  return context;
}

// ==================== API REQUEST HELPER ====================

function useDAMRequest() {
  const client = useDAMClient();

  const request = useCallback(async (endpoint, options = {}) => {
    const url = `${client.baseUrl}${endpoint}`;
    const headers = {
      'X-API-Key-ID': client.keyId,
      'X-API-Key-Secret': client.keySecret,
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
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Request failed');
    }

    return data;
  }, [client]);

  return request;
}

// ==================== FILE HOOKS ====================

/**
 * Hook for listing and managing files
 * 
 * @example
 * const { files, loading, error, refetch } = useFiles({ 
 *   folderId: 'folder-123',
 *   mimeType: 'image/*' 
 * });
 */
export function useFiles(options = {}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const request = useDAMRequest();

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.folderId) params.append('folder_id', options.folderId);
      if (options.mimeType) params.append('mime_type', options.mimeType);
      if (options.search) params.append('search', options.search);
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);

      const query = params.toString();
      const data = await request(`/files${query ? '?' + query : ''}`);

      setFiles(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [request, options.folderId, options.mimeType, options.search, options.limit, options.offset]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    files,
    loading,
    error,
    pagination,
    refetch: fetchFiles,
  };
}

/**
 * Hook for getting a single file
 */
export function useFile(fileId) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const request = useDAMRequest();

  const fetchFile = useCallback(async () => {
    if (!fileId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await request(`/files/${fileId}`);
      setFile(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [request, fileId]);

  useEffect(() => {
    fetchFile();
  }, [fetchFile]);

  return {
    file,
    loading,
    error,
    refetch: fetchFile,
  };
}

/**
 * Hook for file upload with progress tracking
 * 
 * @example
 * const { upload, uploading, progress, error } = useFileUpload();
 * 
 * const handleUpload = async (file) => {
 *   const result = await upload(file, { folderId: 'folder-123' });
 *   console.log('Uploaded:', result);
 * };
 */
export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const client = useDAMClient();

  const upload = useCallback(async (file, options = {}) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      if (options.folderId) {
        formData.append('folder_id', options.folderId);
      }

      if (options.metadata) {
        formData.append('metadata', JSON.stringify(options.metadata));
      }

      // Use XMLHttpRequest for progress tracking
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = `${client.baseUrl}/upload/single`;

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setProgress(percent);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response.data);
            } catch (err) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.message || 'Upload failed'));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', url);
        xhr.setRequestHeader('X-API-Key-ID', client.keyId);
        xhr.setRequestHeader('X-API-Key-Secret', client.keySecret);
        xhr.send(formData);
      });

      setProgress(100);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [client]);

  const uploadMultiple = useCallback(async (files, options = {}) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
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

      const url = `${client.baseUrl}/upload/multiple`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key-ID': client.keyId,
          'X-API-Key-Secret': client.keySecret,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Upload failed');
      }

      setProgress(100);
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [client]);

  return {
    upload,
    uploadMultiple,
    uploading,
    progress,
    error,
    reset: () => {
      setProgress(0);
      setError(null);
    },
  };
}

/**
 * Hook for file operations (update, delete, move)
 */
export function useFileOperations() {
  const request = useDAMRequest();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateFile = useCallback(async (fileId, updates) => {
    setLoading(true);
    setError(null);

    try {
      const data = await request(`/files/${fileId}`, {
        method: 'PUT',
        body: updates,
      });
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request]);

  const moveFile = useCallback(async (fileId, folderId) => {
    setLoading(true);
    setError(null);

    try {
      const data = await request(`/files/${fileId}/move`, {
        method: 'PUT',
        body: { folder_id: folderId },
      });
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request]);

  const deleteFile = useCallback(async (fileId) => {
    setLoading(true);
    setError(null);

    try {
      await request(`/files/${fileId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request]);

  const deleteFiles = useCallback(async (fileIds) => {
    setLoading(true);
    setError(null);

    try {
      const data = await request('/files/bulk-delete', {
        method: 'POST',
        body: { file_ids: fileIds },
      });
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [request]);

  return {
    updateFile,
    moveFile,
    deleteFile,
    deleteFiles,
    loading,
    error,
  };
}

// ==================== FOLDER HOOKS ====================

/**
 * Hook for listing and managing folders
 * 
 * @example
 * const { folders, loading, error, createFolder } = useFolders();
 */
export function useFolders(options = {}) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const request = useDAMRequest();

  const fetchFolders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.parentId !== undefined) {
        params.append('parent_id', options.parentId);
      }

      const query = params.toString();
      const data = await request(`/folders${query ? '?' + query : ''}`);

      setFolders(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [request, options.parentId]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = useCallback(async (name, folderOptions = {}) => {
    setError(null);

    try {
      const data = await request('/folders', {
        method: 'POST',
        body: {
          name,
          ...folderOptions,
        },
      });

      await fetchFolders();
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [request, fetchFolders]);

  const updateFolder = useCallback(async (folderId, updates) => {
    setError(null);

    try {
      const data = await request(`/folders/${folderId}`, {
        method: 'PUT',
        body: updates,
      });

      await fetchFolders();
      return data.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [request, fetchFolders]);

  const deleteFolder = useCallback(async (folderId) => {
    setError(null);

    try {
      await request(`/folders/${folderId}`, {
        method: 'DELETE',
      });

      await fetchFolders();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [request, fetchFolders]);

  return {
    folders,
    loading,
    error,
    refetch: fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}

/**
 * Hook for getting a single folder with details
 */
export function useFolder(folderId) {
  const [folder, setFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const request = useDAMRequest();

  const fetchFolder = useCallback(async () => {
    if (!folderId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await request(`/folders/${folderId}`);
      setFolder(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [request, folderId]);

  useEffect(() => {
    fetchFolder();
  }, [fetchFolder]);

  return {
    folder,
    loading,
    error,
    refetch: fetchFolder,
  };
}

// ==================== URL GENERATION HOOKS ====================

/**
 * Hook for generating file URLs
 */
export function useFileUrl(fileId, transformOptions = null) {
  const client = useDAMClient();

  if (!fileId) return null;

  if (!transformOptions) {
    return `${client.apiUrl}/api/transform/${fileId}`;
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
  return `${client.apiUrl}/api/transform/${fileId}${query ? '?' + query : ''}`;
}

// ==================== STATISTICS HOOKS ====================

/**
 * Hook for dashboard statistics
 */
export function useDashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const request = useDAMRequest();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await request('/stats/dashboard');
      setStats(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Hook for storage statistics
 */
export function useStorageStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const request = useDAMRequest();

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await request('/stats/storage');
      setStats(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

// ==================== UTILITY HOOKS ====================

/**
 * Hook for debounced search
 */
export function useDebouncedSearch(initialValue = '', delay = 500) {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [debouncedValue, value, setValue];
}

// ==================== EXPORTS ====================

export default {
  DAMProvider,
  useDAMClient,
  useFiles,
  useFile,
  useFileUpload,
  useFileOperations,
  useFolders,
  useFolder,
  useFileUrl,
  useDashboardStats,
  useStorageStats,
  useDebouncedSearch,
};