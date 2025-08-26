# Minecraft Craft Widget

A single-file, embeddable React widget that displays a searchable grid of Minecraft items/blocks with crafting recipes and usage information.

## Features

- Supports Minecraft Java versions 1.12 → latest
- Search and filter items by name or ID
- View all crafting recipes for any item
- Reverse-lookup to see what items can be crafted with a selected item
- Lazy-loaded icons for performance
- Single-file embed for easy WordPress integration

## Quick Start

```bash
# Install dependencies
npm install

# Build the widget
npm run build

# The output will be in dist/minecraft-craft-widget.min.js
```

## WordPress Embed

Add this to your WordPress post/page:

```html
<div id="mc-craft"></div>
<script src="path/to/minecraft-craft-widget.min.js"></script>
```