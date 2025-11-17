import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { transportRequests, getOffersByRequestId } from '@/lib/data';

export default function PassengerRequestsPage() {
  const { currentUser } = useAuth();
  const [allRequests, setAllRequests] = useState(transportRequests);

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
  const myRequests = allRequests.filter((r) => r.userId === currentUser?.id);

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Moje Zapytania</h1>
          <p className="text-gray-600">Zarządzaj swoimi zapytaniami o transport</p>
        </div>
        <Link
          href="/passenger/new-request"
          className="bg-[#ffc428] text-white px-6 py-3 rounded-lg hover:bg-[#f5b920] transition-colors font-semibold"
        >
          + Nowe Zapytanie
        </Link>
      </div>

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
          {myRequests.map((request) => {
            const offers = getOffersByRequestId(request.id);
            return (
              <div key={request.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {request.from.city} → {request.to.city}
                      </h3>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="text-gray-600 space-y-1">
                      <p>📅 {formatDate(request.departureDate)}</p>
                      <p>👥 {request.passengerCount} osób</p>
                      {request.isRoundTrip && <p>🔄 Podróż powrotna</p>}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-2">Oferty</div>
                    <div className="text-3xl font-bold text-[#215387]">{offers.length}</div>
                  </div>
                </div>

                {request.specialRequirements && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Wymagania:</span> {request.specialRequirements}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <Link
                    href={`/passenger/requests/${request.id}`}
                    className="flex-1 text-center bg-[#ffc428] text-white py-2 px-4 rounded-lg hover:bg-[#f5b920] transition-colors font-medium"
                  >
                    Zobacz oferty ({offers.length})
                  </Link>
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => alert('Edycja - Demo')}
                  >
                    Edytuj
                  </button>
                  <button
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    onClick={() => alert('Anulowanie - Demo')}
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
