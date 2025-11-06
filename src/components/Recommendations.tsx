import React, { useState } from 'react';
import { Recommendation } from '../types';

interface RecommendationsProps {
  recommendations: Recommendation[];
  isLoading: boolean;
}

const Recommendations: React.FC<RecommendationsProps> = ({
  recommendations,
  isLoading
}) => {
  const [savedPlaces, setSavedPlaces] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const handleSave = (poiId: string) => {
    setSavedPlaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(poiId)) {
        newSet.delete(poiId);
      } else {
        newSet.add(poiId);
        showToast('Место сохранено!');
      }
      return newSet;
    });
  };

  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease;
      font-weight: 500;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  };

  const displayedRecommendations = showAll ? recommendations : recommendations.slice(0, 3);

  if (isLoading) {
    return (
      <div className="recommendations">
        <h2>Ищу подходящие места...</h2>
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Анализирую вашу локацию и предпочтения</p>
          <p>Подбираю лучшие рекомендации</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="recommendations">
        <h2>Рекомендации</h2>
        <div className="loading">
          <p>Выберите сценарий или настройте фильтры для получения рекомендаций</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations">
      <h2>Рекомендации для вас</h2>
      {displayedRecommendations.map((rec) => (
        <div key={rec.poi.id} className="recommendation-card">
          <div className="recommendation-title">
            {rec.poi.name}
            <div className="poi-category">{rec.poi.category}</div>
          </div>

          <div className="recommendation-meta">
            <div className="meta-item">
              <span className="meta-icon">📍</span>
              <span>{rec.distance}м</span>
            </div>
            <div className="meta-item">
              <span className="meta-icon">🚶‍♂️</span>
              <span>{rec.walkingTime} мин</span>
            </div>
            {rec.poi.rating && (
              <div className="meta-item">
                <span className="meta-icon">⭐</span>
                <span>{rec.poi.rating}</span>
              </div>
            )}
          </div>

          {/* Короткая мотивация */}
          <div className="motivator">
            {rec.why}
          </div>

          {/* Время на посещение */}
          <div className="visit-time">
            Рекомендуемое время: {rec.estimatedDuration} мин
          </div>

          {/* Источник и уверенность */}
          <div className="source-badge">
            <span className="source-label">Источник:</span>
            <span className="source-value">POI data</span>
            <span className="confidence">95%</span>
          </div>

          {/* Кнопки действий */}
          <div className="action-buttons">
            <button className="action-btn primary">
              🗺️ Маршрут
            </button>
            <button className="action-btn secondary">
              📋 Подробно
            </button>
            <button
              className={`action-btn tertiary ${savedPlaces.has(rec.poi.id) ? 'saved' : ''}`}
              onClick={() => handleSave(rec.poi.id)}
            >
              {savedPlaces.has(rec.poi.id) ? '❤️ Сохранено' : '💾 Сохранить'}
            </button>
          </div>

          {/* Теги */}
          {rec.poi.tags.length > 0 && (
            <div className="poi-tags">
              {rec.poi.tags.slice(0, 3).map(tag => (
                <span key={tag} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}

      {recommendations.length > 3 && (
        <div className="show-more">
          <button
            className="show-more-btn"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Показать меньше' : `Показать ещё (${recommendations.length - 3})`}
          </button>
        </div>
      )}
    </div>
  );
};

export default Recommendations;
