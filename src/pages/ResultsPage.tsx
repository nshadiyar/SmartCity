import React, { useState } from 'react';
import { Recommendation, UserQuery } from '../types';
import Map from '../components/Map';
import GroupFilter, { GroupType } from '../components/GroupFilter';

interface ResultsPageProps {
  recommendations: Recommendation[];
  userLocation: { lat: number; lng: number } | null;
  onPOISelect: (poi: any) => void;
  onAddToRoute: (poi: any) => void;
  onStartRoute: () => void;
  searchQuery: UserQuery | null;
  selectedGroup: GroupType;
  onGroupChange: (group: GroupType) => void;
  onRefetch: () => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({
  recommendations,
  userLocation,
  onPOISelect,
  onAddToRoute,
  onStartRoute,
  searchQuery,
  selectedGroup,
  onGroupChange,
  onRefetch
}) => {
  const [selectedPOIForRoute, setSelectedPOIForRoute] = useState<any>(null);

  const handleGroupChange = (group: GroupType) => {
    onGroupChange(group);
    // Пересчитываем рекомендации при изменении группы
    setTimeout(() => {
      onRefetch();
    }, 100);
  };

  const handleNavigate = (poi: any) => {
    setSelectedPOIForRoute(poi);
    // Также открываем страницу деталей POI
    onPOISelect(poi);
  };
  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Кафе': '☕',
      'Парк': '🌳',
      'Музей': '🏛️',
      'Ресторан': '🍽️',
      'Магазин': '🛍️',
      'default': '📍'
    };
    return icons[category] || icons.default;
  };

  const getWhyRecommended = (poi: any) => {
    // Simple logic to determine why this POI is recommended
    if (poi.tags.includes('спокойное')) return 'calm';
    if (poi.tags.includes('дети')) return 'family-friendly';
    if (poi.tags.includes('кофе')) return 'cozy';
    if (poi.tags.includes('культура')) return 'cultural';
    return 'popular';
  };

  const whyLabels = {
    calm: 'Peaceful & Quiet',
    'family-friendly': 'Great with Kids',
    cozy: 'Cozy Atmosphere',
    cultural: 'Cultural Experience',
    popular: 'Popular Choice'
  };

  return (
    <div className="results-page">
      {/* Header */}
      <div className="results-header">
        <h1>Your Perfect Walk in Astana</h1>
        {searchQuery && (
          <p className="search-summary">
            Based on: {searchQuery.preferences} • Near: {searchQuery.location}
          </p>
        )}
      </div>

      {/* Group Filter */}
      <div className="results-group-filter">
        <GroupFilter
          selectedGroup={selectedGroup}
          onGroupChange={handleGroupChange}
        />
      </div>

      <div className="results-content">
        {/* Map Section */}
        <div className="map-container">
          <Map
            userLocation={userLocation || undefined}
            recommendations={recommendations}
            pois={[]}
            height="600px"
            onLocationUpdate={() => {}}
            selectedPOI={selectedPOIForRoute}
          />
        </div>

        {/* POI Cards Section */}
        <div className="poi-cards-section">
          <div className="poi-cards-header">
            <h2>Recommended Places</h2>
            <span className="results-count">{recommendations.length} places found</span>
          </div>

          <div className="poi-cards">
            {recommendations.map((rec) => (
              <div key={rec.poi.id} className="poi-card">
                <div className="poi-card-content" onClick={() => onPOISelect(rec.poi)}>
                  <div className="poi-header">
                    <div className="poi-category-icon">
                      {getCategoryIcon(rec.poi.category)}
                    </div>
                    <div className="poi-info">
                      <h3 className="poi-name">{rec.poi.name}</h3>
                      <p className="poi-category">{rec.poi.category}</p>
                    </div>
                  </div>

                  <p className="poi-description">{rec.poi.description}</p>

                  <div className="poi-meta">
                    <div className="meta-item">
                      <span className="meta-icon">📍</span>
                      <span>{rec.distance}m away</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">🚶</span>
                      <span>{rec.walkingTime} min walk</span>
                    </div>
                    {rec.poi.rating && (
                      <div className="meta-item">
                        <span className="meta-icon">⭐</span>
                        <span>{rec.poi.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="poi-tags">
                    <span className="why-tag">
                      {rec.why || whyLabels[getWhyRecommended(rec.poi) as keyof typeof whyLabels]}
                    </span>
                  </div>
                </div>

                <div className="poi-actions">
                  <button
                    className="action-btn secondary"
                    onClick={() => onAddToRoute(rec.poi)}
                  >
                    Add to Route
                  </button>
                  <button
                    className="action-btn primary"
                    onClick={() => handleNavigate(rec.poi)}
                  >
                    Navigate
                  </button>
                </div>
              </div>
            ))}
          </div>

          {recommendations.length > 0 && (
            <div className="route-actions">
              <button className="start-route-btn" onClick={onStartRoute}>
                Start My Route ({recommendations.length} stops)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
