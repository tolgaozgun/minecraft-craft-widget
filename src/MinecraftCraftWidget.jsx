import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ItemGrid from './components/ItemGrid';
import RecipeModal from './components/RecipeModal';
import SearchBar from './components/SearchBar';
import VersionSelector from './components/VersionSelector';
import DebugPanel from './components/DebugPanel';
import { searchItems, filterByVersion, getRecipesForItem, getUsesForItem } from './utils/dataUtils';
import './styles.css';

const MinecraftCraftWidget = ({ data, iconBaseUrl = 'icons/' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('latest');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalTab, setModalTab] = useState('craft');
  const [showDebug, setShowDebug] = useState(true); // Show debug by default
  
  // Unpack data
  const unpackedData = useMemo(() => {
    console.log('Unpacking data, data exists:', !!data);
    if (!data) return null;
    
    // Make data globally available for debugging
    window.__MINECRAFT_DATA__ = data;
    window.__DEBUG__ = true;
    
    console.log('Raw data structure:', {
      versions: data.v?.length,
      items: data.i?.length,
      recipes: data.r?.length,
      uses: Object.keys(data.u || {}).length
    });
    
    // Unpack items
    const items = data.i.map(item => ({
      id: item.id,
      displayName: item.n,
      category: expandCategory(item.c),
      icon: `${item.ic}.png`,
      version_added: data.v[item.va] || data.v[0],
      version_removed: item.vr >= 0 ? data.v[item.vr] : null,
      aliases: item.a || []
    }));
    
    // Unpack recipes
    const recipes = data.r.map(recipe => {
      const unpacked = {
        id: recipe.id,
        type: expandRecipeType(recipe.t),
        result: recipe.rs,
        versions: recipe.v ? (typeof recipe.v === 'string' ? parseVersionRange(recipe.v, data.v) : recipe.v) : null
      };
      
      // Unpack recipe fields
      if (recipe.in) unpacked.ingredients = recipe.in;
      if (recipe.p) unpacked.pattern = recipe.p;
      if (recipe.k) unpacked.key = recipe.k;
      if (recipe.g) unpacked.grid = recipe.g;
      if (recipe.i) unpacked.ingredient = recipe.i;
      if (recipe.xp !== undefined) unpacked.experience = recipe.xp;
      if (recipe.ct) unpacked.cookingtime = recipe.ct;
      if (recipe.b) unpacked.base = recipe.b;
      if (recipe.a) unpacked.addition = recipe.a;
      if (recipe.tm) unpacked.template = recipe.tm;
      if (recipe.gr) unpacked.group = recipe.gr;
      
      return unpacked;
    });
    
    const result = {
      versions: data.v,
      items,
      recipes,
      uses: data.u,
      icons: data.icons || {}
    };
    
    console.log('Unpacked data:', {
      versions: result.versions.length,
      items: result.items.length,
      recipes: result.recipes.length,
      sampleRecipe: result.recipes[0]
    });
    
    window.__UNPACKED_DATA__ = result;
    
    return result;
  }, [data]);
  
  // Get current version
  const currentVersion = selectedVersion === 'latest' 
    ? unpackedData?.versions[unpackedData.versions.length - 1]
    : selectedVersion;
  
  // Filter items
  const filteredItems = useMemo(() => {
    if (!unpackedData) return [];
    
    let items = unpackedData.items;
    
    // Filter by version
    if (currentVersion) {
      items = filterByVersion(items, currentVersion, unpackedData.versions);
    }
    
    // Search filter
    if (searchQuery) {
      items = searchItems(items, searchQuery);
    }
    
    return items;
  }, [unpackedData, currentVersion, searchQuery]);
  
  const handleItemClick = useCallback((item) => {
    setSelectedItem(item);
    setModalTab('craft');
  }, []);
  
  const handleCloseModal = useCallback(() => {
    setSelectedItem(null);
  }, []);
  
  // Keyboard shortcut for debug panel
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  const getItemRecipes = useCallback((itemId) => {
    console.log(`getItemRecipes called for ${itemId}, unpackedData:`, unpackedData ? 'exists' : 'null');
    if (!unpackedData) {
      console.log('No unpacked data available');
      return [];
    }
    console.log(`Calling getRecipesForItem with ${unpackedData.recipes.length} recipes`);
    const recipes = getRecipesForItem(unpackedData.recipes, itemId, currentVersion);
    console.log(`Recipes for ${itemId}:`, recipes);
    return recipes;
  }, [unpackedData, currentVersion]);
  
  const getItemUses = useCallback((itemId) => {
    if (!unpackedData) return [];
    return getUsesForItem(unpackedData, itemId, currentVersion);
  }, [unpackedData, currentVersion]);
  
  if (!unpackedData) {
    return <div className="mc-craft-loading">Loading Minecraft data...</div>;
  }
  
  return (
    <div className="mc-craft-widget">
      <div className="mc-craft-header">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <VersionSelector
          versions={unpackedData.versions}
          selected={selectedVersion}
          onChange={setSelectedVersion}
        />
      </div>
      
      <ItemGrid
        items={filteredItems}
        onItemClick={handleItemClick}
        iconBaseUrl={iconBaseUrl}
        preloadedIcons={unpackedData.icons}
      />
      
      {selectedItem && (
        <RecipeModal
          item={selectedItem}
          recipes={(() => {
            console.log('RecipeModal: Getting recipes for', selectedItem.id);
            const r = getItemRecipes(selectedItem.id);
            console.log('RecipeModal: Got recipes:', r);
            return r;
          })()}
          uses={getItemUses(selectedItem.id)}
          activeTab={modalTab}
          onTabChange={setModalTab}
          onClose={handleCloseModal}
          iconBaseUrl={iconBaseUrl}
          items={unpackedData.items}
        />
      )}
      
      {showDebug && (
        <DebugPanel
          data={unpackedData}
          iconBaseUrl={iconBaseUrl}
          selectedItem={selectedItem}
          recipes={selectedItem ? (() => {
            console.log('DebugPanel: Getting recipes for', selectedItem.id);
            const r = getItemRecipes(selectedItem.id);
            console.log('DebugPanel: Got recipes:', r);
            return r;
          })() : []}
          uses={selectedItem ? getItemUses(selectedItem.id) : []}
        />
      )}
    </div>
  );
};

// Utility functions
function expandCategory(c) {
  const categories = {
    'b': 'building_blocks',
    'c': 'combat',
    't': 'tools',
    'f': 'food',
    'r': 'redstone',
    'p': 'transportation',
    'w': 'brewing',
    'm': 'misc'
  };
  return categories[c] || 'misc';
}

function expandRecipeType(t) {
  const types = {
    'cr': 'crafting_shaped',
    'cs': 'crafting_shapeless',
    'sm': 'smelting',
    'bl': 'blasting',
    'sk': 'smoking',
    'ca': 'campfire_cooking',
    'st': 'stonecutting',
    'sh': 'smithing',
    'sht': 'smithing_transform',
    'str': 'smithing_trim'
  };
  return types[t] || t;
}

function parseVersionRange(range, versions) {
  if (range.includes('–')) {
    const [start, end] = range.split('–');
    const startIdx = versions.indexOf(start);
    const endIdx = versions.indexOf(end);
    if (startIdx >= 0 && endIdx >= 0) {
      return versions.slice(startIdx, endIdx + 1);
    }
  }
  return [range];
}

export default MinecraftCraftWidget;