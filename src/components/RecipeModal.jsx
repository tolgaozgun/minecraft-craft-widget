import React from 'react';
import CraftingGrid from './CraftingGrid';
import RecipeList from './RecipeList';

const RecipeModal = ({ item, recipes, uses, activeTab, onTabChange, onClose, iconBaseUrl, items }) => {
  return (
    <div className="mc-modal-overlay" onClick={onClose}>
      <div className="mc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mc-modal-header">
          <h2>{item.displayName}</h2>
          <button className="mc-modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <div className="mc-modal-tabs">
          <button
            className={`mc-tab ${activeTab === 'craft' ? 'active' : ''}`}
            onClick={() => onTabChange('craft')}
          >
            Crafting ({recipes.length})
          </button>
          <button
            className={`mc-tab ${activeTab === 'uses' ? 'active' : ''}`}
            onClick={() => onTabChange('uses')}
          >
            Uses ({uses.length})
          </button>
        </div>
        
        <div className="mc-modal-content">
          {activeTab === 'craft' ? (
            <div className="mc-recipes">
              {recipes.length > 0 ? (
                recipes.map((recipe, index) => (
                  <RecipeDisplay
                    key={index}
                    recipe={recipe}
                    iconBaseUrl={iconBaseUrl}
                    items={items}
                  />
                ))
              ) : (
                <p className="mc-no-recipes">No crafting recipes found for this item.</p>
              )}
            </div>
          ) : (
            <RecipeList
              uses={uses}
              iconBaseUrl={iconBaseUrl}
            />
          )}
        </div>
        
        <div className="mc-modal-footer">
          <div className="mc-item-id">
            <span>ID: {item.id}</span>
            <button
              className="mc-copy-btn"
              onClick={() => navigator.clipboard.writeText(item.id)}
              title="Copy ID"
            >
              📋
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecipeDisplay = ({ recipe, iconBaseUrl, items }) => {
  const getRecipeTitle = () => {
    const typeNames = {
      'crafting_shaped': 'Crafting Table',
      'crafting_shapeless': 'Crafting Table (Shapeless)',
      'smelting': 'Furnace',
      'blasting': 'Blast Furnace',
      'smoking': 'Smoker',
      'campfire_cooking': 'Campfire',
      'stonecutting': 'Stonecutter',
      'smithing': 'Smithing Table',
      'smithing_transform': 'Smithing Table',
      'smithing_trim': 'Smithing Table (Trim)'
    };
    return typeNames[recipe.type] || recipe.type;
  };
  
  return (
    <div className="mc-recipe">
      <h3>{getRecipeTitle()}</h3>
      
      {(recipe.type === 'crafting_shaped' || recipe.type === 'crafting_shapeless') && (
        <CraftingGrid
          recipe={recipe}
          iconBaseUrl={iconBaseUrl}
          items={items}
        />
      )}
      
      {recipe.type.includes('smelting') || recipe.type.includes('cooking') || 
       recipe.type === 'blasting' || recipe.type === 'smoking' ? (
        <div className="mc-smelting-recipe">
          <div className="mc-smelting-input">
            <ItemIcon item={recipe.ingredient} iconBaseUrl={iconBaseUrl} items={items} />
          </div>
          <div className="mc-smelting-arrow">→</div>
          <div className="mc-smelting-output">
            <ItemIcon item={recipe.result} iconBaseUrl={iconBaseUrl} items={items} />
            {recipe.result.count > 1 && (
              <span className="mc-item-count">{recipe.result.count}</span>
            )}
          </div>
          <div className="mc-smelting-info">
            {recipe.experience > 0 && <span>XP: {recipe.experience}</span>}
            {recipe.cookingtime && <span>Time: {recipe.cookingtime / 20}s</span>}
          </div>
        </div>
      ) : null}
      
      {recipe.type === 'stonecutting' && (
        <div className="mc-stonecutting-recipe">
          <ItemIcon item={recipe.ingredient} iconBaseUrl={iconBaseUrl} items={items} />
          <span className="mc-recipe-arrow">→</span>
          <div className="mc-recipe-result">
            <ItemIcon item={recipe.result} iconBaseUrl={iconBaseUrl} items={items} />
            {recipe.result.count > 1 && (
              <span className="mc-item-count">{recipe.result.count}</span>
            )}
          </div>
        </div>
      )}
      
      {recipe.type.includes('smithing') && (
        <div className="mc-smithing-recipe">
          {recipe.template && (
            <>
              <ItemIcon item={recipe.template} iconBaseUrl={iconBaseUrl} items={items} />
              <span>+</span>
            </>
          )}
          <ItemIcon item={recipe.base} iconBaseUrl={iconBaseUrl} items={items} />
          <span>+</span>
          <ItemIcon item={recipe.addition} iconBaseUrl={iconBaseUrl} items={items} />
          <span className="mc-recipe-arrow">→</span>
          <ItemIcon item={recipe.result} iconBaseUrl={iconBaseUrl} items={items} />
        </div>
      )}
      
      {recipe.versions && (
        <div className="mc-recipe-versions">
          Versions: {Array.isArray(recipe.versions) ? recipe.versions.join(', ') : recipe.versions}
        </div>
      )}
    </div>
  );
};

const ItemIcon = ({ item, iconBaseUrl, items }) => {
  if (!item) return <div className="mc-empty-slot" />;
  
  const getItemData = (itemId) => {
    return items.find(i => i.id === itemId);
  };
  
  const renderItem = (itemIdOrObj) => {
    const itemId = typeof itemIdOrObj === 'string' ? itemIdOrObj : itemIdOrObj.item;
    const itemData = getItemData(itemId);
    
    if (!itemData) {
      return (
        <div className="mc-item-icon mc-unknown-item">
          <span>?</span>
        </div>
      );
    }
    
    return (
      <div className="mc-item-icon" title={itemData.displayName}>
        <img src={`${iconBaseUrl}${itemData.icon}`} alt={itemData.displayName} />
      </div>
    );
  };
  
  if (item.tag) {
    return (
      <div className="mc-tag-item" title={item.tag}>
        <span className="mc-tag-label">Tag</span>
      </div>
    );
  }
  
  if (item.alternatives) {
    return (
      <div className="mc-alternatives">
        {item.alternatives.slice(0, 1).map((alt, i) => (
          <div key={i}>{renderItem(alt)}</div>
        ))}
        {item.alternatives.length > 1 && (
          <span className="mc-alternatives-more">+{item.alternatives.length - 1}</span>
        )}
      </div>
    );
  }
  
  return renderItem(item);
};

export default RecipeModal;