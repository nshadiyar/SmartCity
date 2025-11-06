import { POI, Scenario } from '../types';

// Моковые данные POI для Астаны
export const mockPOIs: POI[] = [
  {
    id: 'expo-2017',
    name: 'Выставочный центр EXPO 2017',
    description: 'Бывший выставочный центр ЭКСПО-2017 с уникальной архитектурой и зелеными зонами. Идеальное место для прогулок и фотосессий.',
    category: 'достопримечательность',
    coordinates: { lat: 51.0896, lng: 71.4134 },
    address: 'пр. Кабанбай батыра, 42',
    tags: ['архитектура', 'фото', 'прогулки', 'туризм'],
    rating: 4.5,
    workingHours: '24/7',
    phone: '+7 (7172) 55-55-55',
    website: 'https://expo2017astana.com',
    imageUrl: 'https://example.com/expo.jpg'
  },
  {
    id: 'nur-astana-mosque',
    name: 'Мечеть Нур-Астана',
    description: 'Одна из крупнейших мечетей в Центральной Азии. Архитектурный шедевр с золотыми куполами и просторным двором.',
    category: 'религия',
    coordinates: { lat: 51.1275, lng: 71.4274 },
    address: 'пр. Победы, 1',
    tags: ['мечеть', 'архитектура', 'культура', 'туризм'],
    rating: 4.7,
    workingHours: '5:00-23:00',
    phone: '+7 (7172) 77-77-77',
    imageUrl: 'https://example.com/mosque.jpg'
  },
  {
    id: 'central-park',
    name: 'Центральный парк культуры и отдыха',
    description: 'Огромный парк с озером, аттракционами и детскими площадками. Отличное место для семейного отдыха.',
    category: 'парк',
    coordinates: { lat: 51.1667, lng: 71.4167 },
    address: 'ул. Акмешит, 1',
    tags: ['парк', 'семьи', 'дети', 'отдых', 'прогулки'],
    rating: 4.3,
    workingHours: '6:00-23:00',
    phone: '+7 (7172) 33-33-33',
    imageUrl: 'https://example.com/park.jpg'
  },
  {
    id: 'coffee-booth',
    name: 'Кофейная будка в парке',
    description: 'Уютная кофейная будка с видом на озеро. Идеальное место для работы с ноутбуком или чтения.',
    category: 'кафе',
    coordinates: { lat: 51.1670, lng: 71.4170 },
    address: 'Центральный парк, у озера',
    tags: ['кофе', 'работа', 'wifi', 'уют', 'природа'],
    rating: 4.1,
    workingHours: '8:00-20:00',
    phone: '+7 (7172) 22-22-22',
    imageUrl: 'https://example.com/coffee.jpg'
  },
  {
    id: 'silk-way-mall',
    name: 'ТРЦ Silk Way City',
    description: 'Современный торгово-развлекательный центр с кинотеатром, ресторанами и магазинами.',
    category: 'торговый центр',
    coordinates: { lat: 51.0890, lng: 71.4090 },
    address: 'пр. Кабанбай батыра, 62',
    tags: ['шопинг', 'кино', 'еда', 'развлечения'],
    rating: 4.4,
    workingHours: '10:00-22:00',
    phone: '+7 (7172) 44-44-44',
    website: 'https://silkwaycity.kz',
    imageUrl: 'https://example.com/mall.jpg'
  },
  {
    id: 'art-cafe',
    name: 'Художественное кафе "Артемида"',
    description: 'Креативное кафе с выставками местных художников. Тихое место с розетками и Wi-Fi.',
    category: 'кафе',
    coordinates: { lat: 51.1280, lng: 71.4250 },
    address: 'ул. Сейфуллина, 15',
    tags: ['искусство', 'кофе', 'работа', 'wifi', 'розетки', 'тихое'],
    rating: 4.6,
    workingHours: '9:00-21:00',
    phone: '+7 (7172) 11-11-11',
    imageUrl: 'https://example.com/artcafe.jpg'
  },
  {
    id: 'night-club',
    name: 'Ночной клуб "Астана"',
    description: 'Популярный ночной клуб с современной музыкой и коктейлями. Лучшее место для ночных развлечений.',
    category: 'развлечения',
    coordinates: { lat: 51.1300, lng: 71.4200 },
    address: 'ул. Достык, 8',
    tags: ['ночь', 'музыка', 'танцы', 'коктейли', 'вечеринка'],
    rating: 4.2,
    workingHours: '22:00-06:00',
    phone: '+7 (7172) 66-66-66',
    imageUrl: 'https://example.com/club.jpg'
  },
  {
    id: 'museum-future',
    name: 'Музей будущего искусства',
    description: 'Интерактивный музей с современными экспозициями. Интересные инсталляции и вечерние выставки.',
    category: 'музей',
    coordinates: { lat: 51.0920, lng: 71.4150 },
    address: 'пр. Кабанбай батыра, 45',
    tags: ['музей', 'искусство', 'интерактив', 'выставки', 'образование'],
    rating: 4.8,
    workingHours: '10:00-20:00',
    phone: '+7 (7172) 88-88-88',
    website: 'https://futuremuseum.kz',
    imageUrl: 'https://example.com/museum.jpg'
  },
  {
    id: 'rooftop-bar',
    name: 'Крыша отеля Hilton',
    description: 'Скрытая терраса на крыше отеля с панорамным видом на город. Идеально для фотосессий.',
    category: 'бар',
    coordinates: { lat: 51.1285, lng: 71.4265 },
    address: 'ул. Сейфуллина, 38',
    tags: ['крыша', 'вид', 'фото', 'коктейли', 'романтика'],
    rating: 4.5,
    workingHours: '18:00-02:00',
    phone: '+7 (7172) 99-99-99',
    imageUrl: 'https://example.com/rooftop.jpg'
  },
  {
    id: 'playground-park',
    name: 'Детская площадка в парке',
    description: 'Безопасная детская площадка с горками, качелями и песочницей. Рядом есть кафе для родителей.',
    category: 'детская площадка',
    coordinates: { lat: 51.1675, lng: 71.4175 },
    address: 'Центральный парк, сектор B',
    tags: ['дети', 'семьи', 'игры', 'безопасность', 'отдых'],
    rating: 4.0,
    workingHours: '6:00-22:00',
    imageUrl: 'https://example.com/playground.jpg'
  }
];

