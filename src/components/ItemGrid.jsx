import React, { useEffect, useRef, useState, useCallback } from 'react';

const ItemGrid = ({ items, onItemClick, iconBaseUrl, preloadedIcons = {} }) => {
  const [visibleItems, setVisibleItems] = useState(new Set());
  const [loadedIcons, setLoadedIcons] = useState(new Set());
  const gridRef = useRef(null);
  const itemRefs = useRef({});
  
  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const itemId = entry.target.dataset.itemId;
          setVisibleItems(prev => new Set([...prev, itemId]));
        }
      });
    }, {
      root: gridRef.current,
      rootMargin: '50px',
      threshold: 0.01
    });
    
    // Observe all items
    Object.values(itemRefs.current).forEach(el => {
      if (el) observer.observe(el);
    });
    
    return () => observer.disconnect();
  }, [items]);
  
  const getIconSrc = useCallback((item) => {
    const iconKey = item.icon.replace('.png', '');
    
    // Check preloaded data URIs first
    if (preloadedIcons[iconKey]) {
      return preloadedIcons[iconKey];
    }
    
    // Return URL for lazy loading
    return `${iconBaseUrl}${item.icon}`;
  }, [iconBaseUrl, preloadedIcons]);
  
  const handleIconLoad = useCallback((itemId) => {
    setLoadedIcons(prev => new Set([...prev, itemId]));
  }, []);
  
  const handleIconError = useCallback((e, item) => {
    // Fallback to placeholder
    e.target.style.display = 'none';
    e.target.parentElement.classList.add('mc-item-no-icon');
  }, []);
  
  return (
    <div className="mc-item-grid" ref={gridRef}>
      {items.map(item => (
        <div
          key={item.id}
          ref={el => itemRefs.current[item.id] = el}
          data-item-id={item.id}
          className="mc-item"
          onClick={() => onItemClick(item)}
          title={item.displayName}
        >
          <div className="mc-item-icon">
            {visibleItems.has(item.id) && (
              <img
                src={getIconSrc(item)}
                alt={item.displayName}
                loading="lazy"
                onLoad={() => handleIconLoad(item.id)}
                onError={(e) => handleIconError(e, item)}
                style={{
                  opacity: loadedIcons.has(item.id) ? 1 : 0,
                  transition: 'opacity 0.2s'
                }}
              />
            )}
            {(!visibleItems.has(item.id) || !loadedIcons.has(item.id)) && (
              <div className="mc-item-placeholder">
                {item.displayName.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="mc-item-name">{item.displayName}</div>
        </div>
      ))}
    </div>
  );
};

export default ItemGrid;