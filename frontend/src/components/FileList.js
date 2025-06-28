import React, { useState, useEffect } from 'react';

const FileList = ({ refreshKey }) => {
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch('http://localhost:8000/files/');
        const data = await response.json();
        setFiles(data);
      } catch (error) {
        setError(error.message);
        console.error('Failed to fetch files:', error);
      }
    };

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
            <th>Checksum</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id}>
              <td>{file.filename}</td>
              <td className={getStatusClass(file.scan_status)}>
                {file.scan_status}
              </td>
              <td>{file.checksum}</td>
              <td>
                {file.scan_status === 'clean' && (
                  <a href={`http://localhost:8000/download/${file.id}`} download>
                    Download
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileList;
