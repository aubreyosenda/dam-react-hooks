import React, { useState } from 'react';
import { 
  DAMProvider, 
  useFiles, 
  useFileUpload, 
  useFileOperations,
  useFolders,
  useFileUrl,
  useDashboardStats
} from 'dam-react-hooks';

// ==================== FILE MANAGER COMPONENT ====================

function FileManager() {
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  
  const { files, loading, error, refetch } = useFiles({ 
    folderId: selectedFolder 
  });
  
  const { upload, uploading, progress } = useFileUpload();
  const { deleteFile, moveFile } = useFileOperations();
  const { folders } = useFolders();

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      await upload(file, { folderId: selectedFolder });
    }
    refetch();
  };

  const handleDelete = async (fileId) => {
    if (confirm('Delete this file?')) {
      await deleteFile(fileId);
      refetch();
    }
  };

  const handleMove = async (fileId, targetFolderId) => {
    await moveFile(fileId, targetFolderId);
    refetch();
  };

  const toggleFileSelection = (fileId) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading files...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <div className="text-red-800 font-medium">Error</div>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
        <input
          type="file"
          multiple
          onChange={handleFileUpload}
          disabled={uploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Folder Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Current Folder</h3>
        <select
          value={selectedFolder || ''}
          onChange={(e) => setSelectedFolder(e.target.value || null)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="">Root</option>
          {folders.map(folder => (
            <option key={folder.id} value={folder.id}>
              {folder.path}
            </option>
          ))}
        </select>
      </div>

      {/* Files Grid */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            Files ({files.length})
          </h3>
          {selectedFiles.length > 0 && (
            <button
              onClick={() => {
                selectedFiles.forEach(id => handleDelete(id));
                setSelectedFiles([]);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete Selected ({selectedFiles.length})
            </button>
          )}
        </div>

        {files.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No files in this folder
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map(file => (
              <FileCard
                key={file.id}
                file={file}
                selected={selectedFiles.includes(file.id)}
                onSelect={() => toggleFileSelection(file.id)}
                onDelete={() => handleDelete(file.id)}
                onMove={(folderId) => handleMove(file.id, folderId)}
                folders={folders}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== FILE CARD COMPONENT ====================

function FileCard({ file, selected, onSelect, onDelete, onMove, folders }) {
  const [showMenu, setShowMenu] = useState(false);
  
  const imageUrl = useFileUrl(
    file.is_image ? file.id : null,
    { width: 300, height: 300, fit: 'cover', format: 'webp' }
  );

  return (
    <div className={`relative border rounded-lg overflow-hidden ${selected ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="aspect-square bg-gray-100 relative">
        {file.is_image ? (
          <img
            src={imageUrl}
            alt={file.original_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Selection Checkbox */}
        <div className="absolute top-2 left-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="w-5 h-5 rounded"
          />
        </div>

        {/* Menu Button */}
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 bg-white rounded-full shadow hover:bg-gray-50"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
              <div className="border-t">
                <div className="px-4 py-2 text-xs text-gray-500">Move to:</div>
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      onMove(folder.id);
                      setShowMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    {folder.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="p-3">
        <div className="text-sm font-medium truncate" title={file.original_name}>
          {file.original_name}
        </div>
        <div className="text-xs text-gray-500">
          {file.size_formatted}
        </div>
      </div>
    </div>
  );
}

// ==================== DASHBOARD COMPONENT ====================

function Dashboard() {
  const { stats, loading, error } = useDashboardStats();

  if (loading) return <div>Loading stats...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatCard
        title="Total Files"
        value={stats.overview.fileCount}
        icon="📁"
        color="blue"
      />
      <StatCard
        title="Total Folders"
        value={stats.overview.folderCount}
        icon="📂"
        color="green"
      />
      <StatCard
        title="Storage Used"
        value={stats.overview.totalSizeFormatted}
        icon="💾"
        color="purple"
      />
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
        <div className={`text-4xl ${colors[color]} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN APP ====================

export default function App() {
  return (
    <DAMProvider
      config={{
        apiUrl: 'http://localhost:55055',
        keyId: 'your-key-id-here',
        keySecret: 'your-key-secret-here'
      }}
    >
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              DAM File Manager
            </h1>
            <p className="text-gray-600 mt-1">
              Complete example using DAM React Hooks
            </p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          <Dashboard />
          <FileManager />
        </main>
      </div>
    </DAMProvider>
  );
}