#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');
const FormData = require('form-data');

// Configuration from environment variables
const WORDPRESS_URL = process.env.WORDPRESS_URL;
const WORDPRESS_USERNAME = process.env.WORDPRESS_USERNAME;
const WORDPRESS_APP_PASSWORD = process.env.WORDPRESS_APP_PASSWORD;

if (!WORDPRESS_URL || !WORDPRESS_USERNAME || !WORDPRESS_APP_PASSWORD) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const PLUGIN_ZIP = path.join(__dirname, '..', 'dist', 'minecraft-craft-widget-plugin.zip');

// Create authorization header
const auth = Buffer.from(`${WORDPRESS_USERNAME}:${WORDPRESS_APP_PASSWORD}`).toString('base64');

async function uploadPlugin() {
  if (!fs.existsSync(PLUGIN_ZIP)) {
    console.error('Plugin ZIP file not found. Run create-plugin-zip.js first.');
    process.exit(1);
  }

  console.log('Uploading WordPress plugin...\n');

  try {
    // First, upload the zip file to media library
    const form = new FormData();
    form.append('file', fs.createReadStream(PLUGIN_ZIP));
    form.append('title', 'Minecraft Craft Widget Plugin');
    
    const uploadUrl = new URL('/wp-json/wp/v2/media', WORDPRESS_URL);
    
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: uploadUrl.hostname,
        port: uploadUrl.port || 443,
        path: uploadUrl.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          ...form.getHeaders()
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const response = JSON.parse(data);
            console.log(`✓ Plugin uploaded to: ${response.source_url}`);
            console.log('\nTo install the plugin:');
            console.log('1. Download from the link above');
            console.log('2. Go to WordPress Admin → Plugins → Add New → Upload');
            console.log('3. Select the downloaded file');
            console.log('4. Activate the plugin');
            console.log('\nOr use WP-CLI if available:');
            console.log(`wp plugin install ${response.source_url} --activate`);
            resolve(response);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });
      
      req.on('error', reject);
      form.pipe(req);
    });
  } catch (error) {
    console.error('Failed to upload plugin:', error.message);
    
    // Alternative approach: Create a plugin info page
    console.log('\nAlternative: Creating plugin info page...');
    
    const content = `
<!-- wp:heading -->
<h2>Minecraft Craft Widget</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Interactive Minecraft crafting recipe widget with full recipe database.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":3} -->
<h3>Installation</h3>
<!-- /wp:heading -->

<!-- wp:list {"ordered":true} -->
<ol>
<li>Download the plugin: <a href="https://github.com/tolgaozgun/minecraft-craft-widget/releases/latest/download/minecraft-craft-widget-plugin.zip">minecraft-craft-widget-plugin.zip</a></li>
<li>Upload via WordPress Admin → Plugins → Add New → Upload</li>
<li>Activate the plugin</li>
<li>Use shortcode: [minecraft_widget]</li>
</ol>
<!-- /wp:list -->

<!-- wp:heading {"level":3} -->
<h3>Demo</h3>
<!-- /wp:heading -->

<!-- wp:shortcode -->
[minecraft_widget]
<!-- /wp:shortcode -->
`;
    
    // Create or update plugin info page
    const pageData = {
      title: 'Minecraft Craft Widget Plugin',
      content: content,
      status: 'publish',
      slug: 'minecraft-widget-plugin'
    };
    
    const pageUrl = new URL('/wp-json/wp/v2/pages', WORDPRESS_URL);
    
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: pageUrl.hostname,
        port: pageUrl.port || 443,
        path: pageUrl.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const response = JSON.parse(data);
            console.log(`✓ Created plugin page: ${response.link}`);
            resolve(response);
          } else {
            console.log('Page might already exist or creation failed');
          }
        });
      });
      
      req.on('error', reject);
      req.write(JSON.stringify(pageData));
      req.end();
    });
  }
}

if (require.main === module) {
  uploadPlugin().catch(console.error);
}