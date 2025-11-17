import Link from 'next/link';
import { transportRequests, getOffersByRequestId, offers } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { getCarrierByUserId } from '@/lib/data';

export default function CarrierRequestsPage() {
  const { currentUser } = useAuth();
  const carrier = currentUser ? getCarrierByUserId(currentUser.id) : null;

  // Get only active requests
  const activeRequests = transportRequests.filter((r) =>
    r.status === 'active' || r.status === 'offers_received'
  );

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
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Dostępne Zapytania</h1>
        <p className="text-gray-600">Przeglądaj zapytania i składaj oferty</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Filtry</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Miasto startowe
            </label>
            <input
              type="text"
              placeholder="np. Kraków"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Miasto docelowe
            </label>
            <input
              type="text"
              placeholder="np. Warszawa"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data od</label>
            <input
              type="date"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min. osób</label>
            <input
              type="number"
              placeholder="1"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
        <div className="mt-4">
          <button className="bg-[#215387] text-white px-6 py-2 rounded-lg hover:bg-[#1a4469] transition-colors font-medium">
            Zastosuj filtry
          </button>
        </div>
      </div>

      {/* Requests List */}
      {activeRequests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Brak dostępnych zapytań</h2>
          <p className="text-gray-600">Sprawdź ponownie później</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeRequests.map((request) => {
            const requestOffers = getOffersByRequestId(request.id);
            const myOfferExists = hasMyOffer(request.id);

            return (
              <div
                key={request.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {request.from.city} → {request.to.city}
                      </h3>
                      {myOfferExists && (
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                          ✓ Złożono ofertę
                        </span>
                      )}
                      {request.budget?.max && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          💰 Budżet: {request.budget.max} PLN
                        </span>
                      )}
                    </div>

                    <div className="text-gray-600 space-y-1">
                      {request.from.address && (
                        <p className="text-sm">📍 Start: {request.from.address}</p>
                      )}
                      {request.to.address && (
                        <p className="text-sm">📍 Cel: {request.to.address}</p>
                      )}
                      <p>📅 {formatDate(request.departureDate)}</p>
                      <p>👥 {request.passengerCount} osób</p>
                      {request.isRoundTrip && <p>🔄 Podróż powrotna</p>}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Konkurencja</div>
                    <div className="text-2xl font-bold text-[#215387]">
                      {requestOffers.length} ofert
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {request.viewCount} wyświetleń
                    </div>
                  </div>
                </div>

                {request.luggageInfo && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Bagaż:</span> {request.luggageInfo}
                    </p>
                  </div>
                )}

                {request.specialRequirements && (
                  <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Wymagania:</span>{' '}
                      {request.specialRequirements}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-4 pt-4 border-t">
                  {myOfferExists ? (
                    <>
                      <Link
                        href={`/carrier/requests/${request.id}`}
                        className="flex-1 text-center bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                      >
                        Zobacz szczegóły
                      </Link>
                      <button
                        onClick={() => alert('Edycja oferty - Demo')}
                        className="px-4 py-2 border border-purple-300 text-[#215387] rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        Edytuj ofertę
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/carrier/requests/${request.id}`}
                        className="flex-1 text-center bg-[#215387] text-white py-2 px-4 rounded-lg hover:bg-[#1a4469] transition-colors font-medium"
                      >
                        Złóż ofertę
                      </Link>
                      <button
                        onClick={() => alert('Szczegóły zapytania - Demo')}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Szczegóły
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
