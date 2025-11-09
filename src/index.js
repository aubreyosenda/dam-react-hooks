import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import DAMClient from './DAMClient.js';

// ==================== DAM CONTEXT ====================

const DAMContext = createContext(null);

/**
 * DAM Provider Component
 * Wrap your app with this provider to use DAM hooks
 */
export function DAMProvider({ config, children }) {
  const [client] = useState(() => new DAMClient(config));

  return (
    <DAMContext.Provider value={client}>
      {children}
    </DAMContext.Provider>
  );
}

/**
 * Hook to access DAM client
 */
export function useDAMClient() {
  const context = useContext(DAMContext);
  if (!context) {
    throw new Error('useDAMClient must be used within a DAMProvider');
  }
  return context;
}

// ==================== FILE HOOKS ====================

/**
 * Hook for listing files using API key
 */
export function useFiles(options = {}) {
  const client = useDAMClient();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await client.getFiles(options);
      setFiles(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [client, JSON.stringify(options)]);

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
 * Hook for getting a single file using API key
 */
export function useFile(fileId) {
  const client = useDAMClient();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFile = useCallback(async () => {
    if (!fileId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await client.getFile(fileId);
      setFile(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [client, fileId]);

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
 * Hook for file upload with progress tracking using API key
 */
export function useFileUpload() {
  const client = useDAMClient();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const upload = useCallback(async (file, options = {}) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Use XMLHttpRequest for progress tracking
      const result = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = `${client.baseUrl}/public/single`;

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
        
        const formData = new FormData();
        formData.append('file', file);
        if (options.folderId) {
          formData.append('folder_id', options.folderId);
        }
        if (options.metadata) {
          formData.append('metadata', JSON.stringify(options.metadata));
        }

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
      const result = await client.uploadMultipleFiles(files, options);
      setProgress(100);
      return result.data;
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
 * Hook for file operations using API key
 */
export function useFileOperations() {
  const client = useDAMClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteFile = useCallback(async (fileId) => {
    setLoading(true);
    setError(null);

    try {
      await client.deleteFile(fileId);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [client]);

  return {
    deleteFile,
    loading,
    error,
  };
}

/**
 * Hook for generating file URLs
 */
export function useFileUrl(fileId, transformOptions = null) {
  const client = useDAMClient();
  return client.getFileUrl(fileId, transformOptions);
}

/**
 * Hook for testing API connection
 */
export function useTestConnection() {
  const client = useDAMClient();
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  const testConnection = useCallback(async () => {
    setTesting(true);
    setError(null);

    try {
      await client.testConnection();
      setConnected(true);
      return true;
    } catch (err) {
      setError(err.message);
      setConnected(false);
      return false;
    } finally {
      setTesting(false);
    }
  }, [client]);

  return {
    testConnection,
    testing,
    connected,
    error,
  };
}

// ==================== EXPORTS ====================

export default {
  DAMProvider,
  useDAMClient,
  useFiles,
  useFile,
  useFileUpload,
  useFileOperations,
  useFileUrl,
  useTestConnection,
};