import React, { useState, useEffect } from 'react';
import './QuarantineManager.css';

function QuarantineManager() {
  const [quarantinedFiles, setQuarantinedFiles] = useState([]);
  const [error, setError] = useState(null);

  const fetchQuarantinedFiles = () => {
    fetch('http://localhost:5000/api/quarantine')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => setQuarantinedFiles(data))
      .catch(error => {
        console.error('Fetch error:', error);
        setError(error.message);
      });
  };

  useEffect(() => {
    fetchQuarantinedFiles();
  }, []);

  const handleRelease = (fileId) => {
    // Placeholder for release logic
    console.log(`Releasing file ${fileId}`);
    alert(`File ${fileId} released.`);
  };

  const handleDelete = (fileId) => {
    // Placeholder for delete logic
    console.log(`Deleting file ${fileId}`);
    alert(`File ${fileId} deleted.`);
  };

  return (
    <div>
      <h2>Quarantine</h2>
      {error && <p className="error">Error fetching quarantined files: {error}</p>}
      {quarantinedFiles.length > 0 ? (
        <table className="quarantine-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Original Path</th>
              <th>Quarantined At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quarantinedFiles.map(file => (
              <tr key={file.id}>
                <td>{file.filename}</td>
                <td>{file.original_path}</td>
                <td>{new Date(file.quarantined_at).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleRelease(file.id)} className="btn-release">Release</button>
                  <button onClick={() => handleDelete(file.id)} className="btn-delete">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !error && <p>No files in quarantine.</p>
      )}
    </div>
  );
}

export default QuarantineManager;
