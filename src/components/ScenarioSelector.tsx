import React from 'react';
import { ScenarioType, Scenario } from '../types';

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  selectedScenario: ScenarioType | null;
  onScenarioSelect: (scenario: ScenarioType) => void;
}

const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  scenarios,
  selectedScenario,
  onScenarioSelect
}) => {
  return (
    <div style={{
      marginBottom: '30px',
      padding: '20px',
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '15px',
      border: '2px solid #e9ecef'
    }}>
      <h3 style={{
        margin: '0 0 15px 0',
        color: '#495057',
        fontSize: '1.2rem'
      }}>
        Или выберите готовый сценарий:
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '15px'
      }}>
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => onScenarioSelect(scenario.id)}
            style={{
              padding: '15px',
              border: selectedScenario === scenario.id ? '2px solid #4facfe' : '2px solid #dee2e6',
              borderRadius: '10px',
              background: selectedScenario === scenario.id ? '#e3f2fd' : 'white',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.3s ease',
              boxShadow: selectedScenario === scenario.id ? '0 4px 12px rgba(79, 172, 254, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
            onMouseOver={(e) => {
              if (selectedScenario !== scenario.id) {
                e.currentTarget.style.borderColor = '#4facfe';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 172, 254, 0.2)';
              }
            }}
            onMouseOut={(e) => {
              if (selectedScenario !== scenario.id) {
                e.currentTarget.style.borderColor = '#dee2e6';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }
            }}
          >
            <div style={{
              fontWeight: 'bold',
              marginBottom: '5px',
              color: '#2c3e50'
            }}>
              {scenario.title}
            </div>
            <div style={{
              fontSize: '0.9rem',
              color: '#6c757d',
              marginBottom: '8px'
            }}>
              {scenario.description}
            </div>
            <div style={{
              fontSize: '0.85rem',
              color: '#495057',
              fontStyle: 'italic'
            }}>
              Пример: "{scenario.exampleQuery}"
            </div>
          </button>
        ))}
      </div>

      {selectedScenario && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: '#e8f5e8',
          borderRadius: '8px',
          border: '1px solid #2e7d32'
        }}>
          <strong>Выбран сценарий:</strong> {scenarios.find(s => s.id === selectedScenario)?.title}
        </div>
      )}
    </div>
  );
};

export default ScenarioSelector;
