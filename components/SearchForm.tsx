import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import PlaceAutocomplete from '@/components/PlaceAutocomplete';
import 'leaflet/dist/leaflet.css';

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

export interface FormData {
  fromCity: string;
  toCity: string;
  stops: string[];
  passengerCount: string;
  departureDate: string;
  departureTime: string;
  hasWifi: boolean;
  hasAirConditioning: boolean;
  hasChildSeat: boolean;
  hasMoreSpace: boolean;
  moreSpaceDescription: string;
  numberOfChildren: number;
  childrenAges: number[];
  additionalDescription: string;
  luggageInfo: string;
  specialRequirements: string;
}

interface SearchFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  handleSubmit: (e: React.FormEvent) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setShowRouteModal: (show: boolean) => void;
  getRouteDisplayText: () => string;
  addStop: () => void;
  removeStop: (index: number) => void;
  updateStop: (index: number, value: string) => void;
  geocodeCity: (city: string) => Promise<{ lat: number; lng: number } | null>;
  getRoute: (waypoints: { lat: number; lng: number }[]) => Promise<void>;
  updateRoute: () => Promise<void>;
  routeCoordinates: {
    from?: { lat: number; lng: number };
    to?: { lat: number; lng: number };
  };
  routePath: [number, number][];
  allWaypoints: { lat: number; lng: number }[];
  isLoadingRoute: boolean;
  routeReady: boolean;
}

