import React from 'react';

interface StickyHeaderProps {
  onNavigate: (page: string, poi?: any) => void;
}

const StickyHeader: React.FC<StickyHeaderProps> = ({ onNavigate }) => {
  return (
    <header className="sticky-header">
      <div className="header-content">
        <div className="logo" onClick={() => onNavigate('landing')}>
          <div className="logo-icon">🏙️</div>
          <div className="logo-text">
            <span className="logo-main">Astana</span>
            <span className="logo-sub">Walks</span>
          </div>
        </div>

        <nav className="nav-links">
          <button
            className="nav-link"
            onClick={() => onNavigate('landing')}
          >
            Discover
          </button>
          <button
            className="nav-link"
            onClick={() => onNavigate('time-weather')}
          >
            🌤️ Time & Weather
          </button>
          <button
            className="nav-link"
            onClick={() => onNavigate('results')}
          >
            My Walks
          </button>
          <button className="nav-link ai-chat">
            AI Chat
          </button>
        </nav>

        <div className="header-actions">
          <button className="profile-btn">
            👤
          </button>
        </div>
      </div>
    </header>
  );
};

export default StickyHeader;
