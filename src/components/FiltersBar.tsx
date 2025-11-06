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
    { value: 500, label: '500м' },
    { value: 1000, label: '1км' },
    { value: 2000, label: '2км' }
  ];

  const transportOptions = [
    { value: 'walking', label: '🚶 Пешком', icon: '🚶' },
    { value: 'driving', label: '🚗 На машине', icon: '🚗' }
  ];

  return (
    <div className="filters-bar">
      <button className="filters-toggle" onClick={onToggle}>
        <span className="filter-icon">⚙️</span>
        <span>Фильтры</span>
        <span className={`arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </button>

      {isExpanded && (
        <div className="filters-content">
          {/* Радиус */}
          <div className="filter-group">
            <label className="filter-label">
              <span className="filter-icon">📏</span>
              Радиус поиска:
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

          {/* Транспорт */}
          <div className="filter-group">
            <label className="filter-label">
              <span className="filter-icon">🚗</span>
              Способ передвижения:
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

          {/* Специальные фильтры */}
          <div className="filter-group">
            <label className="filter-label">Особые требования:</label>
            <div className="special-filters">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.accessibility}
                  onChange={(e) => onFiltersChange({ accessibility: e.target.checked })}
                />
                <span className="checkmark">♿</span>
                Доступность (пандусы)
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.kidFriendly}
                  onChange={(e) => onFiltersChange({ kidFriendly: e.target.checked })}
                />
                <span className="checkmark">👶</span>
                Подходит для детей
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FiltersBar;