export default function SearchForm({
  formData,
  setFormData,
  handleSubmit,
  handleChange,
  setShowRouteModal,
  getRouteDisplayText,
  addStop,
  removeStop,
  updateStop,
  geocodeCity,
  getRoute,
  updateRoute,
  routeCoordinates,
  routePath,
  allWaypoints,
  isLoadingRoute,
  routeReady,
}: SearchFormProps) {
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
  const [showRouteDropdown, setShowRouteDropdown] = useState(false);
  const [routeDropdownStep, setRouteDropdownStep] = useState<1 | 2>(1);
  const [mapMounted, setMapMounted] = useState(false);
  const dateTimePickerRef = useRef<HTMLDivElement>(null);
  const routeDropdownRef = useRef<HTMLDivElement>(null);

  // Set map mounted
  useEffect(() => {
    setMapMounted(true);
  }, []);

  // Handle proceed to step 2
  const handleProceedToStep2 = async () => {
    if (!formData.fromCity || !formData.toCity) {
      alert('Proszę wypełnić pola "Skąd" i "Dokąd"');
      return;
    }

    const hasEmptyStops = formData.stops.some((stop) => stop === '');
    if (hasEmptyStops) {
      alert('Proszę wypełnić wszystkie przystanki lub je usunąć');
      return;
    }

    setRouteDropdownStep(2);
    await updateRoute();
  };

  // Handle save route
  const handleSaveRoute = () => {
    setShowRouteDropdown(false);
    setRouteDropdownStep(1);
  };

  return (
    <div className="mt-12 px-4 relative">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-4 relative" style={{ zIndex: 1 }}>
        {/* Nowy layout - podobny do wakacje.pl */}
        <div className="flex items-stretch">
          {/* Kolumna 1 - Trasa */}
          <div className="flex-1 min-w-0 relative" ref={routeDropdownRef}>
            <button
              type="button"
              onClick={() => setShowRouteDropdown(!showRouteDropdown)}
              className="w-full h-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-shrink-0 text-[#215387]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#215387] mb-0.5">Skąd - Dokąd</p>
                <p className="text-sm text-gray-900 truncate">
                  {getRouteDisplayText() || 'Wybierz trasę'}
                </p>
              </div>
            </button>

            {/* Dropdown wyboru trasy */}
            {showRouteDropdown && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-6" style={{ minWidth: '600px', maxWidth: '1200px' }}>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-[#215387]">
                      {routeDropdownStep === 1 ? 'Wybierz trasę' : 'Podgląd trasy'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${routeDropdownStep === 1 ? 'bg-[#ffc428] text-[#215387]' : 'bg-green-500 text-white'}`}>
                        1
                      </div>
                      <div className="w-8 h-0.5 bg-gray-300"></div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${routeDropdownStep === 2 ? 'bg-[#ffc428] text-[#215387]' : 'bg-gray-300 text-gray-500'}`}>
                        2
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRouteDropdown(false);
                      setRouteDropdownStep(1);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {routeDropdownStep === 1 && (
                  <div className="space-y-4 max-w-xl mx-auto">
                    <div>
                      <label className="block text-left text-sm font-semibold text-[#215387] mb-2">Skąd</label>
                      <PlaceAutocomplete
                        value={formData.fromCity}
                        onChange={(value) => {
                          setFormData((prev) => ({ ...prev, fromCity: value }));
                        }}
                        onSelect={() => {}}
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
                              onSelect={() => {}}
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
                        onSelect={() => {}}
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

                {routeDropdownStep === 2 && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                      <h4 className="text-sm font-semibold text-[#215387] mb-2">Twoja trasa:</h4>
                      <p className="text-lg font-bold text-gray-900">{getRouteDisplayText()}</p>
                    </div>

                    <div className="bg-gray-100 rounded-xl overflow-hidden relative" style={{ minHeight: '400px', height: '400px' }}>
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
                        onClick={() => setRouteDropdownStep(1)}
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
            )}
          </div>

          {/* Kolumna 2 - Data i godzina */}
          <div className="flex-1 min-w-0 relative border-l border-gray-200" ref={dateTimePickerRef}>
            <button
              type="button"
              onClick={() => setShowDateTimePicker(true)}
              className="w-full h-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-shrink-0 text-[#215387]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#215387] mb-0.5">Kiedy?</p>
                <p className="text-sm text-gray-900 truncate">
                  {`${new Date(formData.departureDate).toLocaleDateString('pl-PL')} ${formData.departureTime}`}
                </p>
              </div>
            </button>

            {/* Dropdown */}
            {showDateTimePicker && (
              <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4 left-0">
                <div className="space-y-4">
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
                  <div>
                    <label className="block text-sm font-semibold text-[#215387] mb-2">Godzina</label>
                    <input
                      type="time"
                      value={formData.departureTime}
                      onChange={(e) => setFormData((prev) => ({ ...prev, departureTime: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                    />
                  </div>
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

          {/* Kolumna 3 - Liczba pasażerów */}
          <div className="flex-1 min-w-0 border-l border-gray-200">
            <button
              type="button"
              className="w-full h-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-shrink-0 text-[#215387]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#215387] mb-0.5">Ile osób?</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newCount = Math.max(1, parseInt(formData.passengerCount) - 1);
                      handleChange({ target: { name: 'passengerCount', value: newCount.toString() } } as any);
                    }}
                    className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-[#215387] font-bold"
                  >
                    -
                  </button>
                  <span className="text-sm font-semibold text-gray-900 min-w-[30px] text-center">
                    {formData.passengerCount} os.
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newCount = parseInt(formData.passengerCount) + 1;
                      handleChange({ target: { name: 'passengerCount', value: newCount.toString() } } as any);
                    }}
                    className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-[#215387] font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </button>
          </div>

          {/* Kolumna 4 - Dodatkowe opcje */}
          <div className="flex-1 min-w-0 relative border-l border-gray-200">
            <button
              type="button"
              onClick={() => setShowAdditionalOptions(!showAdditionalOptions)}
              className="w-full h-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex-shrink-0 text-[#215387]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#215387] mb-0.5">Opcje dodatkowe</p>
                <p className="text-sm text-gray-900 truncate">
                  {[
                    formData.hasWifi && 'WiFi',
                    formData.hasAirConditioning && 'Klimatyzacja',
                    formData.hasChildSeat && 'Fotelik',
                    formData.hasMoreSpace && 'Więcej miejsca'
                  ].filter(Boolean).join(', ') || 'Brak'}
                </p>
              </div>
              <svg
                className={`w-4 h-4 transition-transform flex-shrink-0 ${showAdditionalOptions ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown panel */}
            {showAdditionalOptions && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4" style={{ minWidth: '250px' }}>
                <div className="space-y-3">
                  {/* WiFi */}
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.hasWifi}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hasWifi: e.target.checked }))}
                      className="w-4 h-4 rounded border-2 border-gray-300 text-[#ffc428] focus:ring-2 focus:ring-[#ffc428]"
                    />
                    <svg className="w-4 h-4 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                    <span className="text-xs font-medium text-gray-700">WiFi</span>
                  </label>

                  {/* Klimatyzacja */}
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.hasAirConditioning}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hasAirConditioning: e.target.checked }))}
                      className="w-4 h-4 rounded border-2 border-gray-300 text-[#ffc428] focus:ring-2 focus:ring-[#ffc428]"
                    />
                    <svg className="w-4 h-4 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-700">Klimatyzacja</span>
                  </label>

                  {/* Fotelik */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.hasChildSeat}
                        onChange={(e) => setFormData((prev) => ({
                          ...prev,
                          hasChildSeat: e.target.checked,
                          numberOfChildren: e.target.checked ? prev.numberOfChildren : 1,
                          childrenAges: e.target.checked ? prev.childrenAges : []
                        }))}
                        className="w-4 h-4 rounded border-2 border-gray-300 text-[#ffc428] focus:ring-2 focus:ring-[#ffc428]"
                      />
                      <svg className="w-4 h-4 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Fotelik</span>
                    </label>

                    {/* Rozwijane pola dla fotelika */}
                    {formData.hasChildSeat && (
                      <div className="mt-2 ml-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="block text-xs font-semibold text-[#215387] mb-2">
                          Liczba dzieci
                        </label>
                        <div className="flex items-center gap-3 mb-3">
                          {/* Przycisk minus */}
                          <button
                            type="button"
                            onClick={() => {
                              const newCount = Math.max(1, formData.numberOfChildren - 1);
                              const newAges = formData.childrenAges.slice(0, newCount);
                              setFormData((prev) => ({
                                ...prev,
                                numberOfChildren: newCount,
                                childrenAges: newAges
                              }));
                            }}
                            className="w-7 h-7 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center font-bold text-[#215387]"
                          >
                            -
                          </button>

                          {/* Wyświetlanie liczby */}
                          <span className="w-8 text-center font-bold text-[#215387]">
                            {formData.numberOfChildren}
                          </span>

                          {/* Przycisk plus */}
                          <button
                            type="button"
                            onClick={() => {
                              const newCount = Math.min(10, formData.numberOfChildren + 1);
                              setFormData((prev) => ({
                                ...prev,
                                numberOfChildren: newCount
                              }));
                            }}
                            className="w-7 h-7 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center font-bold text-[#215387]"
                          >
                            +
                          </button>
                        </div>

                        {/* Pola wiekowe dla każdego dziecka */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#215387] mb-1">
                            Wiek dzieci (w latach)
                          </label>
                          {Array.from({ length: formData.numberOfChildren }).map((_, index) => (
                            <input
                              key={index}
                              type="number"
                              min="0"
                              max="17"
                              value={formData.childrenAges[index] || ''}
                              onChange={(e) => {
                                const newAges = [...formData.childrenAges];
                                newAges[index] = parseInt(e.target.value) || 0;
                                setFormData((prev) => ({
                                  ...prev,
                                  childrenAges: newAges
                                }));
                              }}
                              placeholder={`Dziecko ${index + 1}`}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#ffc428] focus:border-[#ffc428]"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Więcej miejsca */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.hasMoreSpace}
                        onChange={(e) => setFormData((prev) => ({
                          ...prev,
                          hasMoreSpace: e.target.checked,
                          moreSpaceDescription: e.target.checked ? prev.moreSpaceDescription : ''
                        }))}
                        className="w-4 h-4 rounded border-2 border-gray-300 text-[#ffc428] focus:ring-2 focus:ring-[#ffc428]"
                      />
                      <svg className="w-4 h-4 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Więcej miejsca</span>
                    </label>

                    {/* Pole opisu dla więcej miejsca */}
                    {formData.hasMoreSpace && (
                      <div className="mt-2 ml-6">
                        <textarea
                          value={formData.moreSpaceDescription}
                          onChange={(e) => setFormData((prev) => ({
                            ...prev,
                            moreSpaceDescription: e.target.value
                          }))}
                          placeholder="Opisz swoje potrzeby, np. ilość bagażu, sprzęt sportowy..."
                          rows={3}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#ffc428] focus:border-[#ffc428] resize-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Przycisk Zamknij */}
                  <button
                    type="button"
                    onClick={() => setShowAdditionalOptions(false)}
                    className="w-full mt-2 px-3 py-2 bg-[#ffc428] text-[#215387] rounded-lg hover:bg-[#f5b920] transition-all font-bold text-xs"
                  >
                    Zamknij
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Kolumna 5 - Przycisk Submit */}
          <div className="flex items-center px-4">
            <button
              type="submit"
              className="px-8 py-3 text-base bg-[#ffc428] text-[#215387] rounded-xl hover:bg-[#f5b920] transition-all font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 whitespace-nowrap"
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
  );
}
