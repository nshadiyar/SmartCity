// Объявляем глобальные типы Leaflet
declare global {
  interface Window {
    L: any;
  }
}

import { useEffect, useRef, useState, useCallback } from 'react';
import { POI, Recommendation, UserGeolocation } from '../types';

interface MapProps {
  userLocation?: { lat: number; lng: number };
  recommendations: Recommendation[];
  pois?: POI[];
  className?: string;
  height?: string;
  onLocationUpdate?: (location: UserGeolocation) => void;
  selectedPOI?: POI | null; // Выбранный POI для построения маршрута
}

const Map: React.FC<MapProps> = ({
  userLocation,
  recommendations,
  pois = [],
  className = '',
  height = '400px',
  onLocationUpdate,
  selectedPOI = null
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [routingControl, setRoutingControl] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<UserGeolocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Функция для получения текущей геолокации
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Геолокация не поддерживается вашим браузером');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserGeolocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };

        setCurrentLocation(location);
        onLocationUpdate?.(location);
        setIsLocating(false);

        // Центрируем карту на текущей позиции
        if (map) {
          map.setView([location.lat, location.lng], 16);
        }
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
  }, [map, onLocationUpdate]);

  // Функция для построения маршрута
  const createRoute = useCallback((startLat: number, startLng: number, endLat: number, endLng: number, poiName: string) => {
    if (!map) return;

    // Удаляем предыдущий маршрут
    if (routingControl) {
      map.removeControl(routingControl);
    }

    const control = window.L.Routing.control({
      waypoints: [
        window.L.latLng(startLat, startLng),
        window.L.latLng(endLat, endLng)
      ],
      routeWhileDragging: false,
      createMarker: () => null, // Не создаем маркеры для waypoints
      lineOptions: {
        styles: [
          {
            color: '#667eea',
            weight: 6,
            opacity: 0.8
          },
          {
            color: 'white',
            weight: 2,
            opacity: 1
          }
        ]
      },
      language: 'ru',
      showAlternatives: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true
    });

    control.addTo(map);
    setRoutingControl(control);

    // Добавляем информационное сообщение
    setTimeout(() => {
      const instructions = document.querySelector('.leaflet-routing-container-hide');
      if (instructions) {
        instructions.innerHTML = `
          <div style="padding: 10px; background: rgba(102, 126, 234, 0.9); color: white; border-radius: 8px; margin-top: 10px;">
            <strong>🚶 Маршрут до ${poiName}</strong><br>
            <small>Следуйте указаниям для пешей прогулки</small>
          </div>
        `;
      }
    }, 1000);

  }, [map, routingControl]);

  // Инициализация карты
  useEffect(() => {
    if (!mapRef.current || !window.L) return;

    // Центр Астаны
    const astanaCenter: [number, number] = [51.1694, 71.4491];

    const leafletMap = window.L.map(mapRef.current).setView(astanaCenter, 12);

    // Добавляем слой OpenStreetMap
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(leafletMap);

    // Добавляем слой с названиями улиц
    window.L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>',
      maxZoom: 19,
      opacity: 0.7
    }).addTo(leafletMap);

    // Добавляем кнопку геолокации
    const locateControl = window.L.control({ position: 'topleft' });
    locateControl.onAdd = function() {
      const div = window.L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      div.innerHTML = `
        <a class="locate-button" href="#" title="Мое местоположение" style="
          background: white;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.4);
          text-decoration: none;
          color: #333;
          font-size: 16px;
          transition: all 0.3s ease;
        ">📍</a>
      `;

      div.onclick = function(e: Event) {
        e.preventDefault();
        if (isLocating) return; // Предотвращаем повторные клики

        getCurrentLocation();
      };

      return div;
    };
    locateControl.addTo(leafletMap);

    setMap(leafletMap);

    return () => {
      leafletMap.remove();
    };
  }, []);

  // Обновление маркеров
  useEffect(() => {
    if (!map) return;

    // Очищаем старые маркеры
    markers.forEach(marker => map.removeLayer(marker));
    setMarkers([]);

    const newMarkers: any[] = [];

    // Добавляем маркер пользователя
    if (userLocation) {
      const userMarker = window.L.marker([userLocation.lat, userLocation.lng])
        .addTo(map)
        .bindPopup(`
          <div style="text-align: center;">
            <strong>📍 Ваше местоположение</strong><br>
            <small>Здесь вы сейчас находитесь</small>
          </div>
        `);

      // Добавляем круг вокруг маркера пользователя (радиус ~1км)
      const userCircle = window.L.circle([userLocation.lat, userLocation.lng], {
        color: '#667eea',
        fillColor: '#667eea',
        fillOpacity: 0.1,
        radius: 1000
      }).addTo(map);

      newMarkers.push(userMarker, userCircle);
    }

    // Добавляем маркеры POI
    pois.forEach(poi => {
      const markerColor = getMarkerColor(poi.category);
      const markerIcon = createCustomIcon(markerColor, '📍');

      const marker = window.L.marker([poi.coordinates.lat, poi.coordinates.lng], {
        icon: markerIcon
      })
        .addTo(map)
        .bindPopup(`
          <div style="max-width: 250px;">
            <h4 style="margin: 0 0 8px 0; color: #1f2937;">${poi.name}</h4>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${poi.description}</p>
            <div style="font-size: 12px; color: #9ca3af;">
              <strong>Категория:</strong> ${poi.category}<br>
              ${poi.address ? `<strong>Адрес:</strong> ${poi.address}<br>` : ''}
              ${poi.workingHours ? `<strong>Время работы:</strong> ${poi.workingHours}<br>` : ''}
              ${poi.rating ? `<strong>Рейтинг:</strong> ⭐ ${poi.rating}<br>` : ''}
            </div>
          </div>
        `);

      newMarkers.push(marker);
    });

    // Добавляем маркеры рекомендаций
    recommendations.forEach(rec => {
      // Проверяем наличие POI и координат
      if (!rec.poi || !rec.poi.coordinates) {
        console.warn('POI или координаты отсутствуют:', rec);
        return;
      }

      const markerIcon = createCustomIcon('#10b981', '🎯');
      
      // Безопасная обработка имени POI
      const poiName = rec.poi?.name || 'Место';
      const safePoiName = poiName.replace(/'/g, "\\'");

      const marker = window.L.marker([rec.poi.coordinates.lat, rec.poi.coordinates.lng], {
        icon: markerIcon
      })
        .addTo(map)
        .bindPopup(`
          <div style="max-width: 280px;">
            <h4 style="margin: 0 0 8px 0; color: #059669;">${poiName}</h4>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${rec.poi.description || ''}</p>
            <div style="background: #f0fdf4; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
              <strong style="color: #059669;">💡 Почему рекомендую:</strong><br>
              <span style="font-size: 13px;">${rec.why || ''}</span>
            </div>
            <div style="background: #fef3c7; padding: 8px; border-radius: 6px; margin-bottom: 12px;">
              <strong style="color: #d97706;">🎯 План действий:</strong><br>
              <span style="font-size: 13px;">${rec.plan || ''}</span>
            </div>
            <div style="font-size: 12px; color: #9ca3af; margin-bottom: 12px;">
              📍 ${rec.distance}м • 🚶‍♂️ ${rec.walkingTime} мин<br>
              ${rec.poi.address ? `<strong>Адрес:</strong> ${rec.poi.address}<br>` : ''}
              ${rec.poi.workingHours ? `<strong>Время работы:</strong> ${rec.poi.workingHours}<br>` : ''}
            </div>
            <div style="display: flex; gap: 8px;">
              <button onclick="window.mapCreateRoute && window.mapCreateRoute(${currentLocation?.lat || userLocation?.lat || 51.1694}, ${currentLocation?.lng || userLocation?.lng || 71.4491}, ${rec.poi.coordinates.lat}, ${rec.poi.coordinates.lng}, '${safePoiName}')" style="
                flex: 1;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s ease;
              " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                🗺️ Маршрут
              </button>
              <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${rec.poi.coordinates.lat},${rec.poi.coordinates.lng}&travelmode=walking', '_blank')" style="
                flex: 1;
                background: #4285f4;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                cursor: pointer;
                transition: transform 0.2s ease;
              " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                🗺️ Google Maps
              </button>
            </div>
          </div>
        `);

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Автоматически подстраиваем границы карты, чтобы показать все маркеры
    if (newMarkers.length > 0) {
      const group = new window.L.featureGroup(newMarkers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

  }, [map, userLocation, recommendations, pois]);

  // Создание кастомной иконки маркера
  const createCustomIcon = (color: string, emoji: string) => {
    return window.L.divIcon({
      html: `
        <div style="
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          color: white;
        ">
          ${emoji}
        </div>
      `,
      className: 'custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  // Получение цвета маркера по категории
  const getMarkerColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'достопримечательность': '#f59e0b',
      'музей': '#8b5cf6',
      'парк': '#10b981',
      'кафе': '#ef4444',
      'развлечения': '#f97316',
      'торговый центр': '#3b82f6',
      'религия': '#6b7280',
      'бар': '#ec4899',
      'детская площадка': '#06b6d4'
    };
    return colors[category] || '#6b7280';
  };

  // Добавляем глобальную функцию для создания маршрута
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).mapCreateRoute = createRoute;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).mapCreateRoute;
      }
    };
  }, [createRoute]);

  // Функция для сброса маршрута
  const clearRoute = useCallback(() => {
    if (!map || !routingControl) return;
    map.removeControl(routingControl);
    setRoutingControl(null);
    console.log('🗺️ [MAP] Маршрут сброшен');
  }, [map, routingControl]);

  // Автоматическое построение маршрута при выборе POI
  useEffect(() => {
    if (!map || !userLocation) return;

    // Если selectedPOI null, сбрасываем маршрут
    if (!selectedPOI) {
      clearRoute();
      return;
    }

    const startLat = userLocation.lat;
    const startLng = userLocation.lng;
    const endLat = selectedPOI.coordinates.lat;
    const endLng = selectedPOI.coordinates.lng;

    console.log('🗺️ [MAP] Построение маршрута:', {
      from: { lat: startLat, lng: startLng },
      to: { lat: endLat, lng: endLng },
      poiName: selectedPOI.name
    });

    createRoute(startLat, startLng, endLat, endLng, selectedPOI.name);
  }, [selectedPOI, map, userLocation, createRoute, clearRoute]);

  return (
    <div className={`map-container ${className}`}>
      <div
        ref={mapRef}
        style={{
          height,
          width: '100%',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
          zIndex: 1
        }}
      />
      {isLocating && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          textAlign: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #667eea',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 10px'
          }}></div>
          <p style={{ margin: 0, color: '#374151', fontWeight: '500' }}>
            Определяем ваше местоположение...
          </p>
        </div>
      )}
    </div>
  );
};

export default Map;
