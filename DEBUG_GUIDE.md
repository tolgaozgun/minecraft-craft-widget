# Debug Guide for Minecraft Craft Widget

## Debug Panel

The widget now includes a comprehensive debug panel that's shown by default. You can toggle it with **Ctrl+Shift+D**.

### Features:

1. **Data Summary** - Shows total items, recipes, and version info
2. **Image Loading** - Test all images and see which ones fail to load
3. **Selected Item** - Detailed info about the currently selected item
4. **Recipes Debug** - Shows all recipes for the selected item with details
5. **Uses Debug** - Shows what can be crafted with the selected item  
6. **Network Log** - Tracks all fetch requests and their status
7. **Raw Data Samples** - View the actual data structure
8. **Recipe Search** - Search for any item ID to find all recipes that produce or use it
9. **Data Analysis** - Analyze the entire data structure to find patterns and issues

## Console Commands

- `window.__MINECRAFT_DATA__` - Access the full raw data
- `window.__DEBUG__` - Enable additional console logging
- Check browser console for recipe lookup logs

## What Was Fixed

1. **Recipe Lookup Issue**: The `getRecipesForItem` function was looking for `recipe.result.item` but the unpacked data uses `recipe.rs.item`. Fixed to handle both formats.

2. **Version Filtering**: Enhanced version checking to handle both array and string formats.

3. **Debug Logging**: Added extensive console logging for recipe lookups to help identify issues.

## Testing Steps

1. Open http://localhost:8080
2. The debug panel should appear on the right side
3. Click "Test All Images" to check image loading
4. Click on any item to see its recipes
5. Check the console for detailed logs
6. Use the debug panel sections to inspect data

## Debug Helper Script

Load `debug-helper.js` in the browser console for additional debugging commands:

```javascript
// Copy and paste from debug-helper.js into console
searchRecipes("minecraft:oak_planks")  // Find all recipes for an item
analyzeResultStructures()              // Analyze recipe result formats  
findPopularItems()                     // List items with most recipes
```

## Common Issues to Check

1. **Images not loading**: 
   - Check the "Image Loading" section
   - Verify icon paths match the actual files
   - Check Network Log for 404 errors

2. **No recipes showing**:
   - Use the Recipe Search feature to search for specific item IDs
   - Check if the result structure matches expected format
   - Use Data Analysis to see how many items have recipes
   - Look for console logs showing recipe filtering
   - Verify recipe result structure in "Raw Data Samples"

3. **Version filtering issues**:
   - Check if recipes have correct version arrays
   - Verify version selection is working properly

## Debugging Steps for Missing Recipes

1. Click on an item that should have recipes
2. Check the console for logs like:
   - "Looking for recipes for item: minecraft:xxx"
   - "Sample recipe structure: ..."
3. In the Debug Panel, use Recipe Search:
   - Enter the item ID (e.g., "minecraft:oak_planks")
   - Click "Search Recipes"
   - Check if recipes are found but filtered out
4. Run Data Analysis to see:
   - Total recipes vs items with recipes
   - Recipe field usage
   - Result structure types