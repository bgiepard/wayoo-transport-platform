import Link from 'next/link';
import { useState } from 'react';
import { transportRequests, getOffersByRequestId, offers } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { getCarrierByUserId } from '@/lib/data';
import dynamic from 'next/dynamic';
import { calculateDistance, formatDistance } from '@/lib/distance';

const RequestsMap = dynamic(() => import('@/components/RequestsMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 rounded-xl flex items-center justify-center">
      <div className="text-gray-500">Ładowanie mapy...</div>
    </div>
  ),
});

export default function CarrierRequestsPage() {
  const { currentUser } = useAuth();
  const carrier = currentUser ? getCarrierByUserId(currentUser.id) : null;
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [filterCity, setFilterCity] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Advanced filters
  const [minDistance, setMinDistance] = useState<number>(0);
  const [maxDistance, setMaxDistance] = useState<number>(1000);
  const [minBudget, setMinBudget] = useState<number>(0);
  const [maxBudget, setMaxBudget] = useState<number>(10000);

  // Get only active requests
  let activeRequests = transportRequests.filter((r) =>
    r.status === 'active' || r.status === 'offers_received'
  );

  // Apply city filter
  if (filterCity) {
    activeRequests = activeRequests.filter(
      (r) =>
        r.from.city.toLowerCase().includes(filterCity.toLowerCase()) ||
        r.to.city.toLowerCase().includes(filterCity.toLowerCase())
    );
  }

  // Apply distance filter
  activeRequests = activeRequests.filter((r) => {
    if (!r.from.coordinates || !r.to.coordinates) return true;
    const distance = calculateDistance(
      r.from.coordinates.lat,
      r.from.coordinates.lng,
      r.to.coordinates.lat,
      r.to.coordinates.lng
    );
    return distance >= minDistance && distance <= maxDistance;
  });

  // Apply budget filter
  activeRequests = activeRequests.filter((r) => {
    if (!r.budget?.max) return true;
    return r.budget.max >= minBudget && r.budget.max <= maxBudget;
  });

  // Apply sorting
  activeRequests = [...activeRequests].sort((a, b) => {
    if (sortBy === 'newest') {
      return b.createdAt.getTime() - a.createdAt.getTime();
    } else if (sortBy === 'oldest') {
      return a.createdAt.getTime() - b.createdAt.getTime();
    } else if (sortBy === 'distance-asc') {
      const distA =
        a.from.coordinates && a.to.coordinates
          ? calculateDistance(
              a.from.coordinates.lat,
              a.from.coordinates.lng,
              a.to.coordinates.lat,
              a.to.coordinates.lng
            )
          : 0;
      const distB =
        b.from.coordinates && b.to.coordinates
          ? calculateDistance(
              b.from.coordinates.lat,
              b.from.coordinates.lng,
              b.to.coordinates.lat,
              b.to.coordinates.lng
            )
          : 0;
      return distA - distB;
    } else if (sortBy === 'distance-desc') {
      const distA =
        a.from.coordinates && a.to.coordinates
          ? calculateDistance(
              a.from.coordinates.lat,
              a.from.coordinates.lng,
              a.to.coordinates.lat,
              a.to.coordinates.lng
            )
          : 0;
      const distB =
        b.from.coordinates && b.to.coordinates
          ? calculateDistance(
              b.from.coordinates.lat,
              b.from.coordinates.lng,
              b.to.coordinates.lat,
              b.to.coordinates.lng
            )
          : 0;
      return distB - distA;
    } else if (sortBy === 'budget-asc') {
      return (a.budget?.max || 0) - (b.budget?.max || 0);
    } else if (sortBy === 'budget-desc') {
      return (b.budget?.max || 0) - (a.budget?.max || 0);
    }
    return 0;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const hasMyOffer = (requestId: string) => {
    if (!carrier) return false;
    return offers.some((o) => o.requestId === requestId && o.carrierId === carrier.id);
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="px-4 py-6 border-b bg-white">
        <div className="max-w-[1800px] mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Dostępne Zapytania</h1>
          <p className="text-gray-600">Przeglądaj zapytania i składaj oferty</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-[1800px] mx-auto px-4 py-6">
          {/* Filters at top */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            {/* First row - basic filters */}
            <div className="flex items-center gap-4 mb-4">
              {/* Search by city */}
              <div className="flex-1">
                <input
                  type="text"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  placeholder="🔍 Szukaj po trasie (np. Kraków, Warszawa)"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                />
              </div>

              {/* Sort by */}
              <div className="w-64">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                >
                  <option value="newest">Najnowsze</option>
                  <option value="oldest">Najstarsze</option>
                  <option value="distance-asc">Dystans ↑</option>
                  <option value="distance-desc">Dystans ↓</option>
                  <option value="budget-asc">Budżet ↑</option>
                  <option value="budget-desc">Budżet ↓</option>
                </select>
              </div>

              {/* Toggle advanced filters */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`px-4 py-2 border-2 rounded-lg transition-all text-sm font-medium whitespace-nowrap ${
                  showAdvancedFilters
                    ? 'border-[#ffc428] bg-[#ffc428] text-[#215387]'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {showAdvancedFilters ? '▲ Ukryj filtry' : '▼ Więcej filtrów'}
              </button>

              {/* Reset filters */}
              <button
                onClick={() => {
                  setFilterCity('');
                  setSortBy('newest');
                  setMinDistance(0);
                  setMaxDistance(1000);
                  setMinBudget(0);
                  setMaxBudget(10000);
                }}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium whitespace-nowrap"
              >
                Wyczyść
              </button>

              {/* Stats */}
              <div className="text-sm text-gray-600 whitespace-nowrap">
                Znaleziono: <span className="font-bold text-[#215387]">{activeRequests.length}</span>
              </div>
            </div>

            {/* Advanced filters - collapsible */}
            {showAdvancedFilters && (
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-6">
                  {/* Distance range filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Dystans trasy
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="10"
                          value={minDistance}
                          onChange={(e) => setMinDistance(Number(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ffc428]"
                        />
                        <div className="w-24 text-center">
                          <div className="text-xs text-gray-500">Min</div>
                          <div className="text-sm font-bold text-[#215387]">{minDistance} km</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="10"
                          value={maxDistance}
                          onChange={(e) => setMaxDistance(Number(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ffc428]"
                        />
                        <div className="w-24 text-center">
                          <div className="text-xs text-gray-500">Max</div>
                          <div className="text-sm font-bold text-[#215387]">{maxDistance} km</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Budget range filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Budżet (PLN)
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          step="100"
                          value={minBudget}
                          onChange={(e) => setMinBudget(Number(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ffc428]"
                        />
                        <div className="w-24 text-center">
                          <div className="text-xs text-gray-500">Min</div>
                          <div className="text-sm font-bold text-green-600">{minBudget} PLN</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          step="100"
                          value={maxBudget}
                          onChange={(e) => setMaxBudget(Number(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#ffc428]"
                        />
                        <div className="w-24 text-center">
                          <div className="text-xs text-gray-500">Max</div>
                          <div className="text-sm font-bold text-green-600">{maxBudget} PLN</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Two columns - List and Map */}
          <div className="h-[calc(100vh-240px)] flex gap-6">
            {/* Left column - Requests list */}
            <div className="flex-1 flex flex-col min-w-0">

              {/* Requests List with scroll */}
              <div className="flex-1 overflow-y-auto pr-2">
                {activeRequests.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-md p-12 text-center">
                    <div className="text-6xl mb-4">📭</div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Brak dostępnych zapytań
                    </h2>
                    <p className="text-gray-600">Sprawdź ponownie później</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeRequests.map((request) => {
                      const requestOffers = getOffersByRequestId(request.id);
                      const myOfferExists = hasMyOffer(request.id);
                      const isSelected = selectedRequestId === request.id;

                      // Calculate distance if coordinates are available
                      const distance =
                        request.from.coordinates && request.to.coordinates
                          ? calculateDistance(
                              request.from.coordinates.lat,
                              request.from.coordinates.lng,
                              request.to.coordinates.lat,
                              request.to.coordinates.lng
                            )
                          : null;

                      return (
                        <div
                          key={request.id}
                          onMouseEnter={() => setSelectedRequestId(request.id)}
                          onMouseLeave={() => setSelectedRequestId(null)}
                          className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border ${
                            isSelected
                              ? 'border-[#ffc428] ring-2 ring-[#ffc428]'
                              : 'border-gray-100'
                          }`}
                        >
                          {/* Header with gradient */}
                          <div className="bg-gradient-to-r from-[#215387] to-[#1a4469] px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              {distance && (
                                <span className="px-4 py-1.5 bg-[#ffc428] text-[#215387] rounded-full text-sm font-bold shadow-md flex items-center gap-1.5">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                  </svg>
                                  {formatDistance(distance)}
                                </span>
                              )}
                              {myOfferExists && (
                                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">
                                  ✓ Złożono ofertę
                                </span>
                              )}
                            </div>
                            <span className="text-white/80 text-sm">
                              {requestOffers.length} {requestOffers.length === 1 ? 'oferta' : 'ofert'}
                            </span>
                          </div>

                          <div className="p-6">
                            {/* Route with arrow */}
                            <div className="mb-6">
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-[#ffc428] rounded-full flex items-center justify-center flex-shrink-0">
                                      <svg className="w-6 h-6 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm text-gray-500 font-medium">Skąd</p>
                                      <p className="text-xl font-bold text-gray-900">{request.from.city}</p>
                                      {request.from.address && request.from.address !== request.from.city && (
                                        <p className="text-xs text-gray-600">{request.from.address}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-center px-4">
                                  <svg className="w-8 h-8 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                  </svg>
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                      </svg>
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm text-gray-500 font-medium">Dokąd</p>
                                      <p className="text-xl font-bold text-gray-900">{request.to.city}</p>
                                      {request.to.address && request.to.address !== request.to.city && (
                                        <p className="text-xs text-gray-600">{request.to.address}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Details grid */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                              <div className="bg-blue-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-xs text-blue-600 font-medium">Data</span>
                                </div>
                                <p className="text-xs font-bold text-gray-900">{formatDate(request.departureDate).split(',')[0]}</p>
                              </div>

                              <div className="bg-purple-50 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                  <span className="text-xs text-purple-600 font-medium">Osoby</span>
                                </div>
                                <p className="text-xs font-bold text-gray-900">{request.passengerCount}</p>
                              </div>

                              {request.budget?.max && (
                                <div className="bg-green-50 rounded-lg p-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-xs text-green-600 font-medium">Budżet</span>
                                  </div>
                                  <p className="text-xs font-bold text-green-700">{request.budget.max} PLN</p>
                                </div>
                              )}
                            </div>

                            {/* Additional info */}
                            {request.specialRequirements && (
                              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-xs text-blue-700 font-medium mb-1">Wymagania</p>
                                <p className="text-sm text-gray-700 line-clamp-2">{request.specialRequirements}</p>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t">
                              {myOfferExists ? (
                                <>
                                  <Link
                                    href={`/carrier/requests/${request.id}`}
                                    className="flex-1 text-center bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-all font-bold shadow-md hover:shadow-lg hover:scale-105"
                                  >
                                    Zobacz szczegóły
                                  </Link>
                                  <button
                                    onClick={() => alert('Edycja oferty - Demo')}
                                    className="px-4 py-2 border-2 border-purple-300 text-[#215387] rounded-lg hover:bg-purple-50 transition-colors"
                                  >
                                    Edytuj
                                  </button>
                                </>
                              ) : (
                                <>
                                  <Link
                                    href={`/carrier/requests/${request.id}`}
                                    className="flex-1 text-center bg-[#ffc428] text-[#215387] py-3 px-6 rounded-lg hover:bg-[#f5b920] transition-all font-bold shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Złóż ofertę
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right column - Map */}
            <div className="flex-1">
              <RequestsMap requests={activeRequests} selectedRequestId={selectedRequestId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
