import React, { useState, useEffect } from 'react';

const DebugPanel = ({ data, iconBaseUrl, selectedItem, recipes, uses }) => {
  const [imageLoadStats, setImageLoadStats] = useState({ loaded: 0, failed: 0, total: 0 });
  const [expandedSections, setExpandedSections] = useState({});
  const [networkLog, setNetworkLog] = useState([]);
  const [searchItemId, setSearchItemId] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [dataAnalysis, setDataAnalysis] = useState(null);

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

  const searchRecipesForItem = () => {
    if (!searchItemId || !data?.recipes) return;
    
    console.log(`Searching for recipes with item ID: ${searchItemId}`);
    const results = {
      asResult: [],
      asIngredient: [],
      inKey: [],
      inGrid: [],
      asBase: [],
      asAddition: [],
      asTemplate: []
    };
    
    data.recipes.forEach((recipe, index) => {
      // Check if item is the result
      const result = recipe.result || recipe.rs;
      if (result) {
        if (result.item === searchItemId) {
          results.asResult.push({ recipe, index, resultData: result });
        } else if (typeof result === 'string' && result === searchItemId) {
          results.asResult.push({ recipe, index, resultData: result });
        }
      }
      
      // Check in ingredients
      if (recipe.ingredients || recipe.in) {
        const ingredients = recipe.ingredients || recipe.in;
        if (JSON.stringify(ingredients).includes(searchItemId)) {
          results.asIngredient.push({ recipe, index });
        }
      }
      
      // Check in key (shaped recipes)
      if (recipe.key || recipe.k) {
        const key = recipe.key || recipe.k;
        if (JSON.stringify(key).includes(searchItemId)) {
          results.inKey.push({ recipe, index });
        }
      }
      
      // Check in grid
      if (recipe.grid || recipe.g) {
        const grid = recipe.grid || recipe.g;
        if (JSON.stringify(grid).includes(searchItemId)) {
          results.inGrid.push({ recipe, index });
        }
      }
      
      // Check smithing recipe fields
      if ((recipe.base || recipe.b) === searchItemId) {
        results.asBase.push({ recipe, index });
      }
      if ((recipe.addition || recipe.a) === searchItemId) {
        results.asAddition.push({ recipe, index });
      }
      if ((recipe.template || recipe.tm) === searchItemId) {
        results.asTemplate.push({ recipe, index });
      }
    });
    
    setSearchResults(results);
    console.log('Search results:', results);
  };
  
  const analyzeData = () => {
    if (!data) return;
    
    const analysis = {
      recipeTypes: {},
      resultStructures: {},
      itemsWithRecipes: new Set(),
      itemsWithoutRecipes: [],
      recipeFieldUsage: {},
      versionDistribution: {}
    };
    
    // Analyze recipes
    data.recipes?.forEach(recipe => {
      // Count recipe types
      const type = recipe.type || recipe.t;
      analysis.recipeTypes[type] = (analysis.recipeTypes[type] || 0) + 1;
      
      // Analyze result structure
      const result = recipe.result || recipe.rs;
      const resultType = result ? (typeof result === 'object' ? 'object' : 'string') : 'none';
      analysis.resultStructures[resultType] = (analysis.resultStructures[resultType] || 0) + 1;
      
      // Track items with recipes
      if (result?.item) {
        analysis.itemsWithRecipes.add(result.item);
      }
      
      // Track field usage
      Object.keys(recipe).forEach(key => {
        analysis.recipeFieldUsage[key] = (analysis.recipeFieldUsage[key] || 0) + 1;
      });
      
      // Version distribution
      const versions = recipe.versions || recipe.v;
      if (versions) {
        const versionStr = Array.isArray(versions) ? versions.join(',') : versions;
        analysis.versionDistribution[versionStr] = (analysis.versionDistribution[versionStr] || 0) + 1;
      }
    });
    
    // Find items without recipes
    data.items?.forEach(item => {
      if (!analysis.itemsWithRecipes.has(item.id)) {
        analysis.itemsWithoutRecipes.push(item.id);
      }
    });
    
    analysis.totalItems = data.items?.length || 0;
    analysis.totalRecipes = data.recipes?.length || 0;
    analysis.itemsWithRecipesCount = analysis.itemsWithRecipes.size;
    
    setDataAnalysis(analysis);
    console.log('Data analysis:', analysis);
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

      {/* Recipe Search */}
      <div className="debug-section">
        <h4 onClick={() => toggleSection('search')} style={{ cursor: 'pointer' }}>
          🔍 Recipe Search {expandedSections.search ? '▼' : '▶'}
        </h4>
        {expandedSections.search && (
          <div style={{ paddingLeft: '10px' }}>
            <input 
              type="text" 
              value={searchItemId}
              onChange={(e) => setSearchItemId(e.target.value)}
              placeholder="Enter item ID (e.g., minecraft:oak_planks)"
              style={{ 
                width: '100%', 
                padding: '5px', 
                background: '#000', 
                color: '#0f0', 
                border: '1px solid #0f0',
                marginBottom: '10px'
              }}
            />
            <button 
              onClick={searchRecipesForItem}
              style={{ 
                background: '#0f0', 
                color: '#000', 
                border: 'none', 
                padding: '5px 10px',
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              Search Recipes
            </button>
            
            {searchResults && (
              <div style={{ fontSize: '10px' }}>
                <p style={{ color: '#ff0' }}>Results for: {searchItemId}</p>
                <p>As Result: {searchResults.asResult.length} recipes</p>
                {searchResults.asResult.slice(0, 3).map((res, i) => (
                  <div key={i} style={{ marginLeft: '10px', marginBottom: '5px' }}>
                    <p>Recipe: {res.recipe.id}</p>
                    <p>Result: {JSON.stringify(res.resultData)}</p>
                  </div>
                ))}
                <p>As Ingredient: {searchResults.asIngredient.length} recipes</p>
                <p>In Key: {searchResults.inKey.length} recipes</p>
                <p>In Grid: {searchResults.inGrid.length} recipes</p>
                <p>As Base: {searchResults.asBase.length} recipes</p>
                <p>As Addition: {searchResults.asAddition.length} recipes</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data Analysis */}
      <div className="debug-section">
        <h4 onClick={() => toggleSection('analysis')} style={{ cursor: 'pointer' }}>
          📊 Data Analysis {expandedSections.analysis ? '▼' : '▶'}
        </h4>
        {expandedSections.analysis && (
          <div style={{ paddingLeft: '10px' }}>
            <button 
              onClick={analyzeData}
              style={{ 
                background: '#0f0', 
                color: '#000', 
                border: 'none', 
                padding: '5px 10px',
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              Analyze Data Structure
            </button>
            
            {dataAnalysis && (
              <div style={{ fontSize: '10px' }}>
                <p>Total Items: {dataAnalysis.totalItems}</p>
                <p>Total Recipes: {dataAnalysis.totalRecipes}</p>
                <p>Items with Recipes: {dataAnalysis.itemsWithRecipesCount}</p>
                <p>Items without Recipes: {dataAnalysis.itemsWithoutRecipes.length}</p>
                
                <h5>Recipe Types:</h5>
                {Object.entries(dataAnalysis.recipeTypes).map(([type, count]) => (
                  <p key={type} style={{ marginLeft: '10px' }}>{type}: {count}</p>
                ))}
                
                <h5>Result Structures:</h5>
                {Object.entries(dataAnalysis.resultStructures).map(([type, count]) => (
                  <p key={type} style={{ marginLeft: '10px' }}>{type}: {count}</p>
                ))}
                
                <h5>Recipe Fields:</h5>
                {Object.entries(dataAnalysis.recipeFieldUsage).slice(0, 10).map(([field, count]) => (
                  <p key={field} style={{ marginLeft: '10px' }}>{field}: {count}</p>
                ))}
                
                <h5>Sample Items Without Recipes:</h5>
                {dataAnalysis.itemsWithoutRecipes.slice(0, 10).map(id => (
                  <p key={id} style={{ marginLeft: '10px', fontSize: '9px' }}>{id}</p>
                ))}
              </div>
            )}
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