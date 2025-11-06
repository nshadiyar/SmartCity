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

        // Извлечение локации
        if (example.includes('EXPO')) {
          setLocation('EXPO 2017');
        } else if (example.includes('ребенком')) {
          setLocation('Центральный парк');
          setWithChildren(true);
        } else if (example.includes('турист')) {
          setLocation('Аэропорт Астаны');
        }

        // Извлечение времени
        if (example.includes('30–60 минут')) {
          setTimeAvailable('30-60 минут');
        } else if (example.includes('2 часа')) {
          setTimeAvailable('2 часа');
        } else if (example.includes('пару часов')) {
          setTimeAvailable('2-3 часа');
        }

        // Извлечение предпочтений
        if (example.includes('необычное')) {
          setPreferences('необычное, интересное, уникальное');
        } else if (example.includes('детские площадки')) {
          setPreferences('дети, семья, развлечения');
        } else if (example.includes('кофе и розеткой')) {
          setPreferences('кофе, работа, интернет, розетки');
        } else if (example.includes('ночную активность')) {
          setPreferences('ночь, развлечения, музыка, коктейли');
        }
      }
    }
  }, [selectedScenario, scenarios]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!location.trim() || !preferences.trim()) {
      alert('Пожалуйста, укажите вашу локацию и предпочтения');
      return;
    }

    const query: UserQuery = {
      location: location.trim(),
      preferences: preferences.trim(),
      timeAvailable: timeAvailable || '30-60 минут',
      withChildren,
      specialRequirements: specialRequirements.trim()
    };

    onSearch(query);
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <h2>Расскажите о себе и ваших планах</h2>

      <div className="form-group">
        <label htmlFor="location">Где вы сейчас находитесь?</label>
        <input
          type="text"
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Например: у здания EXPO 2017, в центре города, возле парка..."
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="preferences">Что вы ищете?</label>
        <textarea
          id="preferences"
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          placeholder="Опишите ваши предпочтения: прогулка, кофе, дети, необычное место, работа..."
          rows={3}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="timeAvailable">Сколько времени у вас есть?</label>
        <select
          id="timeAvailable"
          value={timeAvailable}
          onChange={(e) => setTimeAvailable(e.target.value)}
          required
        >
          <option value="">Выберите время...</option>
          <option value="30 минут">30 минут</option>
          <option value="30-60 минут">30-60 минут</option>
          <option value="1 час">1 час</option>
          <option value="1-2 часа">1-2 часа</option>
          <option value="2-3 часа">2-3 часа</option>
          <option value="больше 3 часов">Больше 3 часов</option>
        </select>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={withChildren}
            onChange={(e) => setWithChildren(e.target.checked)}
          />
          {' '}Еду с детьми
        </label>
      </div>

      <div className="form-group">
        <label htmlFor="specialRequirements">Особые требования (опционально)</label>
        <input
          type="text"
          id="specialRequirements"
          value={specialRequirements}
          onChange={(e) => setSpecialRequirements(e.target.value)}
          placeholder="Wi-Fi, розетки, доступность, бюджет..."
        />
      </div>

      <button
        type="submit"
        className="search-button"
        disabled={isLoading}
      >
        {isLoading ? 'Ищу рекомендации...' : 'Найти подходящие места'}
      </button>
    </form>
  );
};

export default SearchForm;
