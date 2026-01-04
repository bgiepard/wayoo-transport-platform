import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth-context';
import PlaceAutocomplete from '@/components/PlaceAutocomplete';
import SearchForm from '@/components/SearchForm';
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
        <div
        className="relative min-h-[400px] pb-[50px] bg-cover bg-center bg-no-repeat bg-[#081c83]"
        style={{
          backgroundImage: 'url(/bg_3.png)',
          backgroundSize: '35%',
          backgroundPosition: '100% -150px',
        }}
      >
        <div className="absolute inset-0 bg-[#081c83]/10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-4">
          <div className="text-center space-y-8 max-w-[1100px]">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg leading-tight">
                Twój transport grupowy<br />
                <span className="text-[#ffc428]">w zasięgu ręki</span>
              </h1>
            </div>

            <SearchForm
              formData={formData}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
              handleChange={handleChange}
              setShowRouteModal={setShowRouteModal}
              getRouteDisplayText={getRouteDisplayText}
            />
            {showRouteModal && (
              <div className="absolute left-0 right-0 top-0 z-50">
                <div className="bg-white rounded-2xl shadow-2xl border-2 border-gray-200 p-6 w-full">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <h3 className="text-2xl font-bold text-[#215387]">
                        {routeModalStep === 1 ? 'Wybierz trasę' : 'Podgląd trasy'}
                      </h3>
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

                  {routeModalStep === 1 && (
                    <div className="space-y-4 max-w-xl mx-auto">
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

                  {routeModalStep === 2 && (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                        <h4 className="text-sm font-semibold text-[#215387] mb-2">Twoja trasa:</h4>
                        <p className="text-lg font-bold text-gray-900">{getRouteDisplayText()}</p>
                      </div>

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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-28 h-28 bg-[#ffc428] rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform">
                <svg className="w-14 h-14 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            </div>
            <div className="text-6xl font-bold text-[#ffc428] mb-3">01</div>
            <h3 className="text-xl font-bold mb-2 text-[#215387]">Składasz zapytanie transportowe</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Podajesz trasę, termin i liczbę pasażerów.
            </p>
          </div>

          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-28 h-28 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform">
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="text-6xl font-bold text-green-500 mb-3">02</div>
            <h3 className="text-xl font-bold mb-2 text-[#215387]">Lokalni Przewoźnicy przesyłają oferty</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Otrzymujesz konkurencyjne propozycje cenowe.
            </p>
          </div>

          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-28 h-28 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform">
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-6xl font-bold text-orange-500 mb-3">03</div>
            <h3 className="text-xl font-bold mb-2 text-[#215387]">Wybierasz najlepszą ofertę</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Akceptujesz warunki dopasowane do Twoich gości.
            </p>
          </div>

          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-28 h-28 bg-[#215387] rounded-2xl flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform">
                <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="text-6xl font-bold text-[#215387] mb-3">04</div>
            <h3 className="text-xl font-bold mb-2 text-[#215387]">Goście realizują przejazd</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Transport odbywa się bez zbędnej logistyki po Twojej stronie.
            </p>
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Dlaczego warto nam zaufać</h2>
          <p className="text-xl text-gray-600">Twój wybór transportu nigdy nie był tak prosty</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-2xl shadow-xl border-2 border-[#ffc428] hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#ffc428] to-[#f5b920] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-10 h-10 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-[#215387]">Prosty proces</h3>
                <p className="text-gray-700 leading-relaxed">
                  Składasz zapytanie, otrzymujesz oferty od przewoźników i wybierasz najlepszą — wszystko w jednym miejscu. Zapomnij o niekończących się telefonach i maelach!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-green-50 p-8 rounded-2xl shadow-xl border-2 border-[#ffc428] hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-[#215387]">Bezpieczeństwo i weryfikacja</h3>
                <p className="text-gray-700 leading-relaxed">
                  Współpracujemy wyłącznie ze sprawdzonymi lokalnymi przewoźnikami. Każdy przewoźnik jest weryfikowany, a opinie pasażerów są zawsze dostępne.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-orange-50 p-8 rounded-2xl shadow-xl border-2 border-[#ffc428] hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-[#215387]">Oszczędność czasu</h3>
                <p className="text-gray-700 leading-relaxed">
                  Zamiast dzwonić do wielu przewoźników — wszystko odbywa się w jednym miejscu. Średni czas odpowiedzi to tylko 11 minut!
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-purple-50 p-8 rounded-2xl shadow-xl border-2 border-[#ffc428] hover:shadow-2xl transition-all hover:scale-105">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#215387] to-[#1a4469] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3 text-[#215387]">Odpowiedzialny model współpracy</h3>
                <p className="text-gray-700 leading-relaxed">
                  Wayoo wspiera standardy ESG i porządkuje proces organizacji transportu po stronie hotelu. Razem budujemy lepszą przyszłość!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/*          🚐*/}

      {/*          🚌*/}

      {/*          🌱*/}


    </div>
  );
}
