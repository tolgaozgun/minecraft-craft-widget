#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const versions = require('./versions.json');
const { getVersionType } = require('./extract-assets');

const CACHE_DIR = path.join(__dirname, '..', '.cache');
const EXTRACTED_DIR = path.join(CACHE_DIR, 'extracted');
const OUT_DIR = path.join(__dirname, '..', 'out');

// Legacy to modern ID mappings
const LEGACY_ID_MAP = {
  'minecraft:planks:0': 'minecraft:oak_planks',
  'minecraft:planks:1': 'minecraft:spruce_planks',
  'minecraft:planks:2': 'minecraft:birch_planks',
  'minecraft:planks:3': 'minecraft:jungle_planks',
  'minecraft:planks:4': 'minecraft:acacia_planks',
  'minecraft:planks:5': 'minecraft:dark_oak_planks',
  'minecraft:log:0': 'minecraft:oak_log',
  'minecraft:log:1': 'minecraft:spruce_log',
  'minecraft:log:2': 'minecraft:birch_log',
  'minecraft:log:3': 'minecraft:jungle_log',
  'minecraft:log2:0': 'minecraft:acacia_log',
  'minecraft:log2:1': 'minecraft:dark_oak_log',
  'minecraft:stone:0': 'minecraft:stone',
  'minecraft:stone:1': 'minecraft:granite',
  'minecraft:stone:2': 'minecraft:polished_granite',
  'minecraft:stone:3': 'minecraft:diorite',
  'minecraft:stone:4': 'minecraft:polished_diorite',
  'minecraft:stone:5': 'minecraft:andesite',
  'minecraft:stone:6': 'minecraft:polished_andesite',
  'minecraft:wool:0': 'minecraft:white_wool',
  'minecraft:wool:14': 'minecraft:red_wool',
  'minecraft:dye:4': 'minecraft:lapis_lazuli',
  'minecraft:dye:15': 'minecraft:bone_meal'
};

const ITEM_CATEGORIES = {
  'planks': 'building_blocks',
  'log': 'building_blocks',
  'stone': 'building_blocks',
  'dirt': 'building_blocks',
  'cobblestone': 'building_blocks',
  'sand': 'building_blocks',
  'gravel': 'building_blocks',
  'wool': 'building_blocks',
  'glass': 'building_blocks',
  'concrete': 'building_blocks',
  'terracotta': 'building_blocks',
  'sword': 'combat',
  'bow': 'combat',
  'arrow': 'combat',
  'shield': 'combat',
  'armor': 'combat',
  'helmet': 'combat',
  'chestplate': 'combat',
  'leggings': 'combat',
  'boots': 'combat',
  'pickaxe': 'tools',
  'axe': 'tools',
  'shovel': 'tools',
  'hoe': 'tools',
  'fishing_rod': 'tools',
  'flint_and_steel': 'tools',
  'bucket': 'tools',
  'shears': 'tools',
  'food': 'food',
  'apple': 'food',
  'bread': 'food',
  'porkchop': 'food',
  'beef': 'food',
  'chicken': 'food',
  'carrot': 'food',
  'potato': 'food',
  'melon': 'food',
  'redstone': 'redstone',
  'repeater': 'redstone',
  'comparator': 'redstone',
  'piston': 'redstone',
  'observer': 'redstone',
  'hopper': 'redstone',
  'dropper': 'redstone',
  'dispenser': 'redstone',
  'rail': 'transportation',
  'minecart': 'transportation',
  'boat': 'transportation',
  'saddle': 'transportation',
  'potion': 'brewing',
  'brewing_stand': 'brewing',
  'cauldron': 'brewing',
  'enchanting_table': 'misc',
  'anvil': 'misc',
  'beacon': 'misc',
  'torch': 'misc',
  'chest': 'misc',
  'furnace': 'misc',
  'crafting_table': 'misc'
};

