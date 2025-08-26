#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Configuration from environment variables
const WORDPRESS_URL = process.env.WORDPRESS_URL;
const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME;
const WORDPRESS_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD;
const WORDPRESS_MEDIA_FOLDER = process.env.WORDPRESS_MEDIA_FOLDER || 'minecraft-widget';

if (!WORDPRESS_URL || !WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
  console.error('Missing required environment variables:');
  console.error('- WORDPRESS_URL: Your WordPress site URL');
  console.error('- WORDPRESS_USERNAME: Your WordPress username');
  console.error('- WORDPRESS_APP_PASSWORD: Your WordPress application password');
  process.exit(1);
}

// Files to deploy
const WIDGET_FILE = path.join(__dirname, '..', 'dist', 'minecraft-craft-widget.min.js');
const ICONS_DIR = path.join(__dirname, '..', 'out', 'icons');

// Create authorization header
const auth = Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD}`).toString('base64');

async function uploadFile(filePath, mediaPath) {
  const fileContent = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  
  return new Promise((resolve, reject) => {
    const url = new URL(`/wp-json/wp/v2/media`, WORDPRESS_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Disposition': `attachment; filename="${mediaPath || fileName}"`,
        'Content-Type': fileName.endsWith('.js') ? 'application/javascript' : 'image/png',
        'Content-Length': fileContent.length
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(data);
            console.log(`✓ Uploaded: ${fileName} -> ${response.source_url}`);
            resolve(response);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(fileContent);
    req.end();
  });
}

async function createMediaFolder() {
  // WordPress doesn't have a direct API for creating folders
  // We'll upload a placeholder file to create the folder structure
  const placeholderPath = path.join(__dirname, '..', 'README.md');
  
  try {
    await uploadFile(placeholderPath, `${WORDPRESS_MEDIA_FOLDER}/.placeholder`);
    console.log(`✓ Created media folder: ${WORDPRESS_MEDIA_FOLDER}`);
  } catch (error) {
    // Folder might already exist
    console.log(`Media folder might already exist: ${WORDPRESS_MEDIA_FOLDER}`);
  }
}

async function deployWidget() {
  console.log('Deploying Minecraft Widget to WordPress...\n');
  console.log(`WordPress URL: ${WORDPRESS_URL}`);
  console.log(`Media Folder: ${WORDPRESS_MEDIA_FOLDER}\n`);
  
  try {
    // Create media folder
    await createMediaFolder();
    
    // Upload main widget file
    console.log('Uploading widget file...');
    const widgetResponse = await uploadFile(WIDGET_FILE, `${WORDPRESS_MEDIA_FOLDER}/minecraft-craft-widget.min.js`);
    
    // Upload icon files
    console.log('\nUploading icon files...');
    const iconFiles = [];
    
    function walkDir(dir, baseDir = '') {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          walkDir(filePath, path.join(baseDir, file));
        } else if (file.endsWith('.png')) {
          iconFiles.push({
            path: filePath,
            mediaPath: `${WORDPRESS_MEDIA_FOLDER}/icons/${baseDir}/${file}`
          });
        }
      });
    }
    
    if (fs.existsSync(ICONS_DIR)) {
      walkDir(ICONS_DIR);
      
      // Upload icons in batches to avoid overwhelming the server
      const BATCH_SIZE = 10;
      for (let i = 0; i < iconFiles.length; i += BATCH_SIZE) {
        const batch = iconFiles.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(icon => 
          uploadFile(icon.path, icon.mediaPath).catch(err => 
            console.error(`Failed to upload ${icon.mediaPath}: ${err.message}`)
          )
        ));
        
        if (i + BATCH_SIZE < iconFiles.length) {
          console.log(`Progress: ${Math.min(i + BATCH_SIZE, iconFiles.length)}/${iconFiles.length} icons uploaded`);
        }
      }
    }
    
    console.log('\n✓ Deployment complete!');
    console.log('\nEmbed code for WordPress:');
    console.log('```html');
    console.log(`<div id="mc-craft"></div>`);
    console.log(`<script src="${widgetResponse.source_url}"></script>`);
    console.log('```');
    
    // Update widget to use WordPress CDN for icons
    console.log('\nNote: The widget will automatically use the WordPress media library for icons.');
    console.log(`Icon base URL: ${WORDPRESS_URL}/wp-content/uploads/${WORDPRESS_MEDIA_FOLDER}/`);
    
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

// Alternative: Deploy as plugin
async function createPluginVersion() {
  const pluginContent = `<?php
/**
 * Plugin Name: Minecraft Craft Widget
 * Description: Embeddable Minecraft crafting recipe widget
 * Version: 1.0.0
 * Author: Your Name
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Enqueue widget script
function mcw_enqueue_scripts() {
    wp_enqueue_script(
        'minecraft-craft-widget',
        plugin_dir_url(__FILE__) . 'minecraft-craft-widget.min.js',
        array(),
        '1.0.0',
        true
    );
    
    // Pass WordPress URL to script
    wp_localize_script('minecraft-craft-widget', 'mcw_config', array(
        'iconBaseUrl' => plugin_dir_url(__FILE__) . 'icons/'
    ));
}
add_action('wp_enqueue_scripts', 'mcw_enqueue_scripts');

// Shortcode for easy embedding
function mcw_shortcode($atts) {
    $atts = shortcode_atts(array(
        'id' => 'mc-craft'
    ), $atts);
    
    return '<div id="' . esc_attr($atts['id']) . '"></div>';
}
add_shortcode('minecraft_widget', 'mcw_shortcode');
`;
  
  const pluginPath = path.join(__dirname, '..', 'dist', 'minecraft-craft-widget-plugin.php');
  fs.writeFileSync(pluginPath, pluginContent);
  console.log('\n✓ Created WordPress plugin file: dist/minecraft-craft-widget-plugin.php');
}

// Run deployment
if (require.main === module) {
  deployWidget()
    .then(() => createPluginVersion())
    .catch(console.error);
}