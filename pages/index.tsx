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
  });

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

  // Update route when a place is selected
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
            </div>

            {/* Modal wyboru trasy */}
            {showRouteModal && (
              <div className="absolute left-0 right-0 top-0 z-50">
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-6 w-full">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-[#215387]">Wybierz trasę</h3>
                    <button
                      onClick={() => setShowRouteModal(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Dwukolumnowy layout - po lewej inputy, po prawej mapa */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Lewa kolumna - Inputy */}
                    <div className="space-y-4">
                      {/* Skąd */}
                      <div>
                        <label className="block text-left text-sm font-semibold text-[#215387] mb-2">Skąd</label>
                        <PlaceAutocomplete
                          value={formData.fromCity}
                          onChange={(value) => {
                            setFormData((prev) => ({ ...prev, fromCity: value }));
                            setRouteReady(false);
                          }}
                          onSelect={updateRoute}
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
                                  setRouteReady(false);
                                }}
                                onSelect={updateRoute}
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
                            setRouteReady(false);
                          }}
                          onSelect={updateRoute}
                          placeholder="Miejsce docelowe"
                          name="toCity"
                          icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                            </svg>
                          }
                        />
                      </div>

                      {/* Przycisk Zapisz */}
                      <button
                        type="button"
                        onClick={() => setShowRouteModal(false)}
                        className="w-full px-6 py-3 bg-[#ffc428] text-[#215387] rounded-xl hover:bg-[#f5b920] transition-all font-bold shadow-lg hover:shadow-xl"
                      >
                        Zapisz
                      </button>
                    </div>

                    {/* Prawa kolumna - Mapa */}
                    <div className="bg-gray-100 rounded-xl overflow-hidden relative" style={{ minHeight: '300px' }}>
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
                          style={{ height: '100%', width: '100%', minHeight: '300px' }}
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
                            <p className="text-sm">Wybierz miejsca, aby zobaczyć trasę</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
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
            <div className="relative mx-auto mb-6 w-28 h-28 md:w-32 md:h-32 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-[#215387]">
              <div style={{ width: '60px', height: '60px' }}>
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Document/Form */}
                  <rect x="50" y="30" width="100" height="130" rx="8" fill="#215387"/>
                  <rect x="45" y="35" width="100" height="130" rx="8" fill="#2E6BA8"/>
                  {/* Lines on document */}
                  <line x1="60" y1="55" x2="120" y2="55" stroke="#ffc428" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="60" y1="70" x2="110" y2="70" stroke="#ffc428" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="60" y1="85" x2="125" y2="85" stroke="#E8E8E8" strokeWidth="3" strokeLinecap="round"/>
                  <line x1="60" y1="100" x2="105" y2="100" stroke="#E8E8E8" strokeWidth="3" strokeLinecap="round"/>
                  {/* Pencil */}
                  <rect x="110" y="110" width="50" height="8" rx="2" fill="#ffc428" transform="rotate(45 110 110)"/>
                  <path d="M125 125 L115 135 L120 140 L130 130 Z" fill="#f5b920"/>
                  <circle cx="132" cy="122" r="4" fill="#E8E8E8"/>
                </svg>
              </div>
            </div>
            <div className="mb-2 text-sm font-bold text-[#ffc428]">KROK 1</div>
            <h3 className="text-lg md:text-xl font-bold mb-2 text-[#215387]">Złóż zlecenie</h3>
            <p className="text-gray-600 text-xs md:text-sm leading-relaxed hidden md:block">
              Wypełnij formularz z trasą, datą i liczbą pasażerów.
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
            <div className="relative mx-auto mb-6 w-28 h-28 md:w-32 md:h-32 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-[#215387]">
              <div style={{ width: '80px', height: '80px' }}>
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Multiple envelopes/offers */}
                  <g transform="translate(10, 10)">
                    {/* Envelope 3 (back) */}
                    <path d="M90 75 L140 75 L115 95 Z" fill="#9CB4CC"/>
                    <rect x="75" y="75" width="65" height="45" rx="4" fill="#B8CEDF"/>
                    {/* Envelope 2 (middle) */}
                    <path d="M70 60 L120 60 L95 80 Z" fill="#2E6BA8"/>
                    <rect x="55" y="60" width="65" height="45" rx="4" fill="#4A8FCA"/>
                    {/* Envelope 1 (front) */}
                    <path d="M50 45 L100 45 L75 65 Z" fill="#ffc428"/>
                    <rect x="35" y="45" width="65" height="45" rx="4" fill="#ffd858"/>
                    <path d="M35 45 L67.5 72.5 L100 45" stroke="#215387" strokeWidth="2" fill="none"/>
                  </g>
                </svg>
              </div>
            </div>
            <div className="mb-2 text-sm font-bold text-[#ffc428]">KROK 2</div>
            <h3 className="text-lg md:text-xl font-bold mb-2 text-[#215387]">Dostań oferty</h3>
            <p className="text-gray-600 text-xs md:text-sm leading-relaxed hidden md:block">
              Przewoźnicy przesyłają konkurencyjne oferty.
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
            <div className="relative mx-auto mb-6 w-28 h-28 md:w-32 md:h-32 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-[#215387]">
              <div style={{ width: '80px', height: '80px' }}>
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Hand with checkmark */}
                  <g transform="translate(30, 40)">
                    {/* Document selected */}
                    <rect x="20" y="10" width="80" height="100" rx="6" fill="#2E6BA8"/>
                    <rect x="30" y="25" width="60" height="8" rx="2" fill="#E8E8E8"/>
                    <rect x="30" y="40" width="50" height="6" rx="2" fill="#E8E8E8"/>
                    <rect x="30" y="52" width="55" height="6" rx="2" fill="#E8E8E8"/>
                    {/* Big checkmark */}
                    <circle cx="60" cy="75" r="25" fill="#ffc428"/>
                    <path d="M48 75 L55 82 L72 65" stroke="#215387" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                </svg>
              </div>
            </div>
            <div className="mb-2 text-sm font-bold text-[#ffc428]">KROK 3</div>
            <h3 className="text-lg md:text-xl font-bold mb-2 text-[#215387]">Wybierz ofertę</h3>
            <p className="text-gray-600 text-xs md:text-sm leading-relaxed hidden md:block">
              Zaakceptuj najlepszą ofertę dla Ciebie.
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
            <div className="relative mx-auto mb-6 w-28 h-28 md:w-32 md:h-32 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-[#215387]">
              <div style={{ width: '80px', height: '80px' }}>
                <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Bus/Van */}
                  <g transform="translate(20, 50)">
                    {/* Road */}
                    <rect x="0" y="85" width="160" height="3" fill="#E8E8E8"/>
                    <rect x="0" y="92" width="20" height="4" fill="#ffc428"/>
                    <rect x="30" y="92" width="20" height="4" fill="#ffc428"/>
                    <rect x="60" y="92" width="20" height="4" fill="#ffc428"/>
                    <rect x="90" y="92" width="20" height="4" fill="#ffc428"/>
                    <rect x="120" y="92" width="20" height="4" fill="#ffc428"/>
                    {/* Bus body */}
                    <rect x="30" y="35" width="90" height="50" rx="8" fill="#215387"/>
                    {/* Windows */}
                    <rect x="40" y="42" width="18" height="20" rx="3" fill="#B8CEDF"/>
                    <rect x="62" y="42" width="18" height="20" rx="3" fill="#B8CEDF"/>
                    <rect x="84" y="42" width="18" height="20" rx="3" fill="#B8CEDF"/>
                    <rect x="106" y="42" width="8" height="20" rx="3" fill="#B8CEDF"/>
                    {/* Wheels */}
                    <circle cx="50" cy="85" r="10" fill="#2C3E50"/>
                    <circle cx="50" cy="85" r="6" fill="#E8E8E8"/>
                    <circle cx="100" cy="85" r="10" fill="#2C3E50"/>
                    <circle cx="100" cy="85" r="6" fill="#E8E8E8"/>
                    {/* Motion lines */}
                    <line x1="10" y1="30" x2="20" y2="30" stroke="#ffc428" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="5" y1="45" x2="18" y2="45" stroke="#ffc428" strokeWidth="3" strokeLinecap="round"/>
                    <line x1="8" y1="60" x2="22" y2="60" stroke="#ffc428" strokeWidth="3" strokeLinecap="round"/>
                  </g>
                </svg>
              </div>
            </div>
            <div className="mb-2 text-sm font-bold text-[#ffc428]">KROK 4</div>
            <h3 className="text-lg md:text-xl font-bold mb-2 text-[#215387]">Ruszaj w drogę</h3>
            <p className="text-gray-600 text-xs md:text-sm leading-relaxed hidden md:block">
              Ciesz się bezpieczną podróżą.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Dlaczego wayoo? */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dlaczego wayoo?</h2>
          <p className="text-lg text-gray-600">Prosty i szybki sposób na transport grupowy</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-[#ffc428] rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2 text-[#215387]">Prosty proces</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Dodaj zapytanie, porównaj oferty i wybierz najlepszą dla swojej grupy. Wszystko w jednym miejscu.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-[#ffc428] rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2 text-[#215387]">Najlepsze ceny</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Konkurencja między przewoźnikami gwarantuje atrakcyjne ceny. Oszczędzaj na każdej trasie.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-[#ffc428] rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold mb-2 text-[#215387]">Bezpieczeństwo</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Tylko zweryfikowani przewoźnicy z licencjami i ubezpieczeniem. Opinie innych pasażerów.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Popularne Kierunki */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Popularne Kierunki</h2>
          <p className="text-xl text-gray-600">Odkryj najczęściej wybierane destynacje grupowe</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Hotel 1 - Zakopane */}
          <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer">
            <div className="aspect-[4/5] relative">
              <img
                src="https://images.unsplash.com/photo-1605346434674-a440ca4dc4c0?w=400&h=500&fit=crop"
                alt="Zakopane"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Zakopane</h3>
                <p className="text-sm text-white/90 mb-3">Tatry • Narty • Góry</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-3 py-1 bg-[#ffc428] text-[#215387] rounded-full font-bold">
                    Od 150 PLN/os
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hotel 2 - Sopot */}
          <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer">
            <div className="aspect-[4/5] relative">
              <img
                src="https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=500&fit=crop"
                alt="Sopot"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Sopot</h3>
                <p className="text-sm text-white/90 mb-3">Morze • Plaża • Molo</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-3 py-1 bg-[#ffc428] text-[#215387] rounded-full font-bold">
                    Od 180 PLN/os
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hotel 3 - Kraków */}
          <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer">
            <div className="aspect-[4/5] relative">
              <img
                src="https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=400&h=500&fit=crop"
                alt="Kraków"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Kraków</h3>
                <p className="text-sm text-white/90 mb-3">Historia • Kultura • Rynek</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-3 py-1 bg-[#ffc428] text-[#215387] rounded-full font-bold">
                    Od 120 PLN/os
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hotel 4 - Warszawa */}
          <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer">
            <div className="aspect-[4/5] relative">
              <img
                src="https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=400&h=500&fit=crop"
                alt="Warszawa"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Warszawa</h3>
                <p className="text-sm text-white/90 mb-3">Stolica • Biznes • Imprezy</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-3 py-1 bg-[#ffc428] text-[#215387] rounded-full font-bold">
                    Od 140 PLN/os
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hotel 5 - Gdańsk */}
          <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer">
            <div className="aspect-[4/5] relative">
              <img
                src="https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?w=400&h=500&fit=crop"
                alt="Gdańsk"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Gdańsk</h3>
                <p className="text-sm text-white/90 mb-3">Stare Miasto • Historia • Kultura</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-3 py-1 bg-[#ffc428] text-[#215387] rounded-full font-bold">
                    Od 170 PLN/os
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hotel 6 - Wrocław */}
          <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer">
            <div className="aspect-[4/5] relative">
              <img
                src="https://images.unsplash.com/photo-1596436889106-be35e843f974?w=400&h=500&fit=crop"
                alt="Wrocław"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Wrocław</h3>
                <p className="text-sm text-white/90 mb-3">Zabytki • Ostrów Tumski • Festiwale</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-3 py-1 bg-[#ffc428] text-[#215387] rounded-full font-bold">
                    Od 130 PLN/os
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hotel 7 - Karpacz */}
          <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer">
            <div className="aspect-[4/5] relative">
              <img
                src="https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=500&fit=crop"
                alt="Karpacz"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Karpacz</h3>
                <p className="text-sm text-white/90 mb-3">Karkonosze • Góry • Przyroda</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-3 py-1 bg-[#ffc428] text-[#215387] rounded-full font-bold">
                    Od 145 PLN/os
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hotel 8 - Kołobrzeg */}
          <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all cursor-pointer">
            <div className="aspect-[4/5] relative">
              <img
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=500&fit=crop"
                alt="Kołobrzeg"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Kołobrzeg</h3>
                <p className="text-sm text-white/90 mb-3">Morze • Spa • Relaks</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-3 py-1 bg-[#ffc428] text-[#215387] rounded-full font-bold">
                    Od 165 PLN/os
                  </span>
                </div>
              </div>
            </div>
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
