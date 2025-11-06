import { useState } from 'react';
import { UserQuery, Recommendation } from './types';
import { mockPOIs } from './data/mockPOIs';
import LandingPage from './pages/LandingPage';
import ResultsPage from './pages/ResultsPage';
import POIDetailPage from './pages/POIDetailPage';
import RouteGenerator from './pages/RouteGenerator';
import StickyHeader from './components/StickyHeader';
import FloatingChatButton from './components/FloatingChatButton';
import './App.css';

// Page types
type PageType = 'landing' | 'results' | 'poi-detail' | 'route-generator';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [selectedPOI, setSelectedPOI] = useState<any>(null);
  const [routePOIs, setRoutePOIs] = useState<any[]>([]);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState<UserQuery | null>(null);

  // Автоматическое определение геолокации
  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        // Если геолокация не поддерживается, используем центр Астаны
        resolve({ lat: 51.1694, lng: 71.4491 });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          // При ошибке используем центр Астаны
          console.warn('Геолокация недоступна, используется центр Астаны:', error);
          resolve({ lat: 51.1694, lng: 71.4491 });
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 минут
        }
      );
    });
  };

  // Функция для расчета расстояния между двумя точками (в метрах)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Радиус Земли в метрах
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Функция для расчета времени пешком (примерно 5 км/ч = 83 м/мин)
  const calculateWalkingTime = (distance: number): number => {
    return Math.ceil(distance / 83); // 83 м/мин = 5 км/ч
  };

  // Функция для поиска рекомендаций (имитация RAG)
  const findRecommendations = (query: UserQuery): Recommendation[] => {
    // Используем реальную геолокацию пользователя
    const currentLocation = userLocation || { lat: 51.1694, lng: 71.4491 };

    // Фильтрация и ранжирование POI
    const filteredPOIs = mockPOIs
      .map(poi => {
        const distance = calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          poi.coordinates.lat,
          poi.coordinates.lng
        );
        const walkingTime = calculateWalkingTime(distance);

        // Расчет релевантности на основе предпочтений
        let score = 0;
        const preferences = query.preferences.toLowerCase();

        // Проверка соответствия тегам
        poi.tags.forEach(tag => {
          if (preferences.includes(tag)) score += 2;
        });

        // Проверка категории
        if (preferences.includes(poi.category)) score += 3;

        // Учет времени доступности
        if (query.timeAvailable.includes('час') && walkingTime > 60) score -= 1;
        if (query.timeAvailable.includes('30') && walkingTime > 30) score -= 1;

        // Учет специальных требований
        if (query.withChildren && poi.tags.includes('дети')) score += 2;
        if (query.withChildren && poi.tags.includes('семьи')) score += 2;

        // Бонус за рейтинг
        if (poi.rating) score += poi.rating * 0.5;

        return {
          poi,
          distance: Math.round(distance),
          walkingTime,
          score,
          why: generateWhyText(poi, query),
          plan: generatePlanText(poi, query),
          estimatedDuration: estimateDuration(poi, query)
        };
      })
      .filter(rec => rec.walkingTime <= 60) // Только в пределах часа пешком
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Топ-3 рекомендации

    return filteredPOIs;
  };

  // Генерация текста "почему"
  const generateWhyText = (poi: any, query: UserQuery): string => {
    const reasons = [];

    if (poi.tags.some((tag: string) => query.preferences.includes(tag))) {
      reasons.push(`соответствует вашим предпочтениям (${poi.tags.join(', ')})`);
    }

    if (poi.rating && poi.rating > 4) {
      reasons.push(`высокий рейтинг ${poi.rating}⭐`);
    }

    if (query.withChildren && poi.tags.includes('дети')) {
      reasons.push('подходит для отдыха с детьми');
    }

    if (reasons.length === 0) {
      reasons.push('интересное место недалеко от вас');
    }

    return reasons.join(', ');
  };

  // Генерация плана действий
  const generatePlanText = (poi: any, query: UserQuery): string => {
    const timeAvailable = query.timeAvailable;
    const actions = [];

    if (poi.category === 'кафе') {
      actions.push('заказать кофе и удобно расположиться');
    } else if (poi.category === 'парк') {
      actions.push('прогуляться по аллеям и отдохнуть на лавочке');
    } else if (poi.category === 'музей') {
      actions.push('осмотреть экспозиции и интерактивные выставки');
    } else if (poi.category === 'развлечения') {
      actions.push('насладиться атмосферой и музыкой');
    } else {
      actions.push('осмотреть и сфотографировать');
    }

    return `${actions[0]}, провести здесь ${timeAvailable}`;
  };

  // Оценка продолжительности
  const estimateDuration = (_poi: any, query: UserQuery): number => {
    if (query.timeAvailable.includes('час')) {
      return 60;
    } else if (query.timeAvailable.includes('30')) {
      return 30;
    }
    return 45; // по умолчанию
  };


  // Navigation functions
  const navigateToPage = (page: PageType, poi?: any) => {
    setCurrentPage(page);
    if (poi) setSelectedPOI(poi);
  };

  const handleSearchSubmit = async (query: UserQuery) => {
    setIsLoading(true);
    setSearchQuery(query);

    // Автоматически определяем геолокацию пользователя
    const location = await getCurrentLocation();
    setUserLocation(location);

    // Имитация поиска
    await new Promise(resolve => setTimeout(resolve, 1000));

    const results = findRecommendations(query);
    setRecommendations(results);
    setCurrentPage('results');
    setIsLoading(false);
  };

  const handlePOISelect = (poi: any) => {
    setSelectedPOI(poi);
    setCurrentPage('poi-detail');
  };

  const handleAddToRoute = (poi: any) => {
    setRoutePOIs(prev => [...prev, poi]);
    // Show toast notification
    showToast('Добавлено в маршрут');
  };

  const handleStartRoute = () => {
    setCurrentPage('route-generator');
  };

  const showToast = (message: string) => {
    // Simple toast implementation
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
      font-weight: 500;
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage
            onSearch={handleSearchSubmit}
            isLoading={isLoading}
            onNavigate={(page: string) => navigateToPage(page as PageType)}
          />
        );
      case 'results':
        return (
          <ResultsPage
            recommendations={recommendations}
            userLocation={userLocation}
            onPOISelect={handlePOISelect}
            onAddToRoute={handleAddToRoute}
            onStartRoute={handleStartRoute}
            searchQuery={searchQuery}
          />
        );
      case 'poi-detail':
        return (
          <POIDetailPage
            poi={selectedPOI}
            onNavigate={(page: string) => navigateToPage(page as PageType)}
            onAddToRoute={handleAddToRoute}
          />
        );
      case 'route-generator':
        return (
          <RouteGenerator
            pois={routePOIs}
            onNavigate={(page: string) => navigateToPage(page as PageType)}
          />
        );
      default:
        return (
          <LandingPage
            onSearch={handleSearchSubmit}
            isLoading={isLoading}
            onNavigate={(page: string) => navigateToPage(page as PageType)}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <StickyHeader onNavigate={(page: string) => navigateToPage(page as PageType)} />
      <main className="main-content">
        {renderPage()}
      </main>
      <FloatingChatButton onClick={() => navigateToPage('landing')} />
    </div>
  );
}

export default App;
