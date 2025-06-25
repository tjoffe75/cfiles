import React, { useState, useEffect } from 'react';
import './DarkMode.css';

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [darkMode, setDarkMode] = useState(false);

  const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB per chunk

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode) {
      setDarkMode(savedMode === 'true');
    }
  }, []);

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : '';
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const uploadChunk = async (chunk, chunkIndex) => {
    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('chunkIndex', chunkIndex);
    formData.append('fileName', selectedFile.name);

    const response = await fetch('http://localhost:8000/config/upload-chunk', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload chunk');
    }
  };

  const handleUpload = async () => {
    console.log('Upload button clicked');
    if (!selectedFile) {
      alert('Please select a file first!');
      console.log('No file selected');
      return;
    }

    console.log(`File selected: ${selectedFile.name}, size: ${selectedFile.size}`);
    const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, selectedFile.size);
      const chunk = selectedFile.slice(start, end);

      try {
        console.log(`Uploading chunk ${chunkIndex + 1} of ${totalChunks}`);
        await uploadChunk(chunk, chunkIndex);
        setUploadProgress(((chunkIndex + 1) / totalChunks) * 100);
      } catch (error) {
        console.error(`Failed to upload chunk ${chunkIndex + 1}:`, error);
        alert(`Failed to upload chunk ${chunkIndex + 1}`);
        return;
      }
    }

    alert('File uploaded successfully!');
    console.log('File uploaded successfully');
  };

  return (
    <div className="file-upload">
      <h1>File Upload</h1>
      <label>
        Dark Mode:
        <input
          type="checkbox"
          checked={darkMode}
          onChange={() => setDarkMode(!darkMode)}
        />
      </label>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {selectedFile && (
        <div>
          <p>File: {selectedFile.name}</p>
          <p>Size: {selectedFile.size} bytes</p>
          <progress value={uploadProgress} max="100" />
        </div>
      )}
    </div>
  );
};

export default FileUpload;