// Предустановленные сценарии использования
export const scenarios: Scenario[] = [
  {
    id: 'casual_walk',
    title: 'Прогулка рядом',
    description: 'Ищу интересные места недалеко от меня для приятной прогулки',
    exampleQuery: 'Я у здания EXPO 2017, хочу прогуляться 30-60 минут — что посоветуете?'
  },
  {
    id: 'with_children',
    title: 'С ребенком',
    description: 'Нужны места подходящие для семейного отдыха с детьми',
    exampleQuery: 'Еду с ребенком — где рядом есть детские площадки или музеи с интерактивами?'
  },
  {
    id: 'tourist',
    title: 'Турист',
    description: 'Ищу достопримечательности и интересные места для знакомства с городом',
    exampleQuery: 'Я турист, у меня 2 часа перед вылетом: что можно посмотреть поблизости?'
  },
  {
    id: 'night_activity',
    title: 'Ночное приключение',
    description: 'Ищу необычные активные занятия на вечер/ночь',
    exampleQuery: 'Ищу необычную ночную активность (последние пару часов).'
  },
  {
    id: 'quiet_place',
    title: 'Тихое место',
    description: 'Нужно спокойное место для работы или отдыха',
    exampleQuery: 'Хочу тихое место с кофе и розеткой недалеко от меня.'
  },
  {
    id: 'coffee_work',
    title: 'Работа с кофе',
    description: 'Ищу кафе с хорошим Wi-Fi и розетками для работы',
    exampleQuery: 'Нужно место с кофе и интернетом для работы на пару часов.'
  },
  {
    id: 'unusual_experience',
    title: 'Необычное',
    description: 'Хочу что-то уникальное и запоминающееся',
    exampleQuery: 'Хочу что-то необычное на 1-2 часа, пешком.'
  }
];