function getItemCategory(itemId) {
  const itemName = itemId.replace('minecraft:', '').toLowerCase();
  
  for (const [key, category] of Object.entries(ITEM_CATEGORIES)) {
    if (itemName.includes(key)) {
      return category;
    }
  }
  
  return 'misc';
}

function normalizeItemId(id, version) {
  if (getVersionType(version) === '1.12' && id.includes(':')) {
    const [namespace, item, meta] = id.split(':');
    if (meta !== undefined) {
      const legacyKey = `${namespace}:${item}:${meta}`;
      return LEGACY_ID_MAP[legacyKey] || id;
    }
  }
  return id;
}

function parseRecipe(recipeData, recipeId, version) {
  const type = recipeData.type;
  const recipe = {
    id: recipeId,
    type: type.replace('minecraft:', ''),
    versions: [version],
    group: recipeData.group || null
  };
  
  // Parse result
  if (recipeData.result) {
    if (typeof recipeData.result === 'string') {
      recipe.result = {
        item: normalizeItemId(recipeData.result, version),
        count: 1
      };
    } else {
      recipe.result = {
        item: normalizeItemId(recipeData.result.item, version),
        count: recipeData.result.count || 1
      };
    }
  }
  
  // Parse ingredients based on recipe type
  switch (type) {
    case 'minecraft:crafting_shaped':
      recipe.pattern = recipeData.pattern;
      recipe.key = {};
      for (const [key, ingredient] of Object.entries(recipeData.key || {})) {
        recipe.key[key] = parseIngredient(ingredient, version);
      }
      recipe.grid = parseShapedGrid(recipeData.pattern, recipe.key);
      break;
      
    case 'minecraft:crafting_shapeless':
      recipe.ingredients = (recipeData.ingredients || []).map(ing => 
        parseIngredient(ing, version)
      );
      break;
      
    case 'minecraft:smelting':
    case 'minecraft:blasting':
    case 'minecraft:smoking':
    case 'minecraft:campfire_cooking':
      recipe.ingredient = parseIngredient(recipeData.ingredient, version);
      recipe.experience = recipeData.experience || 0;
      recipe.cookingtime = recipeData.cookingtime || 200;
      break;
      
    case 'minecraft:stonecutting':
      recipe.ingredient = parseIngredient(recipeData.ingredient, version);
      recipe.result = {
        item: normalizeItemId(recipeData.result, version),
        count: recipeData.count || 1
      };
      break;
      
    case 'minecraft:smithing':
    case 'minecraft:smithing_transform':
    case 'minecraft:smithing_trim':
      recipe.base = parseIngredient(recipeData.base, version);
      recipe.addition = parseIngredient(recipeData.addition, version);
      if (recipeData.template) {
        recipe.template = parseIngredient(recipeData.template, version);
      }
      break;
  }
  
  return recipe;
}

function parseIngredient(ingredient, version) {
  if (!ingredient) return null;
  
  if (typeof ingredient === 'string') {
    return { item: normalizeItemId(ingredient, version) };
  }
  
  if (ingredient.item) {
    return { item: normalizeItemId(ingredient.item, version) };
  }
  
  if (ingredient.tag) {
    return { tag: ingredient.tag };
  }
  
  if (Array.isArray(ingredient)) {
    return { alternatives: ingredient.map(ing => parseIngredient(ing, version)) };
  }
  
  return null;
}

function parseShapedGrid(pattern, key) {
  const grid = [];
  for (let row of pattern) {
    const gridRow = [];
    for (let char of row) {
      if (char === ' ') {
        gridRow.push(null);
      } else {
        gridRow.push(key[char] || null);
      }
    }
    grid.push(gridRow);
  }
  
  // Pad to 3x3
  while (grid.length < 3) {
    grid.push([null, null, null]);
  }
  for (let row of grid) {
    while (row.length < 3) {
      row.push(null);
    }
  }
  
  return grid;
}

