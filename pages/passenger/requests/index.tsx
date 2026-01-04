import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { transportRequests, getOffersByRequestId } from '@/lib/data';
import type { Location } from '@/lib/types';

export default function PassengerRequestsPage() {
  const { currentUser } = useAuth();
  const [allRequests, setAllRequests] = useState(transportRequests);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  // Update current time every minute for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Load requests from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
    }
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

  const getStatusBadge = (status: string, expired: boolean = false) => {
    // Jeśli wygasło, pokaż pastylkę "Wygasło"
    if (expired && status === 'active') {
      return (
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-600">
          Wygasło
        </span>
      );
    }

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
        icon: (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ),
      },
      {
        id: 2,
        title: 'Przewoźnicy dostali informację',
        description: 'Twoje zapytanie jest widoczne dla przewoźników',
        status: request.status === 'active' ? 'active' as const : 'completed' as const,
        icon: request.status === 'active' ? (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ),
      },
      {
        id: 3,
        title: 'Sprawdź oferty przewoźników',
        description: `${pendingOffers.length > 0 ? `Otrzymano ${pendingOffers.length} ${pendingOffers.length === 1 ? 'ofertę' : 'oferty'}` : 'Oczekiwanie na oferty'}`,
        status: pendingOffers.length > 0 ? 'active' as const : 'pending' as const,
        icon: pendingOffers.length > 0 ? (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        id: 4,
        title: 'Wybierz ofertę i ruszaj w drogę',
        description: request.status === 'booked' || request.status === 'completed'
          ? 'Oferta zaakceptowana!'
          : 'Wybierz najlepszą ofertę',
        status: request.status === 'booked' || request.status === 'completed' ? 'completed' as const : 'pending' as const,
        icon: request.status === 'booked' || request.status === 'completed' ? (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ];
  };

  // Get latest request (most recent)
  const latestRequest = myRequests.length > 0 ? myRequests[0] : null;
  const latestOffers = latestRequest ? getOffersByRequestId(latestRequest.id) : [];
  const progressSteps = latestRequest ? getProgressSteps(latestRequest, latestOffers) : [];

  // Filter requests based on active tab (excluding the first one which is shown in progress section)
  const filteredRequests = myRequests.slice(1).filter((request) => {
    const timeRemaining = getTimeRemaining(request.createdAt);
    const isExpired = timeRemaining.expired;
    const isCompleted = request.status === 'completed' || request.status === 'cancelled' || request.status === 'booked' || isExpired;

    if (activeTab === 'active') {
      return !isCompleted;
    } else {
      return isCompleted;
    }
  });

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
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Compact Header */}
            <div className="bg-gradient-to-r from-[#215387] to-[#1a4469] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      {latestRequest.from.city.replace('województwo', '')} → {latestRequest.to.city.replace('województwo', '')}
                    </h2>
                    <div className="flex items-center gap-3 text-white/80 text-sm">
                      <span>{formatDate(latestRequest.departureDate).split(',')[0]}</span>
                      <span>•</span>
                      <span>{latestRequest.passengerCount} osób</span>
                      {(() => {
                        const distance = calculateDistance(latestRequest.from, latestRequest.to);
                        if (distance) {
                          return (
                            <>
                              <span>•</span>
                              <span>{distance} km</span>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {(() => {
                    const timeRemaining = getTimeRemaining(latestRequest.createdAt);
                    const colors = getTimeColor(timeRemaining.hours, timeRemaining.expired);

                    return (
                      <div className={`${colors.bg} px-4 py-2 rounded-lg border ${colors.border}`}>
                        <div className="flex items-center gap-2">
                          <svg className={`w-4 h-4 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className={`text-sm font-bold ${colors.text}`}>
                            {timeRemaining.expired ? 'Wygasło' : `${timeRemaining.hours}h ${timeRemaining.minutes}m`}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {getStatusBadge(latestRequest.status)}

                  <Link
                    href={`/passenger/requests/${latestRequest.id}`}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg transition-all font-medium text-sm flex items-center gap-1.5 border border-white/30"
                  >
                    Szczegóły
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Compact Stats */}
            <div className="p-5">
              {/* Additional Options - Compact */}
              {(latestRequest.hasWifi || latestRequest.hasAirConditioning || latestRequest.hasChildSeat || latestRequest.hasMoreSpace) && (
                <div className="flex flex-wrap gap-2 pb-1">
                  {latestRequest.hasWifi && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">WiFi</span>
                  )}
                  {latestRequest.hasAirConditioning && (
                    <span className="bg-cyan-100 text-cyan-700 px-2 py-1 rounded text-xs font-medium">Klimatyzacja</span>
                  )}
                  {latestRequest.hasChildSeat && (
                    <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded text-xs font-medium">Fotelik</span>
                  )}
                  {latestRequest.hasMoreSpace && (
                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-medium">Więcej miejsca</span>
                  )}
                </div>
              )}

            {/* Progress Steps - Horizontal */}
            <div className="relative">
              {/* Connecting Lines - positioned absolutely */}
              <div className="absolute top-8 left-0 right-0 px-8">
                <div className="grid grid-cols-4 gap-4">
                  {progressSteps.map((step, index) => (
                    <div key={`line-container-${step.id}`} className="relative flex justify-center">
                      {index < progressSteps.length - 1 && (
                        <div
                          className={`absolute left-1/2 top-0 h-1 ${
                            step.status === 'completed'
                              ? 'bg-green-500'
                              : 'bg-gray-300'
                          }`}
                          style={{
                            width: 'calc(100% + 1rem)',
                            marginLeft: '8px'
                          }}
                        />
                      )}
                    </div>
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
                          ? 'bg-[#ffc428] border-[#ffc428] text-[#215387]'
                          : 'bg-gray-100 border-gray-300 text-gray-400'
                      }`}
                    >
                      {step.icon}
                    </div>

                    {/* Step Content */}
                    <div
                      className={`w-full p-4 rounded-lg transition-all text-center min-h-[100px] flex flex-col ${
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

          {/* Info Text */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Informacja:</span> Średni czas ofert przewoźników na podobne zlecenia to <span className="font-bold">11 minut</span>
            </p>
          </div>
        </div>
      )}

      {/* All Requests List */}
      {myRequests.length > 1 && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Wszystkie zapytania</h2>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-3 font-semibold transition-all relative ${
                activeTab === 'active'
                  ? 'text-[#215387] border-b-2 border-[#ffc428]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Aktywne
              {myRequests.slice(1).filter((r) => {
                const timeRemaining = getTimeRemaining(r.createdAt);
                const isExpired = timeRemaining.expired;
                const isCompleted = r.status === 'completed' || r.status === 'cancelled' || r.status === 'booked' || isExpired;
                return !isCompleted;
              }).length > 0 && (
                <span className="ml-2 bg-[#ffc428] text-[#215387] px-2 py-0.5 rounded-full text-xs font-bold">
                  {myRequests.slice(1).filter((r) => {
                    const timeRemaining = getTimeRemaining(r.createdAt);
                    const isExpired = timeRemaining.expired;
                    const isCompleted = r.status === 'completed' || r.status === 'cancelled' || r.status === 'booked' || isExpired;
                    return !isCompleted;
                  }).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-3 font-semibold transition-all relative ${
                activeTab === 'completed'
                  ? 'text-[#215387] border-b-2 border-[#ffc428]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Zakończone
              {myRequests.slice(1).filter((r) => {
                const timeRemaining = getTimeRemaining(r.createdAt);
                const isExpired = timeRemaining.expired;
                const isCompleted = r.status === 'completed' || r.status === 'cancelled' || r.status === 'booked' || isExpired;
                return isCompleted;
              }).length > 0 && (
                <span className="ml-2 bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">
                  {myRequests.slice(1).filter((r) => {
                    const timeRemaining = getTimeRemaining(r.createdAt);
                    const isExpired = timeRemaining.expired;
                    const isCompleted = r.status === 'completed' || r.status === 'cancelled' || r.status === 'booked' || isExpired;
                    return isCompleted;
                  }).length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

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
        <div className="space-y-4">
          {/* Show filtered requests (excluding the first one which is shown above in progress section) */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-4xl mb-4">
                {activeTab === 'active' ? '📋' : '✓'}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'active' ? 'Brak aktywnych zapytań' : 'Brak zakończonych zapytań'}
              </h3>
              <p className="text-gray-600">
                {activeTab === 'active'
                  ? 'Wszystkie Twoje zapytania zostały zakończone'
                  : 'Nie masz jeszcze zakończonych zapytań'}
              </p>
            </div>
          ) : (
            filteredRequests.sort((a, b) => {
              const offersA = getOffersByRequestId(a.id).length;
              const offersB = getOffersByRequestId(b.id).length;
              // Sortuj malejąco po liczbie ofert (więcej ofert = wyżej)
              return offersB - offersA;
            }).map((request) => {
            const offers = getOffersByRequestId(request.id);
            const hasNewOffers = offers.filter(o => o.status === 'pending').length > 0;
            const timeRemaining = getTimeRemaining(request.createdAt);
            const isExpired = timeRemaining.expired;

            return (
              <div key={request.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden border border-gray-100">
                {/* Header with status badge */}
                <div className={`${isExpired ? 'bg-gradient-to-r from-gray-400 to-gray-500' : 'bg-gradient-to-r from-[#215387] to-[#1a4469]'} px-4 py-2 flex justify-between items-center`}>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(request.status, isExpired)}
                    <span className="text-white/80 text-xs">
                      Utworzono: {formatDate(request.createdAt).split(',')[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasNewOffers && !isExpired && (
                      <span className="bg-[#ffc428] text-[#215387] px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                        Nowe oferty!
                      </span>
                    )}
                    <button
                      className="px-2 py-1 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1 text-xs"
                      onClick={() => alert('Anulowanie - Demo')}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Anuluj
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  {/* Route with arrow */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#ffc428] rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium">Skąd</p>
                            <p className="text-lg font-bold text-gray-900">{request.from.city}</p>
                            {request.from.address && request.from.address !== request.from.city && (
                              <p className="text-xs text-gray-600">{request.from.address}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center px-2 gap-1">
                        <svg className="w-6 h-6 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        {(() => {
                          const distance = calculateDistance(request.from, request.to);
                          if (distance) {
                            return (
                              <div className="bg-[#ffc428] text-[#215387] px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap">
                                {distance} km
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 font-medium">Dokąd</p>
                            <p className="text-lg font-bold text-gray-900">{request.to.city}</p>
                            {request.to.address && request.to.address !== request.to.city && (
                              <p className="text-xs text-gray-600">{request.to.address}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                    {/* Data wyjazdu */}
                    <div className="bg-blue-50 rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-0.5">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-blue-600 font-medium">Data wyjazdu</span>
                      </div>
                      <p className="text-xs font-bold text-gray-900">{formatDate(request.departureDate).split(',')[0]}</p>
                      <p className="text-xs text-gray-600">{formatDate(request.departureDate).split(',')[1]}</p>
                    </div>

                    {/* Pasażerowie */}
                    <div className="bg-purple-50 rounded-lg p-2">
                      <div className="flex items-center gap-1 mb-0.5">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-xs text-purple-600 font-medium">Pasażerowie</span>
                      </div>
                      <p className="text-xs font-bold text-gray-900">{request.passengerCount} osób</p>
                    </div>

                    {/* Czas oferty */}
                    {(() => {
                      const colors = getTimeColor(timeRemaining.hours, timeRemaining.expired);

                      return (
                        <div className={`${colors.bg} rounded-lg p-2 border ${colors.border}`}>
                          <div className="flex items-center gap-1 mb-0.5">
                            <svg className={`w-4 h-4 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className={`text-xs ${colors.text} font-medium`}>Czas oferty</span>
                          </div>
                          {timeRemaining.expired ? (
                            <p className={`text-sm font-bold ${colors.text}`}>Wygasło</p>
                          ) : (
                            <p className={`text-base font-bold ${colors.text}`}>
                              {timeRemaining.hours}h {timeRemaining.minutes}m
                            </p>
                          )}
                        </div>
                      );
                    })()}

                    {/* Zobacz oferty - kafelek */}
                    <Link
                      href={`/passenger/requests/${request.id}`}
                      className={`rounded-lg p-2 transition-all cursor-pointer group ${
                        offers.length > 0
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-yellow-50 hover:bg-yellow-100'
                      }`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <svg className={`w-4 h-4 ${offers.length > 0 ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className={`text-xs font-medium ${offers.length > 0 ? 'text-white' : 'text-gray-500'}`}>Oferty</span>
                      </div>
                      <p className={`text-base font-bold group-hover:scale-105 transition-transform ${offers.length > 0 ? 'text-white' : 'text-gray-400'}`}>{offers.length}</p>
                      <p className={`text-xs ${offers.length > 0 ? 'text-white' : 'text-gray-500'}`}>Zobacz</p>
                    </Link>
                  </div>

                  {/* Zobacz szczegóły - przycisk */}
                  <div className="mt-3">
                    <Link
                      href={`/passenger/requests/${request.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#215387] text-white rounded-lg hover:bg-[#1a4469] transition-colors font-medium text-sm"
                    >
                      Zobacz szczegóły zapytania
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            );
          }))}
        </div>
      )}
      </div>
    </div>
  );
}
