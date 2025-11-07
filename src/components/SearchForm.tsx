import React, { useState, useEffect } from 'react';
import { UserQuery, ScenarioType, Scenario } from '../types';

interface SearchFormProps {
  onSearch: (query: UserQuery) => void;
  selectedScenario: ScenarioType | null;
  scenarios: Scenario[];
  isLoading: boolean;
}

const SearchForm: React.FC<SearchFormProps> = ({
  onSearch,
  selectedScenario,
  scenarios,
  isLoading
}) => {
  const [location, setLocation] = useState('');
  const [preferences, setPreferences] = useState('');
  const [timeAvailable, setTimeAvailable] = useState('');
  const [withChildren, setWithChildren] = useState(false);
  const [specialRequirements, setSpecialRequirements] = useState('');

  // Заполнение формы на основе выбранного сценария
  useEffect(() => {
    if (selectedScenario) {
      const scenario = scenarios.find(s => s.id === selectedScenario);
      if (scenario) {
        // Парсинг примера запроса для автоматического заполнения
        const example = scenario.exampleQuery;

        // Extract location
        if (example.includes('EXPO')) {
          setLocation('EXPO 2017');
        } else if (example.includes('child') || example.includes('children')) {
          setLocation('Central Park');
          setWithChildren(true);
        } else if (example.includes('tourist') || example.includes('airport')) {
          setLocation('Astana Airport');
        }

        // Extract time
        if (example.includes('30–60') || example.includes('30-60')) {
          setTimeAvailable('30-60 minutes');
        } else if (example.includes('2 hour')) {
          setTimeAvailable('2 hours');
        } else if (example.includes('couple of hours')) {
          setTimeAvailable('2-3 hours');
        }

        // Extract preferences
        if (example.includes('unusual') || example.includes('unique')) {
          setPreferences('unusual, interesting, unique');
        } else if (example.includes('children') || example.includes('kids')) {
          setPreferences('children, family, entertainment');
        } else if (example.includes('coffee') && example.includes('work')) {
          setPreferences('coffee, work, internet, outlets');
        } else if (example.includes('night') || example.includes('evening')) {
          setPreferences('night, entertainment, music, cocktails');
        }
      }
    }
  }, [selectedScenario, scenarios]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!location.trim() || !preferences.trim()) {
      alert('Please specify your location and preferences');
      return;
    }

    const query: UserQuery = {
      location: location.trim(),
      preferences: preferences.trim(),
      timeAvailable: timeAvailable || '30-60 minutes',
      withChildren,
      specialRequirements: specialRequirements.trim()
    };

    onSearch(query);
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <h2>Tell us about yourself and your plans</h2>

      <div className="form-group">
        <label htmlFor="location">Where are you now?</label>
        <input
          type="text"
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="For example: near EXPO 2017, city center, near the park..."
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="preferences">What are you looking for?</label>
        <textarea
          id="preferences"
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          placeholder="Describe your preferences: walk, coffee, children, unusual place, work..."
          rows={3}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="timeAvailable">How much time do you have?</label>
        <select
          id="timeAvailable"
          value={timeAvailable}
          onChange={(e) => setTimeAvailable(e.target.value)}
          required
        >
          <option value="">Select time...</option>
          <option value="30 minutes">30 minutes</option>
          <option value="30-60 minutes">30-60 minutes</option>
          <option value="1 hour">1 hour</option>
          <option value="1-2 hours">1-2 hours</option>
          <option value="2-3 hours">2-3 hours</option>
          <option value="more than 3 hours">More than 3 hours</option>
        </select>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={withChildren}
            onChange={(e) => setWithChildren(e.target.checked)}
          />
          {' '}Traveling with children
        </label>
      </div>

      <div className="form-group">
        <label htmlFor="specialRequirements">Special requirements (optional)</label>
        <input
          type="text"
          id="specialRequirements"
          value={specialRequirements}
          onChange={(e) => setSpecialRequirements(e.target.value)}
          placeholder="Wi-Fi, outlets, accessibility, budget..."
        />
      </div>

      <button
        type="submit"
        className="search-button"
        disabled={isLoading}
      >
        {isLoading ? 'Searching for recommendations...' : 'Find suitable places'}
      </button>
    </form>
  );
};

export default SearchForm;
