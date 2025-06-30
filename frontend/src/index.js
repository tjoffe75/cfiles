import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Importera App-komponenten
import './App.css'; // Importera den nya CSS-filen

// Skapa nödvändiga mappar om frontend körs i Node-miljö (t.ex. SSR)
if (typeof require !== 'undefined' && typeof process !== 'undefined') {
  const fs = require('fs');
  ["uploads", "quarantine", "testfiles"].forEach(folder => {
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
