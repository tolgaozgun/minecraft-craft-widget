#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function buildWidget() {
  console.log('Building Minecraft Craft Widget...\n');
  
  try {
    // Check if data exists
    const dataFile = path.join(__dirname, '..', 'out', 'data.min.json');
    if (!fs.existsSync(dataFile)) {
      console.error('No packed data found. Run the full build process first.');
      process.exit(1);
    }
    
    // Run rollup
    console.log('Running rollup build...');
    await execAsync('npx rollup -c');
    
    // Get file sizes
    const widgetPath = path.join(__dirname, '..', 'dist', 'minecraft-craft-widget.min.js');
    const widgetSize = fs.statSync(widgetPath).size;
    
    console.log('\n✓ Widget built successfully!');
    console.log(`  Output: ${widgetPath}`);
    console.log(`  Size: ${(widgetSize / 1024).toFixed(2)} KB`);
    
    // Create embed snippet
    const embedSnippet = `<!-- Minecraft Craft Widget -->
<div id="mc-craft"></div>
<script src="/path/to/minecraft-craft-widget.min.js"></script>

<!-- Or with custom options -->
<div id="my-minecraft-widget"></div>
<script>
  // Wait for widget to load
  document.addEventListener('DOMContentLoaded', function() {
    if (window.MinecraftCraftWidget) {
      window.MinecraftCraftWidget.init('my-minecraft-widget', {
        iconBaseUrl: '/my-custom-path/icons/'
      });
    }
  });
</script>`;
    
    const snippetPath = path.join(__dirname, '..', 'dist', 'embed-snippet.html');
    fs.writeFileSync(snippetPath, embedSnippet);
    
    console.log(`\n✓ Embed snippet saved to: ${snippetPath}`);
    
    // Create example HTML
    const exampleHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Minecraft Craft Widget Demo</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f0f0f0;
    }
    h1 {
      text-align: center;
      color: #333;
    }
    .demo-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <h1>Minecraft Craft Widget Demo</h1>
  <div class="demo-container">
    <div id="mc-craft"></div>
  </div>
  
  <script src="minecraft-craft-widget.min.js"></script>
</body>
</html>`;
    
    const examplePath = path.join(__dirname, '..', 'dist', 'demo.html');
    fs.writeFileSync(examplePath, exampleHtml);
    
    console.log(`✓ Demo page saved to: ${examplePath}`);
    console.log('\nTo test the widget:');
    console.log('1. Serve the dist directory with a local web server');
    console.log('2. Open demo.html in your browser');
    
  } catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  buildWidget().catch(console.error);
}