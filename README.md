# Minecraft Craft Widget

A standalone React application that displays a searchable grid of Minecraft items/blocks with crafting recipes and usage information.

## Features

- Supports Minecraft Java versions 1.12 → latest
- Search and filter items by name or ID
- View all crafting recipes for any item
- Reverse-lookup to see what items can be crafted with a selected item
- Lazy-loaded icons for performance
- Dockerized for easy deployment

## Quick Start

```bash
# Install dependencies
npm install

# Build everything (downloads MC data, builds app)
npm run build

# The output will be in dist/
```

## Development

```bash
# If you already have the data built
npm run build:app

# Serve locally
npm run serve

# Or use the dev script
./serve-dev.sh
```

Open http://localhost:8080 to view the app.

## Docker

```bash
# Build Docker image
docker build -t minecraft-craft-widget .

# Run container
docker run -p 8080:80 minecraft-craft-widget
```

## Build Process

1. **Download Minecraft JARs**: Downloads client jars from Mojang
2. **Extract Assets**: Extracts recipes, textures, and language files
3. **Build Data**: Normalizes and processes all recipe data
4. **Build Icons**: Creates 64×64 PNG icons from textures
5. **Pack Data**: Compresses data for web delivery
6. **Build App**: Bundles React app with Rollup

## WordPress Integration

After building, you can include the generated files in WordPress:
- Copy `dist/` contents to your WordPress theme/plugin
- Include the CSS and JS files in your page

## File Structure

```
dist/
├── index.html    # Main HTML file
├── app.js        # Bundled React app
├── app.css       # Styles
├── data.min.json # Compressed recipe data
└── icons/        # Item icons (965 files)
```