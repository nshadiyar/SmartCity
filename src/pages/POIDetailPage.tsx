import React from 'react';
import { Recommendation } from '../types';
import Map from '../components/Map';

interface POIDetailPageProps {
  poi: any;
  recommendation?: Recommendation | null;
  onNavigate: (page: string) => void;
  onAddToRoute: (poi: any) => void;
  userLocation?: { lat: number; lng: number } | null;
  previousPage?: string;
}

const POIDetailPage: React.FC<POIDetailPageProps> = ({ 
  poi, 
  recommendation, 
  onNavigate, 
  onAddToRoute,
  userLocation,
  previousPage = 'results'
}) => {
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
            onClick={() => onNavigate(previousPage)}
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
          {poi.rating && (
            <div className="info-item">
              <span className="info-icon">⭐</span>
              <span className="info-text">
                {poi.rating}
              </span>
            </div>
          )}
        </div>

        {/* Why Recommended - показываем только если есть recommendation */}
        {recommendation && recommendation.why && (
          <div className="why-recommended" style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '20px',
            border: '2px solid #10b981'
          }}>
            <h2 style={{ 
              margin: '0 0 12px 0', 
              color: '#059669',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              💡 Why I recommend this place
            </h2>
            <p style={{ 
              margin: 0, 
              color: '#047857', 
              fontSize: '1.1rem',
              lineHeight: '1.6'
            }}>
              {recommendation.why}
            </p>
            {recommendation.distance && (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: 'rgba(16, 185, 129, 0.1)',
                borderRadius: '8px',
                display: 'inline-block',
                fontSize: '0.9rem',
                color: '#047857'
              }}>
                📍 {recommendation.distance}m from you • 🚶‍♂️ ~{recommendation.walkingTime} min walk
              </div>
            )}
          </div>
        )}

        {/* Map with Route - показываем карту с автоматическим маршрутом */}
        {poi.coordinates && (
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ 
              marginBottom: '15px', 
              color: '#1f2937',
              fontSize: '1.5rem',
              fontWeight: '600'
            }}>
              🗺️ Map and Route
            </h2>
            {userLocation ? (
              <p style={{
                marginBottom: '15px',
                color: '#6b7280',
                fontSize: '0.95rem'
              }}>
                Route is automatically built from your current location
              </p>
            ) : (
              <p style={{
                marginBottom: '15px',
                color: '#6b7280',
                fontSize: '0.95rem'
              }}>
                Please allow location access to build a route from your location
              </p>
            )}
            <Map
              userLocation={userLocation || undefined}
              recommendations={recommendation ? [recommendation] : []}
              pois={[]}
              routePOIs={[]}
              selectedPOI={poi}
              height="400px"
              onLocationUpdate={() => {}}
            />
          </div>
        )}

        {/* Description */}
        <div className="poi-description">
          <h2>About this place</h2>
          <p>{poi.description}</p>
        </div>

        {/* Suggested Plan */}
        <div className="suggested-plan">
          <h2>Suggested Plan</h2>
          {recommendation && recommendation.plan ? (
            <>
              <div className="plan-duration">
                <span className="duration-icon">⏱️</span>
                {recommendation.estimatedDuration ? (
                  `Recommended time: ~${recommendation.estimatedDuration} minutes`
                ) : (
                  'Recommended time: 30-45 minutes'
                )}
              </div>
              <div className="plan-activities">
                <h3>What to do here:</h3>
                <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: '#374151' }}>
                  {recommendation.plan}
                </p>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
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
          {userLocation && poi.coordinates && (
            <button
              className="action-btn primary"
              onClick={() => {
                // Route is already built on the map above
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              🗺️ Show route on map
            </button>
          )}
          <button
            className="action-btn secondary"
            onClick={() => onAddToRoute(poi)}
          >
            ➕ Add to Route
          </button>
          <button
            className="action-btn tertiary"
            onClick={() => window.open(
              `https://www.google.com/maps/dir/?api=1&destination=${poi.coordinates.lat},${poi.coordinates.lng}&travelmode=walking`,
              '_blank'
            )}
          >
            🗺️ Google Maps
          </button>
        </div>
      </div>
    </div>
  );
};

export default POIDetailPage;
