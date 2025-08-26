#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { getVersionType } = require('./extract-assets');

const CACHE_DIR = path.join(__dirname, '..', '.cache');
const EXTRACTED_DIR = path.join(CACHE_DIR, 'extracted');
const ICONS_DIR = path.join(__dirname, '..', 'out', 'icons');
const DATA_FILE = path.join(__dirname, '..', 'out', 'index.json');

const ICON_SIZE = 64;

// Map of items to their texture paths (for special cases)
const TEXTURE_OVERRIDES = {
  'minecraft:water_bucket': 'bucket',
  'minecraft:lava_bucket': 'bucket',
  'minecraft:milk_bucket': 'bucket',
  'minecraft:cod_bucket': 'bucket',
  'minecraft:salmon_bucket': 'bucket',
  'minecraft:tropical_fish_bucket': 'bucket',
  'minecraft:pufferfish_bucket': 'bucket',
  'minecraft:axolotl_bucket': 'bucket'
};

async function findTexture(itemId, version) {
  const versionType = getVersionType(version);
  const extractPath = path.join(EXTRACTED_DIR, version);
  const cleanId = itemId.replace('minecraft:', '');
  const override = TEXTURE_OVERRIDES[itemId]?.replace('minecraft:', '');
  const textureId = override || cleanId;
  
  // Possible texture paths
  const paths = [];
  
  if (versionType === '1.12') {
    paths.push(
      path.join(extractPath, 'assets/minecraft/textures/items', `${textureId}.png`),
      path.join(extractPath, 'assets/minecraft/textures/blocks', `${textureId}.png`)
    );
  } else {
    paths.push(
      path.join(extractPath, 'assets/minecraft/textures/item', `${textureId}.png`),
      path.join(extractPath, 'assets/minecraft/textures/block', `${textureId}.png`)
    );
  }
  
  // Try to find the texture
  for (const texturePath of paths) {
    if (fs.existsSync(texturePath)) {
      return texturePath;
    }
  }
  
  // Try without underscores (some items like dyes)
  const noUnderscoreId = textureId.replace(/_/g, '');
  if (versionType === '1.12') {
    const altPath = path.join(extractPath, 'assets/minecraft/textures/items', `${noUnderscoreId}.png`);
    if (fs.existsSync(altPath)) return altPath;
  } else {
    const altPath = path.join(extractPath, 'assets/minecraft/textures/item', `${noUnderscoreId}.png`);
    if (fs.existsSync(altPath)) return altPath;
  }
  
  return null;
}

async function createIcon(itemId, texturePath, outputPath) {
  try {
    // Read the texture
    const texture = sharp(texturePath);
    const metadata = await texture.metadata();
    
    // Handle animated textures (they're taller than wide)
    let sourceHeight = metadata.height;
    if (metadata.height > metadata.width) {
      // Use first frame of animation
      sourceHeight = metadata.width;
      texture.extract({
        left: 0,
        top: 0,
        width: metadata.width,
        height: sourceHeight
      });
    }
    
    // Create hotbar-style icon with padding
    const icon = sharp({
      create: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        channels: 4,
        background: { r: 139, g: 139, b: 139, alpha: 0.2 } // Semi-transparent gray
      }
    });
    
    // Resize texture to fit (with some padding)
    const innerSize = Math.floor(ICON_SIZE * 0.75);
    const padding = Math.floor((ICON_SIZE - innerSize) / 2);
    
    const resizedTexture = await sharp(texturePath)
      .resize(innerSize, innerSize, {
        kernel: 'nearest',
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toBuffer();
    
    // Composite the texture onto the background
    await icon
      .composite([{
        input: resizedTexture,
        top: padding,
        left: padding
      }])
      .png()
      .toFile(outputPath);
      
    return true;
  } catch (error) {
    console.error(`Failed to create icon for ${itemId}:`, error.message);
    return false;
  }
}

async function createPlaceholderIcon(itemId, outputPath) {
  // Create a simple placeholder icon
  const text = itemId.replace('minecraft:', '').substring(0, 2).toUpperCase();
  
  const svg = `
    <svg width="${ICON_SIZE}" height="${ICON_SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${ICON_SIZE}" height="${ICON_SIZE}" fill="#424242" opacity="0.8"/>
      <text x="50%" y="50%" text-anchor="middle" dy="0.3em" 
            font-family="monospace" font-size="20" fill="#fff">${text}</text>
    </svg>
  `;
  
  try {
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error(`Failed to create placeholder for ${itemId}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('Building item icons...\n');
  
  // Load item data
  if (!fs.existsSync(DATA_FILE)) {
    console.error('No data file found. Run build-data first.');
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const versions = data.versions;
  
  // Create icons directory
  fs.mkdirSync(ICONS_DIR, { recursive: true });
  fs.mkdirSync(path.join(ICONS_DIR, 'minecraft'), { recursive: true });
  
  let created = 0;
  let failed = 0;
  
  // Process each item
  for (const item of data.items) {
    // Remove the 'icons/' prefix from item.icon
    const iconPath = item.icon.replace('icons/', '');
    const outputPath = path.join(ICONS_DIR, iconPath);
    
    // Skip if icon already exists
    if (fs.existsSync(outputPath)) {
      created++;
      continue;
    }
    
    // Try to find texture in any version (prefer newer versions)
    let textureFound = false;
    
    for (let i = versions.length - 1; i >= 0; i--) {
      const version = versions[i];
      const texturePath = await findTexture(item.id, version);
      
      if (texturePath) {
        const success = await createIcon(item.id, texturePath, outputPath);
        if (success) {
          created++;
          textureFound = true;
          break;
        }
      }
    }
    
    // Create placeholder if no texture found
    if (!textureFound) {
      const success = await createPlaceholderIcon(item.id, outputPath);
      if (success) {
        created++;
      } else {
        failed++;
      }
    }
    
    // Progress update
    if ((created + failed) % 100 === 0) {
      console.log(`Progress: ${created + failed}/${data.items.length}`);
    }
  }
  
  console.log(`\n✓ Icon generation complete!`);
  console.log(`  - ${created} icons created`);
  console.log(`  - ${failed} failed`);
}

if (require.main === module) {
  main().catch(console.error);
}