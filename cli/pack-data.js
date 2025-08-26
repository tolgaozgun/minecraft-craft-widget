#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.join(__dirname, '..', 'out');
const DATA_FILE = path.join(OUT_DIR, 'index.json');
const ICONS_DIR = path.join(OUT_DIR, 'icons');

function compressVersionRanges(versions) {
  if (versions.length <= 2) return versions;
  
  // Check if versions are consecutive
  const versionNumbers = versions.map(v => {
    const parts = v.split('.');
    return parseInt(parts[1]) * 100 + parseInt(parts[2] || 0);
  });
  
  let isConsecutive = true;
  for (let i = 1; i < versionNumbers.length; i++) {
    if (versionNumbers[i] - versionNumbers[i-1] > 10) {
      isConsecutive = false;
      break;
    }
  }
  
  if (isConsecutive && versions.length > 3) {
    return `${versions[0]}–${versions[versions.length - 1]}`;
  }
  
  return versions;
}

function packData(data) {
  // Create compact version of data
  const packed = {
    v: data.versions,
    i: data.items.map(item => ({
      id: item.id,
      n: item.displayName,
      c: item.category.substring(0, 1), // Single letter categories
      ic: item.icon.replace('icons/', '').replace('.png', ''),
      va: data.versions.indexOf(item.version_added),
      vr: item.version_removed ? data.versions.indexOf(item.version_removed) : -1,
      a: item.aliases
    })),
    r: data.recipes.map(recipe => {
      const packed = {
        id: recipe.id,
        t: recipe.type.substring(0, 2), // Shortened type
        rs: recipe.result,
        v: compressVersionRanges(recipe.versions)
      };
      
      // Add recipe-specific fields
      if (recipe.ingredients) packed.in = recipe.ingredients;
      if (recipe.pattern) packed.p = recipe.pattern;
      if (recipe.key) packed.k = recipe.key;
      if (recipe.grid) packed.g = recipe.grid;
      if (recipe.ingredient) packed.i = recipe.ingredient;
      if (recipe.experience) packed.xp = recipe.experience;
      if (recipe.cookingtime) packed.ct = recipe.cookingtime;
      if (recipe.base) packed.b = recipe.base;
      if (recipe.addition) packed.a = recipe.addition;
      if (recipe.template) packed.tm = recipe.template;
      if (recipe.group) packed.gr = recipe.group;
      
      return packed;
    }),
    u: data.uses
  };
  
  return packed;
}

function createIconsDataUri() {
  const iconData = {};
  const iconFiles = fs.readdirSync(path.join(ICONS_DIR, 'minecraft'));
  
  // Only include most common items as data URIs (rest will be lazy-loaded)
  const priorityItems = [
    'oak_planks', 'cobblestone', 'stone', 'iron_ingot', 'gold_ingot',
    'diamond', 'stick', 'coal', 'redstone', 'crafting_table',
    'furnace', 'chest', 'torch', 'oak_log', 'dirt'
  ];
  
  iconFiles.forEach(file => {
    const itemName = file.replace('.png', '');
    if (priorityItems.includes(itemName)) {
      const iconPath = path.join(ICONS_DIR, 'minecraft', file);
      const iconBuffer = fs.readFileSync(iconPath);
      iconData[`minecraft/${itemName}`] = `data:image/png;base64,${iconBuffer.toString('base64')}`;
    }
  });
  
  return iconData;
}

async function main() {
  console.log('Packing data for embedding...\n');
  
  // Load original data
  if (!fs.existsSync(DATA_FILE)) {
    console.error('No data file found. Run build-data first.');
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  
  // Pack the data
  const packed = packData(data);
  
  // Create icons data
  const iconData = createIconsDataUri();
  packed.icons = iconData;
  
  // Save packed versions
  const packedJson = JSON.stringify(packed);
  fs.writeFileSync(path.join(OUT_DIR, 'data.min.json'), packedJson);
  
  // Create gzipped version
  const gzipped = zlib.gzipSync(packedJson);
  fs.writeFileSync(path.join(OUT_DIR, 'data.min.json.gz'), gzipped);
  
  // Stats
  const originalSize = fs.statSync(DATA_FILE).size;
  const packedSize = Buffer.byteLength(packedJson);
  const gzippedSize = gzipped.length;
  
  console.log('✓ Data packed successfully!');
  console.log(`  Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Packed: ${(packedSize / 1024 / 1024).toFixed(2)} MB (${Math.round(packedSize / originalSize * 100)}%)`);
  console.log(`  Gzipped: ${(gzippedSize / 1024).toFixed(2)} KB (${Math.round(gzippedSize / originalSize * 100)}%)`);
  console.log(`  Icons included: ${Object.keys(iconData).length} priority items`);
}

if (require.main === module) {
  main().catch(console.error);
}