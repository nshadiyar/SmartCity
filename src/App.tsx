import { useState } from 'react';
import { UserQuery, Recommendation } from './types';
import { mockPOIs } from './data/mockPOIs';
import LandingPage from './pages/LandingPage';
import ResultsPage from './pages/ResultsPage';
import POIDetailPage from './pages/POIDetailPage';
import RouteGenerator from './pages/RouteGenerator';
import TimeWeatherPage from './pages/TimeWeatherPage';
import StickyHeader from './components/StickyHeader';
import FloatingChatButton from './components/FloatingChatButton';
import RealtimeChat from './components/RealtimeChat';
import EventsPage from './components/EventsPage';
import { GroupType } from './components/GroupFilter';
import './App.css';

// Page types
type PageType = 'landing' | 'results' | 'poi-detail' | 'route-generator' | 'time-weather' | 'events';

// API Response type
interface APIResponsePOI {
  why: string;
  name: string;
  region: string;
  district: string;
  city: string;
  city_district: string;
  address: string;
  phone: string;
  postal_code: string;
  website: string;
  category: string;
  subcategory: string;
  working_hours: string;
  payment_methods: string;
  whatsapp: string;
  telegram: string;
  facebook: string;
  instagram: string;
  latitude: number | null;
  longitude: number | null;
}

// Генерация sessionId
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

