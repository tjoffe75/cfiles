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

    const response = await fetch('http://localhost:8000/upload-chunk', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload chunk');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first!');
      return;
    }

    const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, selectedFile.size);
      const chunk = selectedFile.slice(start, end);

      try {
        await uploadChunk(chunk, chunkIndex);
        setUploadProgress(((chunkIndex + 1) / totalChunks) * 100);
      } catch (error) {
        console.error('Error uploading chunk:', error);
        alert('An error occurred while uploading the file.');
        return;
      }
    }

    alert('File uploaded successfully!');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div>
      <button onClick={toggleDarkMode}>
        {darkMode ? 'Disable Dark Mode' : 'Enable Dark Mode'}
      </button>
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h2>Welcome to the File Upload System</h2>
        <p>Use the buttons above to toggle dark mode.</p>
      </div>
      <h2>Upload File</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      <div>Upload Progress: {uploadProgress.toFixed(2)}%</div>
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}>
        <p style={{ color: '#333' }}>If you see this message, the component is rendering correctly.</p>
      </div>
    </div>
  );
};

export default FileUpload;
