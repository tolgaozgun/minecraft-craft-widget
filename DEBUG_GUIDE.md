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

## Common Issues to Check

1. **Images not loading**: 
   - Check the "Image Loading" section
   - Verify icon paths match the actual files
   - Check Network Log for 404 errors

2. **No recipes showing**:
   - Check "Recipes Debug" section when item is selected
   - Look for console logs showing recipe filtering
   - Verify recipe result structure in "Raw Data Samples"

3. **Version filtering issues**:
   - Check if recipes have correct version arrays
   - Verify version selection is working properly