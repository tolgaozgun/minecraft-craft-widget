import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import ItemGrid from './components/ItemGrid';
import RecipeModal from './components/RecipeModal';
import SearchBar from './components/SearchBar';
import VersionSelector from './components/VersionSelector';
import { searchItems, filterByVersion, getRecipesForItem, getUsesForItem } from './utils/dataUtils';
import './styles.css';

const MinecraftCraftWidget = ({ data, iconBaseUrl = 'icons/' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('latest');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalTab, setModalTab] = useState('craft');
  
  // Unpack data
  const unpackedData = useMemo(() => {
    if (!data) return null;
    
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
        versions: typeof recipe.v === 'string' ? parseVersionRange(recipe.v, data.v) : recipe.v
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
    
    return {
      versions: data.v,
      items,
      recipes,
      uses: data.u,
      icons: data.icons || {}
    };
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
  
  const getItemRecipes = useCallback((itemId) => {
    if (!unpackedData) return [];
    return getRecipesForItem(unpackedData.recipes, itemId, currentVersion);
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
          recipes={getItemRecipes(selectedItem.id)}
          uses={getItemUses(selectedItem.id)}
          activeTab={modalTab}
          onTabChange={setModalTab}
          onClose={handleCloseModal}
          iconBaseUrl={iconBaseUrl}
          items={unpackedData.items}
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