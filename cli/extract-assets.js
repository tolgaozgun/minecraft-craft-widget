#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const versions = require('./versions.json');

const CACHE_DIR = path.join(__dirname, '..', '.cache');
const JARS_DIR = path.join(CACHE_DIR, 'jars');
const EXTRACTED_DIR = path.join(CACHE_DIR, 'extracted');

const PATHS_TO_EXTRACT = {
  '1.12': {
    recipes: 'assets/minecraft/recipes/',
    lang: 'assets/minecraft/lang/en_US.lang',
    textures: ['assets/minecraft/textures/items/', 'assets/minecraft/textures/blocks/'],
    models: 'assets/minecraft/models/item/'
  },
  '1.13+': {
    recipes: 'data/minecraft/recipes/',
    tags: 'data/minecraft/tags/items/',
    lang: 'assets/minecraft/lang/en_us.json',
    textures: ['assets/minecraft/textures/item/', 'assets/minecraft/textures/block/'],
    models: 'assets/minecraft/models/item/'
  }
};

function getVersionType(version) {
  const [major, minor] = version.split('.').map(Number);
  return (major === 1 && minor <= 12) ? '1.12' : '1.13+';
}

function extractFromZip(zipPath, extractPath, patterns) {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  let extractedCount = 0;
  
  entries.forEach(entry => {
    const entryName = entry.entryName;
    
    // Check if entry matches any pattern
    for (const pattern of patterns) {
      if (entryName.startsWith(pattern) || entryName === pattern) {
        const destPath = path.join(extractPath, entryName);
        const destDir = path.dirname(destPath);
        
        fs.mkdirSync(destDir, { recursive: true });
        fs.writeFileSync(destPath, entry.getData());
        extractedCount++;
        break;
      }
    }
  });
  
  return extractedCount;
}

async function extractVersion(version) {
  const jarPath = path.join(JARS_DIR, `${version}.jar`);
  const extractPath = path.join(EXTRACTED_DIR, version);
  
  if (!fs.existsSync(jarPath)) {
    console.error(`✗ ${version} jar not found. Run 'npm run fetch-jars' first.`);
    return;
  }
  
  // Skip if already extracted
  if (fs.existsSync(extractPath) && fs.readdirSync(extractPath).length > 0) {
    console.log(`✓ ${version} already extracted`);
    return;
  }
  
  console.log(`Extracting ${version}...`);
  
  const versionType = getVersionType(version);
  const paths = PATHS_TO_EXTRACT[versionType];
  
  // Collect all patterns to extract
  const patterns = [];
  if (paths.recipes) patterns.push(paths.recipes);
  if (paths.tags) patterns.push(paths.tags);
  if (paths.lang) patterns.push(paths.lang);
  if (paths.textures) patterns.push(...paths.textures);
  if (paths.models) patterns.push(paths.models);
  
  const count = extractFromZip(jarPath, extractPath, patterns);
  console.log(`✓ Extracted ${count} files from ${version}`);
}

async function main() {
  console.log('Extracting assets from Minecraft jars...\n');
  
  // Process each version
  for (const version of versions) {
    await extractVersion(version);
  }
  
  console.log('\n✓ All assets extracted successfully!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { extractVersion, getVersionType };