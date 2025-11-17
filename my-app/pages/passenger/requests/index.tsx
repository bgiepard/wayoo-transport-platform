import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { transportRequests, getOffersByRequestId } from '@/lib/data';

export default function PassengerRequestsPage() {
  const { currentUser } = useAuth();
  const [allRequests, setAllRequests] = useState(transportRequests);
  const [searchCity, setSearchCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Load requests from localStorage on mount
  useEffect(() => {
    const savedRequests = JSON.parse(localStorage.getItem('transportRequests') || '[]');
    // Convert date strings back to Date objects and merge with static data
    const parsedRequests = savedRequests.map((req: any) => ({
      ...req,
      departureDate: new Date(req.departureDate),
      returnDate: req.returnDate ? new Date(req.returnDate) : undefined,
      createdAt: new Date(req.createdAt),
      updatedAt: new Date(req.updatedAt),
    }));
    setAllRequests([...parsedRequests, ...transportRequests]);
  }, []);

  // Filter requests for current user
  let myRequests = allRequests.filter((r) => r.userId === currentUser?.id);

  // Apply filters
  if (searchCity) {
    myRequests = myRequests.filter(
      (r) =>
        r.from.city.toLowerCase().includes(searchCity.toLowerCase()) ||
        r.to.city.toLowerCase().includes(searchCity.toLowerCase())
    );
  }

  if (filterStatus !== 'all') {
    myRequests = myRequests.filter((r) => r.status === filterStatus);
  }

  // Apply sorting
  myRequests = [...myRequests].sort((a, b) => {
    if (sortBy === 'newest') {
      return b.createdAt.getTime() - a.createdAt.getTime();
    } else if (sortBy === 'oldest') {
      return a.createdAt.getTime() - b.createdAt.getTime();
    } else if (sortBy === 'date-asc') {
      return a.departureDate.getTime() - b.departureDate.getTime();
    } else if (sortBy === 'date-desc') {
      return b.departureDate.getTime() - a.departureDate.getTime();
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

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      offers_received: 'bg-blue-100 text-blue-800',
      booked: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const labels = {
      active: 'Aktywne',
      offers_received: 'Otrzymano oferty',
      booked: 'Zarezerwowane',
      completed: 'Zrealizowane',
      cancelled: 'Anulowane',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Moje Zapytania</h1>
          <p className="text-gray-600">Zarządzaj swoimi zapytaniami o transport</p>
        </div>
        <Link
          href="/passenger/new-request"
          className="bg-[#ffc428] text-[#215387] px-6 py-3 rounded-lg hover:bg-[#f5b920] transition-colors font-semibold shadow-lg hover:shadow-xl"
        >
          + Nowe Zapytanie
        </Link>
      </div>

      {/* Layout with sidebar */}
      <div className="grid md:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Filtry</h3>

            {/* Search by city */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Szukaj po trasie
              </label>
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="np. Kraków, Warszawa"
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
              />
            </div>

            {/* Status filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
              >
                <option value="all">Wszystkie</option>
                <option value="active">Aktywne</option>
                <option value="offers_received">Otrzymano oferty</option>
                <option value="booked">Zarezerwowane</option>
                <option value="completed">Zrealizowane</option>
                <option value="cancelled">Anulowane</option>
              </select>
            </div>

            {/* Sort by */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sortuj po
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
              >
                <option value="newest">Najnowsze</option>
                <option value="oldest">Najstarsze</option>
                <option value="date-asc">Data wyjazdu (rosnąco)</option>
                <option value="date-desc">Data wyjazdu (malejąco)</option>
              </select>
            </div>

            {/* Reset filters */}
            <button
              onClick={() => {
                setSearchCity('');
                setFilterStatus('all');
                setSortBy('newest');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Wyczyść filtry
            </button>

            {/* Stats */}
            <div className="mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  Znaleziono: <span className="font-bold text-[#215387]">{myRequests.length}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Requests List */}
        <div className="md:col-span-3">
      {myRequests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Brak zapytań</h2>
          <p className="text-gray-600 mb-6">Stwórz swoje pierwsze zapytanie o transport</p>
          <Link
            href="/passenger/new-request"
            className="inline-block bg-[#ffc428] text-white px-6 py-3 rounded-lg hover:bg-[#f5b920] transition-colors font-semibold"
          >
            Utwórz Zapytanie
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {myRequests.map((request) => {
            const offers = getOffersByRequestId(request.id);
            const hasNewOffers = offers.filter(o => o.status === 'pending').length > 0;

            return (
              <div key={request.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden border border-gray-100">
                {/* Header with status badge */}
                <div className="bg-gradient-to-r from-[#215387] to-[#1a4469] px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(request.status)}
                    <span className="text-white/80 text-sm">
                      Utworzono: {formatDate(request.createdAt).split(',')[0]}
                    </span>
                  </div>
                  {hasNewOffers && (
                    <span className="bg-[#ffc428] text-[#215387] px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                      Nowe oferty!
                    </span>
                  )}
                </div>

                <div className="p-6">
                  {/* Route with arrow */}
                  <div className="mb-6">
                    <div className="flex items-center gap-4 mb-3">
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
                            <p className="text-2xl font-bold text-gray-900">{request.from.city}</p>
                            {request.from.address && request.from.address !== request.from.city && (
                              <p className="text-sm text-gray-600">{request.from.address}</p>
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
                            <p className="text-2xl font-bold text-gray-900">{request.to.city}</p>
                            {request.to.address && request.to.address !== request.to.city && (
                              <p className="text-sm text-gray-600">{request.to.address}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-blue-600 font-medium">Data wyjazdu</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{formatDate(request.departureDate).split(',')[0]}</p>
                      <p className="text-xs text-gray-600">{formatDate(request.departureDate).split(',')[1]}</p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-xs text-purple-600 font-medium">Pasażerowie</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{request.passengerCount} osób</p>
                    </div>

                    {request.isRoundTrip && (
                      <div className="bg-amber-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span className="text-xs text-amber-600 font-medium">Typ</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900">Powrót</p>
                        {request.returnDate && (
                          <p className="text-xs text-gray-600">{formatDate(request.returnDate).split(',')[0]}</p>
                        )}
                      </div>
                    )}

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs text-green-600 font-medium">Oferty</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{offers.length}</p>
                    </div>
                  </div>

                  {/* Additional info */}
                  {(request.specialRequirements || request.budget?.max) && (
                    <div className="flex gap-3 mb-6">
                      {request.budget?.max && (
                        <div className="flex-1 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <p className="text-xs text-green-700 font-medium mb-1">Maksymalny budżet</p>
                          <p className="text-lg font-bold text-green-700">{request.budget.max} PLN</p>
                        </div>
                      )}
                      {request.specialRequirements && (
                        <div className="flex-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs text-blue-700 font-medium mb-1">Wymagania specjalne</p>
                          <p className="text-sm text-gray-700 line-clamp-2">{request.specialRequirements}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Link
                      href={`/passenger/requests/${request.id}`}
                      className="flex-1 text-center bg-[#ffc428] text-[#215387] py-3 px-6 rounded-lg hover:bg-[#f5b920] transition-all font-bold shadow-md hover:shadow-lg hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Zobacz oferty ({offers.length})
                    </Link>
                    <button
                      className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                      onClick={() => alert('Edycja - Demo')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="hidden md:inline">Edytuj</span>
                    </button>
                    <button
                      className="px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                      onClick={() => alert('Anulowanie - Demo')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="hidden md:inline">Anuluj</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
