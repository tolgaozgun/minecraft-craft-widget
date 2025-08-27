import React from 'react';
import MinecraftCraftWidget from './MinecraftCraftWidget';

function App() {
  // For development, we'll use the local data and icons
  const iconBaseUrl = process.env.NODE_ENV === 'production' 
    ? '/icons/' 
    : 'http://localhost:8080/icons/';

  return (
    <div className="App">
      <MinecraftCraftWidget 
        data={window.__MINECRAFT_DATA__} 
        iconBaseUrl={iconBaseUrl}
      />
    </div>
  );
}

export default App;