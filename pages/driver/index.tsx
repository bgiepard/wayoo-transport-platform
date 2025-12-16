import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getCarrierByUserId, transportRequests, offers, vehicles } from '@/lib/data';

export default function DriverDashboard() {
  const { currentUser } = useAuth();
  const carrier = currentUser ? getCarrierByUserId(currentUser.id) : null;

  // Get stats
  const activeRequests = transportRequests.filter(
    (r) => r.status === 'active' || r.status === 'offers_received'
  );
  const myOffers = carrier ? offers.filter((o) => o.carrierId === carrier.id) : [];
  const myVehicles = carrier ? vehicles.filter((v) => v.carrierId === carrier.id) : [];
  const pendingOffers = myOffers.filter((o) => o.status === 'pending');
  const acceptedOffers = myOffers.filter((o) => o.status === 'accepted');

  // Get latest requests (last 5)
  const latestRequests = [...activeRequests]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 5);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#215387] to-[#1a4469] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">
            Witaj, {carrier?.companyName || currentUser?.firstName}!
          </h1>
          <p className="text-xl text-white/90">
            Panel przewoźnika - zarządzaj ofertami i flotą
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Link
            href="/driver/requests"
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-[#ffc428]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
            <div className="text-sm text-gray-500 mb-1">Dostępne zapytania</div>
            <div className="text-3xl font-bold text-gray-900">{activeRequests.length}</div>
            <div className="text-xs text-blue-600 mt-2 font-medium">Przeglądaj i składaj oferty →</div>
          </Link>

          <Link
            href="/driver/my-offers"
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-[#ffc428]"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
            <div className="text-sm text-gray-500 mb-1">Oczekujące oferty</div>
            <div className="text-3xl font-bold text-gray-900">{pendingOffers.length}</div>
            <div className="text-xs text-yellow-600 mt-2 font-medium">Zarządzaj ofertami →</div>
          </Link>

          <Link
            href="/driver/my-offers"
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-green-400"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
            <div className="text-sm text-gray-500 mb-1">Zaakceptowane</div>
            <div className="text-3xl font-bold text-gray-900">{acceptedOffers.length}</div>
            <div className="text-xs text-green-600 mt-2 font-medium">Zobacz zlecenia →</div>
          </Link>

          <Link
            href="/driver/vehicles"
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-purple-400"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
            <div className="text-sm text-gray-500 mb-1">Flota</div>
            <div className="text-3xl font-bold text-gray-900">{myVehicles.length}</div>
            <div className="text-xs text-purple-600 mt-2 font-medium">Zarządzaj flotą →</div>
          </Link>
        </div>

        {/* Revenue Stats */}
        <div className="bg-gradient-to-r from-[#ffc428] to-[#f5b920] rounded-2xl shadow-lg p-8 mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#215387] mb-2">
                Łączna wartość ofert
              </h3>
              <div className="text-4xl font-bold text-[#215387]">
                {formatCurrency(myOffers.reduce((sum, o) => sum + o.price, 0), 'PLN')}
              </div>
              <p className="text-sm text-[#215387]/80 mt-2">
                {myOffers.length} ofert złożonych • {acceptedOffers.length} zaakceptowanych
              </p>
            </div>
            <div className="text-[#215387]/20">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Latest Requests */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Najnowsze zapytania</h2>
              <Link
                href="/driver/requests"
                className="text-sm text-[#215387] hover:text-[#1a4469] font-medium flex items-center gap-1"
              >
                Zobacz wszystkie
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>

            <div className="space-y-4">
              {latestRequests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📭</div>
                  <p className="text-gray-500">Brak nowych zapytań</p>
                </div>
              ) : (
                latestRequests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/driver/requests/${request.id}`}
                    className="block p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 mb-1">
                          {request.from.city} → {request.to.city}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(request.departureDate)} • {request.passengerCount} osób
                        </div>
                      </div>
                      {request.budget?.max && (
                        <div className="text-sm font-bold text-green-600">
                          {request.budget.max} PLN
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {request.offerCount} ofert
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        {request.viewCount} wyświetleń
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Szybkie akcje</h2>

            <div className="space-y-4">
              <Link
                href="/driver/requests"
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all group border-2 border-transparent hover:border-blue-300"
              >
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">Przeglądaj zapytania</div>
                  <div className="text-sm text-gray-600">
                    Znajdź idealne zlecenia dla swojej floty
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>

              <Link
                href="/driver/vehicles"
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all group border-2 border-transparent hover:border-purple-300"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">Zarządzaj flotą</div>
                  <div className="text-sm text-gray-600">Dodaj lub edytuj pojazdy</div>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>

              <Link
                href="/driver/my-offers"
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all group border-2 border-transparent hover:border-green-300"
              >
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">Moje oferty</div>
                  <div className="text-sm text-gray-600">
                    Monitoruj status złożonych ofert
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 group-hover:text-green-500 group-hover:translate-x-1 transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>

              <div className="mt-6 p-4 bg-gradient-to-r from-[#215387] to-[#1a4469] rounded-xl text-white">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <div className="font-semibold mb-1">Wskazówka</div>
                    <div className="text-sm text-white/90">
                      Regularnie aktualizuj swoją flotę i szybko odpowiadaj na zapytania, aby zwiększyć
                      szanse na przyjęcie oferty.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
