import React from 'react';
import { Scenario, ScenarioType } from '../types';

interface ScenarioChipsProps {
  scenarios: Scenario[];
  selectedScenario: ScenarioType | null;
  onScenarioSelect: (scenario: ScenarioType) => void;
}

const ScenarioChips: React.FC<ScenarioChipsProps> = ({
  scenarios,
  selectedScenario,
  onScenarioSelect
}) => {
  const getScenarioIcon = (id: ScenarioType): string => {
    const icons: { [key in ScenarioType]: string } = {
      casual_walk: '🚶',
      with_children: '👨‍👩‍👧‍👦',
      tourist: '🏛️',
      night_activity: '🌙',
      quiet_place: '📚',
      coffee_work: '💻',
      unusual_experience: '✨'
    };
    return icons[id] || '📍';
  };

  return (
    <div className="scenario-chips">
      <h4>Быстрый выбор сценария:</h4>
      <div className="chips-container">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            className={`scenario-chip ${selectedScenario === scenario.id ? 'selected' : ''}`}
            onClick={() => onScenarioSelect(scenario.id)}
          >
            <span className="chip-icon">{getScenarioIcon(scenario.id)}</span>
            <span className="chip-title">{scenario.title}</span>
            <span className="chip-desc">{scenario.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScenarioChips;
