#!/usr/bin/env node

// This script updates the widget to use WordPress media URLs for icons

const fs = require('fs');
const path = require('path');

const WIDGET_FILE = path.join(__dirname, '..', 'dist', 'minecraft-craft-widget.min.js');
const WORDPRESS_URL = process.env.WORDPRESS_URL;
const WORDPRESS_MEDIA_FOLDER = process.env.WORDPRESS_MEDIA_FOLDER || 'minecraft-widget';

if (!WORDPRESS_URL) {
  console.error('WORDPRESS_URL environment variable is required');
  process.exit(1);
}

function updateWidgetConfig() {
  if (!fs.existsSync(WIDGET_FILE)) {
    console.error('Widget file not found. Run build first.');
    process.exit(1);
  }
  
  let widgetContent = fs.readFileSync(WIDGET_FILE, 'utf8');
  
  // Update the default icon base URL to use WordPress media library
  const iconBaseUrl = `${WORDPRESS_URL}/wp-content/uploads/${WORDPRESS_MEDIA_FOLDER}/`;
  
  // Replace the default GitHub URL with WordPress URL
  widgetContent = widgetContent.replace(
    /iconBaseUrl:\s*[^,}]+/g,
    `iconBaseUrl:"${iconBaseUrl}"`
  );
  
  // Create a WordPress-specific build
  const wpWidgetFile = path.join(__dirname, '..', 'dist', 'minecraft-craft-widget.wp.min.js');
  fs.writeFileSync(wpWidgetFile, widgetContent);
  
  console.log('✓ Created WordPress-specific widget build');
  console.log(`  Icon base URL: ${iconBaseUrl}`);
  console.log(`  Output: ${wpWidgetFile}`);
}

if (require.main === module) {
  updateWidgetConfig();
}