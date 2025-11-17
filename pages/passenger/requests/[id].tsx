import { useRouter } from 'next/router';
import {
  getRequestById,
  getOffersByRequestId,
  getCarrierById,
  getVehicleById,
} from '@/lib/data';

export default function RequestDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const requestId = id as string;

  const request = requestId ? getRequestById(requestId) : null;
  const offers = requestId ? getOffersByRequestId(requestId) : [];

  if (!requestId || !request) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Nie znaleziono zapytania</h2>
          <button
            onClick={() => router.back()}
            className="text-[#215387] hover:text-blue-700 font-medium"
          >
            ← Wróć
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const sortedOffers = [...offers].sort((a, b) => a.price - b.price);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <button
        onClick={() => router.back()}
        className="text-[#215387] hover:text-blue-700 font-medium mb-6 flex items-center gap-2"
      >
        ← Wróć do listy zapytań
      </button>

      {/* Request Details */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Szczegóły Zapytania</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Trasa</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-1">📍</span>
                <div>
                  <div className="font-medium">{request.from.city}</div>
                  {request.from.address && (
                    <div className="text-sm text-gray-600">{request.from.address}</div>
                  )}
                </div>
              </div>
              <div className="ml-4 border-l-2 border-gray-300 h-6"></div>
              <div className="flex items-start gap-2">
                <span className="text-red-600 mt-1">📍</span>
                <div>
                  <div className="font-medium">{request.to.city}</div>
                  {request.to.address && (
                    <div className="text-sm text-gray-600">{request.to.address}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Termin</h3>
              <p className="text-gray-900">📅 {formatDate(request.departureDate)}</p>
              {request.isRoundTrip && request.returnDate && (
                <p className="text-gray-900 mt-1">🔄 Powrót: {formatDate(request.returnDate)}</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Pasażerowie</h3>
              <p className="text-gray-900">👥 {request.passengerCount} osób</p>
            </div>
          </div>
        </div>

        {request.luggageInfo && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Bagaż</h3>
            <p className="text-gray-700">{request.luggageInfo}</p>
          </div>
        )}

        {request.specialRequirements && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Wymagania specjalne</h3>
            <p className="text-gray-700">{request.specialRequirements}</p>
          </div>
        )}

        {request.budget?.max && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Budżet</h3>
            <p className="text-gray-700">
              Maksymalnie: <span className="font-bold">{request.budget.max} {request.budget.currency}</span>
            </p>
          </div>
        )}
      </div>

      {/* Offers */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Otrzymane Oferty ({offers.length})
        </h2>

        {offers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Oczekiwanie na oferty
            </h3>
            <p className="text-gray-600">
              Przewoźnicy wkrótce prześlą swoje propozycje. Sprawdź ponownie później.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedOffers.map((offer, index) => {
              const carrier = getCarrierById(offer.carrierId);
              const vehicle = getVehicleById(offer.vehicleId);

              if (!carrier || !vehicle) return null;

              const isBestPrice = index === 0;

              return (
                <div
                  key={offer.id}
                  className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow ${
                    isBestPrice ? 'ring-2 ring-green-500' : ''
                  }`}
                >
                  {isBestPrice && (
                    <div className="inline-block bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
                      ⭐ Najlepsza cena
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{carrier.logo}</div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{carrier.companyName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="font-medium">{carrier.rating}</span>
                          <span className="text-gray-500 text-sm">
                            ({carrier.reviewCount} opinii)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-3xl font-bold text-[#215387]">
                        {offer.price} {offer.currency}
                      </div>
                      <div className="text-sm text-gray-500">cena całkowita</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Pojazd</h4>
                    <p className="text-gray-900">
                      {vehicle.brand} {vehicle.model} - {vehicle.capacity} miejsc
                    </p>
                  </div>

                  {offer.description && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 text-sm">{offer.description}</p>
                    </div>
                  )}

                  {offer.includedServices.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-700 mb-2 text-sm">
                        Usługi w cenie:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {offer.includedServices.map((service) => (
                          <span
                            key={service}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                          >
                            ✓ {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-4 pt-4 border-t">
                    <button
                      onClick={() => alert('Akceptacja oferty - Demo')}
                      className="flex-1 bg-[#ffc428] text-white py-2 px-4 rounded-lg hover:bg-[#f5b920] transition-colors font-medium"
                    >
                      Zarezerwuj
                    </button>
                    <button
                      onClick={() => alert('Kontakt z przewoźnikiem - Demo')}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Kontakt
                    </button>
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
