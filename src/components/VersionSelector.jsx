import React from 'react';

const VersionSelector = ({ versions, selected, onChange }) => {
  return (
    <div className="mc-version-selector">
      <label htmlFor="mc-version">Version:</label>
      <select
        id="mc-version"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="mc-version-select"
      >
        <option value="latest">Latest</option>
        {versions.map(version => (
          <option key={version} value={version}>{version}</option>
        ))}
      </select>
    </div>
  );
};

export default VersionSelector;