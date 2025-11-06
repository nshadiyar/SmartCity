import React from 'react';

interface POIDetailPageProps {
  poi: any;
  onNavigate: (page: string) => void;
  onAddToRoute: (poi: any) => void;
}

const POIDetailPage: React.FC<POIDetailPageProps> = ({ poi, onNavigate, onAddToRoute }) => {
  if (!poi) return null;

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

  const suggestedPlan = {
    duration: '30-45 minutes',
    activities: [
      'Enjoy a quiet moment with your favorite drink',
      'People-watch from the window seat',
      'Read or work in peaceful atmosphere'
    ]
  };

  return (
    <div className="poi-detail-page">
      {/* Photo Banner */}
      <div className="poi-banner">
        <div className="banner-placeholder">
          <div className="banner-icon">{getCategoryIcon(poi.category)}</div>
          <div className="banner-overlay"></div>
        </div>
      </div>

      {/* Content */}
      <div className="poi-content">
        <div className="poi-header">
          <div className="poi-title-section">
            <h1 className="poi-title">{poi.name}</h1>
            <div className="poi-category-badge">
              <span className="category-icon">{getCategoryIcon(poi.category)}</span>
              {poi.category}
            </div>
          </div>
          <button
            className="back-btn"
            onClick={() => onNavigate('results')}
          >
            ← Back
          </button>
        </div>

        {/* Key Info */}
        <div className="poi-key-info">
          <div className="info-item">
            <span className="info-icon">📍</span>
            <span className="info-text">{poi.address}</span>
          </div>
          <div className="info-item">
            <span className="info-icon">🕐</span>
            <span className="info-text">
              {poi.workingHours || 'Hours not specified'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-icon">⭐</span>
            <span className="info-text">
              {poi.rating || 'Not rated'}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="poi-description">
          <h2>About this place</h2>
          <p>{poi.description}</p>
        </div>

        {/* Suggested Plan */}
        <div className="suggested-plan">
          <h2>Suggested Plan</h2>
          <div className="plan-duration">
            <span className="duration-icon">⏱️</span>
            Recommended visit: {suggestedPlan.duration}
          </div>

          <div className="plan-activities">
            <h3>What to do here:</h3>
            <ul>
              {suggestedPlan.activities.map((activity, index) => (
                <li key={index}>{activity}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tags */}
        {poi.tags && poi.tags.length > 0 && (
          <div className="poi-tags">
            <h3>Features:</h3>
            <div className="tags-list">
              {poi.tags.map((tag: string, index: number) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="poi-actions">
          <button
            className="action-btn primary"
            onClick={() => onAddToRoute(poi)}
          >
            🗺️ Show on Map
          </button>
          <button
            className="action-btn secondary"
            onClick={() => onAddToRoute(poi)}
          >
            ➕ Add to Route
          </button>
          <button
            className="action-btn tertiary"
            onClick={() => onNavigate('route-generator')}
          >
            🚶 Start Walk
          </button>
        </div>
      </div>
    </div>
  );
};

export default POIDetailPage;
