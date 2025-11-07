// Типы данных для POI (Point of Interest)
export interface POI {
  id: string;
  name: string;
  description: string;
  category: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  tags: string[];
  rating?: number;
  workingHours?: string;
  phone?: string;
  website?: string;
  imageUrl?: string;
}

// Типы для запросов пользователя
export interface UserQuery {
  location: string;
  preferences: string;
  timeAvailable: string;
  withChildren?: boolean;
  budget?: string;
  specialRequirements?: string;
  singleResult?: boolean; // Флаг для получения только одного лучшего результата
}

// Типы для рекомендаций
export interface Recommendation {
  poi: POI;
  distance: number; // в метрах
  walkingTime: number; // в минутах
  score: number; // рейтинг релевантности
  why: string; // почему рекомендовано
  plan: string; // план действий
  estimatedDuration: number; // предполагаемая продолжительность в минутах
}

// Типы для сценариев использования
export type ScenarioType =
  | 'casual_walk'
  | 'with_children'
  | 'tourist'
  | 'night_activity'
  | 'quiet_place'
  | 'coffee_work'
  | 'unusual_experience';

// Предустановленные сценарии
export interface Scenario {
  id: ScenarioType;
  title: string;
  description: string;
  exampleQuery: string;
}

// Типы для карты
export interface MapMarker {
  id: string;
  position: [number, number];
  title: string;
  description: string;
  type: 'user' | 'poi' | 'recommendation';
  poi?: POI;
}

export interface UserGeolocation {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}
