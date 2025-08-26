#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const versions = require('./versions.json');

const CACHE_DIR = path.join(__dirname, '..', '.cache', 'jars');
const VERSION_MANIFEST_URL = 'https://launchermeta.mojang.com/mc/game/version_manifest_v2.json';

async function downloadFile(url, filepath) {
  const writer = fs.createWriteStream(filepath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  
  response.data.pipe(writer);
  
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function fetchJarForVersion(version) {
  const jarPath = path.join(CACHE_DIR, `${version}.jar`);
  
  if (fs.existsSync(jarPath)) {
    console.log(`✓ ${version} already cached`);
    return;
  }
  
  console.log(`Fetching ${version}...`);
  
  try {
    // Get version manifest
    const manifestResponse = await axios.get(VERSION_MANIFEST_URL);
    const versionInfo = manifestResponse.data.versions.find(v => v.id === version);
    
    if (!versionInfo) {
      console.error(`✗ Version ${version} not found in manifest`);
      return;
    }
    
    // Get version details
    const versionDetailsResponse = await axios.get(versionInfo.url);
    const clientJarUrl = versionDetailsResponse.data.downloads.client.url;
    
    // Download client jar
    await downloadFile(clientJarUrl, jarPath);
    console.log(`✓ Downloaded ${version}`);
    
  } catch (error) {
    console.error(`✗ Failed to download ${version}:`, error.message);
  }
}

async function main() {
  // Ensure cache directory exists
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  
  console.log('Fetching Minecraft client jars...\n');
  
  // Download jars for all versions
  for (const version of versions) {
    await fetchJarForVersion(version);
  }
  
  console.log('\n✓ All jars fetched successfully!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fetchJarForVersion };