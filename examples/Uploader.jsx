import React from 'react';
import { useFileUpload } from 'dam-react-hooks';

export function Uploader({ folderId, onUploadComplete }) {
  const { upload, uploading, progress, error } = useFileUpload();

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      await upload(file, { folderId });
    }
    onUploadComplete?.();
  };

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={handleFiles}
        disabled={uploading}
      />
      {uploading && (
        <div>
          <progress value={progress} max="100" />
          <span>{progress}%</span>
        </div>
      )}
      {error && <div className="text-red-500">{error}</div>}
    </div>
  );
}