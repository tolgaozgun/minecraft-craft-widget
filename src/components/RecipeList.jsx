import React from 'react';

const RecipeList = ({ uses, iconBaseUrl }) => {
  return (
    <div className="mc-uses-list">
      {uses.length > 0 ? (
        <div className="mc-uses-grid">
          {uses.map((use, index) => (
            <div key={index} className="mc-use-item">
              <div className="mc-use-icon">
                <img 
                  src={`${iconBaseUrl}${use.icon}`} 
                  alt={use.displayName}
                  loading="lazy"
                />
              </div>
              <div className="mc-use-name">{use.displayName}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mc-no-uses">This item is not used in any recipes.</p>
      )}
    </div>
  );
};

export default RecipeList;