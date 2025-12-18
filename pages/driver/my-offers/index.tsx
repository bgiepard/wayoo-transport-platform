import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { offers, getCarrierByUserId, getRequestById, getVehicleById } from '@/lib/data';

export default function DriverMyOffersPage() {
  const { currentUser } = useAuth();
  const carrier = currentUser ? getCarrierByUserId(currentUser.id) : null;
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');

  // Filter offers for current carrier
  const myOffers = carrier ? offers.filter((o) => o.carrierId === carrier.id) : [];

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
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      pending: 'Oczekuje',
      accepted: 'Zaakceptowana',
      rejected: 'Odrzucona',
      expired: 'Wygasła',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Group offers by status
  const activeOffers = myOffers.filter((o) => o.status === 'pending' || o.status === 'accepted');
  const completedOffers = myOffers.filter((o) => o.status === 'rejected' || o.status === 'expired');
  const pendingOffers = myOffers.filter((o) => o.status === 'pending');
  const acceptedOffers = myOffers.filter((o) => o.status === 'accepted');

  const displayedOffers = activeTab === 'active' ? activeOffers : completedOffers;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Moje Oferty</h1>
        <p className="text-gray-600">Zarządzaj swoimi ofertami transportu</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-500 mb-1">Wszystkie oferty</div>
          <div className="text-3xl font-bold text-[#215387]">{myOffers.length}</div>
        </div>
        <div className="bg-yellow-50 rounded-xl shadow-md p-6 border border-yellow-200">
          <div className="text-sm text-yellow-700 mb-1">Oczekujące</div>
          <div className="text-3xl font-bold text-yellow-800">{pendingOffers.length}</div>
        </div>
        <div className="bg-green-50 rounded-xl shadow-md p-6 border border-green-200">
          <div className="text-sm text-green-700 mb-1">Zaakceptowane</div>
          <div className="text-3xl font-bold text-green-800">{acceptedOffers.length}</div>
        </div>
        <div className="bg-blue-50 rounded-xl shadow-md p-6 border border-blue-200">
          <div className="text-sm text-blue-700 mb-1">Łączna wartość</div>
          <div className="text-2xl font-bold text-blue-800">
            {formatCurrency(myOffers.reduce((sum, o) => sum + o.price, 0), 'PLN')}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'active'
                  ? 'border-[#215387] text-[#215387]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Aktywne oferty ({activeOffers.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                activeTab === 'completed'
                  ? 'border-[#215387] text-[#215387]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Zakończone ({completedOffers.length})
            </button>
          </div>
        </div>
      </div>

      {myOffers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Brak ofert</h2>
          <p className="text-gray-600 mb-6">Nie złożyłeś jeszcze żadnych ofert</p>
          <Link
            href="/driver/requests"
            className="inline-block bg-[#215387] text-white px-6 py-3 rounded-lg hover:bg-[#1a4469] transition-colors font-semibold"
          >
            Przeglądaj zapytania
          </Link>
        </div>
      ) : displayedOffers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">
            {activeTab === 'active' ? '📝' : '📋'}
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {activeTab === 'active' ? 'Brak aktywnych ofert' : 'Brak zakończonych ofert'}
          </h2>
          <p className="text-gray-600">
            {activeTab === 'active'
              ? 'Nie masz obecnie aktywnych ofert'
              : 'Brak historii zakończonych ofert'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOffers
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .map((offer) => {
              const request = getRequestById(offer.requestId);
              const vehicle = getVehicleById(offer.vehicleId);

              if (!request || !vehicle) return null;

              return (
                <div
                  key={offer.id}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {request.from.city} → {request.to.city}
                        </h3>
                        {getStatusBadge(offer.status)}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 mb-3">
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>📅 Wyjazd: {formatDate(offer.proposedDeparture)}</p>
                          {offer.proposedReturn && (
                            <p>📅 Powrót: {formatDate(offer.proposedReturn)}</p>
                          )}
                          <p>👥 {request.passengerCount} osób</p>
                          <p>⏱️ Czas podróży: ~{offer.estimatedDuration} min</p>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            🚐 Pojazd: {vehicle.brand} {vehicle.model}
                          </p>
                          <p>💺 Pojemność: {vehicle.capacity} osób</p>
                          <p className="text-xs text-gray-500">
                            Złożono: {formatDate(offer.createdAt)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Ważność: {formatDate(offer.validUntil)}
                          </p>
                        </div>
                      </div>

                      {offer.description && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">{offer.description}</p>
                        </div>
                      )}

                      {offer.includedServices && offer.includedServices.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {offer.includedServices.map((service, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                            >
                              ✓ {service}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-6">
                      <div className="text-sm text-gray-500 mb-1">Twoja oferta</div>
                      <div className="text-3xl font-bold text-[#215387]">
                        {formatCurrency(offer.price, offer.currency)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    {offer.status === 'pending' && (
                      <>
                        <Link
                          href={`/passenger/requests/${request.id}`}
                          className="flex-1 text-center bg-[#215387] text-white py-2 px-4 rounded-lg hover:bg-[#1a4469] transition-colors font-medium"
                        >
                          Zobacz zapytanie
                        </Link>
                        <button
                          onClick={() => alert('Edycja oferty - Demo')}
                          className="px-4 py-2 border border-[#215387] text-[#215387] rounded-lg hover:bg-[#215387] hover:text-white transition-colors"
                        >
                          Edytuj ofertę
                        </button>
                        <button
                          onClick={() => alert('Anulowanie oferty - Demo')}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Anuluj
                        </button>
                      </>
                    )}

                    {offer.status === 'accepted' && (
                      <>
                        <Link
                          href={`/passenger/requests/${request.id}`}
                          className="flex-1 text-center bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Szczegóły zlecenia
                        </Link>
                        <button
                          onClick={() => alert('Kontakt z pasażerem - Demo')}
                          className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                        >
                          Kontakt
                        </button>
                      </>
                    )}

                    {(offer.status === 'rejected' || offer.status === 'expired') && (
                      <Link
                        href={`/passenger/requests/${request.id}`}
                        className="flex-1 text-center bg-gray-400 text-white py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors font-medium"
                      >
                        Zobacz szczegóły
                      </Link>
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
