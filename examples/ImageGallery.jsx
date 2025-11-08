import React from 'react';
import { useFiles, useFileUrl } from 'dam-react-hooks';

export function ImageGallery({ folderId }) {
  const { files, loading, error } = useFiles({ 
    folderId, 
    mimeType: 'image/*' 
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      {files.map(file => (
        <ImageCard key={file.id} file={file} />
      ))}
    </div>
  );
}

function ImageCard({ file }) {
  const thumbnailUrl = useFileUrl(file.id, {
    width: 300,
    height: 300,
    fit: 'cover',
    format: 'webp'
  });

  return (
    <div className="border rounded overflow-hidden">
      <img src={thumbnailUrl} alt={file.original_name} />
      <div className="p-2">
        <p className="text-sm truncate">{file.original_name}</p>
      </div>
    </div>
  );
}