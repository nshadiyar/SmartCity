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
  onBuildRouteToAll?: () => void; // Callback для построения маршрута ко всем местам
  routePOIs?: any[]; // Места в мини-маршруте (до 3 мест)
}

const Map: React.FC<MapProps> = ({
  userLocation,
  recommendations,
  pois = [],
  className = '',
  height = '400px',
  onLocationUpdate,
  selectedPOI = null,
  onBuildRouteToAll,
  routePOIs = []
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [routingControl, setRoutingControl] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<UserGeolocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const isBuildingRouteRef = useRef(false); // Флаг для предотвращения повторных вызовов

  // Функция для получения текущей геолокации
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
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

        let errorMessage = 'Failed to determine your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timeout exceeded.';
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
    console.log('🗺️ [MAP] createRoute вызвана:', { startLat, startLng, endLat, endLng, poiName });
    
    if (!map) {
      console.error('🗺️ [MAP] Map not initialized');
      alert('Map is not ready. Please wait a moment and try again.');
      return;
    }

    // Предотвращаем повторные вызовы (только для кнопки, не блокируем автоматическое построение)
    // Для кнопки это не критично, так как пользователь может захотеть перестроить маршрут

    // Check coordinate validity
    if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
      console.error('🗺️ [MAP] Invalid coordinates:', { startLat, startLng, endLat, endLng });
      alert('Error: invalid coordinates for route building');
      return;
    }

    // Check if Leaflet Routing Machine is available
    if (!window.L || !window.L.Routing) {
      console.error('🗺️ [MAP] Leaflet Routing Machine not loaded!');
      alert('Error: routing library not loaded. Please refresh the page.');
      return;
    }

    // Удаляем предыдущий маршрут безопасно
    if (routingControl) {
      try {
        if (map.hasLayer && map.hasLayer(routingControl)) {
          map.removeControl(routingControl);
        }
        setRoutingControl(null);
        console.log('🗺️ [MAP] Предыдущий маршрут удален');
      } catch (error) {
        console.warn('🗺️ [MAP] Ошибка при удалении предыдущего маршрута:', error);
        setRoutingControl(null);
      }
    }

    try {
      // Настройки маршрутизации
      const routingOptions: any = {
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
        language: 'en',
        showAlternatives: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true
      };

      // Проверяем наличие OSRM router
      if (window.L.Routing && window.L.Routing.osrmv1) {
        routingOptions.router = window.L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'foot'
        });
        console.log('🗺️ [MAP] Используется OSRM router для пешеходных маршрутов');
      }

      const control = window.L.Routing.control(routingOptions);

      // Обработка событий маршрута
      control.on('routingerror', (e: any) => {
        console.error('🗺️ [MAP] Ошибка построения маршрута:', e);
        console.warn('🗺️ [MAP] Попробуйте еще раз или проверьте подключение к интернету');
      });

      control.on('routesfound', (e: any) => {
        console.log('🗺️ [MAP] ✅ Маршрут успешно построен!', e);
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const route = routes[0];
          console.log('🗺️ [MAP] Количество маршрутов:', routes.length);
          if (route.summary) {
            console.log('🗺️ [MAP] Длина маршрута:', Math.round(route.summary.totalDistance), 'м');
            console.log('🗺️ [MAP] Время маршрута:', Math.round(route.summary.totalTime / 60), 'мин');
          }
        }
      });

      control.addTo(map);
      setRoutingControl(control);
      console.log('🗺️ [MAP] ✅ Маршрут добавлен на карту');

      // Обработка событий маршрута
      control.on('routingerror', (e: any) => {
        console.error('🗺️ [MAP] Ошибка построения маршрута к POI:', e);
      });

      control.on('routesfound', () => {
        console.log('🗺️ [MAP] ✅ Маршрут к POI успешно построен');
      });

      // Добавляем информационное сообщение
      setTimeout(() => {
        const instructions = document.querySelector('.leaflet-routing-container-hide');
        if (instructions) {
          instructions.innerHTML = `
            <div style="padding: 10px; background: rgba(102, 126, 234, 0.9); color: white; border-radius: 8px; margin-top: 10px;">
              <strong>🚶 Route to ${poiName}</strong><br>
              <small>Follow the directions for walking</small>
            </div>
          `;
        }
      }, 1000);

    } catch (error) {
      console.error('🗺️ [MAP] ❌ Error creating route:', error);
      alert('Failed to build route. Check the console for details.');
    }

  }, [map]);

  // Функция для построения маршрута через все рекомендованные места
  const createRouteToAllRecommendations = useCallback(() => {
    if (!map || !userLocation || recommendations.length === 0) {
      console.log('🗺️ [MAP] Пропуск построения маршрута: нет условий');
      return;
    }

    // Предотвращаем повторные вызовы
    if (isBuildingRouteRef.current) {
      console.log('🗺️ [MAP] Маршрут уже строится, пропускаем');
      return;
    }

    isBuildingRouteRef.current = true;

    // Удаляем предыдущий маршрут безопасно
    if (routingControl) {
      try {
        if (map.hasLayer && map.hasLayer(routingControl)) {
          map.removeControl(routingControl);
        }
        setRoutingControl(null);
      } catch (error) {
        console.warn('🗺️ [MAP] Ошибка при удалении предыдущего маршрута:', error);
        setRoutingControl(null);
      }
    }

    // Создаем waypoints: начало (пользователь) + все рекомендованные места
    const waypoints = [
      window.L.latLng(userLocation.lat, userLocation.lng),
      ...recommendations
        .filter(rec => rec.poi && rec.poi.coordinates)
        .map(rec => window.L.latLng(rec.poi.coordinates.lat, rec.poi.coordinates.lng))
    ];

    if (waypoints.length < 2) {
      console.warn('Недостаточно точек для построения маршрута');
      return;
    }

    console.log('🗺️ [MAP] Построение маршрута через все рекомендованные места:', {
      waypointsCount: waypoints.length,
      recommendations: recommendations.map(rec => rec.poi.name)
    });

    try {
      const routingOptions: any = {
        waypoints: waypoints,
        routeWhileDragging: false,
        createMarker: () => null,
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
        language: 'en',
        showAlternatives: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true
      };

      // Проверяем наличие OSRM router
      if (window.L.Routing && window.L.Routing.osrmv1) {
        routingOptions.router = window.L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'foot'
        });
        console.log('🗺️ [MAP] Используется OSRM router для пешеходных маршрутов');
      }

      const control = window.L.Routing.control(routingOptions);

      control.addTo(map);
      setRoutingControl(control);
      isBuildingRouteRef.current = false; // Сбрасываем флаг после добавления

      // Обработка событий маршрута
      control.on('routingerror', (e: any) => {
        console.error('🗺️ [MAP] Ошибка построения маршрута через все рекомендации:', e);
        isBuildingRouteRef.current = false;
      });

      control.on('routesfound', () => {
        console.log('🗺️ [MAP] ✅ Маршрут успешно построен через все рекомендации');
        isBuildingRouteRef.current = false;
      });

      // Добавляем информационное сообщение
      setTimeout(() => {
        const instructions = document.querySelector('.leaflet-routing-container-hide');
        if (instructions) {
          instructions.innerHTML = `
            <div style="padding: 10px; background: rgba(102, 126, 234, 0.9); color: white; border-radius: 8px; margin-top: 10px;">
              <strong>🚶 Route through ${recommendations.length} recommended places</strong><br>
              <small>Follow the directions for walking</small>
            </div>
          `;
        }
      }, 1000);

    } catch (error) {
      console.error('🗺️ [MAP] ❌ Ошибка при создании маршрута через все рекомендации:', error);
      isBuildingRouteRef.current = false; // Сбрасываем флаг при ошибке
      console.warn('🗺️ [MAP] Маршрут может быть недоступен. Проверьте консоль для подробностей.');
    }

  }, [map, userLocation, recommendations]);

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
              <strong>Category:</strong> ${poi.category}<br>
              ${poi.address ? `<strong>Address:</strong> ${poi.address}<br>` : ''}
              ${poi.workingHours ? `<strong>Hours:</strong> ${poi.workingHours}<br>` : ''}
              ${poi.rating ? `<strong>Rating:</strong> ⭐ ${poi.rating}<br>` : ''}
            </div>
          </div>
        `);

      newMarkers.push(marker);
    });

    // Добавляем маркеры рекомендаций (только если routePOIs пуст)
    if (routePOIs.length === 0) {
      recommendations.forEach(rec => {
        // Проверяем наличие POI и координат
        if (!rec.poi || !rec.poi.coordinates) {
          console.warn('POI или координаты отсутствуют:', rec);
          return;
        }

        const markerIcon = createCustomIcon('#10b981', '🎯');
        
        // Безопасная обработка имени POI
        const poiName = rec.poi?.name || 'Place';
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
                <strong style="color: #059669;">💡 Why I recommend:</strong><br>
                <span style="font-size: 13px;">${rec.why || ''}</span>
              </div>
              <div style="background: #fef3c7; padding: 8px; border-radius: 6px; margin-bottom: 12px;">
                <strong style="color: #d97706;">🎯 Action plan:</strong><br>
                <span style="font-size: 13px;">${rec.plan || ''}</span>
              </div>
              <div style="font-size: 12px; color: #9ca3af; margin-bottom: 12px;">
                📍 ${rec.distance}m • 🚶‍♂️ ${rec.walkingTime} min<br>
                ${rec.poi.address ? `<strong>Address:</strong> ${rec.poi.address}<br>` : ''}
                ${rec.poi.workingHours ? `<strong>Hours:</strong> ${rec.poi.workingHours}<br>` : ''}
              </div>
              <div style="display: flex; gap: 8px;">
                <button onclick="(function() {
                  const startLat = ${currentLocation?.lat || userLocation?.lat || 51.1694};
                  const startLng = ${currentLocation?.lng || userLocation?.lng || 71.4491};
                  const endLat = ${rec.poi.coordinates.lat};
                  const endLng = ${rec.poi.coordinates.lng};
                  const poiName = ${JSON.stringify(poiName)};
                  console.log('🗺️ [BUTTON] Кнопка маршрута нажата:', { startLat, startLng, endLat, endLng, poiName });
                  if (window.mapCreateRoute) {
                    try {
                      window.mapCreateRoute(startLat, startLng, endLat, endLng, poiName);
                    } catch (error) {
                      console.error('🗺️ [BUTTON] Error calling mapCreateRoute:', error);
                      alert('Error building route. Check the console for details.');
                    }
                  } else {
                    console.error('🗺️ [BUTTON] window.mapCreateRoute not found!');
                    alert('Route function unavailable. Please try refreshing the page.');
                  }
                })()" style="
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
                  🗺️ Route
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
    }

    // Добавляем маркеры для routePOIs (места в маршруте)
    routePOIs.forEach((poi, index) => {
      if (!poi || !poi.coordinates || 
          typeof poi.coordinates.lat !== 'number' || 
          typeof poi.coordinates.lng !== 'number' ||
          isNaN(poi.coordinates.lat) || 
          isNaN(poi.coordinates.lng)) {
        console.warn('🗺️ [MAP] Пропускаем POI без валидных координат:', poi?.name);
        return;
      }

      // Специальная иконка для мест в маршруте
      const routeMarkerIcon = createCustomIcon('#f59e0b', '🚶');
      
      const poiName = poi?.name || 'Место';
      const safePoiName = poiName.replace(/'/g, "\\'");

      const marker = window.L.marker([poi.coordinates.lat, poi.coordinates.lng], {
        icon: routeMarkerIcon
      })
        .addTo(map)
        .bindPopup(`
          <div style="max-width: 280px;">
            <h4 style="margin: 0 0 8px 0; color: #d97706;">
              🚶 Stop ${index + 1}: ${poiName}
            </h4>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
              ${poi.description || ''}
            </p>
            <div style="font-size: 12px; color: #9ca3af; margin-bottom: 12px;">
              ${poi.address ? `<strong>Address:</strong> ${poi.address}<br>` : ''}
              ${poi.workingHours ? `<strong>Hours:</strong> ${poi.workingHours}<br>` : ''}
              ${poi.category ? `<strong>Category:</strong> ${poi.category}<br>` : ''}
            </div>
            <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${poi.coordinates.lat},${poi.coordinates.lng}&travelmode=walking', '_blank')" style="
              width: 100%;
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
        `);

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Автоматически подстраиваем границы карты, чтобы показать все маркеры
    if (newMarkers.length > 0) {
      const group = new window.L.featureGroup(newMarkers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

  }, [map, userLocation, recommendations, pois, routePOIs, currentLocation]);

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
      console.log('🗺️ [MAP] Функция mapCreateRoute зарегистрирована в window');
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).mapCreateRoute;
        console.log('🗺️ [MAP] Функция mapCreateRoute удалена из window');
      }
    };
  }, [createRoute]);

  // Функция для сброса маршрута
  const clearRoute = useCallback(() => {
    if (!map) return;
    if (routingControl) {
      try {
        // Проверяем, что control все еще на карте перед удалением
        if (map.hasLayer && map.hasLayer(routingControl)) {
          map.removeControl(routingControl);
        }
        setRoutingControl(null);
        console.log('🗺️ [MAP] Маршрут сброшен');
      } catch (error) {
        console.warn('🗺️ [MAP] Ошибка при удалении маршрута:', error);
        setRoutingControl(null);
      }
    }
  }, [map, routingControl]);

  // Автоматическое построение маршрута при выборе POI
  useEffect(() => {
    if (!map || !userLocation) return;

    // Если selectedPOI null, сбрасываем маршрут только если нет routePOIs
    if (!selectedPOI) {
      // Не сбрасываем маршрут, если есть routePOIs - они имеют приоритет
      if (routePOIs.length === 0) {
        clearRoute();
      }
      return;
    }

    // Предотвращаем повторные вызовы
    if (isBuildingRouteRef.current) {
      console.log('🗺️ [MAP] Маршрут уже строится для selectedPOI, пропускаем');
      return;
    }

    const startLat = userLocation.lat;
    const startLng = userLocation.lng;
    const endLat = selectedPOI.coordinates.lat;
    const endLng = selectedPOI.coordinates.lng;

    console.log('🗺️ [MAP] Построение маршрута к selectedPOI:', {
      from: { lat: startLat, lng: startLng },
      to: { lat: endLat, lng: endLng },
      poiName: selectedPOI.name
    });

    createRoute(startLat, startLng, endLat, endLng, selectedPOI.name);
  }, [selectedPOI, map, userLocation, createRoute, clearRoute, routePOIs]);

  // Функция для построения маршрута через routePOIs (мини-маршрут из 3 мест)
  const createRouteThroughPOIs = useCallback(() => {
    if (!map || routePOIs.length === 0) {
      console.warn('🗺️ [MAP] Не удалось построить маршрут: нет карты или POI');
      return;
    }

    // Предотвращаем повторные вызовы
    if (isBuildingRouteRef.current) {
      console.log('🗺️ [MAP] Маршрут уже строится, пропускаем');
      return;
    }

    isBuildingRouteRef.current = true;

    // Фильтруем POI с валидными координатами
    const validPOIs = routePOIs.filter(poi => {
      const hasValidCoords = poi && 
        poi.coordinates && 
        typeof poi.coordinates.lat === 'number' && 
        typeof poi.coordinates.lng === 'number' &&
        !isNaN(poi.coordinates.lat) &&
        !isNaN(poi.coordinates.lng);
      
      if (!hasValidCoords) {
        console.warn('🗺️ [MAP] POI без валидных координат:', poi?.name || 'Unknown');
      }
      return hasValidCoords;
    });

    if (validPOIs.length === 0) {
      console.warn('🗺️ [MAP] Нет POI с валидными координатами');
      return;
    }

    // Определяем начальную точку: пользователь или первое место из маршрута
    let startLat: number;
    let startLng: number;
    
    if (userLocation && typeof userLocation.lat === 'number' && typeof userLocation.lng === 'number') {
      startLat = userLocation.lat;
      startLng = userLocation.lng;
      console.log('🗺️ [MAP] Используем местоположение пользователя как начальную точку');
    } else if (validPOIs.length > 0) {
      startLat = validPOIs[0].coordinates.lat;
      startLng = validPOIs[0].coordinates.lng;
      console.log('🗺️ [MAP] Используем первое место маршрута как начальную точку');
    } else {
      // Fallback на центр Астаны
      startLat = 51.1694;
      startLng = 71.4491;
      console.log('🗺️ [MAP] Используем центр Астаны как начальную точку (fallback)');
    }

    // Удаляем предыдущий маршрут
    if (routingControl) {
      map.removeControl(routingControl);
      setRoutingControl(null);
    }

    // Создаем waypoints: начало + все места в routePOIs
    const waypoints = [
      window.L.latLng(startLat, startLng),
      ...validPOIs.map(poi => window.L.latLng(poi.coordinates.lat, poi.coordinates.lng))
    ];

    if (waypoints.length < 2) {
      console.warn('🗺️ [MAP] Недостаточно точек для построения маршрута:', waypoints.length);
      return;
    }

    console.log('🗺️ [MAP] Построение мини-маршрута через routePOIs:', {
      waypointsCount: waypoints.length,
      startPoint: { lat: startLat, lng: startLng },
      pois: validPOIs.map(poi => ({
        name: poi.name,
        coords: { lat: poi.coordinates.lat, lng: poi.coordinates.lng }
      }))
    });

    // Проверяем наличие Leaflet Routing Machine
    if (!window.L || !window.L.Routing) {
      console.error('🗺️ [MAP] Leaflet Routing Machine не загружен!');
      alert('Error: routing library not loaded. Please refresh the page.');
      return;
    }

    try {
      // Настройки маршрутизации
      const routingOptions: any = {
        waypoints: waypoints,
        routeWhileDragging: false,
        createMarker: () => null, // Не создаем стандартные маркеры
        lineOptions: {
          styles: [
            {
              color: '#10b981',
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
        language: 'en',
        showAlternatives: false,
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true
      };

      // Проверяем наличие OSRM router
      if (window.L.Routing && window.L.Routing.osrmv1) {
        routingOptions.router = window.L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'foot'
        });
        console.log('🗺️ [MAP] Используется OSRM router для пешеходных маршрутов');
      } else {
        console.warn('🗺️ [MAP] OSRM router недоступен, используется маршрутизация по умолчанию');
      }

      const control = window.L.Routing.control(routingOptions);

      // Обработка событий маршрута
      control.on('routingerror', (e: any) => {
        console.error('🗺️ [MAP] Ошибка построения маршрута:', e);
        // Не показываем alert, только логируем, чтобы не раздражать пользователя
        console.warn('🗺️ [MAP] Попробуйте обновить страницу или проверить подключение к интернету');
      });

      control.on('routesfound', (e: any) => {
        console.log('🗺️ [MAP] ✅ Маршрут успешно построен!', e);
        const routes = e.routes;
        if (routes && routes.length > 0) {
          const route = routes[0];
          console.log('🗺️ [MAP] Количество маршрутов:', routes.length);
          if (route.summary) {
            console.log('🗺️ [MAP] Длина маршрута:', Math.round(route.summary.totalDistance), 'м');
            console.log('🗺️ [MAP] Время маршрута:', Math.round(route.summary.totalTime / 60), 'мин');
          }
        }
      });

      control.addTo(map);
      setRoutingControl(control);
      isBuildingRouteRef.current = false; // Сбрасываем флаг после добавления
      console.log('🗺️ [MAP] ✅ Маршрутизация добавлена на карту');

      // Обработка событий для routePOIs маршрута
      control.on('routingerror', (e: any) => {
        console.error('🗺️ [MAP] Ошибка построения маршрута через routePOIs:', e);
        isBuildingRouteRef.current = false;
      });

      control.on('routesfound', () => {
        console.log('🗺️ [MAP] ✅ Маршрут через routePOIs успешно построен');
        isBuildingRouteRef.current = false;
      });

      // Добавляем информационное сообщение
      setTimeout(() => {
        const instructions = document.querySelector('.leaflet-routing-container-hide');
        if (instructions) {
          instructions.innerHTML = `
            <div style="padding: 10px; background: rgba(16, 185, 129, 0.9); color: white; border-radius: 8px; margin-top: 10px;">
              <strong>🚶 Mini-route through ${validPOIs.length} places</strong><br>
              <small>Follow the directions for walking</small>
            </div>
          `;
        }
      }, 1000);

    } catch (error) {
      console.error('🗺️ [MAP] ❌ Ошибка при создании маршрута через routePOIs:', error);
      isBuildingRouteRef.current = false; // Сбрасываем флаг при ошибке
      console.warn('🗺️ [MAP] Маршрут может быть недоступен. Проверьте консоль для подробностей.');
    }

  }, [map, userLocation, routePOIs]);

  // Автоматическое построение маршрута через routePOIs (приоритет) или через все рекомендации
  useEffect(() => {
    if (!map) {
      console.warn('🗺️ [MAP] Карта не инициализирована');
      return;
    }
    
    // Если есть selectedPOI, не строим автоматические маршруты
    if (selectedPOI) {
      console.log('🗺️ [MAP] Выбран POI, пропускаем автоматическое построение маршрута');
      return;
    }

    // Предотвращаем повторные вызовы
    if (isBuildingRouteRef.current) {
      console.log('🗺️ [MAP] Маршрут уже строится, пропускаем автоматическое построение');
      return;
    }

    // Если есть routePOIs, строим маршрут через них (приоритет)
    if (routePOIs.length > 0) {
      console.log('🗺️ [MAP] Обнаружены routePOIs, строим маршрут:', routePOIs.length);
      // Небольшая задержка для обеспечения готовности карты
      const timer = setTimeout(() => {
        createRouteThroughPOIs();
      }, 300);
      return () => clearTimeout(timer);
    }

    // Иначе строим маршрут через все рекомендации (только если есть userLocation и нет routePOIs)
    if (recommendations.length > 0 && userLocation && routePOIs.length === 0) {
      console.log('🗺️ [MAP] Автоматическое построение маршрута ко всем рекомендованным местам');
      const timer = setTimeout(() => {
        createRouteToAllRecommendations();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [routePOIs, recommendations, map, userLocation, createRouteThroughPOIs, createRouteToAllRecommendations, selectedPOI]);

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
