import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { transportRequests, getOffersByRequestId } from '@/lib/data';
import type { Location } from '@/lib/types';

export default function PassengerRequestsPage() {
  const { currentUser } = useAuth();
  const [allRequests, setAllRequests] = useState(transportRequests);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expandedRequirements, setExpandedRequirements] = useState<Set<string>>(new Set());

  // Update current time every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

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

  // Filter requests for current user and sort by newest
  const myRequests = allRequests
    .filter((r) => r.userId === currentUser?.id)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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

  const getTimeRemaining = (createdAt: Date) => {
    const expiryTime = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours from creation
    const now = currentTime;
    const diff = expiryTime.getTime() - now.getTime();

    if (diff <= 0) {
      return { hours: 0, minutes: 0, expired: true };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, expired: false };
  };

  const getTimeColor = (hours: number, expired: boolean) => {
    if (expired) return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
    if (hours < 6) return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' };
    if (hours < 12) return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' };
    return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' };
  };

  const toggleRequirements = (requestId: string) => {
    setExpandedRequirements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (from: Location, to: Location): number | null => {
    if (!from.coordinates || !to.coordinates) return null;

    const R = 6371; // Earth's radius in km
    const dLat = (to.coordinates.lat - from.coordinates.lat) * Math.PI / 180;
    const dLon = (to.coordinates.lng - from.coordinates.lng) * Math.PI / 180;
    const lat1 = from.coordinates.lat * Math.PI / 180;
    const lat2 = to.coordinates.lat * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance);
  };

  // Get progress steps for a request
  const getProgressSteps = (request: typeof myRequests[0], offers: any[]) => {
    const pendingOffers = offers.filter(o => o.status === 'pending');

    return [
      {
        id: 1,
        title: 'Zlecenie zostało złożone',
        description: 'Twoje zapytanie zostało pomyślnie utworzone',
        status: 'completed' as const,
        icon: '✓',
      },
      {
        id: 2,
        title: 'Nasi przewoźnicy dostali informację',
        description: 'Twoje zapytanie jest widoczne dla przewoźników',
        status: request.status === 'active' ? 'active' as const : 'completed' as const,
        icon: request.status === 'active' ? '⏳' : '✓',
      },
      {
        id: 3,
        title: 'Sprawdź oferty przewoźników',
        description: `${pendingOffers.length > 0 ? `Otrzymano ${pendingOffers.length} ${pendingOffers.length === 1 ? 'ofertę' : 'oferty'}` : 'Oczekiwanie na oferty'}`,
        status: pendingOffers.length > 0 ? 'active' as const : 'pending' as const,
        icon: pendingOffers.length > 0 ? '⏳' : '○',
      },
      {
        id: 4,
        title: 'Wybierz ofertę i ruszaj w drogę',
        description: request.status === 'booked' || request.status === 'completed'
          ? 'Oferta zaakceptowana!'
          : 'Wybierz najlepszą ofertę',
        status: request.status === 'booked' || request.status === 'completed' ? 'completed' as const : 'pending' as const,
        icon: request.status === 'booked' || request.status === 'completed' ? '✓' : '○',
      },
    ];
  };

  // Get latest request (most recent)
  const latestRequest = myRequests.length > 0 ? myRequests[0] : null;
  const latestOffers = latestRequest ? getOffersByRequestId(latestRequest.id) : [];
  const progressSteps = latestRequest ? getProgressSteps(latestRequest, latestOffers) : [];

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

      {/* Latest Request Progress Section */}
      {latestRequest && (
        <div className="mb-12">
          <div className="bg-gradient-to-r from-[#215387] to-[#1a4469] rounded-t-2xl px-6 py-4">
            <h2 className="text-2xl font-bold text-white">Twoje ostatnie zapytanie</h2>
          </div>

          <div className="bg-white rounded-b-2xl shadow-xl border-2 border-[#ffc428] p-8">
            {/* Request Summary */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {latestRequest.from.city} → {latestRequest.to.city}
                  </h3>
                  {getStatusBadge(latestRequest.status)}
                </div>
                <Link
                  href={`/passenger/requests/${latestRequest.id}`}
                  className="text-[#215387] hover:text-[#1a4469] font-semibold flex items-center gap-2"
                >
                  Szczegóły
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(latestRequest.departureDate)}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {latestRequest.passengerCount} osób
                </div>
              </div>
            </div>

            {/* Progress Steps - Horizontal */}
            <div className="relative">
              {/* Horizontal Progress Line */}
              <div className="absolute top-8 left-0 right-0 flex items-center px-8">
                <div className="flex-1 flex items-center gap-4">
                  {progressSteps.map((step, index) => (
                    <React.Fragment key={`line-${step.id}`}>
                      {index > 0 && (
                        <div
                          className={`flex-1 h-1 ${
                            progressSteps[index - 1].status === 'completed'
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div className="grid grid-cols-4 gap-4">
                {progressSteps.map((step) => (
                  <div key={step.id} className="relative flex flex-col items-center">
                    {/* Step Icon */}
                    <div
                      className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 font-bold text-xl mb-4 ${
                        step.status === 'completed'
                          ? 'bg-green-500 border-green-500 text-white'
                          : step.status === 'active'
                          ? 'bg-[#ffc428] border-[#ffc428] text-[#215387] animate-pulse'
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                      }`}
                    >
                      {step.icon}
                    </div>

                    {/* Step Content */}
                    <div
                      className={`w-full p-4 rounded-lg transition-all text-center ${
                        step.status === 'active'
                          ? 'bg-yellow-50 border-2 border-[#ffc428]'
                          : step.status === 'completed'
                          ? 'bg-green-50 border-2 border-green-200'
                          : 'bg-gray-50 border-2 border-gray-200'
                      }`}
                    >
                      <h4
                        className={`font-bold mb-2 ${
                          step.status === 'pending' ? 'text-gray-400 text-sm' : 'text-gray-900 text-base'
                        }`}
                      >
                        {step.title}
                      </h4>
                      <p
                        className={`text-xs ${
                          step.status === 'pending' ? 'text-gray-400' : 'text-gray-600'
                        }`}
                      >
                        {step.description}
                      </p>

                      {/* Action Button for Step 3 */}
                      {step.id === 3 && latestOffers.filter(o => o.status === 'pending').length > 0 && (
                        <Link
                          href={`/passenger/requests/${latestRequest.id}`}
                          className="mt-3 inline-flex items-center gap-1 px-3 py-2 bg-[#215387] text-white rounded-lg hover:bg-[#1a4469] transition-colors font-semibold text-xs"
                        >
                          Zobacz
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Requests List */}
      <div>
        {myRequests.length > 1 && (
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Wszystkie zapytania</h2>
        )}
      </div>

      {/* Requests List */}
      <div>
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
          {/* Show all requests except the first one (which is shown above in progress section) */}
          {myRequests.slice(1).map((request) => {
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

                      <div className="flex flex-col items-center justify-center px-4 gap-2">
                        <svg className="w-8 h-8 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        {(() => {
                          const distance = calculateDistance(request.from, request.to);
                          if (distance) {
                            return (
                              <div className="bg-[#ffc428] text-[#215387] px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                                {distance} km
                              </div>
                            );
                          }
                          return null;
                        })()}
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

                    {(() => {
                      const timeRemaining = getTimeRemaining(request.createdAt);
                      const colors = getTimeColor(timeRemaining.hours, timeRemaining.expired);

                      return (
                        <div className={`${colors.bg} rounded-lg p-4 border-2 ${colors.border}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <svg className={`w-5 h-5 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className={`text-xs ${colors.text} font-medium`}>Czas oferty</span>
                          </div>
                          {timeRemaining.expired ? (
                            <p className={`text-lg font-bold ${colors.text}`}>Wygasło</p>
                          ) : (
                            <p className={`text-2xl font-bold ${colors.text}`}>
                              {timeRemaining.hours}h {timeRemaining.minutes}m
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Wymagania specjalne */}
                    {request.specialRequirements && (
                      <div className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          <span className="text-xs text-indigo-600 font-medium">Wymagania specjalne</span>
                        </div>
                        <div>
                          <p className={`text-sm text-gray-700 ${!expandedRequirements.has(request.id) ? 'line-clamp-2' : ''}`}>
                            {request.specialRequirements}
                          </p>
                          {request.specialRequirements.length > 80 && (
                            <button
                              onClick={() => toggleRequirements(request.id)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1"
                            >
                              {expandedRequirements.has(request.id) ? '▲ Zwiń' : '▼ Rozwiń'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

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
  );
}
