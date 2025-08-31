// Debug helper script - paste this in browser console

// Quick search for recipes by item
window.searchRecipes = (itemId) => {
  const data = window.__MINECRAFT_DATA__;
  if (!data) {
    console.error('No data loaded! Make sure the widget is loaded.');
    return;
  }
  
  console.log(`Searching for recipes with item: ${itemId}`);
  
  const results = {
    asResult: [],
    asIngredient: [],
    inKey: [],
    inGrid: []
  };
  
  data.r.forEach((recipe, index) => {
    // Check result
    if (recipe.rs) {
      if (recipe.rs.item === itemId || recipe.rs === itemId) {
        results.asResult.push({ recipe, index });
      }
    }
    
    // Check ingredients
    if (recipe.in && JSON.stringify(recipe.in).includes(itemId)) {
      results.asIngredient.push({ recipe, index });
    }
    
    // Check key
    if (recipe.k && JSON.stringify(recipe.k).includes(itemId)) {
      results.inKey.push({ recipe, index });
    }
    
    // Check grid
    if (recipe.g && JSON.stringify(recipe.g).includes(itemId)) {
      results.inGrid.push({ recipe, index });
    }
  });
  
  console.log('Results:', results);
  console.log(`Found ${results.asResult.length} recipes that produce ${itemId}`);
  
  // Show first recipe details
  if (results.asResult.length > 0) {
    console.log('First recipe that produces this item:', results.asResult[0].recipe);
  }
  
  return results;
};

// List all unique result structures
window.analyzeResultStructures = () => {
  const data = window.__MINECRAFT_DATA__;
  if (!data) return;
  
  const structures = new Map();
  
  data.r.forEach(recipe => {
    const resultType = recipe.rs ? typeof recipe.rs : 'no-result';
    const sample = recipe.rs;
    
    if (!structures.has(resultType)) {
      structures.set(resultType, { count: 0, samples: [] });
    }
    
    const entry = structures.get(resultType);
    entry.count++;
    if (entry.samples.length < 3) {
      entry.samples.push({ recipe: recipe.id, result: sample });
    }
  });
  
  console.log('Result structure analysis:');
  structures.forEach((value, key) => {
    console.log(`Type: ${key}, Count: ${value.count}`);
    console.log('Samples:', value.samples);
  });
};

// Find items with most recipes
window.findPopularItems = () => {
  const data = window.__MINECRAFT_DATA__;
  if (!data) return;
  
  const itemCounts = {};
  
  data.r.forEach(recipe => {
    if (recipe.rs && recipe.rs.item) {
      itemCounts[recipe.rs.item] = (itemCounts[recipe.rs.item] || 0) + 1;
    }
  });
  
  const sorted = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);
  
  console.log('Top 20 items by recipe count:');
  sorted.forEach(([item, count]) => {
    console.log(`${item}: ${count} recipes`);
  });
};

console.log('Debug helpers loaded! Available commands:');
console.log('- searchRecipes("minecraft:oak_planks")');
console.log('- analyzeResultStructures()');
console.log('- findPopularItems()');