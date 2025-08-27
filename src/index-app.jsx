import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Load the data
fetch('/data.min.json')
  .then(res => res.json())
  .then(data => {
    // Make data available globally
    window.__MINECRAFT_DATA__ = data;
    
    // Render the app
    const container = document.getElementById('root');
    const root = createRoot(container);
    root.render(<App />);
  })
  .catch(err => {
    console.error('Failed to load Minecraft data:', err);
    document.getElementById('root').innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <h2>Failed to load Minecraft data</h2>
        <p>Please ensure data.min.json is available</p>
      </div>
    `;
  });