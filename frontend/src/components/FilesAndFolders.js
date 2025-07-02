import React from 'react';

const apiUrl = process.env.REACT_APP_API_URL || '';

const FilesAndFolders = ({ folders, files, error }) => {
  // Filer som inte tillhör någon mapp
  const otherFiles = files.filter(f => !f.folder_id);

  if (error) return <div className="error-message">Fel: {error}</div>;

  return (
    <div className="files-folders-section">
      <h2>Filer & Mappar</h2>
      {folders.length === 0 && otherFiles.length === 0 && <p>Inga filer eller mappar uppladdade ännu.</p>}
      {folders.map(folder => (
        <div key={folder.id} className={`folder-block folder-status-${folder.status}`}>
          <div className="folder-header">
            <b>{folder.name}</b>
            <span className="folder-status-badge">[{folder.status}]</span>
            {folder.status === 'pending' && (
              <span className="pending-info">(Alla filer måste skannas klart innan mappen är klar)</span>
            )}
            {folder.status === 'ready' && (
              <a href={`${apiUrl}/folders/${folder.id}/download`} className="download-btn">Ladda ner zip</a>
            )}
            {folder.status === 'quarantine' && (
              <span className="quarantine-warning">Karantän</span>
            )}
          </div>
          <ul className="file-list-in-folder">
            {folder.files.map(file => (
              <li key={file.id} className={`file-status-${file.scan_status}`}>
                {file.filename} <span>[{file.scan_status}]</span>
                {file.scan_status === 'pending' && (
                  <span className="pending-info">(Väntar på scanning...)</span>
                )}
                {file.scan_status === 'clean' && (
                  <a href={`${apiUrl}/files/${file.id}/download`} className="download-btn">Ladda ner</a>
                )}
                {file.scan_status === 'infected' && (
                  <span className="quarantine-warning">Infekterad</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {otherFiles.length > 0 && (
        <>
          <h3>Övriga filer</h3>
          <ul className="file-list-standalone">
            {otherFiles.map(file => (
              <li key={file.id} className={`file-status-${file.scan_status}`}>
                {file.filename} <span>[{file.scan_status}]</span>
                {file.scan_status === 'clean' && (
                  <a href={`${apiUrl}/files/${file.id}/download`} className="download-btn">Ladda ner</a>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default FilesAndFolders;
