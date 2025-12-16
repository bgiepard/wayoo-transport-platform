import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { vehicles, getCarrierByUserId, offers } from '@/lib/data';

export default function DriverVehiclesPage() {
  const { currentUser } = useAuth();
  const carrier = currentUser ? getCarrierByUserId(currentUser.id) : null;
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter vehicles for current carrier
  const myVehicles = carrier ? vehicles.filter((v) => v.carrierId === carrier.id) : [];

  // Count active offers per vehicle
  const getActiveOffersCount = (vehicleId: string) => {
    return offers.filter((o) => o.vehicleId === vehicleId && o.status === 'pending').length;
  };

  const getVehicleTypeName = (type: string) => {
    const types: { [key: string]: string } = {
      van: 'Bus',
      minibus: 'Minibus',
      bus: 'Autobus',
    };
    return types[type] || type;
  };

  const getVehicleIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      van: '🚐',
      minibus: '🚌',
      bus: '🚍',
    };
    return icons[type] || '🚗';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Moja Flota</h1>
          <p className="text-gray-600">Zarządzaj swoimi pojazdami</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#ffc428] text-[#215387] px-6 py-3 rounded-lg hover:bg-[#f5b920] transition-colors font-semibold shadow-lg hover:shadow-xl hover:scale-105"
        >
          + Dodaj Pojazd
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-500 mb-1">Pojazdy w flocie</div>
          <div className="text-3xl font-bold text-[#215387]">{myVehicles.length}</div>
        </div>
        <div className="bg-blue-50 rounded-xl shadow-md p-6 border border-blue-200">
          <div className="text-sm text-blue-700 mb-1">Łączna pojemność</div>
          <div className="text-3xl font-bold text-blue-800">
            {myVehicles.reduce((sum, v) => sum + v.capacity, 0)} <span className="text-xl">osób</span>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl shadow-md p-6 border border-green-200">
          <div className="text-sm text-green-700 mb-1">Autobusy</div>
          <div className="text-3xl font-bold text-green-800">
            {myVehicles.filter((v) => v.type === 'bus').length}
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl shadow-md p-6 border border-purple-200">
          <div className="text-sm text-purple-700 mb-1">Minibusy</div>
          <div className="text-3xl font-bold text-purple-800">
            {myVehicles.filter((v) => v.type === 'minibus').length}
          </div>
        </div>
      </div>

      {/* Add Vehicle Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border-2 border-[#ffc428]">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dodaj nowy pojazd</h2>
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Typ pojazdu
                </label>
                <select className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all">
                  <option value="">Wybierz typ</option>
                  <option value="van">Bus</option>
                  <option value="minibus">Minibus</option>
                  <option value="bus">Autobus</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pojemność (liczba miejsc)
                </label>
                <input
                  type="number"
                  placeholder="np. 50"
                  min="1"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Marka
                </label>
                <input
                  type="text"
                  placeholder="np. Mercedes"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Model
                </label>
                <input
                  type="text"
                  placeholder="np. Sprinter"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Wyposażenie (oddziel przecinkami)
              </label>
              <input
                type="text"
                placeholder="np. Klimatyzacja, WiFi, USB, Bagażnik"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Dodawanie pojazdu - Demo');
                  setShowAddForm(false);
                }}
                className="bg-[#215387] text-white px-6 py-3 rounded-lg hover:bg-[#1a4469] transition-colors font-semibold"
              >
                Zapisz pojazd
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Anuluj
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicles List */}
      {myVehicles.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="text-6xl mb-4">🚐</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Brak pojazdów</h2>
          <p className="text-gray-600 mb-6">Dodaj pierwszy pojazd do swojej floty</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-block bg-[#ffc428] text-[#215387] px-6 py-3 rounded-lg hover:bg-[#f5b920] transition-colors font-semibold"
          >
            Dodaj Pojazd
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {myVehicles.map((vehicle) => {
            const activeOffers = getActiveOffersCount(vehicle.id);

            return (
              <div
                key={vehicle.id}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100"
              >
                {/* Vehicle Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{getVehicleIcon(vehicle.type)}</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <p className="text-sm text-gray-500">{getVehicleTypeName(vehicle.type)}</p>
                    </div>
                  </div>

                  {activeOffers > 0 && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {activeOffers} aktywne oferty
                    </span>
                  )}
                </div>

                {/* Vehicle Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Pojemność</div>
                    <div className="text-2xl font-bold text-[#215387]">
                      {vehicle.capacity} <span className="text-sm font-normal text-gray-600">osób</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <div className="text-sm font-medium text-green-600">
                      {activeOffers > 0 ? '🟢 Aktywny' : '⚪ Dostępny'}
                    </div>
                  </div>
                </div>

                {/* Features */}
                {vehicle.features && vehicle.features.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-2 font-medium">Wyposażenie:</div>
                    <div className="flex flex-wrap gap-2">
                      {vehicle.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                        >
                          ✓ {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => alert('Edycja pojazdu - Demo')}
                    className="flex-1 text-center bg-[#215387] text-white py-2 px-4 rounded-lg hover:bg-[#1a4469] transition-colors font-medium"
                  >
                    Edytuj
                  </button>
                  <button
                    onClick={() => alert('Zobacz oferty dla tego pojazdu - Demo')}
                    className="flex-1 text-center border border-[#215387] text-[#215387] py-2 px-4 rounded-lg hover:bg-[#215387] hover:text-white transition-colors font-medium"
                  >
                    Oferty ({activeOffers})
                  </button>
                  <button
                    onClick={() => {
                      if (activeOffers > 0) {
                        alert('Nie można usunąć pojazdu z aktywnymi ofertami');
                      } else {
                        alert('Usuwanie pojazdu - Demo');
                      }
                    }}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                    disabled={activeOffers > 0}
                  >
                    Usuń
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
