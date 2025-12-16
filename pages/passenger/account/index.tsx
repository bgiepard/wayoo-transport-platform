import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/router';

type TabType = 'profile' | 'password' | 'notifications';

export default function PassengerAccountPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Form states
  const [profileData, setProfileData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Dane zostały zaktualizowane! (Demo)');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Nowe hasło i potwierdzenie muszą być takie same!');
      return;
    }
    alert('Hasło zostało zmienione! (Demo)');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleNotificationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Ustawienia powiadomień zostały zapisane! (Demo)');
  };

  const handleLogout = () => {
    if (confirm('Czy na pewno chcesz się wylogować?')) {
      alert('Wylogowano! (Demo)');
      router.push('/');
    }
  };

  const tabs = [
    { id: 'profile' as TabType, label: 'Dane osobowe', icon: '👤' },
    { id: 'password' as TabType, label: 'Hasło', icon: '🔒' },
    { id: 'notifications' as TabType, label: 'Powiadomienia', icon: '🔔' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Moje Konto</h1>
        <p className="text-gray-600">Zarządzaj swoimi danymi i ustawieniami</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar with tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-4 sticky top-4">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all font-medium flex items-center gap-3 ${
                    activeTab === tab.id
                      ? 'bg-[#215387] text-white shadow-md'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}

              <div className="pt-4 border-t">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-lg transition-all font-medium flex items-center gap-3 text-red-600 hover:bg-red-50"
                >
                  <span className="text-xl">🚪</span>
                  <span>Wyloguj się</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-md p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Dane osobowe</h2>
                  <p className="text-gray-600">Zaktualizuj swoje informacje kontaktowe</p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Imię *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileData.firstName}
                        onChange={(e) =>
                          setProfileData((prev) => ({ ...prev, firstName: e.target.value }))
                        }
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nazwisko *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileData.lastName}
                        onChange={(e) =>
                          setProfileData((prev) => ({ ...prev, lastName: e.target.value }))
                        }
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Telefon *
                    </label>
                    <input
                      type="tel"
                      required
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="+48 XXX XXX XXX"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="bg-[#215387] text-white px-8 py-3 rounded-xl hover:bg-[#1a4469] transition-colors font-semibold shadow-md hover:shadow-lg"
                    >
                      Zapisz zmiany
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Zmień hasło</h2>
                  <p className="text-gray-600">
                    Zaktualizuj swoje hasło, aby zachować bezpieczeństwo konta
                  </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Aktualne hasło *
                    </label>
                    <input
                      type="password"
                      required
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nowe hasło *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                    />
                    <p className="text-sm text-gray-500 mt-1">Minimum 8 znaków</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Potwierdź nowe hasło *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                    />
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-blue-600 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-sm text-blue-800">
                        <strong>Wskazówki dotyczące hasła:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Użyj co najmniej 8 znaków</li>
                          <li>Dodaj wielkie i małe litery</li>
                          <li>Dodaj cyfry i znaki specjalne</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="bg-[#215387] text-white px-8 py-3 rounded-xl hover:bg-[#1a4469] transition-colors font-semibold shadow-md hover:shadow-lg"
                    >
                      Zmień hasło
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Powiadomienia</h2>
                  <p className="text-gray-600">
                    Wybierz, jak chcesz otrzymywać powiadomienia o statusie zapytań
                  </p>
                </div>

                <form onSubmit={handleNotificationsSubmit} className="space-y-6">
                  <div className="space-y-4">
                    {/* Email Notifications */}
                    <div className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#ffc428] transition-colors">
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        checked={notifications.emailNotifications}
                        onChange={(e) =>
                          setNotifications((prev) => ({
                            ...prev,
                            emailNotifications: e.target.checked,
                          }))
                        }
                        className="w-5 h-5 text-[#215387] rounded focus:ring-2 focus:ring-[#ffc428] mt-1"
                      />
                      <label htmlFor="emailNotifications" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">📧</span>
                          <span className="font-semibold text-gray-900">Powiadomienia Email</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Otrzymuj powiadomienia o nowych ofertach, zmianach statusu i ważnych
                          informacjach
                        </p>
                      </label>
                    </div>

                    {/* SMS Notifications */}
                    <div className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#ffc428] transition-colors">
                      <input
                        type="checkbox"
                        id="smsNotifications"
                        checked={notifications.smsNotifications}
                        onChange={(e) =>
                          setNotifications((prev) => ({
                            ...prev,
                            smsNotifications: e.target.checked,
                          }))
                        }
                        className="w-5 h-5 text-[#215387] rounded focus:ring-2 focus:ring-[#ffc428] mt-1"
                      />
                      <label htmlFor="smsNotifications" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">💬</span>
                          <span className="font-semibold text-gray-900">Powiadomienia SMS</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Otrzymuj powiadomienia SMS o pilnych sprawach i zmianach w ostatniej
                          chwili
                        </p>
                      </label>
                    </div>

                    {/* Push Notifications */}
                    <div className="flex items-start gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-[#ffc428] transition-colors">
                      <input
                        type="checkbox"
                        id="pushNotifications"
                        checked={notifications.pushNotifications}
                        onChange={(e) =>
                          setNotifications((prev) => ({
                            ...prev,
                            pushNotifications: e.target.checked,
                          }))
                        }
                        className="w-5 h-5 text-[#215387] rounded focus:ring-2 focus:ring-[#ffc428] mt-1"
                      />
                      <label htmlFor="pushNotifications" className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">🔔</span>
                          <span className="font-semibold text-gray-900">
                            Powiadomienia Push
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Otrzymuj natychmiastowe powiadomienia w przeglądarce lub aplikacji
                          mobilnej
                        </p>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 text-yellow-600 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      <div className="text-sm text-yellow-800">
                        <strong>Uwaga:</strong> Jeśli wyłączysz wszystkie powiadomienia, możesz
                        przegapić ważne informacje o swoich zapytaniach.
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="bg-[#215387] text-white px-8 py-3 rounded-xl hover:bg-[#1a4469] transition-colors font-semibold shadow-md hover:shadow-lg"
                    >
                      Zapisz preferencje
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
