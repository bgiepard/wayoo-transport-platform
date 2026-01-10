import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import {
  getRequestById,
  getOffersByRequestId,
  getCarrierById,
  getVehicleById,
  transportRequests,
  users,
} from '@/lib/data';

export default function RequestDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const requestId = id as string;
  const [allRequests, setAllRequests] = useState(transportRequests);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [acceptPaymentTerms, setAcceptPaymentTerms] = useState(false);
  const [acceptDataProcessing, setAcceptDataProcessing] = useState(false);

  // Load requests from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRequests = JSON.parse(localStorage.getItem('transportRequests') || '[]');
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

  const request = requestId ? allRequests.find((r) => r.id === requestId) : null;
  const offers = requestId ? getOffersByRequestId(requestId) : [];

  // Get progress steps for the request
  const getProgressSteps = () => {
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
        status: 'completed' as const,
        icon: (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        ),
      },
      {
        id: 3,
        title: 'Sprawdź oferty przewoźników',
        description: 'Oczekiwanie na oferty',
        status: 'active' as const,
        icon: (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        id: 4,
        title: 'Wybierz ofertę i ruszaj w drogę',
        description: request?.status === 'booked' || request?.status === 'completed'
          ? 'Oferta zaakceptowana!'
          : 'Wybierz najlepszą ofertę',
        status: request?.status === 'booked' || request?.status === 'completed' ? 'completed' as const : 'pending' as const,
        icon: request?.status === 'booked' || request?.status === 'completed' ? (
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

  const progressSteps = getProgressSteps();

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

      {/* Status Zlecenia */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Status Zlecenia</h2>

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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
      </div>

      {/* Offers */}
      <div>
        {!selectedOfferId ? (
          <>
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
                  className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer border-2 ${
                    isBestPrice ? 'border-green-500' : 'border-gray-200 hover:border-[#ffc428]'
                  }`}
                  onClick={() => alert('Szczegóły oferty - Demo')}
                >
                  {isBestPrice && (
                    <div className="bg-green-500 text-white px-4 py-2 text-sm font-bold flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Najlepsza cena
                    </div>
                  )}

                  <div className="p-5 flex items-center gap-6">
                    {/* Logo przewoźnika */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#215387] to-[#1a4469] rounded-xl flex items-center justify-center text-4xl shadow-lg">
                        {carrier.logo}
                      </div>
                    </div>

                    {/* Informacje o przewoźniku */}
                    <div className="flex-1">
                      {/* Nazwa firmy + Mini zdjęcia samochodów */}
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-gray-900">{carrier.companyName}</h3>
                        <div className="flex gap-1">
                          <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-lg">
                              🚐
                            </div>
                          </div>
                          <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-lg">
                              🚌
                            </div>
                          </div>
                          <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-lg">
                              🚍
                            </div>
                          </div>
                          <div className="w-10 h-10 bg-gray-200 rounded overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-lg">
                              🚙
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Wayoo Score */}
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-600">Wayoo Score:</span>
                          <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
                            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="font-bold text-gray-900">{carrier.rating}</span>
                            <span className="text-xs text-gray-600">({carrier.reviewCount})</span>
                          </div>
                        </div>
                      </div>

                      {/* Pojazd */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                        </svg>
                        <span>{vehicle.brand} {vehicle.model}</span>
                        <span>•</span>
                        <span>{vehicle.capacity} miejsc</span>
                      </div>
                    </div>

                    {/* Cena */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-4xl font-bold text-[#215387] mb-1">
                        {offer.price} {offer.currency}
                      </div>
                      <div className="text-sm text-gray-500 mb-3">cena całkowita</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOfferId(offer.id);
                        }}
                        className="w-full bg-[#ffc428] text-[#215387] py-2 px-6 rounded-lg hover:bg-[#f5b920] transition-colors font-bold shadow-md hover:shadow-lg"
                      >
                        Zarezerwuj
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
            )}
          </>
        ) : (
          // Selected offer details
          (() => {
            const selectedOffer = offers.find(o => o.id === selectedOfferId);
            if (!selectedOffer) return null;

            const carrier = getCarrierById(selectedOffer.carrierId);
            const vehicle = getVehicleById(selectedOffer.vehicleId);
            const carrierUser = carrier ? users.find(u => u.id === carrier.userId) : null;

            if (!carrier || !vehicle || !carrierUser) return null;

            return (
              <div className="space-y-6">
                {/* Przycisk powrotu */}
                <button
                  onClick={() => {
                    setSelectedOfferId(null);
                    setAcceptTerms(false);
                    setShowPayment(false);
                    setSelectedPaymentMethod('');
                    setAcceptPaymentTerms(false);
                    setAcceptDataProcessing(false);
                  }}
                  className="text-[#215387] hover:text-blue-700 font-medium flex items-center gap-2"
                >
                  ← Wróć do ofert
                </button>

                <h2 className="text-2xl font-bold text-gray-900">
                  Podsumowanie rezerwacji
                </h2>

                {/* Szczegóły przewoźnika */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Dane przewoźnika</h3>

                  <div className="flex items-start gap-6 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#215387] to-[#1a4469] rounded-xl flex items-center justify-center text-4xl shadow-lg">
                      {carrier.logo}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold text-gray-900 mb-2">{carrier.companyName}</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Imię i nazwisko</p>
                          <p className="font-semibold text-gray-900">{carrierUser.firstName} {carrierUser.lastName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-semibold text-gray-900">{carrierUser.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Telefon</p>
                          <p className="font-semibold text-gray-900">{carrierUser.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Wayoo Score</p>
                          <div className="flex items-center gap-1">
                            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="font-bold text-gray-900">{carrier.rating}</span>
                            <span className="text-sm text-gray-600">({carrier.reviewCount} opinii)</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">Opis firmy</p>
                        <p className="text-gray-700">{carrier.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-bold text-gray-900 mb-2">Pojazd</h4>
                    <p className="text-gray-700">{vehicle.brand} {vehicle.model} - {vehicle.capacity} miejsc</p>
                    {vehicle.features.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {vehicle.features.map((feature) => (
                          <span
                            key={feature}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                          >
                            ✓ {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-700">Cena całkowita:</span>
                      <span className="text-3xl font-bold text-[#215387]">{selectedOffer.price} {selectedOffer.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Mapka z trasą lub wybór płatności */}
                {!showPayment ? (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Trasa przejazdu</h3>
                    <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-20 h-20 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <p className="text-gray-600 font-semibold">{request.from.city} → {request.to.city}</p>
                        <p className="text-sm text-gray-500 mt-2">Mapka z trasą (demo)</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Wybierz metodę płatności</h3>

                    <div className="space-y-3 mb-6">
                      {/* Blik */}
                      <label
                        className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPaymentMethod === 'blik'
                            ? 'border-[#215387] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="blik"
                          checked={selectedPaymentMethod === 'blik'}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="w-5 h-5 text-[#215387]"
                        />
                        <div className="flex-1 flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded flex items-center justify-center font-bold text-lg border">
                            BLIK
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">BLIK</p>
                            <p className="text-sm text-gray-600">Szybka płatność kodem z aplikacji bankowej</p>
                          </div>
                        </div>
                      </label>

                      {/* Karta płatnicza */}
                      <label
                        className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPaymentMethod === 'card'
                            ? 'border-[#215387] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="card"
                          checked={selectedPaymentMethod === 'card'}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="w-5 h-5 text-[#215387]"
                        />
                        <div className="flex-1 flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded flex items-center justify-center text-white">
                            💳
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Karta płatnicza</p>
                            <p className="text-sm text-gray-600">Visa, Mastercard, Maestro</p>
                          </div>
                        </div>
                      </label>

                      {/* Przelew bankowy */}
                      <label
                        className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPaymentMethod === 'transfer'
                            ? 'border-[#215387] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="transfer"
                          checked={selectedPaymentMethod === 'transfer'}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="w-5 h-5 text-[#215387]"
                        />
                        <div className="flex-1 flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded flex items-center justify-center text-white">
                            🏦
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Przelew bankowy</p>
                            <p className="text-sm text-gray-600">Szybki przelew online</p>
                          </div>
                        </div>
                      </label>

                      {/* PayPal */}
                      <label
                        className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPaymentMethod === 'paypal'
                            ? 'border-[#215387] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value="paypal"
                          checked={selectedPaymentMethod === 'paypal'}
                          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                          className="w-5 h-5 text-[#215387]"
                        />
                        <div className="flex-1 flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center text-white font-bold">
                            PP
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">PayPal</p>
                            <p className="text-sm text-gray-600">Bezpieczna płatność PayPal</p>
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Dodatkowe checkboxy */}
                    <div className="space-y-3 border-t pt-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptPaymentTerms}
                          onChange={(e) => setAcceptPaymentTerms(e.target.checked)}
                          className="mt-1 w-5 h-5 text-[#215387] border-gray-300 rounded focus:ring-[#215387]"
                        />
                        <span className="text-gray-700">
                          Akceptuję{' '}
                          <a href="#" className="text-[#215387] font-semibold hover:underline">
                            warunki płatności
                          </a>{' '}
                          i rozumiem, że płatność jest nieodwołalna
                        </span>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptDataProcessing}
                          onChange={(e) => setAcceptDataProcessing(e.target.checked)}
                          className="mt-1 w-5 h-5 text-[#215387] border-gray-300 rounded focus:ring-[#215387]"
                        />
                        <span className="text-gray-700">
                          Wyrażam zgodę na{' '}
                          <a href="#" className="text-[#215387] font-semibold hover:underline">
                            przetwarzanie danych osobowych
                          </a>{' '}
                          w celu realizacji płatności
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Checkbox i przycisk płatności */}
                {!showPayment ? (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="mb-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="mt-1 w-5 h-5 text-[#215387] border-gray-300 rounded focus:ring-[#215387]"
                        />
                        <span className="text-gray-700">
                          Akceptuję{' '}
                          <a href="#" className="text-[#215387] font-semibold hover:underline">
                            regulamin przejazdu
                          </a>{' '}
                          oraz{' '}
                          <a href="#" className="text-[#215387] font-semibold hover:underline">
                            politykę prywatności
                          </a>
                        </span>
                      </label>
                    </div>

                    <button
                      onClick={() => {
                        if (acceptTerms) {
                          setShowPayment(true);
                        } else {
                          alert('Musisz zaakceptować regulamin przed opłaceniem');
                        }
                      }}
                      disabled={!acceptTerms}
                      className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                        acceptTerms
                          ? 'bg-[#ffc428] text-[#215387] hover:bg-[#f5b920] shadow-lg hover:shadow-xl cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Opłać - {selectedOffer.price} {selectedOffer.currency}
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <button
                      onClick={() => {
                        if (!selectedPaymentMethod) {
                          alert('Wybierz metodę płatności');
                          return;
                        }
                        if (!acceptPaymentTerms || !acceptDataProcessing) {
                          alert('Musisz zaakceptować wszystkie wymagane zgody');
                          return;
                        }
                        // Przekierowanie do strony sukcesu
                        router.push(`/passenger/payment-success?offerId=${selectedOffer.id}&requestId=${requestId}&paymentMethod=${selectedPaymentMethod}`);
                      }}
                      disabled={!selectedPaymentMethod || !acceptPaymentTerms || !acceptDataProcessing}
                      className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                        selectedPaymentMethod && acceptPaymentTerms && acceptDataProcessing
                          ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Zapłać teraz - {selectedOffer.price} {selectedOffer.currency}
                    </button>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
