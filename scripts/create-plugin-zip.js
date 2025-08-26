#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const PLUGIN_DIR = path.join(__dirname, '..', 'wordpress-plugin');
const WIDGET_FILE = path.join(__dirname, '..', 'dist', 'minecraft-craft-widget.min.js');
const ICONS_DIR = path.join(__dirname, '..', 'out', 'icons');
const OUTPUT_FILE = path.join(__dirname, '..', 'dist', 'minecraft-craft-widget-plugin.zip');

async function createPluginZip() {
  console.log('Creating WordPress plugin package...\n');
  
  const zip = new AdmZip();
  
  // Add plugin PHP file
  zip.addLocalFile(
    path.join(PLUGIN_DIR, 'minecraft-craft-widget.php'),
    'minecraft-craft-widget/'
  );
  
  // Add widget JS file
  if (fs.existsSync(WIDGET_FILE)) {
    zip.addLocalFile(WIDGET_FILE, 'minecraft-craft-widget/');
    console.log('✓ Added widget JavaScript file');
  } else {
    console.error('Widget file not found. Run build first.');
    process.exit(1);
  }
  
  // Add all icon files
  if (fs.existsSync(ICONS_DIR)) {
    let iconCount = 0;
    
    function addIconsToZip(dir, zipPath) {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          addIconsToZip(filePath, path.join(zipPath, file));
        } else if (file.endsWith('.png')) {
          zip.addLocalFile(filePath, zipPath);
          iconCount++;
        }
      });
    }
    
    addIconsToZip(ICONS_DIR, 'minecraft-craft-widget/icons');
    console.log(`✓ Added ${iconCount} icon files`);
  }
  
  // Add readme
  const readme = `=== Minecraft Craft Widget ===
Contributors: minecraftcraftwidget
Tags: minecraft, crafting, recipes, widget, games
Requires at least: 5.0
Tested up to: 6.4
Stable tag: 1.0.0
License: MIT
License URI: https://opensource.org/licenses/MIT

Interactive Minecraft crafting recipe widget with full recipe database.

== Description ==

Display an interactive Minecraft crafting recipe browser on your WordPress site. Features include:

* Search for any Minecraft item or block
* View all crafting recipes for each item
* See what items can be crafted with selected materials
* Support for all Minecraft versions from 1.12 to latest
* Lazy-loaded icons for optimal performance
* Responsive design that works on all devices

== Installation ==

1. Upload the plugin folder to /wp-content/plugins/
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Use the [minecraft_widget] shortcode in any post or page

== Usage ==

Basic usage:
[minecraft_widget]

With custom parameters:
[minecraft_widget id="my-widget" height="800px"]

== Changelog ==

= 1.0.0 =
* Initial release
* Support for Minecraft 1.12-1.21+
* 965 items with icons
* 1,881 recipes included
`;
  
  zip.addFile('minecraft-craft-widget/readme.txt', Buffer.from(readme));
  
  // Write the zip file
  zip.writeZip(OUTPUT_FILE);
  
  const stats = fs.statSync(OUTPUT_FILE);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  
  console.log(`\n✓ Plugin package created!`);
  console.log(`  File: ${OUTPUT_FILE}`);
  console.log(`  Size: ${sizeMB} MB`);
  console.log(`\nTo install:`);
  console.log(`1. Upload via WordPress admin → Plugins → Add New → Upload Plugin`);
  console.log(`2. Or extract to wp-content/plugins/ and activate`);
}

if (require.main === module) {
  createPluginZip().catch(console.error);
}