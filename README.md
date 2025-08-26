# Minecraft Craft Widget

A single-file, embeddable React widget that displays a searchable grid of Minecraft items/blocks with crafting recipes and usage information.

## Features

- Supports Minecraft Java versions 1.12 → latest
- Search and filter items by name or ID
- View all crafting recipes for any item
- Reverse-lookup to see what items can be crafted with a selected item
- Lazy-loaded icons for performance
- Single-file embed for easy WordPress integration
- Automated CI/CD deployment to WordPress

## Quick Start

```bash
# Install dependencies
npm install

# Build the widget
npm run build

# The output will be in dist/minecraft-craft-widget.min.js
```

## WordPress Integration

### Manual Embed

Add this to your WordPress post/page:

```html
<div id="mc-craft"></div>
<script src="path/to/minecraft-craft-widget.min.js"></script>
```

### Automated Deployment

This project includes GitHub Actions workflows for automatic deployment to WordPress. See [WordPress Deployment Guide](docs/WORDPRESS_DEPLOYMENT.md) for setup instructions.

## Development

```bash
# Download Minecraft assets
npm run fetch-jars

# Extract recipes and textures
npm run extract-assets

# Build data and icons
npm run build-data
npm run build-icons

# Pack for production
npm run pack-data

# Build final widget
npm run build-widget
```

## CI/CD

Push to `main` branch automatically:
1. Downloads Minecraft client jars
2. Extracts and processes recipes
3. Generates item icons
4. Builds minified widget
5. Deploys to WordPress via REST API

See `.github/workflows/` for workflow details.