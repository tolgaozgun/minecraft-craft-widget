// Debug trace script - paste this in browser console after loading the app

console.log('=== Debug Trace ===');

// Check raw data
if (window.__MINECRAFT_DATA__) {
  console.log('✓ Raw data loaded');
  console.log('  - Recipes:', window.__MINECRAFT_DATA__.r?.length);
  console.log('  - Sample recipe:', window.__MINECRAFT_DATA__.r?.[0]);
} else {
  console.log('✗ No raw data found');
}

// Check unpacked data
if (window.__UNPACKED_DATA__) {
  console.log('✓ Unpacked data available');
  console.log('  - Recipes:', window.__UNPACKED_DATA__.recipes?.length);
  console.log('  - Sample recipe:', window.__UNPACKED_DATA__.recipes?.[0]);
  
  // Test recipe lookup directly
  const testItem = 'minecraft:acacia_boat';
  const recipes = window.__UNPACKED_DATA__.recipes.filter(r => 
    r.result && r.result.item === testItem
  );
  console.log(`  - Direct filter for ${testItem}:`, recipes.length, 'recipes');
  if (recipes.length > 0) {
    console.log('  - First recipe:', recipes[0]);
  }
} else {
  console.log('✗ No unpacked data found');
}

// Check React component state
console.log('\nTo test recipe lookup:');
console.log('1. Click on an item');
console.log('2. Check console for "RecipeModal: Getting recipes for..."');
console.log('3. Check console for "getItemRecipes called for..."');
console.log('4. Check console for "Looking for recipes for item..."');

// Manual recipe search
window.testRecipeLookup = (itemId) => {
  if (!window.__UNPACKED_DATA__) {
    console.error('No unpacked data available');
    return;
  }
  
  console.log(`\n=== Testing recipe lookup for ${itemId} ===`);
  const recipes = window.__UNPACKED_DATA__.recipes;
  let found = 0;
  
  recipes.forEach((recipe, i) => {
    if (recipe.result && recipe.result.item === itemId) {
      console.log(`Recipe ${i}:`, recipe);
      found++;
    }
  });
  
  console.log(`Found ${found} recipes for ${itemId}`);
};

console.log('\nUse testRecipeLookup("minecraft:oak_planks") to test');