function App() {
  const [sessionId] = useState<string>(() => generateSessionId());
  const [currentPage, setCurrentPage] = useState<PageType>('landing');
  const [selectedPOI, setSelectedPOI] = useState<any>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [isRealtimeChatOpen, setIsRealtimeChatOpen] = useState<boolean>(false);
  const [routePOIs, setRoutePOIs] = useState<any[]>([]);
  const [previousPage, setPreviousPage] = useState<PageType>('landing'); // Для отслеживания предыдущей страницы

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState<UserQuery | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupType>('alone');

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
  const findRecommendations = (query: UserQuery, groupType: GroupType = 'alone'): Recommendation[] => {
    // Используем реальную геолокацию пользователя
    const currentLocation = userLocation || { lat: 51.1694, lng: 71.4491 };

    // Определяем приоритетные теги и категории в зависимости от группы
    const groupPreferences: { [key in GroupType]: { tags: string[], categories: string[], keywords: string[] } } = {
      alone: {
        tags: ['тихое', 'спокойное', 'уединенное', 'книги', 'чтение'],
        categories: ['Библиотека', 'Парк', 'Кафе'],
        keywords: ['тихое', 'спокойное', 'уединенное']
      },
      friends: {
        tags: ['кафе', 'ресторан', 'активность', 'развлечения', 'веселье'],
        categories: ['Кафе', 'Ресторан', 'Развлечения'],
        keywords: ['кафе', 'ресторан', 'активность']
      },
      family: {
        tags: ['дети', 'семьи', 'парк', 'музей', 'площадка', 'безопасное'],
        categories: ['Парк', 'Музей', 'Развлечения'],
        keywords: ['дети', 'семьи', 'парк', 'музей']
      },
      work: {
        tags: ['коворкинг', 'кафе', 'wifi', 'розетки', 'тихое', 'работа'],
        categories: ['Кафе', 'Коворкинг', 'Библиотека'],
        keywords: ['коворкинг', 'wifi', 'работа', 'тихое']
      }
    };

    const groupPrefs = groupPreferences[groupType];

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
          // Бонус за соответствие групповым предпочтениям
          if (groupPrefs.tags.some(pref => tag.includes(pref))) score += 3;
        });

        // Проверка категории
        if (preferences.includes(poi.category)) score += 3;
        // Бонус за соответствие групповым категориям
        if (groupPrefs.categories.includes(poi.category)) score += 4;

        // Учет времени доступности
        if (query.timeAvailable.includes('час') && walkingTime > 60) score -= 1;
        if (query.timeAvailable.includes('30') && walkingTime > 30) score -= 1;

        // Учет специальных требований
        if (query.withChildren && poi.tags.includes('дети')) score += 2;
        if (query.withChildren && poi.tags.includes('семьи')) score += 2;

        // Специальные бонусы для групп
        if (groupType === 'family' && (poi.tags.includes('дети') || poi.tags.includes('семьи'))) {
          score += 5;
        }
        if (groupType === 'work' && (poi.tags.includes('wifi') || poi.tags.includes('розетки') || poi.tags.includes('коворкинг'))) {
          score += 5;
        }
        if (groupType === 'alone' && (poi.tags.includes('тихое') || poi.tags.includes('спокойное'))) {
          score += 5;
        }
        if (groupType === 'friends' && (poi.tags.includes('кафе') || poi.tags.includes('ресторан') || poi.tags.includes('активность'))) {
          score += 5;
        }

        // Бонус за рейтинг
        if (poi.rating) score += poi.rating * 0.5;

        return {
          poi,
          distance: Math.round(distance),
          walkingTime,
          score,
          why: generateWhyText(poi, query, groupType),
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
  const generateWhyText = (poi: any, query: UserQuery, groupType: GroupType = 'alone'): string => {
    const reasons = [];

    // Групповые причины
    if (groupType === 'family' && (poi.tags.includes('дети') || poi.tags.includes('семьи'))) {
      reasons.push('отлично подходит для семейного отдыха');
    }
    if (groupType === 'friends' && (poi.tags.includes('кафе') || poi.tags.includes('ресторан'))) {
      reasons.push('идеальное место для встречи с друзьями');
    }
    if (groupType === 'work' && (poi.tags.includes('wifi') || poi.tags.includes('розетки'))) {
      reasons.push('удобное место для работы');
    }
    if (groupType === 'alone' && (poi.tags.includes('тихое') || poi.tags.includes('спокойное'))) {
      reasons.push('тихое и уединенное место');
    }

    if (poi.tags.some((tag: string) => query.preferences.includes(tag))) {
      reasons.push(`соответствует вашим предпочтениям`);
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


  // Функция для запроса к n8n API
  const fetchRecommendationsFromAPI = async (chatInput: string): Promise<APIResponsePOI[]> => {
    const requestBody = {
      chatInput: chatInput,
      sessionId: sessionId
    };

    // Используем прокси через Vite dev server для обхода CORS
    const apiUrl = import.meta.env.DEV 
      ? '/api/n8n'  // Прокси через Vite dev server
      : 'https://nshadiyar.app.n8n.cloud/webhook/chat';  // Прямой запрос в продакшене

    console.log('🚀 [API REQUEST] ========== ОТПРАВКА POST ЗАПРОСА К N8N API ==========');
    console.log('📍 [API REQUEST] URL:', apiUrl);
    console.log('📍 [API REQUEST] Финальный URL (через прокси):', import.meta.env.DEV ? 'http://localhost:5174/api/n8n → https://nshadiyar.app.n8n.cloud/webhook/chat' : 'https://nshadiyar.app.n8n.cloud/webhook/chat');
    console.log('🌐 [API REQUEST] Режим:', import.meta.env.DEV ? 'Development (через прокси)' : 'Production (прямой запрос)');
    console.log('📤 [API REQUEST] Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('🆔 [API REQUEST] Session ID:', sessionId);
    console.log('💬 [API REQUEST] Chat Input:', chatInput);
    console.log('📋 [API REQUEST] Метод:', 'POST');
    console.log('📋 [API REQUEST] Headers:', JSON.stringify({
      'Content-Type': 'application/json'
    }, null, 2));

    try {
      const startTime = Date.now();
      
      console.log('⏳ [API REQUEST] Отправка запроса...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log('⏱️ [API RESPONSE] Время ответа:', `${duration}ms`);
      console.log('📊 [API RESPONSE] HTTP Status:', response.status, response.statusText);
      const headersObj = Object.fromEntries(response.headers.entries());
      console.log('📋 [API RESPONSE] Headers:', JSON.stringify(headersObj, null, 2));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [API ERROR] HTTP error!');
        console.error('❌ [API ERROR] Status:', response.status);
        console.error('❌ [API ERROR] Status Text:', response.statusText);
        console.error('❌ [API ERROR] Response Body:', errorText);
        console.error('❌ [API ERROR] Request URL:', apiUrl);
        console.error('❌ [API ERROR] Request Body:', JSON.stringify(requestBody, null, 2));
        
        // Не выбрасываем ошибку для 500, просто возвращаем пустой массив
        if (response.status === 500) {
          console.warn('⚠️ [API ERROR] Сервер вернул 500 ошибку. Используем fallback на локальные данные.');
          return [];
        }
        
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      // Проверяем Content-Type
      const contentType = response.headers.get('content-type');
      console.log('📄 [API RESPONSE] Content-Type:', contentType);

      // Читаем тело ответа как текст, чтобы безопасно обработать пустой ответ
      const rawText = await response.text();
      console.log('📝 [API RESPONSE] Сырой текст ответа:', rawText);

      if (!rawText || rawText.trim().length === 0) {
        console.warn('⚠️ [API RESPONSE] Пустой ответ от API');
        return [];
      }

      let data: any;
      try {
        data = JSON.parse(rawText);
        console.log('✅ [API RESPONSE] JSON данные получены');
      } catch (parseError) {
        console.error('❌ [API ERROR] Не удалось распарсить ответ как JSON:', parseError);
        console.log('📝 [API RESPONSE] Сырой текст:', rawText);
        return [];
      }

      console.log('📦 [API RESPONSE] Тип данных:', typeof data);
      console.log('📦 [API RESPONSE] Является массивом:', Array.isArray(data));
      if (Array.isArray(data)) {
        console.log('📦 [API RESPONSE] Количество элементов:', data.length);
      }

      // Проверяем структуру данных - API возвращает массив POI напрямую
      if (Array.isArray(data)) {
        console.log('✅ [API RESPONSE] ✅✅✅ ДАННЫЕ - МАССИВ POI ✅✅✅');
        console.log('📊 [API RESPONSE] Количество POI:', data.length);
        if (data.length > 0) {
          console.log('📋 [API RESPONSE] ✅✅✅ ПОЛУЧЕНЫ ДАННЫЕ ИЗ API ✅✅✅');
          console.log('📋 [API RESPONSE] Полные данные всех POI:');
          data.forEach((poi, index) => {
            console.log(`📍 [API RESPONSE] POI ${index + 1}:`, JSON.stringify(poi, null, 2));
          });
          console.log('📋 [API RESPONSE] Первый элемент (детально):', JSON.stringify({
            name: data[0].name,
            latitude: data[0].latitude,
            longitude: data[0].longitude,
            address: data[0].address,
            category: data[0].category,
            why: data[0].why,
            phone: data[0].phone,
            working_hours: data[0].working_hours
          }, null, 2));
          console.log('✅ [API RESPONSE] ✅✅✅ ВОЗВРАЩАЕМ ДАННЫЕ ИЗ API ✅✅✅');
        } else {
          console.warn('⚠️ [API RESPONSE] Массив пустой!');
        }
        return data as APIResponsePOI[];
      } else if (data && typeof data === 'object') {
        console.log('⚠️ [API RESPONSE] Данные - объект, не массив');
        console.log('📋 [API RESPONSE] Ключи объекта:', Object.keys(data));
        
        // Проверяем, может быть данные в каком-то поле
        if (data.results && Array.isArray(data.results)) {
          console.log('✅ [API RESPONSE] Найден массив в поле "results"');
          return data.results as APIResponsePOI[];
        }
        if (data.data && Array.isArray(data.data)) {
          console.log('✅ [API RESPONSE] Найден массив в поле "data"');
          return data.data as APIResponsePOI[];
        }
        if (data.pois && Array.isArray(data.pois)) {
          console.log('✅ [API RESPONSE] Найден массив в поле "pois"');
          return data.pois as APIResponsePOI[];
        }
        
        // Если объект содержит сообщение об ошибке или статусе
        if (data.message) {
          console.log('⚠️ [API RESPONSE] Сообщение от API:', data.message);
        }
        
        console.log('⚠️ [API RESPONSE] Объект не содержит массив, возвращаем пустой массив');
        return [];
      } else {
        console.log('⚠️ [API RESPONSE] Неожиданный тип данных:', typeof data);
        return [];
      }
    } catch (error) {
      console.error('❌ [API ERROR] Ошибка при запросе к API:', error);
      if (error instanceof Error) {
        console.error('❌ [API ERROR] Сообщение об ошибке:', error.message);
        console.error('❌ [API ERROR] Stack trace:', error.stack);
      }
      // В случае ошибки возвращаем пустой массив
      return [];
    }
  };

  // Преобразование API ответа в формат Recommendation
  const convertAPIToRecommendation = (apiPOI: APIResponsePOI, userLoc: { lat: number; lng: number }): Recommendation => {
    console.log('🔄 [CONVERT] Преобразование API POI в Recommendation');
    console.log('📋 [CONVERT] Входные данные API POI:', JSON.stringify(apiPOI, null, 2));
    
    // Используем координаты из API или центр Астаны
    // Важно: проверяем, что координаты действительно числа
    let poiLat = 51.1694;
    let poiLng = 71.4491;
    
    if (apiPOI.latitude !== null && apiPOI.latitude !== undefined && !isNaN(Number(apiPOI.latitude))) {
      poiLat = Number(apiPOI.latitude);
    }
    if (apiPOI.longitude !== null && apiPOI.longitude !== undefined && !isNaN(Number(apiPOI.longitude))) {
      poiLng = Number(apiPOI.longitude);
    }
    
    console.log('📍 [CONVERT] Координаты POI (raw):', { lat: apiPOI.latitude, lng: apiPOI.longitude });
    console.log('📍 [CONVERT] Координаты POI (processed):', { lat: poiLat, lng: poiLng });
    console.log('📍 [CONVERT] Координаты пользователя:', userLoc);

    const distance = calculateDistance(userLoc.lat, userLoc.lng, poiLat, poiLng);
    const walkingTime = calculateWalkingTime(distance);
    
    console.log('📏 [CONVERT] Расстояние:', distance, 'м');
    console.log('⏱️ [CONVERT] Время ходьбы:', walkingTime, 'мин');

    // Преобразуем API данные в формат POI
    const poi = {
      id: `api_${apiPOI.name}_${Date.now()}`,
      name: apiPOI.name,
      category: apiPOI.category || apiPOI.subcategory || 'Место',
      description: apiPOI.why || `Интересное место в ${apiPOI.city || 'Астане'}`,
      address: apiPOI.address || '',
      coordinates: { 
        lat: Number(poiLat), 
        lng: Number(poiLng) 
      },
      rating: undefined,
      workingHours: apiPOI.working_hours || '',
      phone: apiPOI.phone || '',
      website: apiPOI.website || '',
      paymentMethods: apiPOI.payment_methods || '',
      whatsapp: apiPOI.whatsapp || '',
      telegram: apiPOI.telegram || '',
      facebook: apiPOI.facebook || '',
      instagram: apiPOI.instagram || '',
      region: apiPOI.region || '',
      district: apiPOI.district || '',
      city: apiPOI.city || '',
      cityDistrict: apiPOI.city_district || '',
      postalCode: apiPOI.postal_code || '',
      subcategory: apiPOI.subcategory || '',
      tags: [
        apiPOI.category?.toLowerCase() || '',
        apiPOI.subcategory?.toLowerCase() || '',
        ...(apiPOI.why?.toLowerCase().includes('тих') ? ['тихое'] : []),
        ...(apiPOI.why?.toLowerCase().includes('дет') ? ['дети'] : []),
        ...(apiPOI.why?.toLowerCase().includes('кафе') ? ['кафе'] : [])
      ].filter(Boolean)
    };

    const recommendation = {
      poi,
      distance: Math.round(distance),
      walkingTime,
      score: 100, // Высокий приоритет для API результатов
      why: apiPOI.why || 'Рекомендовано AI',
      plan: generatePlanText(poi, searchQuery || {
        location: 'Current location',
        preferences: '',
        timeAvailable: '1 hour',
        withChildren: false,
        specialRequirements: ''
      }),
      estimatedDuration: 45
    };

    console.log('📦 [CONVERT] Преобразованный POI:', {
      id: poi.id,
      name: poi.name,
      category: poi.category,
      address: poi.address,
      tags: poi.tags
    });

    console.log('✅ [CONVERT] Финальный Recommendation:', {
      name: recommendation.poi.name,
      distance: recommendation.distance,
      walkingTime: recommendation.walkingTime,
      why: recommendation.why,
      plan: recommendation.plan
    });

    return recommendation;
  };

  // Navigation functions
  const navigateToPage = (page: PageType, poi?: any) => {
    setCurrentPage(page);
    if (poi) setSelectedPOI(poi);
  };

  const handleSearchSubmit = async (query: UserQuery) => {
    console.log('🔍 [SEARCH] Начало поиска рекомендаций');
    console.log('📝 [SEARCH] Query:', JSON.stringify(query, null, 2));
    
    setIsLoading(true);
    setSearchQuery(query);

    // Автоматически определяем геолокацию пользователя
    console.log('📍 [SEARCH] Определение геолокации пользователя...');
    const location = await getCurrentLocation();
    setUserLocation(location);
    console.log('✅ [SEARCH] Геолокация определена:', JSON.stringify(location, null, 2));

    // Form API request
    const groupLabels: { [key in GroupType]: string } = {
      alone: 'alone',
      friends: 'with friends',
      family: 'with family',
      work: 'working'
    };

    const chatInput = `${query.preferences || 'Explore nearby'}. ${groupLabels[selectedGroup]}. ${query.location || 'Current location'}`;

    console.log('🔍 [SEARCH] Chat Input:', chatInput);
    console.log('👥 [SEARCH] Выбранная группа:', selectedGroup);
    console.log('📍 [SEARCH] Локация пользователя:', JSON.stringify(location, null, 2));

    // Запрос к n8n API
    console.log('🌐 [SEARCH] Отправка запроса к n8n API...');
    const apiResults = await fetchRecommendationsFromAPI(chatInput);

    console.log('📊 [SEARCH] Результаты от API:');
    console.log('  - Количество:', apiResults.length);
    console.log('  - Пусто:', apiResults.length === 0);
    if (apiResults.length > 0) {
      console.log('  - Первый элемент:', JSON.stringify(apiResults[0], null, 2));
    }

    let results: Recommendation[] = [];

    if (apiResults.length > 0) {
      console.log('✅ [SEARCH] ✅✅✅ ИСПОЛЬЗУЕМ ДАННЫЕ ИЗ API ✅✅✅');
      console.log('✅ [SEARCH] Количество POI из API:', apiResults.length);
      // Используем результаты из API
      results = apiResults.map((apiPOI, index) => {
        console.log(`🔄 [SEARCH] Преобразование POI ${index + 1} из API:`, apiPOI.name || 'Без имени');
        console.log(`📋 [SEARCH] Данные POI ${index + 1}:`, JSON.stringify(apiPOI, null, 2));
        const recommendation = convertAPIToRecommendation(apiPOI, location);
        console.log(`✅ [SEARCH] Преобразовано в Recommendation:`, JSON.stringify({
          name: recommendation.poi.name,
          distance: recommendation.distance,
          walkingTime: recommendation.walkingTime,
          why: recommendation.why,
          address: recommendation.poi.address,
          coordinates: recommendation.poi.coordinates
        }, null, 2));
        return recommendation;
      });
      console.log('✅ [SEARCH] ✅✅✅ ВСЕГО ПРЕОБРАЗОВАНО ИЗ API:', results.length, '✅✅✅');
    } else {
      console.log('⚠️ [SEARCH] ⚠️⚠️⚠️ API НЕ ВЕРНУЛ РЕЗУЛЬТАТОВ, ИСПОЛЬЗУЕМ ЛОКАЛЬНЫЕ ДАННЫЕ ⚠️⚠️⚠️');
      // Fallback на локальные рекомендации, если API не вернул результатов
      results = findRecommendations(query, selectedGroup);
      console.log('📊 [SEARCH] Локальные рекомендации (FALLBACK):', results.length);
    }

    console.log('🎯 [SEARCH] Финальные результаты:');
    console.log('  - Всего результатов:', results.length);
    console.log('  - Список результатов:', JSON.stringify(results.map(r => ({ 
      name: r.poi.name, 
      distance: r.distance, 
      why: r.why,
      address: r.poi.address,
      coordinates: r.poi.coordinates,
      category: r.poi.category,
      phone: r.poi.phone,
      workingHours: r.poi.workingHours
    })), null, 2));

    console.log('📊 [SEARCH] Детальная информация о результатах:');
    results.forEach((result, index) => {
      console.log(`📌 [SEARCH] Результат ${index + 1}:`, JSON.stringify({
        id: result.poi.id,
        name: result.poi.name,
        category: result.poi.category,
        address: result.poi.address,
        coordinates: result.poi.coordinates,
        distance: result.distance,
        walkingTime: result.walkingTime,
        why: result.why,
        phone: result.poi.phone,
        website: result.poi.website,
        workingHours: result.poi.workingHours
      }, null, 2));
    });

    // If single result is required (for TimeWeatherPage)
    if (query.singleResult) {
      if (results.length > 0) {
        console.log('🎯 [SEARCH] singleResult mode: selecting best place');
        const bestResult = results[0]; // Take the first (best) place
        console.log('🏆 [SEARCH] Selected place:', bestResult.poi.name);
        console.log('💡 [SEARCH] Reason for selection:', bestResult.why);
        console.log('📋 [SEARCH] Action plan:', bestResult.plan);
        
        setRecommendations([bestResult]);
        setSelectedPOI(bestResult.poi); // Set as selected POI for automatic route building
        setSelectedRecommendation(bestResult); // Save recommendation to display why and plan
        setPreviousPage('time-weather'); // Save that we came from time-weather
        setCurrentPage('poi-detail'); // Navigate to detail page with automatic route
        setIsLoading(false);
        
        console.log('✅ [SEARCH] Navigating to detail page with automatic route building');
      } else {
        console.warn('⚠️ [SEARCH] singleResult mode: no results found');
        // If no results, show message and return to time-weather
        setRecommendations([]);
        setCurrentPage('time-weather');
        setIsLoading(false);
        alert('Unfortunately, we couldn\'t find a suitable place. Please try changing your search parameters.');
      }
    } else {
      setRecommendations(results);
      setPreviousPage('results'); // Save that we came from results
      setCurrentPage('results');
      setIsLoading(false);
      
      console.log('✅ [SEARCH] Поиск завершен, переход на страницу результатов');
    }
  };

  const handlePOISelect = (poi: any, recommendation?: Recommendation) => {
    setSelectedPOI(poi);
    setSelectedRecommendation(recommendation || null);
    setPreviousPage('results'); // Save that we came from results
    setCurrentPage('poi-detail');
  };

  const handleAddToRoute = (poi: any) => {
    console.log('➕ [APP] Adding POI to route:', {
      id: poi?.id,
      name: poi?.name,
      coordinates: poi?.coordinates,
      hasCoordinates: poi?.coordinates && 
        typeof poi.coordinates.lat === 'number' && 
        typeof poi.coordinates.lng === 'number' &&
        !isNaN(poi.coordinates.lat) && 
        !isNaN(poi.coordinates.lng)
    });
    
    // Проверяем, что POI имеет координаты
    if (!poi || !poi.coordinates || 
        typeof poi.coordinates.lat !== 'number' || 
        typeof poi.coordinates.lng !== 'number' ||
        isNaN(poi.coordinates.lat) || 
        isNaN(poi.coordinates.lng)) {
      console.error('❌ [APP] POI не имеет валидных координат:', poi);
      showToast('Error: POI missing valid coordinates');
      return;
    }
    
    setRoutePOIs(prev => {
      // Limit route to 3 places
      if (prev.length >= 3) {
        showToast('Route can contain maximum 3 places');
        return prev;
      }
      // Check if this place is already added
      if (prev.some(p => p.id === poi.id)) {
        showToast('This place is already added to the route');
        return prev;
      }
      // Убеждаемся, что мы добавляем полный объект POI с координатами
      // Нормализуем координаты в числа, если они строки
      const latValue = poi.coordinates.lat;
      const lngValue = poi.coordinates.lng;
      const latNum = Number(latValue);
      const lngNum = Number(lngValue);
      
      // Проверяем еще раз после преобразования
      if (isNaN(latNum) || isNaN(lngNum)) {
        console.error('❌ [APP] Координаты не могут быть преобразованы в числа:', { latValue, lngValue });
        showToast('Error: Invalid coordinates format');
        return prev; // Возвращаем предыдущее состояние
      }
      
      const poiToAdd = {
        ...poi,
        coordinates: {
          lat: latNum,
          lng: lngNum
        }
      };
      const newRoute = [...prev, poiToAdd];
      console.log('✅ [APP] POI added to route. Total:', newRoute.length);
      console.log('✅ [APP] Route POIs:', newRoute.map(p => ({
        name: p.name,
        coordinates: p.coordinates
      })));
      showToast(`Added to route (${newRoute.length}/3)`);
      return newRoute;
    });
  };

  const handleStartRoute = () => {
    console.log('🚶 [APP] Start Route clicked, routePOIs:', routePOIs.length);
    if (routePOIs.length === 0) {
      console.warn('🚶 [APP] No places in route');
      showToast('Add places to your route');
      return;
    }
    console.log('🚶 [APP] Navigating to route-generator page');
    console.log('🚶 [APP] Route POIs:', routePOIs.map(poi => ({
      name: poi.name,
      coordinates: poi.coordinates
    })));
    setCurrentPage('route-generator');
  };

  const handleClearRoute = () => {
    setRoutePOIs([]);
    showToast('Route cleared');
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
            selectedGroup={selectedGroup}
            onGroupChange={setSelectedGroup}
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
            selectedGroup={selectedGroup}
            onGroupChange={setSelectedGroup}
            routePOIs={routePOIs}
            onClearRoute={handleClearRoute}
            onRefetch={async () => {
              console.log('🔄 [REFETCH] Пересчет рекомендаций');
              if (searchQuery && userLocation) {
                console.log('✅ [REFETCH] Есть searchQuery и userLocation');
                setIsLoading(true);
                
                const groupLabels: { [key in GroupType]: string } = {
                  alone: 'один',
                  friends: 'с друзьями',
                  family: 'с семьёй',
                  work: 'работаю'
                };

                const chatInput = `${searchQuery.preferences || 'Explore nearby'}. ${groupLabels[selectedGroup]}. ${searchQuery.location || 'Current location'}`;

                console.log('🔄 [REFETCH] Chat Input:', chatInput);
                console.log('🔄 [REFETCH] Выбранная группа:', selectedGroup);

                const apiResults = await fetchRecommendationsFromAPI(chatInput);

                console.log('🔄 [REFETCH] Результаты от API:', apiResults.length);

                if (apiResults.length > 0) {
                  console.log('✅ [REFETCH] ✅✅✅ ИСПОЛЬЗУЕМ ДАННЫЕ ИЗ API ✅✅✅');
                  const results = apiResults.map(apiPOI => convertAPIToRecommendation(apiPOI, userLocation));
                  setRecommendations(results);
                  console.log('✅ [REFETCH] ✅✅✅ ОБНОВЛЕНО РЕКОМЕНДАЦИЙ ИЗ API:', results.length, '✅✅✅');
                } else {
                  console.log('⚠️ [REFETCH] ⚠️⚠️⚠️ API НЕ ВЕРНУЛ РЕЗУЛЬТАТОВ, ИСПОЛЬЗУЕМ ЛОКАЛЬНЫЕ ДАННЫЕ ⚠️⚠️⚠️');
                  const results = findRecommendations(searchQuery, selectedGroup);
                  setRecommendations(results);
                  console.log('✅ [REFETCH] Обновлено локальных рекомендаций (FALLBACK):', results.length);
                }
                
                setIsLoading(false);
                console.log('✅ [REFETCH] Пересчет завершен');
              } else {
                console.log('⚠️ [REFETCH] Нет searchQuery или userLocation');
              }
            }}
          />
        );
      case 'poi-detail':
        return (
          <POIDetailPage
            poi={selectedPOI}
            recommendation={selectedRecommendation}
            onNavigate={(page: string) => navigateToPage(page as PageType)}
            onAddToRoute={handleAddToRoute}
            userLocation={userLocation}
            previousPage={previousPage}
          />
        );
      case 'route-generator':
        return (
          <RouteGenerator
            pois={routePOIs}
            onNavigate={(page: string) => navigateToPage(page as PageType)}
            userLocation={userLocation}
          />
        );
      case 'time-weather':
        return (
          <TimeWeatherPage
            onSearch={handleSearchSubmit}
            isLoading={isLoading}
            userLocation={userLocation}
            selectedGroup={selectedGroup}
            onGroupChange={setSelectedGroup}
          />
        );
      case 'events':
        return (
          <EventsPage
            onPOISelect={(poi) => handlePOISelect(poi)}
            onAddToRoute={handleAddToRoute}
          />
        );
      default:
        return (
          <LandingPage
            onSearch={handleSearchSubmit}
            isLoading={isLoading}
            onNavigate={(page: string) => navigateToPage(page as PageType)}
            selectedGroup={selectedGroup}
            onGroupChange={setSelectedGroup}
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
      <FloatingChatButton onClick={() => setIsRealtimeChatOpen(true)} />
      {isRealtimeChatOpen && (
        <RealtimeChat onClose={() => setIsRealtimeChatOpen(false)} />
      )}
    </div>
  );
}

export default App;
