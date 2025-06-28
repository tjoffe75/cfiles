import React, { useState } from 'react';

const FileUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setMessage(''); // Clear message when new file is selected
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
      const response = await fetch('http://localhost:8000/upload/', {
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
        onUploadSuccess(); // Notify parent component to refresh file list
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
      console.error('Upload failed:', error);
    }
  };

  return (
    <div className="file-upload">
      <h2>Upload a New File</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {message && <p className="upload-message">{message}</p>}
    </div>
  );
};

export default FileUpload;
