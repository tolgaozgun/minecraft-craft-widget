import React from 'react';

const CraftingGrid = ({ recipe, iconBaseUrl, items }) => {
  const getItemData = (itemId) => {
    return items.find(i => i.id === itemId);
  };
  
  const renderSlot = (ingredient) => {
    if (!ingredient) {
      return <div className="mc-crafting-slot mc-empty-slot" />;
    }
    
    if (ingredient.item) {
      const itemData = getItemData(ingredient.item);
      return (
        <div className="mc-crafting-slot" title={itemData?.displayName || ingredient.item}>
          {itemData && (
            <img src={`${iconBaseUrl}${itemData.icon}`} alt={itemData.displayName} />
          )}
        </div>
      );
    }
    
    if (ingredient.tag) {
      return (
        <div className="mc-crafting-slot mc-tag-slot" title={ingredient.tag}>
          <span>Tag</span>
        </div>
      );
    }
    
    if (ingredient.alternatives) {
      const firstItem = ingredient.alternatives[0];
      const itemData = getItemData(firstItem.item || firstItem);
      return (
        <div className="mc-crafting-slot mc-multi-slot" title="Multiple options">
          {itemData && (
            <img src={`${iconBaseUrl}${itemData.icon}`} alt={itemData.displayName} />
          )}
          <span className="mc-multi-indicator">+{ingredient.alternatives.length - 1}</span>
        </div>
      );
    }
    
    return <div className="mc-crafting-slot mc-empty-slot" />;
  };
  
  if (recipe.type === 'crafting_shaped' && recipe.grid) {
    return (
      <div className="mc-crafting-container">
        <div className="mc-crafting-grid">
          {recipe.grid.map((row, rowIndex) => (
            <div key={rowIndex} className="mc-crafting-row">
              {row.map((slot, colIndex) => (
                <React.Fragment key={`${rowIndex}-${colIndex}`}>
                  {renderSlot(slot)}
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
        <div className="mc-crafting-arrow">→</div>
        <div className="mc-crafting-result">
          {recipe.result && (
            <>
              <div className="mc-crafting-slot">
                {(() => {
                  const itemData = getItemData(recipe.result.item);
                  return itemData && (
                    <img src={`${iconBaseUrl}${itemData.icon}`} alt={itemData.displayName} />
                  );
                })()}
              </div>
              {recipe.result.count > 1 && (
                <span className="mc-result-count">{recipe.result.count}</span>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
  
  if (recipe.type === 'crafting_shapeless') {
    return (
      <div className="mc-crafting-container shapeless">
        <div className="mc-shapeless-ingredients">
          {recipe.ingredients.map((ingredient, index) => (
            <React.Fragment key={index}>
              {renderSlot(ingredient)}
            </React.Fragment>
          ))}
        </div>
        <div className="mc-crafting-arrow">→</div>
        <div className="mc-crafting-result">
          {recipe.result && (
            <>
              <div className="mc-crafting-slot">
                {(() => {
                  const itemData = getItemData(recipe.result.item);
                  return itemData && (
                    <img src={`${iconBaseUrl}${itemData.icon}`} alt={itemData.displayName} />
                  );
                })()}
              </div>
              {recipe.result.count > 1 && (
                <span className="mc-result-count">{recipe.result.count}</span>
              )}
            </>
          )}
        </div>
      </div>
    );
  }
  
  return null;
};

export default CraftingGrid;