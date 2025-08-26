# Minecraft Craft Widget - Project Notes

## Overview
This is a WordPress-embeddable widget for displaying Minecraft crafting recipes. The widget is built as a single minified JavaScript file that can be embedded in any webpage.

## Build Commands
- `npm install` - Install dependencies
- `npm run build` - Full build (downloads jars, extracts assets, builds data and widget)
- `npm run build:widget-only` - Just rebuild the widget (useful for frontend changes)

## Architecture

### CLI Tools
1. **fetch-jars.js** - Downloads Minecraft client jars from Mojang
2. **extract-assets.js** - Extracts recipes, textures, and language files from jars
3. **build-data.js** - Normalizes and processes all data into a unified format
4. **build-icons.js** - Creates 64x64 PNG icons from textures
5. **pack-data.js** - Compresses data for embedding
6. **build-widget.js** - Bundles everything into a single JS file

### Data Structure
- Items are normalized with consistent IDs across versions
- Recipes are deduplicated and version-tagged
- Uses reverse index for "what can I craft with this"
- Icons are lazy-loaded for performance

### Widget Features
- Search by item name or ID
- Filter by Minecraft version
- View all crafting recipes for an item
- See what items can be crafted with selected item
- Lazy-loaded icons with placeholder fallbacks
- Dark mode support

## WordPress Embedding
```html
<div id="mc-craft"></div>
<script src="path/to/minecraft-craft-widget.min.js"></script>
```

## Testing
The widget includes a demo.html file in the dist directory for local testing.

## Performance Notes
- Icons are lazy-loaded using IntersectionObserver
- Only priority items have embedded data URIs
- Data is packed and compressed to minimize size
- Widget self-initializes on DOM ready