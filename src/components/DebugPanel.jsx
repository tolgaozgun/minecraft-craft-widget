import React, { useState, useEffect } from 'react';

const DebugPanel = ({ data, iconBaseUrl, selectedItem, recipes, uses }) => {
  const [imageLoadStats, setImageLoadStats] = useState({ loaded: 0, failed: 0, total: 0 });
  const [expandedSections, setExpandedSections] = useState({});
  const [networkLog, setNetworkLog] = useState([]);

  useEffect(() => {
    // Override fetch to log requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0];
      const start = Date.now();
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - start;
        setNetworkLog(prev => [...prev, {
          url,
          status: response.status,
          ok: response.ok,
          duration,
          time: new Date().toISOString()
        }]);
        return response;
      } catch (error) {
        setNetworkLog(prev => [...prev, {
          url,
          error: error.message,
          duration: Date.now() - start,
          time: new Date().toISOString()
        }]);
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const checkImageLoad = (url) => {
    const img = new Image();
    img.onload = () => {
      setImageLoadStats(prev => ({ ...prev, loaded: prev.loaded + 1 }));
    };
    img.onerror = () => {
      setImageLoadStats(prev => ({ ...prev, failed: prev.failed + 1 }));
      console.error('Failed to load image:', url);
    };
    img.src = url;
  };

  const testAllImages = () => {
    if (!data?.items) return;
    
    setImageLoadStats({ loaded: 0, failed: 0, total: data.items.length });
    
    data.items.forEach(item => {
      const url = `${iconBaseUrl}${item.icon}`;
      checkImageLoad(url);
    });
  };

  if (!data) {
    return <div className="debug-panel">No data loaded</div>;
  }

  return (
    <div className="debug-panel" style={{
      position: 'fixed',
      right: 0,
      top: 0,
      width: '400px',
      height: '100vh',
      overflowY: 'auto',
      background: 'rgba(0, 0, 0, 0.9)',
      color: '#0f0',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '10px',
      zIndex: 10000,
      borderLeft: '2px solid #0f0'
    }}>
      <h3 style={{ color: '#0f0', marginTop: 0 }}>🐛 Debug Panel</h3>
      
      {/* Data Summary */}
      <div className="debug-section">
        <h4 onClick={() => toggleSection('data')} style={{ cursor: 'pointer' }}>
          📊 Data Summary {expandedSections.data ? '▼' : '▶'}
        </h4>
        {expandedSections.data && (
          <div style={{ paddingLeft: '10px' }}>
            <p>Total Items: {data.items?.length || 0}</p>
            <p>Total Recipes: {data.recipes?.length || 0}</p>
            <p>Items with Uses: {Object.keys(data.uses || {}).length}</p>
            <p>Versions: {data.versions?.join(', ')}</p>
            <p>Icon Base URL: {iconBaseUrl}</p>
          </div>
        )}
      </div>

      {/* Image Loading */}
      <div className="debug-section">
        <h4 onClick={() => toggleSection('images')} style={{ cursor: 'pointer' }}>
          🖼️ Image Loading {expandedSections.images ? '▼' : '▶'}
        </h4>
        {expandedSections.images && (
          <div style={{ paddingLeft: '10px' }}>
            <button onClick={testAllImages} style={{ 
              background: '#0f0', 
              color: '#000', 
              border: 'none', 
              padding: '5px 10px',
              cursor: 'pointer',
              marginBottom: '10px'
            }}>
              Test All Images
            </button>
            <p>Loaded: {imageLoadStats.loaded}/{imageLoadStats.total}</p>
            <p>Failed: {imageLoadStats.failed}/{imageLoadStats.total}</p>
            {imageLoadStats.failed > 0 && (
              <p style={{ color: '#f00' }}>Check console for failed URLs</p>
            )}
          </div>
        )}
      </div>

      {/* Selected Item */}
      {selectedItem && (
        <div className="debug-section">
          <h4 onClick={() => toggleSection('selected')} style={{ cursor: 'pointer' }}>
            🎯 Selected Item {expandedSections.selected ? '▼' : '▶'}
          </h4>
          {expandedSections.selected && (
            <div style={{ paddingLeft: '10px' }}>
              <p>ID: {selectedItem.id}</p>
              <p>Name: {selectedItem.displayName}</p>
              <p>Category: {selectedItem.category}</p>
              <p>Icon: {selectedItem.icon}</p>
              <p>Full Icon URL: {iconBaseUrl}{selectedItem.icon}</p>
              <p>Version Added: {selectedItem.version_added}</p>
              <p>Aliases: {selectedItem.aliases?.join(', ') || 'none'}</p>
            </div>
          )}
        </div>
      )}

      {/* Recipes Debug */}
      {selectedItem && (
        <div className="debug-section">
          <h4 onClick={() => toggleSection('recipes')} style={{ cursor: 'pointer' }}>
            📋 Recipes ({recipes?.length || 0}) {expandedSections.recipes ? '▼' : '▶'}
          </h4>
          {expandedSections.recipes && (
            <div style={{ paddingLeft: '10px' }}>
              {recipes?.length === 0 && (
                <p style={{ color: '#ff0' }}>⚠️ No recipes found for {selectedItem.id}</p>
              )}
              {recipes?.map((recipe, index) => (
                <div key={index} style={{ marginBottom: '10px', borderBottom: '1px solid #0f0', paddingBottom: '5px' }}>
                  <p>Type: {recipe.type}</p>
                  <p>ID: {recipe.id}</p>
                  <p>Result: {JSON.stringify(recipe.result)}</p>
                  <p>Versions: {recipe.versions?.join(', ')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Uses Debug */}
      {selectedItem && (
        <div className="debug-section">
          <h4 onClick={() => toggleSection('uses')} style={{ cursor: 'pointer' }}>
            🔧 Uses ({uses?.length || 0}) {expandedSections.uses ? '▼' : '▶'}
          </h4>
          {expandedSections.uses && (
            <div style={{ paddingLeft: '10px' }}>
              {uses?.length === 0 && (
                <p style={{ color: '#ff0' }}>⚠️ No uses found for {selectedItem.id}</p>
              )}
              {uses?.map((use, index) => (
                <div key={index}>
                  <p>{use.id} - {use.displayName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Network Log */}
      <div className="debug-section">
        <h4 onClick={() => toggleSection('network')} style={{ cursor: 'pointer' }}>
          🌐 Network Log ({networkLog.length}) {expandedSections.network ? '▼' : '▶'}
        </h4>
        {expandedSections.network && (
          <div style={{ paddingLeft: '10px', maxHeight: '200px', overflowY: 'auto' }}>
            {networkLog.map((log, index) => (
              <div key={index} style={{ 
                marginBottom: '5px', 
                color: log.error ? '#f00' : (log.ok ? '#0f0' : '#ff0')
              }}>
                <p>{log.url}</p>
                <p>Status: {log.status || log.error} ({log.duration}ms)</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw Data Samples */}
      <div className="debug-section">
        <h4 onClick={() => toggleSection('raw')} style={{ cursor: 'pointer' }}>
          📝 Raw Data Samples {expandedSections.raw ? '▼' : '▶'}
        </h4>
        {expandedSections.raw && (
          <div style={{ paddingLeft: '10px' }}>
            <h5>First 3 Items:</h5>
            <pre style={{ fontSize: '10px', overflow: 'auto' }}>
              {JSON.stringify(data.items?.slice(0, 3), null, 2)}
            </pre>
            <h5>First 3 Recipes:</h5>
            <pre style={{ fontSize: '10px', overflow: 'auto' }}>
              {JSON.stringify(data.recipes?.slice(0, 3), null, 2)}
            </pre>
            <h5>Sample Recipe Result Structure:</h5>
            {data.recipes?.slice(0, 5).map((recipe, idx) => (
              <div key={idx} style={{ fontSize: '10px', marginBottom: '5px' }}>
                Recipe {recipe.id}: result = {JSON.stringify(recipe.result || recipe.rs)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Console Commands */}
      <div className="debug-section">
        <h4>💻 Console Commands</h4>
        <div style={{ paddingLeft: '10px', fontSize: '10px' }}>
          <p>window.__MINECRAFT_DATA__ - Full data</p>
          <p>window.__DEBUG__ = true - Enable logging</p>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;