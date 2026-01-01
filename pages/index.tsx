import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth-context';
import PlaceAutocomplete from '@/components/PlaceAutocomplete';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

// Fix Leaflet default marker icons
if (typeof window !== 'undefined') {
  const L = require('leaflet');
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

export default function Home() {
  const { isPassenger, isCarrier } = useAuth();
  const router = useRouter();
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const dateTimePickerRef = useRef<HTMLDivElement>(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeModalStep, setRouteModalStep] = useState<1 | 2>(1); // Zarządzanie stepami modalu
  const [mapMounted, setMapMounted] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<{
    from?: { lat: number; lng: number };
    to?: { lat: number; lng: number };
  }>({});
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [allWaypoints, setAllWaypoints] = useState<{ lat: number; lng: number }[]>([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeReady, setRouteReady] = useState(false);

  // Helper function to extract city name from full address
  const extractCityName = (address: string): string => {
    if (!address) return '';
    // Get the first part before comma (usually the city name)
    const cityName = address.split(',')[0].trim();
    return cityName;
  };

  // Add a new stop
  const addStop = () => {
    setFormData((prev) => ({
      ...prev,
      stops: [...prev.stops, ''],
    }));
  };

  // Remove a stop by index
  const removeStop = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index),
    }));
    // Clear route when removing a stop
    setRouteReady(false);
    setRoutePath([]);
    setAllWaypoints([]);
  };

  // Update a stop by index
  const updateStop = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      stops: prev.stops.map((stop, i) => (i === index ? value : stop)),
    }));
  };

  // Get route display text
  const getRouteDisplayText = (): string => {
    const parts: string[] = [];
    if (formData.fromCity) parts.push(extractCityName(formData.fromCity));
    formData.stops.forEach((stop) => {
      if (stop) parts.push(extractCityName(stop));
    });
    if (formData.toCity) parts.push(extractCityName(formData.toCity));
    return parts.join(' → ');
  };

  // Check if all stops are filled
  const areAllStopsFilled = (): boolean => {
    return formData.stops.every((stop) => stop !== '');
  };

  // Ustaw domyślną datę na jutro i godzinę na 12:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    fromCity: '',
    toCity: '',
    stops: [] as string[], // Przystanki pośrednie
    passengerCount: '1',
    departureDate: defaultDate,
    departureTime: '12:00',
    // Dodatkowe opcje
    luggageInfo: '',
    specialRequirements: '',
    additionalDescription: '', // Dodatkowy opis
    // Udogodnienia
    hasWifi: false,
    hasAirConditioning: false,
    hasChildSeat: false,
    hasMoreSpace: false,
    moreSpaceDescription: '', // Opis dodatkowego miejsca
    numberOfChildren: 1, // Ilość dzieci
    childrenAges: [] as number[], // Wiek dzieci
  });

  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Połącz datę i godzinę w jeden obiekt Date
    const departureDateTime = new Date(`${formData.departureDate}T${formData.departureTime}`);

    // Zapisz zapytanie do localStorage
    const newRequest = {
      id: 'r' + Date.now(),
      userId: '1', // W demo używamy pierwszego użytkownika
      status: 'active',
      from: {
        city: formData.fromCity,
        address: formData.fromCity,
      },
      to: {
        city: formData.toCity,
        address: formData.toCity,
      },
      stops: formData.stops.filter((stop) => stop !== ''), // Przystanki pośrednie (tylko niepuste)
      departureDate: departureDateTime.toISOString(),
      isRoundTrip: false,
      passengerCount: parseInt(formData.passengerCount),
      luggageInfo: formData.luggageInfo || undefined,
      specialRequirements: formData.specialRequirements || undefined,
      additionalDescription: formData.additionalDescription || undefined,
      // Udogodnienia
      hasWifi: formData.hasWifi,
      hasAirConditioning: formData.hasAirConditioning,
      hasChildSeat: formData.hasChildSeat,
      numberOfChildren: formData.hasChildSeat ? formData.numberOfChildren : undefined,
      childrenAges: formData.hasChildSeat && formData.childrenAges.length > 0 ? formData.childrenAges : undefined,
      hasMoreSpace: formData.hasMoreSpace,
      moreSpaceDescription: formData.moreSpaceDescription || undefined,
      viewCount: 0,
      offerCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Pobierz istniejące zapytania z localStorage
    const existingRequests = JSON.parse(localStorage.getItem('transportRequests') || '[]');
    existingRequests.push(newRequest);
    localStorage.setItem('transportRequests', JSON.stringify(existingRequests));

    // Przekieruj do listy zapytań
    router.push('/passenger/requests');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Close datetime picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateTimePickerRef.current && !dateTimePickerRef.current.contains(event.target as Node)) {
        setShowDateTimePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set map mounted
  useEffect(() => {
    setMapMounted(true);
  }, []);

  // Geocode city to get coordinates
  const geocodeCity = async (city: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(city)}&apiKey=11da404667ca45a78db6a73c3b6be0d9`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].geometry.coordinates;
        return { lat, lng };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  // Get route from API
  const getRoute = async (waypoints: { lat: number; lng: number }[]) => {
    if (waypoints.length < 2) return;

    try {
      // Build waypoints string for API: "lat1,lng1|lat2,lng2|lat3,lng3"
      const waypointsStr = waypoints.map((wp) => `${wp.lat},${wp.lng}`).join('|');

      const response = await fetch(
        `https://api.geoapify.com/v1/routing?waypoints=${waypointsStr}&mode=drive&apiKey=11da404667ca45a78db6a73c3b6be0d9`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const geometry = data.features[0].geometry;
        let allCoordinates: [number, number][] = [];

        // Handle both LineString and MultiLineString
        if (geometry.type === 'LineString') {
          allCoordinates = geometry.coordinates;
        } else if (geometry.type === 'MultiLineString') {
          // Flatten all segments into one array
          allCoordinates = geometry.coordinates.flat();
        }

        // Convert from [lng, lat] to [lat, lng] for Leaflet
        const routePoints: [number, number][] = allCoordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        setRoutePath(routePoints);
      }
    } catch (error) {
      console.error('Routing error:', error);
      // Fallback to straight lines if routing fails
      const fallbackPath: [number, number][] = waypoints.map((wp) => [wp.lat, wp.lng]);
      setRoutePath(fallbackPath);
    }
  };

  // Update route when a place is selected (for Step 2)
  const updateRoute = async () => {
    // Check if all stops are filled before proceeding
    const allStopsFilled = formData.stops.every((stop) => stop !== '');

    // If there are empty stops, clear the route
    if (!allStopsFilled && formData.stops.length > 0) {
      setAllWaypoints([]);
      setRoutePath([]);
      setRouteReady(false);
      setIsLoadingRoute(false);
      return;
    }

    // Don't update if we don't have both from and to cities
    if (!formData.fromCity || !formData.toCity) {
      setAllWaypoints([]);
      setRoutePath([]);
      setRouteReady(false);
      return;
    }

    setIsLoadingRoute(true);
    setRouteReady(false);
    const newCoords: { from?: { lat: number; lng: number }; to?: { lat: number; lng: number } } = {};

    const fromCoords = await geocodeCity(formData.fromCity);
    if (fromCoords) newCoords.from = fromCoords;

    const toCoords = await geocodeCity(formData.toCity);
    if (toCoords) newCoords.to = toCoords;

    setRouteCoordinates(newCoords);

    // Build complete waypoints list including stops
    if (newCoords.from && newCoords.to) {
      const waypointsList: { lat: number; lng: number }[] = [newCoords.from];

      // Add stops coordinates
      for (const stop of formData.stops) {
        if (stop) {
          const stopCoords = await geocodeCity(stop);
          if (stopCoords) waypointsList.push(stopCoords);
        }
      }

      waypointsList.push(newCoords.to);

      // Save all waypoints for markers
      setAllWaypoints(waypointsList);

      // Get the route with all waypoints
      await getRoute(waypointsList);
      setRouteReady(true);
    }

    setIsLoadingRoute(false);
  };

  // Przejdź do Step 2 (mapa)
  const handleProceedToStep2 = async () => {
    // Walidacja: wymagane są przynajmniej skąd i dokąd
    if (!formData.fromCity || !formData.toCity) {
      alert('Proszę wypełnić pola "Skąd" i "Dokąd"');
      return;
    }

    // Sprawdź czy wszystkie przystanki są wypełnione (jeśli istnieją)
    const hasEmptyStops = formData.stops.some((stop) => stop === '');
    if (hasEmptyStops) {
      alert('Proszę wypełnić wszystkie przystanki lub je usunąć');
      return;
    }

    // Przejdź do Step 2 i załaduj trasę
    setRouteModalStep(2);
    await updateRoute();
  };

  // Zapisz trasę i zamknij modal
  const handleSaveRoute = () => {
    setShowRouteModal(false);
    setRouteModalStep(1); // Reset do Step 1 na następne otwarcie
  };

  return (
    <div className="min-h-screen">
        {/* Hero Section with Background */}
        <div
        className="relative min-h-[400px] pb-[50px] bg-cover bg-center bg-no-repeat bg-[#081c83]"
        style={{
          backgroundImage: 'url(/bg_3.png)',
          backgroundSize: '35%',
          backgroundPosition: '100% -150px',
        }}
      >
        {/* Overlay dla lepszej czytelności */}
        <div className="absolute inset-0 bg-[#081c83]/10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-4">
          <div className="text-center space-y-8 max-w-[1100px]">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg leading-tight">
                Twój transport grupowy<br />
                <span className="text-[#ffc428]">w zasięgu ręki</span>
              </h1>
            </div>

            {/* Search Form - Kompaktowy Layout */}
            <div className=" mt-12 px-4 relative" style={{ maxWidth: '1100px' }}>
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 relative" style={{ zIndex: 1 }}>
                {/* 4 Kolumny */}
                <div className="grid grid-cols-1 gap-6 items-end" style={{ gridTemplateColumns: '2fr 1fr 0.66fr 1fr' }}>
                  {/* Kolumna 1 - Trasa (połączone Skąd i Dokąd) */}
                  <div>
                    <label className="block text-left text-sm font-semibold text-[#215387] mb-2">Trasa</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc428] z-10 pointer-events-none">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        readOnly
                        value={getRouteDisplayText()}
                        onClick={() => setShowRouteModal(true)}
                        className="w-full pl-11 pr-4 py-3.5 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all cursor-pointer"
                        placeholder="Wybierz trasę"
                      />
                    </div>
                  </div>

                  {/* Kolumna 2 - Data i godzina */}
                  <div>
                    <label className="block text-left text-sm font-semibold text-[#215387] mb-2">Data i godzina</label>
                    <div className="relative" ref={dateTimePickerRef}>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc428] z-10 pointer-events-none">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        readOnly
                        value={`${new Date(formData.departureDate).toLocaleDateString('pl-PL')} ${formData.departureTime}`}
                        onClick={() => setShowDateTimePicker(true)}
                        className="w-full pl-11 pr-4 py-3.5 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all cursor-pointer"
                        placeholder="Wybierz"
                      />

                      {/* Dropdown */}
                      {showDateTimePicker && (
                        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4">
                          <div className="space-y-4">
                            {/* Data */}
                            <div>
                              <label className="block text-sm font-semibold text-[#215387] mb-2">Data</label>
                              <input
                                type="date"
                                value={formData.departureDate}
                                onChange={(e) => setFormData((prev) => ({ ...prev, departureDate: e.target.value }))}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                              />
                            </div>

                            {/* Godzina */}
                            <div>
                              <label className="block text-sm font-semibold text-[#215387] mb-2">Godzina</label>
                              <input
                                type="time"
                                value={formData.departureTime}
                                onChange={(e) => setFormData((prev) => ({ ...prev, departureTime: e.target.value }))}
                                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                              />
                            </div>

                            {/* Przycisk Zapisz */}
                            <button
                              type="button"
                              onClick={() => setShowDateTimePicker(false)}
                              className="w-full px-4 py-2.5 bg-[#ffc428] text-[#215387] rounded-lg hover:bg-[#f5b920] transition-all font-bold"
                            >
                              Zapisz
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kolumna 3 - Liczba pasażerów */}
                  <div>
                    <label className="block text-left text-sm font-semibold text-[#215387] mb-2">Pasażerowie</label>
                    <input
                      type="number"
                      name="passengerCount"
                      value={formData.passengerCount}
                      onChange={handleChange}
                      min="1"
                      required
                      className="w-full px-4 text-center text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all font-semibold"
                      style={{ padding: '14px 16px' }}
                    />
                  </div>

                  {/* Kolumna 4 - Przycisk Submit */}
                  <div>
                    <button
                      type="submit"
                      className="w-full px-6 py-4 text-base bg-[#ffc428] text-[#215387] rounded-xl hover:bg-[#f5b920] transition-all font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Szukaj
                    </button>
                  </div>
                </div>
              </form>

              {/* Dodatkowe opcje - dropdown pod formularzem */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowAdditionalOptions(!showAdditionalOptions)}
                  className="text-sm text-white hover:text-gray-200 font-medium flex items-center gap-1.5 transition-colors px-2"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${showAdditionalOptions ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Dodatkowe opcje
                </button>

                {/* Rozwijany panel z checkboxami */}
                {showAdditionalOptions && (
                  <div className="mt-3 bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-200" style={{ maxWidth: '50%' }}>
                    <div className="space-y-4">
                      {/* WiFi */}
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.hasWifi}
                          onChange={(e) => setFormData((prev) => ({ ...prev, hasWifi: e.target.checked }))}
                          className="w-5 h-5 rounded border-2 border-gray-300 text-[#ffc428] focus:ring-2 focus:ring-[#ffc428] focus:ring-offset-0 cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-[#215387]">WiFi</span>
                        </div>
                      </label>

                      {/* Klimatyzacja */}
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.hasAirConditioning}
                          onChange={(e) => setFormData((prev) => ({ ...prev, hasAirConditioning: e.target.checked }))}
                          className="w-5 h-5 rounded border-2 border-gray-300 text-[#ffc428] focus:ring-2 focus:ring-[#ffc428] focus:ring-offset-0 cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-[#215387]">Klimatyzacja</span>
                        </div>
                      </label>

                      {/* Fotelik dla dziecka */}
                      <div>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.hasChildSeat}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                hasChildSeat: e.target.checked,
                                numberOfChildren: e.target.checked ? prev.numberOfChildren : 1,
                                childrenAges: e.target.checked ? prev.childrenAges : []
                              }));
                            }}
                            className="w-5 h-5 rounded border-2 border-gray-300 text-[#ffc428] focus:ring-2 focus:ring-[#ffc428] focus:ring-offset-0 cursor-pointer"
                          />
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-[#215387]">Fotelik dla dziecka</span>
                          </div>
                        </label>

                        {/* Rozwijane pola dla fotelika */}
                        {formData.hasChildSeat && (
                          <div className="mt-3 ml-8 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                            <label className="block text-sm font-semibold text-[#215387] mb-2">
                              Liczba dzieci
                            </label>
                            <div className="flex items-center gap-4">
                              {/* Przycisk minus */}
                              <button
                                type="button"
                                onClick={() => {
                                  const newCount = Math.max(1, formData.numberOfChildren - 1);
                                  setFormData((prev) => ({
                                    ...prev,
                                    numberOfChildren: newCount,
                                    childrenAges: Array(newCount).fill(0).map((_, i) => prev.childrenAges[i] || 0)
                                  }));
                                }}
                                disabled={formData.numberOfChildren <= 1}
                                className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#ffc428] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300"
                              >
                                <svg className="w-5 h-5 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>

                              {/* Liczba */}
                              <div className="flex-1 text-center">
                                <span className="text-2xl font-bold text-[#215387]">{formData.numberOfChildren}</span>
                              </div>

                              {/* Przycisk plus */}
                              <button
                                type="button"
                                onClick={() => {
                                  const newCount = Math.min(10, formData.numberOfChildren + 1);
                                  setFormData((prev) => ({
                                    ...prev,
                                    numberOfChildren: newCount,
                                    childrenAges: Array(newCount).fill(0).map((_, i) => prev.childrenAges[i] || 0)
                                  }));
                                }}
                                disabled={formData.numberOfChildren >= 10}
                                className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#ffc428] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300"
                              >
                                <svg className="w-5 h-5 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>

                            {/* Liczniki dla wieku każdego dziecka */}
                            {formData.numberOfChildren > 0 && (
                              <div className="mt-4">
                                <p className="text-sm font-semibold text-[#215387] mb-3">Wiek dzieci</p>
                                <div className="grid grid-cols-2 gap-3">
                                  {Array.from({ length: formData.numberOfChildren }).map((_, index) => (
                                    <div key={index}>
                                      <label className="block text-xs font-medium text-gray-600 mb-2">
                                        Dziecko {index + 1}
                                      </label>
                                      <div className="flex items-center gap-2">
                                        {/* Przycisk minus */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const currentAge = formData.childrenAges[index] || 0;
                                            const newAge = Math.max(0, currentAge - 1);
                                            setFormData((prev) => {
                                              const newAges = [...prev.childrenAges];
                                              newAges[index] = newAge;
                                              return { ...prev, childrenAges: newAges };
                                            });
                                          }}
                                          disabled={(formData.childrenAges[index] || 0) <= 0}
                                          className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#ffc428] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300"
                                        >
                                          <svg className="w-4 h-4 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                          </svg>
                                        </button>

                                        {/* Wiek */}
                                        <div className="flex-1 text-center">
                                          <span className="text-lg font-bold text-[#215387]">
                                            {formData.childrenAges[index] || 0} {(formData.childrenAges[index] || 0) === 1 ? 'rok' : formData.childrenAges[index] >= 2 && formData.childrenAges[index] <= 4 ? 'lata' : 'lat'}
                                          </span>
                                        </div>

                                        {/* Przycisk plus */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const currentAge = formData.childrenAges[index] || 0;
                                            const newAge = Math.min(17, currentAge + 1);
                                            setFormData((prev) => {
                                              const newAges = [...prev.childrenAges];
                                              newAges[index] = newAge;
                                              return { ...prev, childrenAges: newAges };
                                            });
                                          }}
                                          disabled={(formData.childrenAges[index] || 0) >= 17}
                                          className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-[#ffc428] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300"
                                        >
                                          <svg className="w-4 h-4 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Więcej miejsca */}
                      <div>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.hasMoreSpace}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                hasMoreSpace: e.target.checked,
                                moreSpaceDescription: e.target.checked ? prev.moreSpaceDescription : ''
                              }));
                            }}
                            className="w-5 h-5 rounded border-2 border-gray-300 text-[#ffc428] focus:ring-2 focus:ring-[#ffc428] focus:ring-offset-0 cursor-pointer"
                          />
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-[#215387]">Więcej miejsca</span>
                          </div>
                        </label>

                        {/* Rozwijane pole dla opisu */}
                        {formData.hasMoreSpace && (
                          <div className="mt-3 ml-8 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                            <label className="block text-sm font-semibold text-[#215387] mb-2">
                              Opisz co chcesz przewieźć
                            </label>
                            <textarea
                              value={formData.moreSpaceDescription}
                              onChange={(e) => setFormData((prev) => ({ ...prev, moreSpaceDescription: e.target.value }))}
                              placeholder="np. narty, rowery, walizki..."
                              rows={3}
                              className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all resize-none"
                            />
                          </div>
                        )}
                      </div>

                      {/* Dodatkowy opis - zawsze widoczny */}
                      <div className="pt-4 border-t-2 border-gray-100">
                        <label className="block text-sm font-semibold text-[#215387] mb-2">
                          Dodatkowy opis
                        </label>
                        <textarea
                          value={formData.additionalDescription}
                          onChange={(e) => setFormData((prev) => ({ ...prev, additionalDescription: e.target.value }))}
                          placeholder="Dodatkowe uwagi do przejazdu..."
                          rows={3}
                          className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal wyboru trasy */}
            {showRouteModal && (
              <div className="absolute left-0 right-0 top-0 z-50">
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-6 w-full">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <h3 className="text-2xl font-bold text-[#215387]">
                        {routeModalStep === 1 ? 'Wybierz trasę' : 'Podgląd trasy'}
                      </h3>
                      {/* Wskaźnik kroków */}
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${routeModalStep === 1 ? 'bg-[#ffc428] text-[#215387]' : 'bg-green-500 text-white'}`}>
                          1
                        </div>
                        <div className="w-8 h-0.5 bg-gray-300"></div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${routeModalStep === 2 ? 'bg-[#ffc428] text-[#215387]' : 'bg-gray-300 text-gray-500'}`}>
                          2
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowRouteModal(false);
                        setRouteModalStep(1);
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* STEP 1 - Inputy */}
                  {routeModalStep === 1 && (
                    <div className="space-y-4 max-w-xl mx-auto">
                      {/* Skąd */}
                      <div>
                        <label className="block text-left text-sm font-semibold text-[#215387] mb-2">Skąd</label>
                        <PlaceAutocomplete
                          value={formData.fromCity}
                          onChange={(value) => {
                            setFormData((prev) => ({ ...prev, fromCity: value }));
                          }}
                          onSelect={() => {}} // Nie wywołujemy updateRoute w Step 1
                          placeholder="Miejsce wyjazdu"
                          name="fromCity"
                          icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          }
                        />
                      </div>

                      {/* Przystanki pośrednie */}
                      {formData.stops.map((stop, index) => (
                        <div key={index} className="relative">
                          <label className="block text-left text-sm font-semibold text-[#215387] mb-2">
                            Przystanek {index + 1}
                          </label>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <PlaceAutocomplete
                                value={stop}
                                onChange={(value) => {
                                  updateStop(index, value);
                                }}
                                onSelect={() => {}} // Nie wywołujemy updateRoute w Step 1
                                placeholder="Przystanek pośredni"
                                name={`stop-${index}`}
                                icon={
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                }
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeStop(index)}
                              className="px-3 py-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                              title="Usuń przystanek"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Przycisk Dodaj przystanek */}
                      <button
                        type="button"
                        onClick={addStop}
                        className="px-2 py-1 text-[#215387] hover:text-[#1a4469] transition-colors text-sm font-medium flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Dodaj przystanek
                      </button>

                      {/* Dokąd */}
                      <div>
                        <label className="block text-left text-sm font-semibold text-[#215387] mb-2">Dokąd</label>
                        <PlaceAutocomplete
                          value={formData.toCity}
                          onChange={(value) => {
                            setFormData((prev) => ({ ...prev, toCity: value }));
                          }}
                          onSelect={() => {}} // Nie wywołujemy updateRoute w Step 1
                          placeholder="Miejsce docelowe"
                          name="toCity"
                          icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                          }
                        />
                      </div>

                      {/* Przycisk Dalej */}
                      <button
                        type="button"
                        onClick={handleProceedToStep2}
                        className="w-full px-6 py-3 bg-[#ffc428] text-[#215387] rounded-xl hover:bg-[#f5b920] transition-all font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                      >
                        Dalej
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* STEP 2 - Mapa */}
                  {routeModalStep === 2 && (
                    <div className="space-y-4">
                      {/* Podsumowanie trasy */}
                      <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                        <h4 className="text-sm font-semibold text-[#215387] mb-2">Twoja trasa:</h4>
                        <p className="text-lg font-bold text-gray-900">{getRouteDisplayText()}</p>
                      </div>

                      {/* Mapa */}
                      <div className="bg-gray-100 rounded-xl overflow-hidden relative" style={{ minHeight: '500px', height: '500px' }}>
                        {isLoadingRoute ? (
                          <div className="flex items-center justify-center h-full text-gray-400 absolute inset-0 bg-gray-100 z-10">
                            <div className="text-center">
                              <svg className="w-12 h-12 mx-auto mb-3 animate-spin text-[#215387]" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <p className="text-sm text-[#215387] font-medium">Ładowanie trasy...</p>
                            </div>
                          </div>
                        ) : null}

                        {mapMounted && routeReady && routePath.length > 0 && routeCoordinates.from && routeCoordinates.to ? (
                          <MapContainer
                            center={[
                              (routeCoordinates.from.lat + routeCoordinates.to.lat) / 2,
                              (routeCoordinates.from.lng + routeCoordinates.to.lng) / 2,
                            ]}
                            zoom={7}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={false}
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a>'
                              url="https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=11da404667ca45a78db6a73c3b6be0d9"
                            />
                            {/* Markery dla wszystkich waypoints */}
                            {allWaypoints.map((waypoint, index) => (
                              <Marker key={index} position={[waypoint.lat, waypoint.lng]} />
                            ))}
                            <Polyline
                              positions={routePath}
                              color="#215387"
                              weight={4}
                              opacity={0.8}
                            />
                          </MapContainer>
                        ) : !isLoadingRoute ? (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <div className="text-center">
                              <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                              </svg>
                              <p className="text-sm">Nie udało się załadować trasy</p>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {/* Przyciski akcji */}
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setRouteModalStep(1)}
                          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-bold flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                          </svg>
                          Wróć
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveRoute}
                          className="flex-1 px-6 py-3 bg-[#ffc428] text-[#215387] rounded-xl hover:bg-[#f5b920] transition-all font-bold shadow-lg hover:shadow-xl"
                        >
                          Zapisz trasę
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Jak to działa? - Flow */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-center gap-4 md:gap-8">
          {/* Krok 1 */}
          <div className="text-center flex-1 max-w-[200px]">
            <div className="relative mx-auto mb-6">
              <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background circle */}
                <circle cx="70" cy="70" r="68" fill="#f0f7ff" stroke="#215387" strokeWidth="2"/>

                {/* Clipboard/Document */}
                <rect x="35" y="25" width="70" height="85" rx="4" fill="white" stroke="#215387" strokeWidth="2"/>
                <rect x="50" y="20" width="40" height="8" rx="4" fill="#215387"/>

                {/* Location pin icon */}
                <circle cx="55" cy="45" r="6" fill="#ffc428"/>
                <path d="M55 38 C51 38 48 41 48 45 C48 48 55 58 55 58 C55 58 62 48 62 45 C62 41 59 38 55 38 Z" fill="#ffc428"/>
                <circle cx="55" cy="45" r="2" fill="#215387"/>

                {/* Calendar icon */}
                <rect x="72" y="40" width="20" height="18" rx="2" fill="white" stroke="#215387" strokeWidth="1.5"/>
                <line x1="76" y1="38" x2="76" y2="42" stroke="#215387" strokeWidth="1.5"/>
                <line x1="88" y1="38" x2="88" y2="42" stroke="#215387" strokeWidth="1.5"/>
                <line x1="74" y1="47" x2="90" y2="47" stroke="#ffc428" strokeWidth="1.5"/>

                {/* People icon */}
                <circle cx="62" cy="75" r="8" fill="#215387"/>
                <circle cx="78" cy="75" r="8" fill="#215387" opacity="0.7"/>
                <path d="M48 95 C48 88 54 83 62 83 C70 83 76 88 76 95 L48 95 Z" fill="#215387"/>
                <path d="M64 95 C64 88 70 83 78 83 C86 83 92 88 92 95 L64 95 Z" fill="#215387" opacity="0.7"/>
              </svg>
            </div>
            <div className="mb-2 text-sm font-bold text-[#ffc428]">KROK 1</div>
            <h3 className="text-lg md:text-xl font-bold mb-2 text-[#215387]">Składasz zapytanie transportowe</h3>
            <p className="text-gray-600 text-xs md:text-sm leading-relaxed hidden md:block">
              Podajesz trasę, termin i liczbę pasażerów.
            </p>
          </div>

          {/* Strzałka 1 */}
          <div className="hidden md:block flex-shrink-0">
            <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 12 L50 12" stroke="#ffc428" strokeWidth="3" strokeDasharray="6 6"/>
              <path d="M45 6 L55 12 L45 18" stroke="#ffc428" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Krok 2 */}
          <div className="text-center flex-1 max-w-[200px]">
            <div className="relative mx-auto mb-6">
              <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background circle */}
                <circle cx="70" cy="70" r="68" fill="#f0f7ff" stroke="#215387" strokeWidth="2"/>

                {/* Price tags / Offers */}
                {/* Tag 1 - back */}
                <g transform="translate(15, 20)">
                  <path d="M0 10 L40 10 L50 25 L40 40 L0 40 Z" fill="#B8CEDF" stroke="#215387" strokeWidth="1.5"/>
                  <text x="12" y="28" fill="#215387" fontSize="12" fontWeight="bold">€€€</text>
                </g>

                {/* Tag 2 - middle */}
                <g transform="translate(30, 50)">
                  <path d="M0 10 L40 10 L50 25 L40 40 L0 40 Z" fill="#4A8FCA" stroke="#215387" strokeWidth="1.5"/>
                  <text x="12" y="28" fill="white" fontSize="12" fontWeight="bold">€€</text>
                </g>

                {/* Tag 3 - front (best offer) */}
                <g transform="translate(50, 35)">
                  <path d="M0 10 L45 10 L55 25 L45 40 L0 40 Z" fill="#ffc428" stroke="#215387" strokeWidth="2"/>
                  <text x="10" y="28" fill="#215387" fontSize="14" fontWeight="bold">€€€</text>
                  {/* Star for best offer */}
                  <path d="M65 25 L67 19 L69 25 L75 25 L70 29 L72 35 L67 31 L62 35 L64 29 L59 25 Z" fill="#ffc428" stroke="#215387" strokeWidth="1"/>
                </g>

                {/* Arrows indicating incoming */}
                <path d="M25 70 L35 70" stroke="#ffc428" strokeWidth="2" strokeLinecap="round"/>
                <path d="M30 65 L35 70 L30 75" stroke="#ffc428" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>

                <path d="M25 95 L35 95" stroke="#ffc428" strokeWidth="2" strokeLinecap="round"/>
                <path d="M30 90 L35 95 L30 100" stroke="#ffc428" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="mb-2 text-sm font-bold text-[#ffc428]">KROK 2</div>
            <h3 className="text-lg md:text-xl font-bold mb-2 text-[#215387]">Lokalni Przewoźnicy przesyłają oferty</h3>
            <p className="text-gray-600 text-xs md:text-sm leading-relaxed hidden md:block">
              Otrzymujesz konkurencyjne propozycje cenowe.
            </p>
          </div>

          {/* Strzałka 2 */}
          <div className="hidden md:block flex-shrink-0">
            <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 12 L50 12" stroke="#ffc428" strokeWidth="3" strokeDasharray="6 6"/>
              <path d="M45 6 L55 12 L45 18" stroke="#ffc428" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Krok 3 */}
          <div className="text-center flex-1 max-w-[200px]">
            <div className="relative mx-auto mb-6">
              <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background circle */}
                <circle cx="70" cy="70" r="68" fill="#f0f7ff" stroke="#215387" strokeWidth="2"/>

                {/* Contract/Document with checkmark */}
                <rect x="30" y="25" width="80" height="90" rx="4" fill="white" stroke="#215387" strokeWidth="2"/>

                {/* Document lines */}
                <line x1="40" y1="40" x2="80" y2="40" stroke="#215387" strokeWidth="2" strokeLinecap="round"/>
                <line x1="40" y1="50" x2="100" y2="50" stroke="#215387" strokeWidth="2" strokeLinecap="round"/>
                <line x1="40" y1="60" x2="90" y2="60" stroke="#E8E8E8" strokeWidth="2" strokeLinecap="round"/>
                <line x1="40" y1="70" x2="95" y2="70" stroke="#E8E8E8" strokeWidth="2" strokeLinecap="round"/>

                {/* Signature line */}
                <line x1="40" y1="95" x2="100" y2="95" stroke="#215387" strokeWidth="1" strokeDasharray="2,2"/>
                <text x="42" y="105" fill="#666" fontSize="8">Podpis</text>

                {/* Big checkmark badge */}
                <circle cx="90" cy="85" r="22" fill="#ffc428" stroke="#215387" strokeWidth="2"/>
                <path d="M80 85 L86 91 L100 77" stroke="#215387" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>

                {/* Hand/cursor selecting */}
                <g transform="translate(20, 80)">
                  <path d="M10 20 L10 5 L15 5 L15 12 L17 8 L20 8 L20 12 L22 10 L25 10 L25 20 L20 28 L10 28 Z" fill="#215387" stroke="#215387" strokeWidth="1"/>
                  <circle cx="12" cy="3" r="2" fill="#ffc428"/>
                </g>
              </svg>
            </div>
            <div className="mb-2 text-sm font-bold text-[#ffc428]">KROK 3</div>
            <h3 className="text-lg md:text-xl font-bold mb-2 text-[#215387]">Wybierasz najlepszą ofertę</h3>
            <p className="text-gray-600 text-xs md:text-sm leading-relaxed hidden md:block">
              Akceptujesz warunki dopasowane do Twoich gości.
            </p>
          </div>

          {/* Strzałka 3 */}
          <div className="hidden md:block flex-shrink-0">
            <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 12 L50 12" stroke="#ffc428" strokeWidth="3" strokeDasharray="6 6"/>
              <path d="M45 6 L55 12 L45 18" stroke="#ffc428" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Krok 4 */}
          <div className="text-center flex-1 max-w-[200px]">
            <div className="relative mx-auto mb-6">
              <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background circle */}
                <circle cx="70" cy="70" r="68" fill="#f0f7ff" stroke="#215387" strokeWidth="2"/>

                {/* Road */}
                <rect x="10" y="95" width="120" height="15" fill="#E8E8E8"/>
                <rect x="15" y="102" width="15" height="3" fill="#ffc428"/>
                <rect x="40" y="102" width="15" height="3" fill="#ffc428"/>
                <rect x="65" y="102" width="15" height="3" fill="#ffc428"/>
                <rect x="90" y="102" width="15" height="3" fill="#ffc428"/>
                <rect x="115" y="102" width="10" height="3" fill="#ffc428"/>

                {/* Bus */}
                <g transform="translate(45, 45)">
                  {/* Bus body */}
                  <rect x="0" y="15" width="60" height="35" rx="6" fill="#215387" stroke="#215387" strokeWidth="2"/>
                  <rect x="0" y="15" width="10" height="35" rx="6" fill="#2E6BA8"/>

                  {/* Windows */}
                  <rect x="12" y="20" width="12" height="15" rx="2" fill="#B8CEDF"/>
                  <rect x="27" y="20" width="12" height="15" rx="2" fill="#B8CEDF"/>
                  <rect x="42" y="20" width="12" height="15" rx="2" fill="#B8CEDF"/>

                  {/* Headlights */}
                  <circle cx="5" cy="45" r="2" fill="#ffc428"/>

                  {/* Wheels */}
                  <circle cx="15" cy="50" r="6" fill="#2C3E50"/>
                  <circle cx="15" cy="50" r="3" fill="#E8E8E8"/>
                  <circle cx="45" cy="50" r="6" fill="#2C3E50"/>
                  <circle cx="45" cy="50" r="3" fill="#E8E8E8"/>

                  {/* Happy passengers silhouettes */}
                  <circle cx="18" cy="27" r="3" fill="#ffc428" opacity="0.6"/>
                  <circle cx="33" cy="27" r="3" fill="#ffc428" opacity="0.6"/>
                  <circle cx="48" cy="27" r="3" fill="#ffc428" opacity="0.6"/>
                </g>

                {/* Motion lines */}
                <line x1="20" y1="55" x2="30" y2="55" stroke="#ffc428" strokeWidth="2" strokeLinecap="round"/>
                <line x1="15" y1="65" x2="28" y2="65" stroke="#ffc428" strokeWidth="2" strokeLinecap="round"/>
                <line x1="18" y1="75" x2="32" y2="75" stroke="#ffc428" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="mb-2 text-sm font-bold text-[#ffc428]">KROK 4</div>
            <h3 className="text-lg md:text-xl font-bold mb-2 text-[#215387]">Goście realizują przejazd</h3>
            <p className="text-gray-600 text-xs md:text-sm leading-relaxed hidden md:block">
              Transport odbywa się bez zbędnej logistyki po Twojej stronie.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Dlaczego warto nam zaufać */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dlaczego warto nam zaufać</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-[#ffc428] rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2 text-[#215387]">Prosty proces</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Składasz zapytanie, otrzymujesz oferty od przewoźników i wybierasz najlepszą — wszystko w jednym miejscu.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-[#ffc428] rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2 text-[#215387]">Bezpieczeństwo i weryfikacja</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Współpracujemy wyłącznie ze sprawdzonymi lokalnymi przewoźnikami. Dostępne opinie pasażerów.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-[#ffc428] rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2 text-[#215387]">Oszczędność czasu</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Zamiast dzwonić do wielu przewoźników — wszystko odbywa się w jednym miejscu.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-[#ffc428] rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2 text-[#215387]">Odpowiedzialny model współpracy</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Wayoo wspiera standardy ESG i porządkuje proces organizacji transportu po stronie hotelu.
            </p>
          </div>
        </div>
      </div>

      {/*/!* 3. Opinie przewoźników - Reviews Section *!/*/}
      {/*<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">*/}
      {/*  <div className="text-center mb-12">*/}
      {/*    <h2 className="text-4xl font-bold text-gray-900 mb-4">Opinie Przewoźników</h2>*/}
      {/*    <p className="text-xl text-gray-600">Zobacz co mówią o nas pasażerowie</p>*/}
      {/*  </div>*/}

      {/*  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">*/}
      {/*    /!* Review 1 - Fast Transport *!/*/}
      {/*    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">*/}
      {/*      <div className="flex items-center gap-3 mb-4">*/}
      {/*        <div className="w-12 h-12 bg-gradient-to-br from-[#ffc428] to-[#f5b920] rounded-full flex items-center justify-center text-2xl">*/}
      {/*          🚐*/}
      {/*        </div>*/}
      {/*        <div>*/}
      {/*          <h4 className="font-bold text-gray-900">Fast Transport</h4>*/}
      {/*          <div className="flex gap-1">*/}
      {/*            {[1, 2, 3, 4, 5].map((star) => (*/}
      {/*              <svg key={star} className="w-4 h-4 text-[#ffc428] fill-current" viewBox="0 0 20 20">*/}
      {/*                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />*/}
      {/*              </svg>*/}
      {/*            ))}*/}
      {/*          </div>*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*      <p className="text-gray-600 text-sm leading-relaxed mb-4">*/}
      {/*        "Fantastyczna obsługa! Kierowca profesjonalny, autobus czysty i punktualność na najwyższym poziomie. Polecamy dla wyjazdów firmowych."*/}
      {/*      </p>*/}
      {/*      <div className="flex items-center gap-2 text-sm text-gray-500">*/}
      {/*        <span className="font-semibold">Anna Kowalska</span>*/}
      {/*        <span>•</span>*/}
      {/*        <span>Wycieczka do Krakowa</span>*/}
      {/*      </div>*/}
      {/*    </div>*/}

      {/*    /!* Review 2 - BusLine Premium *!/*/}
      {/*    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">*/}
      {/*      <div className="flex items-center gap-3 mb-4">*/}
      {/*        <div className="w-12 h-12 bg-gradient-to-br from-[#215387] to-[#1a4469] rounded-full flex items-center justify-center text-2xl">*/}
      {/*          🚌*/}
      {/*        </div>*/}
      {/*        <div>*/}
      {/*          <h4 className="font-bold text-gray-900">BusLine Premium</h4>*/}
      {/*          <div className="flex gap-1">*/}
      {/*            {[1, 2, 3, 4, 5].map((star) => (*/}
      {/*              <svg key={star} className="w-4 h-4 text-[#ffc428] fill-current" viewBox="0 0 20 20">*/}
      {/*                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />*/}
      {/*              </svg>*/}
      {/*            ))}*/}
      {/*          </div>*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*      <p className="text-gray-600 text-sm leading-relaxed mb-4">*/}
      {/*        "Najlepszy przewoźnik z jakim mieliśmy przyjemność współpracować. WiFi w autobusie, wygodne fotele i miła atmosfera. Dziękujemy!"*/}
      {/*      </p>*/}
      {/*      <div className="flex items-center gap-2 text-sm text-gray-500">*/}
      {/*        <span className="font-semibold">Piotr Nowak</span>*/}
      {/*        <span>•</span>*/}
      {/*        <span>Wyjazd integracyjny</span>*/}
      {/*      </div>*/}
      {/*    </div>*/}

      {/*    /!* Review 3 - EcoTransport *!/*/}
      {/*    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">*/}
      {/*      <div className="flex items-center gap-3 mb-4">*/}
      {/*        <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-2xl">*/}
      {/*          🌱*/}
      {/*        </div>*/}
      {/*        <div>*/}
      {/*          <h4 className="font-bold text-gray-900">EcoTransport</h4>*/}
      {/*          <div className="flex gap-1">*/}
      {/*            {[1, 2, 3, 4, 5].map((star) => (*/}
      {/*              <svg key={star} className="w-4 h-4 text-[#ffc428] fill-current" viewBox="0 0 20 20">*/}
      {/*                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />*/}
      {/*              </svg>*/}
      {/*            ))}*/}
      {/*          </div>*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*      <p className="text-gray-600 text-sm leading-relaxed mb-4">*/}
      {/*        "Elektryczne busy to przyszłość! Cicha jazda, ekologiczny transport i świetna cena. Zdecydowanie wybierzemy Was ponownie."*/}
      {/*      </p>*/}
      {/*      <div className="flex items-center gap-2 text-sm text-gray-500">*/}
      {/*        <span className="font-semibold">Katarzyna Wiśniewska</span>*/}
      {/*        <span>•</span>*/}
      {/*        <span>Transfer lotniskowy</span>*/}
      {/*      </div>*/}
      {/*    </div>*/}

      {/*    /!* Review 4 - Express Travel *!/*/}
      {/*    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">*/}
      {/*      <div className="flex items-center gap-3 mb-4">*/}
      {/*        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-2xl">*/}
      {/*          ⚡*/}
      {/*        </div>*/}
      {/*        <div>*/}
      {/*          <h4 className="font-bold text-gray-900">Express Travel</h4>*/}
      {/*          <div className="flex gap-1">*/}
      {/*            {[1, 2, 3, 4, 5].map((star) => (*/}
      {/*              <svg key={star} className="w-4 h-4 text-[#ffc428] fill-current" viewBox="0 0 20 20">*/}
      {/*                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />*/}
      {/*              </svg>*/}
      {/*            ))}*/}
      {/*          </div>*/}
      {/*        </div>*/}
      {/*      </div>*/}
      {/*      <p className="text-gray-600 text-sm leading-relaxed mb-4">*/}
      {/*        "Szybko, sprawnie i bezproblemowo. Doskonały wybór na transfer na lotnisko. Polecamy każdemu!"*/}
      {/*      </p>*/}
      {/*      <div className="flex items-center gap-2 text-sm text-gray-500">*/}
      {/*        <span className="font-semibold">Marek Zieliński</span>*/}
      {/*        <span>•</span>*/}
      {/*        <span>Wyjazd do Zakopanego</span>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </div>*/}
      {/*</div>*/}

    </div>
  );
}
