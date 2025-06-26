import React, { useState, useEffect } from 'react';

const FileList = ({ refreshKey }) => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  const fetchFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/config/files/');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      setError(error.message);
      console.error('Failed to fetch files:', error);
    }
  };

  useEffect(() => {
    fetchFiles(); // Fetch initially

    const interval = setInterval(() => {
      fetchFiles(); // And then fetch every 3 seconds
    }, 3000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [refreshKey]); // Also re-run when refreshKey changes

  const getStatusClass = (status) => {
    switch (status) {
      case 'CLEAN':
        return 'status-clean';
      case 'INFECTED':
        return 'status-infected';
      case 'SCANNING':
        return 'status-scanning';
      case 'PENDING':
        return 'status-pending';
      case 'ERROR':
        return 'status-error';
      default:
        return '';
    }
  };

  return (
    <div className="file-list">
      <h2>Uploaded Files</h2>
      {error && <p className="error-message">Error fetching files: {error}</p>}
      <table>
        <thead>
          <tr>
            <th>Filename</th>
            <th>Status</th>
            <th>Details</th>
            <th>Path</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id}>
              <td>{file.filename}</td>
              <td>
                <span className={`status-badge ${getStatusClass(file.status)}`}>
                  {file.status}
                </span>
              </td>
              <td>{file.details}</td>
              <td>{file.filepath}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileList;
