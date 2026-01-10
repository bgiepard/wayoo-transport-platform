import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getOffersByRequestId,
  getCarrierById,
  getVehicleById,
  getRequestById,
  users,
} from '@/lib/data';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { offerId, requestId, paymentMethod } = router.query;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !offerId || !requestId) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  const offers = getOffersByRequestId(requestId as string);
  const selectedOffer = offers.find(o => o.id === offerId);
  const request = getRequestById(requestId as string);

  if (!selectedOffer || !request) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Nie znaleziono zamówienia</h2>
          <Link href="/passenger/requests" className="text-[#215387] hover:underline">
            Wróć do listy zapytań
          </Link>
        </div>
      </div>
    );
  }

  const carrier = getCarrierById(selectedOffer.carrierId);
  const vehicle = getVehicleById(selectedOffer.vehicleId);
  const carrierUser = carrier ? users.find(u => u.id === carrier.userId) : null;

  if (!carrier || !vehicle || !carrierUser) {
    return null;
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

  const getPaymentMethodName = (method: string) => {
    const methods: { [key: string]: string } = {
      blik: 'BLIK',
      card: 'Karta płatnicza',
      transfer: 'Przelew bankowy',
      paypal: 'PayPal',
    };
    return methods[method] || method;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Sukces */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6 text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Płatność zakończona sukcesem!</h1>
        <p className="text-lg text-gray-600 mb-4">
          Dziękujemy za dokonanie rezerwacji. Twoja płatność została przetworzona pomyślnie.
        </p>
        <div className="inline-block bg-green-50 border border-green-200 rounded-lg px-6 py-3">
          <p className="text-sm text-gray-600 mb-1">Kwota płatności</p>
          <p className="text-3xl font-bold text-green-600">
            {selectedOffer.price} {selectedOffer.currency}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Metoda: {getPaymentMethodName(paymentMethod as string)}
          </p>
        </div>
      </div>

      {/* Dane przewoźnika */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Dane przewoźnika
        </h2>

        <div className="flex items-start gap-6 mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-[#215387] to-[#1a4469] rounded-xl flex items-center justify-center text-4xl shadow-lg flex-shrink-0">
            {carrier.logo}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-3">{carrier.companyName}</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Kierowca</p>
                <p className="font-semibold text-gray-900 text-lg">
                  {carrierUser.firstName} {carrierUser.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Telefon</p>
                <a href={`tel:${carrierUser.phone}`} className="font-semibold text-[#215387] hover:underline text-lg">
                  {carrierUser.phone}
                </a>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <a href={`mailto:${carrierUser.email}`} className="font-semibold text-[#215387] hover:underline">
                  {carrierUser.email}
                </a>
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
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-bold text-gray-900 mb-2">Pojazd</h4>
          <p className="text-gray-700 mb-2">
            {vehicle.brand} {vehicle.model} - {vehicle.capacity} miejsc
          </p>
          {vehicle.features.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Szczegóły przejazdu */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Szczegóły przejazdu
        </h2>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Trasa</p>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-900">{request.from.city}</span>
              <svg className="w-6 h-6 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span className="font-semibold text-gray-900">{request.to.city}</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Data wyjazdu</p>
            <p className="font-semibold text-gray-900">{formatDate(request.departureDate)}</p>
          </div>

          {request.isRoundTrip && request.returnDate && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Data powrotu</p>
              <p className="font-semibold text-gray-900">{formatDate(request.returnDate)}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600 mb-1">Liczba pasażerów</p>
            <p className="font-semibold text-gray-900">{request.passengerCount} osób</p>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-blue-900 mb-1">Ważne informacje</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Potwierdzenie rezerwacji zostało wysłane na Twój adres email</li>
              <li>• Kierowca skontaktuje się z Tobą na 24h przed wyjazdem</li>
              <li>• W razie pytań skontaktuj się bezpośrednio z przewoźnikiem</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Przyciski akcji */}
      <div className="flex gap-4">
        <Link
          href="/passenger/requests"
          className="flex-1 bg-[#215387] text-white py-3 px-6 rounded-lg hover:bg-[#1a4469] transition-colors font-semibold text-center"
        >
          Moje zapytania
        </Link>
        <Link
          href="/"
          className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-center"
        >
          Strona główna
        </Link>
      </div>
    </div>
  );
}