function loadLanguageFile(version) {
  const versionType = getVersionType(version);
  const extractPath = path.join(EXTRACTED_DIR, version);
  const langPath = versionType === '1.12' 
    ? path.join(extractPath, 'assets/minecraft/lang/en_US.lang')
    : path.join(extractPath, 'assets/minecraft/lang/en_us.json');
  
  if (!fs.existsSync(langPath)) {
    console.warn(`Language file not found for ${version}`);
    return {};
  }
  
  const content = fs.readFileSync(langPath, 'utf8');
  
  if (versionType === '1.12') {
    // Parse .lang format
    const lang = {};
    content.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          lang[key.trim()] = value.trim();
        }
      }
    });
    return lang;
  } else {
    // Parse JSON format
    return JSON.parse(content);
  }
}

function getItemName(itemId, lang, version) {
  const cleanId = itemId.replace('minecraft:', '');
  const versionType = getVersionType(version);
  
  // Try different translation keys
  const keys = [
    `item.minecraft.${cleanId}`,
    `block.minecraft.${cleanId}`,
    `item.${cleanId}.name`,
    `tile.${cleanId}.name`
  ];
  
  for (const key of keys) {
    if (lang[key]) {
      return lang[key];
    }
  }
  
  // Fallback: convert ID to title case
  return cleanId.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function loadTags(version) {
  const versionType = getVersionType(version);
  if (versionType === '1.12') return {}; // No tags in 1.12
  
  const tagsPath = path.join(EXTRACTED_DIR, version, 'data/minecraft/tags/items');
  if (!fs.existsSync(tagsPath)) return {};
  
  const tags = {};
  const files = fs.readdirSync(tagsPath);
  
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const tagName = `#minecraft:${file.replace('.json', '')}`;
      const content = JSON.parse(fs.readFileSync(path.join(tagsPath, file), 'utf8'));
      tags[tagName] = content.values || [];
    }
  });
  
  return tags;
}

function expandTags(ingredient, tags) {
  if (!ingredient) return [];
  
  if (ingredient.item) {
    return [ingredient.item];
  }
  
  if (ingredient.tag && tags[ingredient.tag]) {
    return tags[ingredient.tag];
  }
  
  if (ingredient.alternatives) {
    const items = [];
    ingredient.alternatives.forEach(alt => {
      items.push(...expandTags(alt, tags));
    });
    return [...new Set(items)];
  }
  
  return [];
}

