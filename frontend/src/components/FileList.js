import React from 'react';

const FileList = ({ files, error }) => {
  const getStatusClass = (status) => {
    switch (status) {
      case 'clean':
        return 'status-clean';
      case 'infected':
        return 'status-infected';
      case 'pending':
        return 'status-pending';
      case 'scanning':
        return 'status-scanning';
      case 'error':
        return 'status-error';
      default:
        return '';
    }
  };

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="file-list-container">
      <h2>Uploaded Files</h2>
      <table className="file-list-table">
        <thead>
          <tr>
            <th>Filename</th>
            <th>Status</th>
            <th>Details</th>
            <th>Checksum</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.filter(file => file.filename).map(file => (
            <tr key={file.id}>
              <td>{file.filename}</td>
              <td>
                <span className={`status-badge ${getStatusClass(file.scan_status)}`}>
                  {file.scan_status}
                </span>
              </td>
              <td>{file.scan_details}</td>
              <td>{file.checksum}</td>
              <td>
                {file.scan_status === 'clean' && (
                  <a 
                    href={`${process.env.REACT_APP_API_URL || ''}/files/${file.id}/download`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="download-btn"
                    download
                  >
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
