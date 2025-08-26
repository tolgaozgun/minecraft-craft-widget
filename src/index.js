import React from 'react';
import { createRoot } from 'react-dom/client';
import MinecraftCraftWidget from './MinecraftCraftWidget.jsx';
import './styles.css';

// Self-initializing widget
(function() {
  
  // Get packed data
  const packedData = typeof __PACKED_DATA__ !== 'undefined' ? 
    JSON.parse(__PACKED_DATA__) : null;
  
  // Initialize widget
  function initWidget(containerId = 'mc-craft', options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`MinecraftCraftWidget: Container #${containerId} not found`);
      return;
    }
    
    // Default options
    const defaultOptions = {
      iconBaseUrl: options.iconBaseUrl || 'https://raw.githubusercontent.com/tolgaozgun/minecraft-craft-widget/main/out/',
      data: options.data || packedData
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    // Check if we need to load data
    if (!finalOptions.data) {
      console.log('Loading Minecraft data...');
      fetch(finalOptions.iconBaseUrl + 'data.min.json')
        .then(res => res.json())
        .then(data => {
          finalOptions.data = data;
          renderWidget(container, finalOptions);
        })
        .catch(err => {
          console.error('Failed to load Minecraft data:', err);
          container.innerHTML = '<div class="mc-craft-loading">Failed to load data. Please check console.</div>';
        });
    } else {
      renderWidget(container, finalOptions);
    }
  }
  
  function renderWidget(container, options) {
    const root = createRoot(container);
    root.render(
      React.createElement(MinecraftCraftWidget, {
        data: options.data,
        iconBaseUrl: options.iconBaseUrl
      })
    );
  }
  
  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initWidget());
  } else {
    // DOM already loaded
    setTimeout(() => initWidget(), 0);
  }
  
  // Expose global init function
  window.MinecraftCraftWidget = {
    init: initWidget
  };
})();