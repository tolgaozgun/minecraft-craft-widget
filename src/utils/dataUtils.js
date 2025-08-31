export function searchItems(items, query) {
  const lowerQuery = query.toLowerCase();
  
  return items.filter(item => {
    // Search in display name
    if (item.displayName.toLowerCase().includes(lowerQuery)) return true;
    
    // Search in ID
    if (item.id.toLowerCase().includes(lowerQuery)) return true;
    
    // Search in aliases
    if (item.aliases && item.aliases.some(alias => 
      alias.toLowerCase().includes(lowerQuery)
    )) return true;
    
    return false;
  });
}

export function filterByVersion(items, version, allVersions) {
  const versionIndex = allVersions.indexOf(version);
  if (versionIndex === -1) return items;
  
  return items.filter(item => {
    const addedIndex = allVersions.indexOf(item.version_added);
    const removedIndex = item.version_removed ? allVersions.indexOf(item.version_removed) : -1;
    
    // Item is available if added before or at current version
    if (addedIndex > versionIndex) return false;
    
    // And not removed before current version
    if (removedIndex !== -1 && removedIndex <= versionIndex) return false;
    
    return true;
  });
}

export function getRecipesForItem(recipes, itemId, currentVersion) {
  console.log(`Looking for recipes for item: ${itemId}, total recipes: ${recipes.length}`);
  
  return recipes.filter(recipe => {
    // Check if recipe produces this item
    // Handle both packed (rs) and unpacked (result) formats
    const result = recipe.result || recipe.rs;
    
    if (result && result.item === itemId) {
      // Check version compatibility
      if (currentVersion && recipe.versions) {
        const isInVersion = Array.isArray(recipe.versions) 
          ? recipe.versions.includes(currentVersion)
          : recipe.versions === currentVersion;
        
        if (!isInVersion) {
          console.log(`Recipe ${recipe.id} filtered out - not in version ${currentVersion}`);
          return false;
        }
      }
      console.log(`Found recipe ${recipe.id} for ${itemId}`);
      return true;
    }
    return false;
  });
}

export function getUsesForItem(data, itemId, currentVersion) {
  const uses = data.uses[itemId] || [];
  
  // Get full item data for each use
  return uses.map(useItemId => {
    return data.items.find(item => item.id === useItemId);
  }).filter(item => {
    if (!item) return false;
    
    // Filter by version if specified
    if (currentVersion) {
      const versionIndex = data.versions.indexOf(currentVersion);
      const addedIndex = data.versions.indexOf(item.version_added);
      const removedIndex = item.version_removed ? 
        data.versions.indexOf(item.version_removed) : -1;
      
      if (addedIndex > versionIndex) return false;
      if (removedIndex !== -1 && removedIndex <= versionIndex) return false;
    }
    
    return true;
  });
}

export function expandIngredient(ingredient, items) {
  if (!ingredient) return [];
  
  if (ingredient.item) {
    return [ingredient.item];
  }
  
  if (ingredient.tag) {
    // In a real implementation, this would expand the tag to actual items
    // For now, return the tag itself
    return [`tag:${ingredient.tag}`];
  }
  
  if (ingredient.alternatives) {
    const results = [];
    ingredient.alternatives.forEach(alt => {
      results.push(...expandIngredient(alt, items));
    });
    return results;
  }
  
  return [];
}