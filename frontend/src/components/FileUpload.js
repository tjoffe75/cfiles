import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import './FileUpload.css';

const API_URL = '/api'; // Use relative path

const FileUpload = ({ onUploadSuccess }) => {
    const [files, setFiles] = useState([]);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [dragActive, setDragActive] = useState(false);

    const onDrop = useCallback((acceptedFiles) => {
        setFiles(acceptedFiles);
        setError(null);
    }, []);

    const handleUpload = useCallback(async () => {
        if (files.length === 0) {
            setError('Please select files to upload.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch(`${API_URL}/upload`, { // Corrected URL
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
            setFiles([]); // Clear the files state
            if (onUploadSuccess) {
                onUploadSuccess(result); // Skicka upp filobjektet till App.js
            }
        } catch (error) {
            setMessage(`Error: ${error.message}`);
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    }, [files, onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        accept: {
            'image/*': [],
            'video/*': [],
            'application/pdf': [],
        },
    });

    return (
        <div className="file-upload-container">
            <div
                {...getRootProps()}
                className={`file-upload-dropzone ${isDragActive ? 'drag-active' : ''}`}
            >
                <input {...getInputProps()} />
                <p>Drag and drop files here, or click to select files</p>
            </div>
            <button onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload'}
            </button>
            {error && <p className="upload-error">{error}</p>}
            {message && <p className="upload-message">{message}</p>}
        </div>
    );
};

export default FileUpload;
