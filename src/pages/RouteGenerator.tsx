import React, { useEffect } from 'react';
import Map from '../components/Map';

interface RouteGeneratorProps {
  pois: any[];
  onNavigate: (page: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

// Функция для расчета расстояния между двумя точками (формула гаверсинуса)
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // Радиус Земли в метрах
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Функция для расчета времени ходьбы (примерно 5 км/ч = 83 м/мин)
const calculateWalkingTime = (distance: number): number => {
  return Math.ceil(distance / 83); // 83 м/мин = 5 км/ч
};

const RouteGenerator: React.FC<RouteGeneratorProps> = ({ pois, onNavigate, userLocation }) => {
  // Логирование входящих данных
  useEffect(() => {
    console.log('🗺️ [ROUTE GENERATOR] Компонент инициализирован');
    console.log('🗺️ [ROUTE GENERATOR] Количество POI:', pois.length);
    console.log('🗺️ [ROUTE GENERATOR] UserLocation:', userLocation);
    console.log('🗺️ [ROUTE GENERATOR] Full POIs data:', JSON.stringify(pois, null, 2));
    pois.forEach((poi, index) => {
      // Более детальная проверка координат
      const coords = poi?.coordinates;
      const latValue = coords?.lat;
      const lngValue = coords?.lng;
      
      // Пытаемся преобразовать в числа, если они строки
      const latNum = latValue !== null && latValue !== undefined ? Number(latValue) : NaN;
      const lngNum = lngValue !== null && lngValue !== undefined ? Number(lngValue) : NaN;
      
      const hasValidCoords = !isNaN(latNum) && !isNaN(lngNum) && 
        latNum >= -90 && latNum <= 90 && 
        lngNum >= -180 && lngNum <= 180;
      
      console.log(`🗺️ [ROUTE GENERATOR] POI ${index + 1}:`, {
        id: poi?.id,
        name: poi?.name,
        coordinates: coords,
        latValue: latValue,
        lngValue: lngValue,
        latType: typeof latValue,
        lngType: typeof lngValue,
        latNum: latNum,
        lngNum: lngNum,
        hasValidCoords,
        fullPoi: poi
      });
      
      if (!hasValidCoords) {
        console.error(`❌ [ROUTE GENERATOR] POI ${index + 1} (${poi?.name}) не имеет валидных координат!`, {
          coordinates: coords,
          latValue,
          lngValue,
          latNum,
          lngNum
        });
      }
    });
  }, [pois, userLocation]);

  // Рассчитываем время и расстояние для маршрута
  const calculateRouteStats = () => {
    if (pois.length === 0) {
      console.warn('🗺️ [ROUTE GENERATOR] Список POI пуст');
      return { totalTime: 0, totalDistance: 0, steps: [] };
    }

    // Фильтруем POI с валидными координатами и нормализуем их
    const validPOIs = pois.filter(poi => {
      if (!poi || !poi.coordinates) {
        console.warn('🗺️ [ROUTE GENERATOR] POI без объекта coordinates:', poi?.name);
        return false;
      }
      
      // Пытаемся получить координаты, поддерживая строки и числа
      const latValue = poi.coordinates.lat;
      const lngValue = poi.coordinates.lng;
      const latNum = latValue !== null && latValue !== undefined ? Number(latValue) : NaN;
      const lngNum = lngValue !== null && lngValue !== undefined ? Number(lngValue) : NaN;
      
      const isValid = !isNaN(latNum) && !isNaN(lngNum) && 
        latNum >= -90 && latNum <= 90 && 
        lngNum >= -180 && lngNum <= 180;
      
      if (isValid) {
        // Нормализуем координаты в числа
        poi.coordinates.lat = latNum;
        poi.coordinates.lng = lngNum;
      } else {
        console.warn('🗺️ [ROUTE GENERATOR] POI с невалидными координатами:', {
          name: poi?.name,
          coordinates: poi.coordinates,
          latValue,
          lngValue,
          latNum,
          lngNum
        });
      }
      
      return isValid;
    });

    console.log('🗺️ [ROUTE GENERATOR] Валидных POI:', validPOIs.length, 'из', pois.length);

    if (validPOIs.length === 0) {
      console.warn('🗺️ [ROUTE GENERATOR] Нет POI с валидными координатами');
      return { totalTime: 0, totalDistance: 0, steps: [] };
    }

    let totalDistance = 0;
    let totalTime = 0;
    const steps: Array<{ poi: any; distance: number; time: number; cumulativeTime: number }> = [];

    // Начальная точка - местоположение пользователя или первое место
    let currentLat = userLocation?.lat || validPOIs[0]?.coordinates?.lat || 51.1694;
    let currentLng = userLocation?.lng || validPOIs[0]?.coordinates?.lng || 71.4491;

    validPOIs.forEach((poi) => {
      const distance = calculateDistance(
        currentLat,
        currentLng,
        poi.coordinates.lat,
        poi.coordinates.lng
      );
      const time = calculateWalkingTime(distance);

      totalDistance += distance;
      totalTime += time;

      steps.push({
        poi,
        distance: Math.round(distance),
        time,
        cumulativeTime: totalTime
      });

      // Обновляем текущую позицию для следующего расчета
      currentLat = poi.coordinates.lat;
      currentLng = poi.coordinates.lng;
    });

    return { totalTime, totalDistance: Math.round(totalDistance), steps };
  };

  const { totalTime, totalDistance, steps } = calculateRouteStats();

  const handleStartJourney = () => {
    // Navigate to map with route
    onNavigate('results');
  };

  // Если маршрут пустой или нет валидных POI, показываем сообщение
  if (pois.length === 0 || steps.length === 0) {
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
        </div>
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          background: 'white',
          borderRadius: '16px',
          margin: '20px 0'
        }}>
          <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '20px' }}>
            {pois.length === 0 
              ? 'Route is empty. Add places to your route on the results page.' 
              : 'Failed to build route. Added places are missing coordinates.'}
          </p>
          <button
            className="start-journey-btn"
            onClick={() => onNavigate('results')}
            style={{ marginTop: '20px' }}
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

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

      {/* Карта с маршрутом */}
      <div style={{ marginBottom: '30px' }}>
        <Map
          userLocation={userLocation || undefined}
          recommendations={[]}
          pois={[]}
          routePOIs={pois}
          height="500px"
          onLocationUpdate={() => {}}
          selectedPOI={null}
        />
      </div>
      {pois.length > 0 && (
        <div style={{
          padding: '15px',
          background: '#f0fdf4',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #10b981'
        }}>
          <p style={{ margin: 0, color: '#059669', fontSize: '14px' }}>
            💡 <strong>Tip:</strong> The route should automatically appear on the map. 
            If the route is not visible, check the browser console (F12) for more information.
          </p>
        </div>
      )}

      <div className="route-steps">
        {steps.map((step, index) => (
          <div key={step.poi.id || index} className="route-step">
            <div className="step-number">{index + 1}</div>
            <div className="step-connector" style={{ display: index < steps.length - 1 ? 'block' : 'none' }}></div>
            <div className="step-content">
              <div className="step-header">
                <h3>{step.poi.name}</h3>
                <span className="step-category">{step.poi.category}</span>
              </div>
              <p className="step-description">{step.poi.description || ''}</p>
              <div className="step-meta">
                <span>📍 {step.poi.address || 'Address not specified'}</span>
                {index === 0 ? (
                  <span>⏱️ ~{step.time} min from you</span>
                ) : (
                  <span>⏱️ ~{step.time} min from previous place</span>
                )}
                <span>📏 {step.distance}m</span>
                <span>⏰ ~{step.cumulativeTime} min from start</span>
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
