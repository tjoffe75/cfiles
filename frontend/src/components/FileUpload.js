import React, { useState } from 'react';
import './FileUpload.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const FileUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setMessage(''); // Clear message when new file is selected
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setSelectedFile(event.dataTransfer.files[0]);
      setMessage('');
      handleUploadAuto(event.dataTransfer.files[0]);
    }
  };

  // Automatisk uppladdning vid drag-and-drop
  const handleUploadAuto = async (file) => {
    if (!file) return;
    setMessage('Uploading...');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${API_URL}/upload/`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
        throw new Error(errorData.detail || 'Failed to upload file');
      }
      const result = await response.json();
      setMessage(`File uploaded successfully! Status: ${result.status}`);
      document.querySelector('input[type="file"]').value = '';
      setSelectedFile(null);
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      console.error('Upload failed:', error);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setMessage('Uploading...');

    try {
      const response = await fetch(`${API_URL}/upload/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
        throw new Error(errorData.detail || 'Failed to upload file');
      }

      const result = await response.json();
      setMessage(`File uploaded successfully! Status: ${result.status}`);
      // Clear the file input after successful upload
      document.querySelector('input[type="file"]').value = '';
      setSelectedFile(null);
      if (onUploadSuccess) {
        onUploadSuccess(result); // Skicka upp filobjektet till App.js
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      console.error('Upload failed:', error);
    }
  };

  return (
    <div 
      className={`file-upload ${dragActive ? 'drag-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
        <div className="dropzone-content">
            <p>Drag and drop a file here, or click to select a file</p>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleUpload}>Upload</button>
            {selectedFile && <p>Selected file: {selectedFile.name}</p>}
            {message && <p className="upload-message">{message}</p>}
        </div>
    </div>
  );
};

export default FileUpload;
