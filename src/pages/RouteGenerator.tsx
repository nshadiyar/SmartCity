import React from 'react';

interface RouteGeneratorProps {
  pois: any[];
  onNavigate: (page: string) => void;
}

const RouteGenerator: React.FC<RouteGeneratorProps> = ({ pois, onNavigate }) => {
  const totalTime = pois.length * 45; // Rough estimate
  const totalDistance = pois.length * 300; // Rough estimate

  const handleStartJourney = () => {
    // Navigate to map with route
    onNavigate('results');
  };

  return (
    <div className="route-generator">
      <div className="route-header">
        <button
          className="back-btn"
          onClick={() => onNavigate('results')}
        >
          ← Back to Results
        </button>
        <h1>Your Walking Route</h1>
        <p className="route-summary">
          {pois.length} stops • ~{totalTime} minutes • ~{totalDistance}m total
        </p>
      </div>

      <div className="route-steps">
        {pois.map((poi, index) => (
          <div key={poi.id} className="route-step">
            <div className="step-number">{index + 1}</div>
            <div className="step-connector" style={{ display: index < pois.length - 1 ? 'block' : 'none' }}></div>
            <div className="step-content">
              <div className="step-header">
                <h3>{poi.name}</h3>
                <span className="step-category">{poi.category}</span>
              </div>
              <p className="step-description">{poi.description}</p>
              <div className="step-meta">
                <span>📍 {poi.address}</span>
                <span>⏱️ ~{45 * (index + 1)} min from start</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="route-actions">
        <div className="route-stats">
          <div className="stat">
            <span className="stat-icon">🚶</span>
            <span className="stat-value">{totalTime} min</span>
            <span className="stat-label">walking time</span>
          </div>
          <div className="stat">
            <span className="stat-icon">📏</span>
            <span className="stat-value">{totalDistance}m</span>
            <span className="stat-label">total distance</span>
          </div>
          <div className="stat">
            <span className="stat-icon">📍</span>
            <span className="stat-value">{pois.length}</span>
            <span className="stat-label">stops</span>
          </div>
        </div>

        <button className="start-journey-btn" onClick={handleStartJourney}>
          🚀 Start My Journey
        </button>
      </div>
    </div>
  );
};

export default RouteGenerator;