async function main() {
  console.log('Building normalized data from extracted assets...\n');
  
  const allItems = new Map();
  const allRecipes = [];
  const itemVersionMap = new Map();
  
  // Process each version
  for (const version of versions) {
    console.log(`Processing ${version}...`);
    
    const versionType = getVersionType(version);
    const extractPath = path.join(EXTRACTED_DIR, version);
    
    if (!fs.existsSync(extractPath)) {
      console.warn(`No extracted data for ${version}`);
      continue;
    }
    
    // Load language file
    const lang = loadLanguageFile(version);
    
    // Load tags
    const tags = loadTags(version);
    
    // Process recipes
    const recipesPath = versionType === '1.12'
      ? path.join(extractPath, 'assets/minecraft/recipes')
      : path.join(extractPath, 'data/minecraft/recipes');
    
    if (fs.existsSync(recipesPath)) {
      const recipeFiles = fs.readdirSync(recipesPath);
      
      recipeFiles.forEach(file => {
        if (!file.endsWith('.json')) return;
        
        const recipeId = `minecraft:${file.replace('.json', '')}`;
        const recipePath = path.join(recipesPath, file);
        const recipeData = JSON.parse(fs.readFileSync(recipePath, 'utf8'));
        
        const recipe = parseRecipe(recipeData, recipeId, version);
        
        // Track items from recipes
        if (recipe.result && recipe.result.item) {
          const itemId = recipe.result.item;
          
          if (!allItems.has(itemId)) {
            allItems.set(itemId, {
              id: itemId,
              displayName: getItemName(itemId, lang, version),
              category: getItemCategory(itemId),
              icon: `icons/${itemId.replace(':', '/')}.png`,
              version_added: version,
              version_removed: null,
              aliases: []
            });
          }
          
          // Track version availability
          if (!itemVersionMap.has(itemId)) {
            itemVersionMap.set(itemId, new Set());
          }
          itemVersionMap.get(itemId).add(version);
        }
        
        // Track ingredients
        const processIngredient = (ing) => {
          const items = expandTags(ing, tags);
          items.forEach(itemId => {
            if (!allItems.has(itemId)) {
              allItems.set(itemId, {
                id: itemId,
                displayName: getItemName(itemId, lang, version),
                category: getItemCategory(itemId),
                icon: `icons/${itemId.replace(':', '/')}.png`,
                version_added: version,
                version_removed: null,
                aliases: []
              });
            }
            
            if (!itemVersionMap.has(itemId)) {
              itemVersionMap.set(itemId, new Set());
            }
            itemVersionMap.get(itemId).add(version);
          });
        };
        
        if (recipe.ingredients) {
          recipe.ingredients.forEach(processIngredient);
        }
        if (recipe.ingredient) {
          processIngredient(recipe.ingredient);
        }
        if (recipe.key) {
          Object.values(recipe.key).forEach(processIngredient);
        }
        if (recipe.base) processIngredient(recipe.base);
        if (recipe.addition) processIngredient(recipe.addition);
        if (recipe.template) processIngredient(recipe.template);
        
        allRecipes.push(recipe);
      });
    }
  }
  
  // Merge duplicate recipes
  const recipeMap = new Map();
  allRecipes.forEach(recipe => {
    const key = JSON.stringify({
      type: recipe.type,
      result: recipe.result,
      ingredients: recipe.ingredients,
      pattern: recipe.pattern,
      key: recipe.key,
      ingredient: recipe.ingredient
    });
    
    if (recipeMap.has(key)) {
      const existing = recipeMap.get(key);
      existing.versions.push(...recipe.versions);
      existing.versions = [...new Set(existing.versions)].sort();
    } else {
      recipeMap.set(key, recipe);
    }
  });
  
  // Build reverse index (uses)
  const uses = {};
  Array.from(recipeMap.values()).forEach(recipe => {
    const addUse = (itemId) => {
      if (!uses[itemId]) uses[itemId] = [];
      if (recipe.result && recipe.result.item) {
        uses[itemId].push(recipe.result.item);
      }
    };
    
    // Process all ingredients
    if (recipe.ingredients) {
      recipe.ingredients.forEach(ing => {
        expandTags(ing, {}).forEach(addUse);
      });
    }
    if (recipe.ingredient) {
      expandTags(recipe.ingredient, {}).forEach(addUse);
    }
    if (recipe.key) {
      Object.values(recipe.key).forEach(ing => {
        expandTags(ing, {}).forEach(addUse);
      });
    }
    if (recipe.base) expandTags(recipe.base, {}).forEach(addUse);
    if (recipe.addition) expandTags(recipe.addition, {}).forEach(addUse);
  });
  
  // Deduplicate uses
  Object.keys(uses).forEach(key => {
    uses[key] = [...new Set(uses[key])];
  });
  
  // Build final data structure
  const data = {
    versions: versions,
    items: Array.from(allItems.values()),
    recipes: Array.from(recipeMap.values()),
    uses: uses
  };
  
  // Save data
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, 'index.json'),
    JSON.stringify(data, null, 2)
  );
  
  console.log(`\n✓ Data built successfully!`);
  console.log(`  - ${data.items.length} items`);
  console.log(`  - ${data.recipes.length} recipes`);
  console.log(`  - ${Object.keys(data.uses).length} items with uses`);
}

if (require.main === module) {
  main().catch(console.error);
}