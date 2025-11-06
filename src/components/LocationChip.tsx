import React, { useState } from 'react';
import { UserGeolocation } from '../types';

interface LocationChipProps {
  location: { lat: number; lng: number } | null;
  onLocationUpdate: (location: UserGeolocation) => void;
}

const LocationChip: React.FC<LocationChipProps> = ({ location, onLocationUpdate }) => {
  const [isLocating, setIsLocating] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAddress, setManualAddress] = useState('');

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Геолокация не поддерживается вашим браузером');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation: UserGeolocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        onLocationUpdate(userLocation);
        setIsLocating(false);
      },
      (error) => {
        console.error('Ошибка геолокации:', error);
        setIsLocating(false);

        let errorMessage = 'Не удалось определить ваше местоположение';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Доступ к геолокации запрещен. Разрешите доступ в настройках браузера.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Информация о местоположении недоступна.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Превышено время ожидания определения местоположения.';
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 минут
      }
    );
  };

  const handleManualSubmit = () => {
    if (manualAddress.trim()) {
      // Имитация геокодирования - используем координаты центра Астаны
      const mockLocation: UserGeolocation = {
        lat: 51.1694,
        lng: 71.4491,
        accuracy: 100,
        timestamp: Date.now()
      };
      onLocationUpdate(mockLocation);
      setShowManualInput(false);
    }
  };

  const getLocationDisplay = () => {
    if (location) {
      return '📍 Мое местоположение';
    }
    return '📍 Определить местоположение';
  };

  return (
    <div className="location-chip">
      <div className="location-display">
        <span className="location-text">{getLocationDisplay()}</span>
        <div className="location-actions">
          <button
            className="location-btn primary"
            onClick={getCurrentLocation}
            disabled={isLocating}
          >
            {isLocating ? '⏳ Определяем...' : '🎯 Определить'}
          </button>
          <button
            className="location-btn secondary"
            onClick={() => setShowManualInput(!showManualInput)}
          >
            ✏️ Ввести адрес
          </button>
        </div>
      </div>

      {showManualInput && (
        <div className="manual-input">
          <input
            type="text"
            placeholder="Введите адрес в Астане..."
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
          />
          <button
            className="manual-submit"
            onClick={handleManualSubmit}
            disabled={!manualAddress.trim()}
          >
            ✅ Применить
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationChip;
