import React from 'react';

interface Filters {
  radius: number;
  transport: 'walking' | 'driving';
  accessibility: boolean;
  kidFriendly: boolean;
  languages: string[];
}

interface FiltersBarProps {
  filters: Filters;
  onFiltersChange: (filters: Partial<Filters>) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  onFiltersChange,
  isExpanded,
  onToggle
}) => {
  const radiusOptions = [
    { value: 500, label: '500m' },
    { value: 1000, label: '1km' },
    { value: 2000, label: '2km' }
  ];

  const transportOptions = [
    { value: 'walking', label: '🚶 Walking', icon: '🚶' },
    { value: 'driving', label: '🚗 By Car', icon: '🚗' }
  ];

  return (
    <div className="filters-bar">
      <button className="filters-toggle" onClick={onToggle}>
        <span className="filter-icon">⚙️</span>
        <span>Filters</span>
        <span className={`arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </button>

      {isExpanded && (
        <div className="filters-content">
          {/* Radius */}
          <div className="filter-group">
            <label className="filter-label">
              <span className="filter-icon">📏</span>
              Search radius:
            </label>
            <div className="radius-options">
              {radiusOptions.map(option => (
                <button
                  key={option.value}
                  className={`radius-btn ${filters.radius === option.value ? 'active' : ''}`}
                  onClick={() => onFiltersChange({ radius: option.value })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transport */}
          <div className="filter-group">
            <label className="filter-label">
              <span className="filter-icon">🚗</span>
              Transportation:
            </label>
            <div className="transport-options">
              {transportOptions.map(option => (
                <button
                  key={option.value}
                  className={`transport-btn ${filters.transport === option.value ? 'active' : ''}`}
                  onClick={() => onFiltersChange({ transport: option.value as 'walking' | 'driving' })}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Special filters */}
          <div className="filter-group">
            <label className="filter-label">Special requirements:</label>
            <div className="special-filters">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.accessibility}
                  onChange={(e) => onFiltersChange({ accessibility: e.target.checked })}
                />
                <span className="checkmark">♿</span>
                Accessibility (ramps)
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.kidFriendly}
                  onChange={(e) => onFiltersChange({ kidFriendly: e.target.checked })}
                />
                <span className="checkmark">👶</span>
                Kid-friendly
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiltersBar;
