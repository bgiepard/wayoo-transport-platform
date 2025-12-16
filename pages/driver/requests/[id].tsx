import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getRequestById, vehicles, getCarrierByUserId } from '@/lib/data';

export default function DriverRequestDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const { currentUser } = useAuth();
  const requestId = id as string;

  const request = requestId ? getRequestById(requestId) : null;
  const carrier = currentUser ? getCarrierByUserId(currentUser.id) : null;
  const myVehicles = carrier ? vehicles.filter((v) => v.carrierId === carrier.id) : [];

  const [formData, setFormData] = useState({
    vehicleId: myVehicles[0]?.id || '',
    price: '',
    description: '',
    includedServices: [] as string[],
    proposedDeparture: '',
    proposedReturn: '',
  });

  const availableServices = [
    'WiFi',
    'Klimatyzacja',
    'Toaleta',
    'TV',
    'Gniazdka 230V',
    'Woda mineralna',
    'Kawa i herbata',
    'Bagażnik',
  ];

  if (!requestId || !request) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Nie znaleziono zapytania</h2>
          <button
            onClick={() => router.back()}
            className="text-[#215387] hover:text-purple-700 font-medium"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating offer:', formData);
    alert('Oferta została wysłana! (Demo - dane nie zostały zapisane)');
    router.push('/driver/requests');
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleService = (service: string) => {
    setFormData((prev) => ({
      ...prev,
      includedServices: prev.includedServices.includes(service)
        ? prev.includedServices.filter((s) => s !== service)
        : [...prev.includedServices, service],
    }));
  };

  const selectedVehicle = myVehicles.find((v) => v.id === formData.vehicleId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <button
        onClick={() => router.back()}
        className="text-[#215387] hover:text-purple-700 font-medium mb-6 flex items-center gap-2"
      >
        ← Wróć do listy zapytań
      </button>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Request Details - Left Column */}
        <div>
          <div className="bg-white rounded-xl shadow-md p-8 sticky top-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Szczegóły Zapytania</h2>

            <div className="space-y-4">
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

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Termin</h3>
                <p className="text-gray-900">📅 {formatDate(request.departureDate)}</p>
                {request.isRoundTrip && request.returnDate && (
                  <p className="text-gray-900 mt-1">
                    🔄 Powrót: {formatDate(request.returnDate)}
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Pasażerowie</h3>
                <p className="text-gray-900">👥 {request.passengerCount} osób</p>
              </div>

              {request.luggageInfo && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Bagaż</h3>
                  <p className="text-gray-700 text-sm">{request.luggageInfo}</p>
                </div>
              )}

              {request.specialRequirements && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Wymagania specjalne</h3>
                  <p className="text-gray-700 text-sm">{request.specialRequirements}</p>
                </div>
              )}

              {request.budget?.max && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Budżet klienta</h3>
                  <p className="text-gray-700">
                    Maksymalnie:{' '}
                    <span className="font-bold text-lg">
                      {request.budget.max} {request.budget.currency}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Offer Form - Right Column */}
        <div>
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Złóż Ofertę</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Vehicle Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wybierz pojazd *
                </label>
                <select
                  name="vehicleId"
                  required
                  value={formData.vehicleId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">-- Wybierz pojazd --</option>
                  {myVehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model} ({vehicle.capacity} miejsc)
                    </option>
                  ))}
                </select>

                {selectedVehicle && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Pojemność:</span> {selectedVehicle.capacity}{' '}
                      osób
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">Wyposażenie:</span>{' '}
                      {selectedVehicle.features.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cena (PLN) *
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  min="0"
                  step="10"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="np. 2500"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-sm text-gray-500 mt-1">Podaj cenę całkowitą za całą trasę</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opis oferty
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Opisz swoją ofertę, dodatkowe usługi, doświadczenie..."
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Included Services */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Usługi w cenie
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableServices.map((service) => (
                    <label
                      key={service}
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.includedServices.includes(service)
                          ? 'bg-purple-50 border-purple-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.includedServices.includes(service)}
                        onChange={() => toggleService(service)}
                        className="w-4 h-4 text-[#215387] rounded focus:ring-2 focus:ring-purple-500"
                      />
                      <span className="text-sm">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Proposed Times */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Proponowany harmonogram</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data i godzina odjazdu *
                    </label>
                    <input
                      type="datetime-local"
                      name="proposedDeparture"
                      required
                      value={formData.proposedDeparture}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  {request.isRoundTrip && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data i godzina powrotu
                      </label>
                      <input
                        type="datetime-local"
                        name="proposedReturn"
                        value={formData.proposedReturn}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-[#215387] text-white py-3 px-6 rounded-lg hover:bg-[#1a4469] transition-colors font-semibold text-lg"
                >
                  Wyślij Ofertę
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
