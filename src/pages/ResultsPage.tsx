import React, { useState, useEffect } from 'react';
import { Recommendation, UserQuery } from '../types';
import Map from '../components/Map';
import GroupFilter, { GroupType } from '../components/GroupFilter';

interface ResultsPageProps {
  recommendations: Recommendation[];
  userLocation: { lat: number; lng: number } | null;
  onPOISelect: (poi: any, recommendation?: Recommendation) => void;
  onAddToRoute: (poi: any) => void;
  onStartRoute: () => void;
  searchQuery: UserQuery | null;
  selectedGroup: GroupType;
  onGroupChange: (group: GroupType) => void;
  onRefetch: () => void;
  routePOIs: any[]; // Текущие места в маршруте
  onClearRoute?: () => void; // Функция очистки маршрута
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
  onRefetch,
  routePOIs,
  onClearRoute
}) => {
  const [selectedPOIForRoute, setSelectedPOIForRoute] = useState<any>(null);

  const handleGroupChange = (group: GroupType) => {
    onGroupChange(group);
    // Пересчитываем рекомендации при изменении группы
    setTimeout(() => {
      onRefetch();
    }, 100);
  };

  const handleNavigate = (poi: any, recommendation?: Recommendation) => {
    setSelectedPOIForRoute(poi);
    // Также открываем страницу деталей POI с recommendation
    onPOISelect(poi, recommendation);
  };

  // Логирование данных для отладки
  useEffect(() => {
    console.log('📋 [RESULTS PAGE] Рекомендации получены:', recommendations.length);
    recommendations.forEach((rec, index) => {
      console.log(`📌 [RESULTS PAGE] Рекомендация ${index + 1}:`, JSON.stringify({
        name: rec.poi.name,
        category: rec.poi.category,
        address: rec.poi.address,
        phone: rec.poi.phone,
        website: rec.poi.website,
        workingHours: rec.poi.workingHours,
        coordinates: rec.poi.coordinates,
        distance: rec.distance,
        walkingTime: rec.walkingTime,
        why: rec.why,
        description: rec.poi.description
      }, null, 2));
    });
  }, [recommendations]);
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
            routePOIs={routePOIs}
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
                <div className="poi-card-content" onClick={() => onPOISelect(rec.poi, rec)}>
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

                  {rec.poi.address && (
                    <div className="poi-address" style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                      📍 {rec.poi.address}
                    </div>
                  )}

                  <div className="poi-meta">
                    <div className="meta-item">
                      <span className="meta-icon">📍</span>
                      <span>{rec.distance}m away</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-icon">🚶</span>
                      <span>{rec.walkingTime} min walk</span>
                    </div>
                    {rec.poi.workingHours && (
                      <div className="meta-item" style={{ fontSize: '12px', color: '#6b7280' }}>
                        <span className="meta-icon">🕐</span>
                        <span>{rec.poi.workingHours}</span>
                      </div>
                    )}
                    {rec.poi.phone && (
                      <div className="meta-item" style={{ fontSize: '12px', color: '#6b7280' }}>
                        <span className="meta-icon">📞</span>
                        <span>{rec.poi.phone}</span>
                      </div>
                    )}
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
                    disabled={routePOIs.length >= 3}
                  >
                    {routePOIs.length >= 3 ? 'Route full (3 places)' : 'Add to Route'}
                  </button>
                  <button
                    className="action-btn primary"
                    onClick={() => handleNavigate(rec.poi, rec)}
                  >
                    Navigate
                  </button>
                </div>
              </div>
            ))}
          </div>

          {routePOIs.length > 0 && (
            <div className="route-actions">
              <div style={{ marginBottom: '12px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#059669' }}>Route: {routePOIs.length}/3 places</span>
                  {onClearRoute && (
                    <button 
                      onClick={() => {
                        if (window.confirm('Clear route?')) {
                          onClearRoute();
                        }
                      }}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#ef4444', 
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  {routePOIs.map((poi, index) => (
                    <div key={poi.id} style={{ marginBottom: '4px' }}>
                      {index + 1}. {poi.name}
                    </div>
                  ))}
                </div>
              </div>
              <button 
                className="start-route-btn" 
                onClick={onStartRoute}
                disabled={routePOIs.length === 0}
              >
                🚶 Start My Route ({routePOIs.length} stops)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
