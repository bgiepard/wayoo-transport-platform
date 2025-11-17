// Fake data for MVP demo
import { User, Carrier, Vehicle, TransportRequest, Offer } from './types';

// Users
export const users: User[] = [
  {
    id: '1',
    email: 'jan.kowalski@example.com',
    firstName: 'Jan',
    lastName: 'Kowalski',
    phone: '+48 123 456 789',
    role: 'passenger',
  },
  {
    id: '2',
    email: 'anna.nowak@example.com',
    firstName: 'Anna',
    lastName: 'Nowak',
    phone: '+48 987 654 321',
    role: 'passenger',
  },
  {
    id: '3',
    email: 'transport@fast.pl',
    firstName: 'Michał',
    lastName: 'Wiśniewski',
    phone: '+48 555 123 456',
    role: 'carrier',
  },
  {
    id: '4',
    email: 'kontakt@busline.pl',
    firstName: 'Piotr',
    lastName: 'Zieliński',
    phone: '+48 555 789 012',
    role: 'carrier',
  },
];

// Carriers
export const carriers: Carrier[] = [
  {
    id: 'c1',
    userId: '3',
    companyName: 'Fast Transport',
    rating: 4.8,
    reviewCount: 142,
    description: 'Profesjonalny transport grupowy od 2010 roku. Nowoczesna flota, doświadczeni kierowcy.',
    logo: '🚐',
  },
  {
    id: 'c2',
    userId: '4',
    companyName: 'BusLine Premium',
    rating: 4.9,
    reviewCount: 203,
    description: 'Komfortowe busy i autobusy. Specjalizujemy się w wyjazdach firmowych i wycieczkach.',
    logo: '🚌',
  },
  {
    id: 'c3',
    userId: '5',
    companyName: 'EcoTransport',
    rating: 4.6,
    reviewCount: 87,
    description: 'Ekologiczny transport - elektryczne i hybrydowe pojazdy.',
    logo: '🌱',
  },
];

// Vehicles
export const vehicles: Vehicle[] = [
  {
    id: 'v1',
    carrierId: 'c1',
    type: 'minibus',
    brand: 'Mercedes',
    model: 'Sprinter',
    capacity: 19,
    features: ['Klimatyzacja', 'WiFi', 'USB', 'Bagażnik'],
    images: [],
  },
  {
    id: 'v2',
    carrierId: 'c1',
    type: 'van',
    brand: 'Volkswagen',
    model: 'Crafter',
    capacity: 9,
    features: ['Klimatyzacja', 'Skórzane fotele'],
    images: [],
  },
  {
    id: 'v3',
    carrierId: 'c2',
    type: 'bus',
    brand: 'MAN',
    model: 'Lion Coach',
    capacity: 50,
    features: ['Klimatyzacja', 'WiFi', 'Toaleta', 'TV', 'Gniazdka 230V'],
    images: [],
  },
  {
    id: 'v4',
    carrierId: 'c2',
    type: 'minibus',
    brand: 'Ford',
    model: 'Transit',
    capacity: 16,
    features: ['Klimatyzacja', 'WiFi', 'Bagażnik'],
    images: [],
  },
];

// Transport Requests
export const transportRequests: TransportRequest[] = [
  {
    id: 'r1',
    userId: '1',
    status: 'active',
    from: {
      address: 'Rynek Główny 1',
      city: 'Kraków',
      coordinates: { lat: 50.0614, lng: 19.9366 },
    },
    to: {
      address: 'Stare Miasto',
      city: 'Warszawa',
      coordinates: { lat: 52.2297, lng: 21.0122 },
    },
    departureDate: new Date('2025-12-15T08:00:00'),
    returnDate: new Date('2025-12-15T18:00:00'),
    isRoundTrip: true,
    passengerCount: 25,
    luggageInfo: 'Bagaż podręczny + 1 walizka na osobę',
    specialRequirements: 'Preferowana klimatyzacja',
    budget: {
      max: 3000,
      currency: 'PLN',
    },
    viewCount: 12,
    offerCount: 3,
    createdAt: new Date('2025-11-15T10:00:00'),
    updatedAt: new Date('2025-11-15T10:00:00'),
  },
  {
    id: 'r2',
    userId: '2',
    status: 'active',
    from: {
      address: 'Port Lotniczy',
      city: 'Gdańsk',
    },
    to: {
      address: 'Hotel Marina',
      city: 'Sopot',
    },
    departureDate: new Date('2025-12-20T14:30:00'),
    isRoundTrip: false,
    passengerCount: 8,
    luggageInfo: 'Tylko bagaż podręczny',
    viewCount: 5,
    offerCount: 2,
    createdAt: new Date('2025-11-16T14:00:00'),
    updatedAt: new Date('2025-11-16T14:00:00'),
  },
  {
    id: 'r3',
    userId: '1',
    status: 'offers_received',
    from: {
      address: 'Dworzec PKP',
      city: 'Wrocław',
    },
    to: {
      address: 'Stadion Narodowy',
      city: 'Warszawa',
    },
    departureDate: new Date('2025-11-30T09:00:00'),
    isRoundTrip: false,
    passengerCount: 45,
    specialRequirements: 'Wyjazd kibicowski - potrzebny duży autobus',
    budget: {
      min: 2000,
      max: 4000,
      currency: 'PLN',
    },
    viewCount: 18,
    offerCount: 5,
    createdAt: new Date('2025-11-14T09:00:00'),
    updatedAt: new Date('2025-11-14T09:00:00'),
  },
];

