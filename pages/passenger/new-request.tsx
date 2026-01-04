import { useState } from 'react';
import { useRouter } from 'next/router';

export default function NewRequestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fromCity: '',
    fromAddress: '',
    toCity: '',
    toAddress: '',
    departureDate: '',
    departureTime: '',
    returnDate: '',
    returnTime: '',
    isRoundTrip: false,
    passengerCount: 1,
    luggageInfo: '',
    specialRequirements: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In real app, this would save to database
    console.log('Creating request:', formData);
    alert('Zapytanie zostało utworzone! (Demo - dane nie zostały zapisane)');
    router.push('/passenger/requests');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Nowe Zapytanie o Transport</h1>
        <p className="text-gray-600">Wypełnij formularz, a przewoźnicy prześlą Ci swoje oferty</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow-md p-8">
        {/* Route Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Trasa</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skąd - Miasto *
              </label>
              <input
                type="text"
                name="fromCity"
                required
                value={formData.fromCity}
                onChange={handleChange}
                placeholder="np. Kraków"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adres / miejsce odbioru
              </label>
              <input
                type="text"
                name="fromAddress"
                value={formData.fromAddress}
                onChange={handleChange}
                placeholder="np. Rynek Główny 1"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dokąd - Miasto *
              </label>
              <input
                type="text"
                name="toCity"
                required
                value={formData.toCity}
                onChange={handleChange}
                placeholder="np. Warszawa"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adres / miejsce docelowe
              </label>
              <input
                type="text"
                name="toAddress"
                value={formData.toAddress}
                onChange={handleChange}
                placeholder="np. Stadion Narodowy"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Date & Time Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Termin</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data wyjazdu *
              </label>
              <input
                type="date"
                name="departureDate"
                required
                value={formData.departureDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Godzina wyjazdu *
              </label>
              <input
                type="time"
                name="departureTime"
                required
                value={formData.departureTime}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isRoundTrip"
                checked={formData.isRoundTrip}
                onChange={handleChange}
                className="w-4 h-4 text-[#215387] rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Podróż powrotna</span>
            </label>
          </div>

          {formData.isRoundTrip && (
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data powrotu *
                </label>
                <input
                  type="date"
                  name="returnDate"
                  required={formData.isRoundTrip}
                  value={formData.returnDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Godzina powrotu *
                </label>
                <input
                  type="time"
                  name="returnTime"
                  required={formData.isRoundTrip}
                  value={formData.returnTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Passengers Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Pasażerowie</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Liczba osób *
            </label>
            <input
              type="number"
              name="passengerCount"
              required
              min="1"
              max="100"
              value={formData.passengerCount}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Dodatkowe informacje</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Informacje o bagażu
              </label>
              <textarea
                name="luggageInfo"
                value={formData.luggageInfo}
                onChange={handleChange}
                rows={2}
                placeholder="np. Bagaż podręczny + 1 walizka na osobę"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wymagania specjalne
              </label>
              <textarea
                name="specialRequirements"
                value={formData.specialRequirements}
                onChange={handleChange}
                rows={2}
                placeholder="np. Klimatyzacja, WiFi, przestrzeń na rowery"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-6">
          <button
            type="submit"
            className="flex-1 bg-[#ffc428] text-[#215387] py-3 px-6 rounded-lg hover:bg-[#f5b920] transition-colors font-bold text-lg"
          >
            Opublikuj Zapytanie
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
  );
}
