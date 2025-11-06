import React, { useState } from 'react';
import { UserQuery } from '../types';
import GroupFilter, { GroupType } from '../components/GroupFilter';

interface LandingPageProps {
  onSearch: (query: UserQuery) => void;
  isLoading: boolean;
  onNavigate: (page: string) => void;
  selectedGroup: GroupType;
  onGroupChange: (group: GroupType) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSearch, isLoading, selectedGroup, onGroupChange }) => {
  const [activity, setActivity] = useState('');

  const handleSearch = () => {
    onSearch({
      location: 'Current location',
      preferences: activity || 'Explore nearby',
      timeAvailable: '1 hour',
      withChildren: false,
      specialRequirements: ''
    });
  };

  const quickSearches = [
    { text: 'Quiet places nearby', icon: '🌸' },
    { text: '1-hour walk with coffee', icon: '☕' },
    { text: 'Kid-friendly spots', icon: '👶' },
    { text: 'Cultural landmarks', icon: '🏛️' }
  ];

  const handleQuickSearch = (text: string) => {
    setActivity(text);
    setTimeout(() => {
      onSearch({
        location: 'Current location',
        preferences: text,
        timeAvailable: '1 hour',
        withChildren: text.includes('Kid'),
        specialRequirements: ''
      });
    }, 100);
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <h1 className="hero-title">
              Discover Astana
              <br />
              <span className="hero-subtitle">Your Personal Walking Guide</span>
            </h1>
            <p className="hero-description">
              Let AI guide you through the most beautiful walks, hidden gems, and perfect moments in our city.
            </p>

            {/* Search Section */}
            <div className="search-section">
              <div className="search-inputs">
                <div className="input-group">
                  <div className="input-icon">🎯</div>
                  <input
                    type="text"
                    placeholder="What do you feel like doing?"
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="search-input"
                  />
                </div>
              </div>

              <button
                className="search-btn"
                onClick={handleSearch}
                disabled={isLoading}
              >
                {isLoading ? 'Finding your walk...' : 'Find my walk'}
              </button>
            </div>

            {/* Group Filter */}
            <div className="group-filter-section">
              <GroupFilter
                selectedGroup={selectedGroup}
                onGroupChange={onGroupChange}
              />
            </div>

            {/* Quick Search Pills */}
            <div className="quick-searches">
              <p className="quick-label">Popular searches:</p>
              <div className="quick-pills">
                {quickSearches.map((search, index) => (
                  <button
                    key={index}
                    className="quick-pill"
                    onClick={() => handleQuickSearch(search.text)}
                  >
                    <span className="pill-icon">{search.icon}</span>
                    {search.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>AI-Powered</h3>
            <p>Personalized recommendations based on your mood, time, and location</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🗺️</div>
            <h3>Local Knowledge</h3>
            <p>Deep understanding of Astana's neighborhoods, culture, and hidden gems</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Real-time</h3>
            <p>Live updates on crowd levels, weather, and opening hours</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
