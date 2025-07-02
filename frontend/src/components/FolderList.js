import React, { useEffect, useState } from 'react';

const apiUrl = process.env.REACT_APP_API_URL || '';

const FolderList = () => {
  const [folders, setFolders] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${apiUrl}/list-folders`)
      .then(res => {
        if (!res.ok) throw new Error('Kunde inte hämta mappar');
        return res.json();
      })
      .then(setFolders)
      .catch(e => setError(e.message));
  }, []);

  const handleDelete = (folderId, event) => {
    event.stopPropagation(); // Prevent onFolderClick from being called
    onFolderDelete(folderId);
  };

  const handleShare = (folderId, event) => {
    event.stopPropagation();
    onFolderShare(folderId);
  };

  if (error) return <div className="error-message">Fel: {error}</div>;

  return (
    <div className="folder-list-container">
      <h2>Mappar</h2>
      {folders.length === 0 && <p>Inga mappar uppladdade ännu.</p>}
      {folders.map(folder => (
        <div key={folder.id} className={`folder-block folder-status-${folder.status}`}>
          <div className="folder-header">
            <b>{folder.name}</b> <span className="folder-status">[{folder.status}]</span>
            {folder.status === 'ready' && (
              <a href={`${apiUrl}/folders/${folder.id}/download`} className="download-btn">Ladda ner zip</a>
            )}
            {folder.status === 'quarantine' && (
              <span className="quarantine-warning">Karantän – minst en fil blockerad</span>
            )}
          </div>
          <ul className="file-list-in-folder">
            {folder.files.map(file => (
              <li key={file.id} className={`file-status-${file.scan_status}`}>
                {file.filename} <span>[{file.scan_status}]</span>
                {file.scan_status === 'clean' && (
                  <a href={`${apiUrl}/files/${file.id}/download`} className="download-btn">Ladda ner</a>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default FolderList;