// Offers
export const offers: Offer[] = [
  {
    id: 'o1',
    requestId: 'r1',
    carrierId: 'c1',
    vehicleId: 'v1',
    status: 'pending',
    price: 2800,
    currency: 'PLN',
    description: 'Oferujemy komfortowy transport Mercedes Sprinter (19 miejsc). Pojazd w pełni klimatyzowany z WiFi.',
    includedServices: ['WiFi', 'Klimatyzacja', 'Woda mineralna', 'Elastyczny harmonogram'],
    proposedDeparture: new Date('2025-12-15T08:00:00'),
    proposedReturn: new Date('2025-12-15T18:00:00'),
    estimatedDuration: 300,
    validUntil: new Date('2025-11-20T23:59:59'),
    createdAt: new Date('2025-11-15T12:00:00'),
  },
  {
    id: 'o2',
    requestId: 'r1',
    carrierId: 'c2',
    vehicleId: 'v3',
    status: 'pending',
    price: 2500,
    currency: 'PLN',
    description: 'Profesjonalny transport autokarem MAN Lion Coach. Najwyższy standard podróży.',
    includedServices: ['WiFi', 'Klimatyzacja', 'Toaleta', 'TV', 'Gniazdka 230V', 'Kawa i herbata'],
    proposedDeparture: new Date('2025-12-15T08:00:00'),
    proposedReturn: new Date('2025-12-15T18:00:00'),
    estimatedDuration: 280,
    validUntil: new Date('2025-11-20T23:59:59'),
    createdAt: new Date('2025-11-15T14:30:00'),
  },
  {
    id: 'o3',
    requestId: 'r1',
    carrierId: 'c3',
    vehicleId: 'v1',
    status: 'pending',
    price: 2650,
    currency: 'PLN',
    description: 'Ekologiczny transport - pojazd hybrydowy. Komfort i troska o środowisko.',
    includedServices: ['WiFi', 'Klimatyzacja', 'Kompensacja CO2'],
    proposedDeparture: new Date('2025-12-15T08:00:00'),
    proposedReturn: new Date('2025-12-15T18:00:00'),
    estimatedDuration: 300,
    validUntil: new Date('2025-11-20T23:59:59'),
    createdAt: new Date('2025-11-15T16:00:00'),
  },
  {
    id: 'o4',
    requestId: 'r2',
    carrierId: 'c1',
    vehicleId: 'v2',
    status: 'pending',
    price: 350,
    currency: 'PLN',
    description: 'Transfer VW Crafter - idealny dla 8 osób. Wygodne skórzane fotele.',
    includedServices: ['Klimatyzacja', 'Bagażnik', 'Pomoc przy bagażu'],
    proposedDeparture: new Date('2025-12-20T14:30:00'),
    estimatedDuration: 30,
    validUntil: new Date('2025-11-25T23:59:59'),
    createdAt: new Date('2025-11-16T15:00:00'),
  },
  {
    id: 'o5',
    requestId: 'r2',
    carrierId: 'c2',
    vehicleId: 'v4',
    status: 'pending',
    price: 400,
    currency: 'PLN',
    description: 'Ford Transit z WiFi. Szybki i komfortowy transfer.',
    includedServices: ['WiFi', 'Klimatyzacja', 'Woda', 'Czekanie na lot bez dodatkowych opłat'],
    proposedDeparture: new Date('2025-12-20T14:30:00'),
    estimatedDuration: 25,
    validUntil: new Date('2025-11-25T23:59:59'),
    createdAt: new Date('2025-11-16T16:30:00'),
  },
];

// Helper functions
export const getUserById = (id: string) => users.find((u) => u.id === id);
export const getCarrierById = (id: string) => carriers.find((c) => c.id === id);
export const getVehicleById = (id: string) => vehicles.find((v) => v.id === id);
export const getRequestById = (id: string) => transportRequests.find((r) => r.id === id);
export const getOffersByRequestId = (requestId: string) =>
  offers.filter((o) => o.requestId === requestId);
export const getCarrierByUserId = (userId: string) =>
  carriers.find((c) => c.userId === userId);
