import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/lib/auth-context';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { pl } from 'date-fns/locale';

export default function Home() {
  const { isPassenger, isCarrier } = useAuth();
  const router = useRouter();
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ]);

  const [formData, setFormData] = useState({
    fromCity: '',
    toCity: '',
    passengerCount: '',
    // Dodatkowe opcje
    luggageInfo: '',
    specialRequirements: '',
    budgetMax: '',
  });

  // Zamknij dropdown gdy klikniemy poza nim
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const startDate = dateRange[0].startDate;
    const endDate = dateRange[0].endDate;
    const isRoundTrip = startDate.toDateString() !== endDate.toDateString();

    // Zapisz zapytanie do localStorage
    const newRequest = {
      id: 'r' + Date.now(),
      userId: '1', // W demo używamy pierwszego użytkownika
      status: 'active',
      from: {
        city: formData.fromCity,
        address: formData.fromCity,
      },
      to: {
        city: formData.toCity,
        address: formData.toCity,
      },
      departureDate: startDate.toISOString(),
      returnDate: isRoundTrip ? endDate.toISOString() : undefined,
      isRoundTrip: isRoundTrip,
      passengerCount: parseInt(formData.passengerCount),
      luggageInfo: formData.luggageInfo || undefined,
      specialRequirements: formData.specialRequirements || undefined,
      budget: formData.budgetMax ? {
        max: parseInt(formData.budgetMax),
        currency: 'PLN',
      } : undefined,
      viewCount: 0,
      offerCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Pobierz istniejące zapytania z localStorage
    const existingRequests = JSON.parse(localStorage.getItem('transportRequests') || '[]');
    existingRequests.push(newRequest);
    localStorage.setItem('transportRequests', JSON.stringify(existingRequests));

    // Przekieruj do listy zapytań
    router.push('/passenger/requests');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatDateRange = () => {
    const start = dateRange[0].startDate;
    const end = dateRange[0].endDate;

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    if (start.toDateString() === end.toDateString()) {
      return formatDate(start);
    }
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background */}
      <div
        className="relative min-h-[700px] pb-[120px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/wayoo-background.jpg)',
        }}
      >
        {/* Overlay dla lepszej czytelności */}
        <div className="absolute inset-0 bg-[#215387]/20"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                <Image
                  src="/wayoo-logo.png"
                  alt="wayoo"
                  width={267}
                  height={90}
                  className="h-20 w-auto drop-shadow-2xl"
                  priority
                />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg leading-tight">
                Twój transport grupowy<br />
                <span className="text-[#ffc428]">w zasięgu ręki</span>
              </h1>
            </div>

            {/* Search Form */}
            <div className="max-w-7xl mx-auto mt-12">
              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6">
                {/* Główna linia wyszukiwania - 5 elementów */}
                <div className="flex flex-col lg:flex-row gap-3 mb-4">
                  {/* Skąd jedziemy */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc428]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="fromCity"
                        value={formData.fromCity}
                        onChange={handleChange}
                        placeholder="Skąd?"
                        required
                        className="w-full pl-11 pr-4 py-3.5 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                      />
                    </div>
                  </div>

                  {/* Dokąd jedziemy */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc428]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        name="toCity"
                        value={formData.toCity}
                        onChange={handleChange}
                        placeholder="Dokąd?"
                        required
                        className="w-full pl-11 pr-4 py-3.5 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                      />
                    </div>
                  </div>

                  {/* Date Range Picker */}
                  <div className="flex-1 min-w-[220px] relative" ref={datePickerRef}>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc428] z-10">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={formatDateRange()}
                        onClick={() => setShowDatePicker(!showDatePicker)}
                        readOnly
                        placeholder="Wybierz daty"
                        className="w-full pl-11 pr-4 py-3.5 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all cursor-pointer"
                      />
                    </div>
                    {showDatePicker && (
                      <div className="absolute top-full mt-2 z-50 bg-white rounded-xl shadow-2xl border-2 border-gray-200">
                        <DateRangePicker
                          ranges={dateRange}
                          onChange={(item: any) => setDateRange([item.selection])}
                          locale={pl}
                          moveRangeOnFirstSelection={false}
                          months={2}
                          direction="horizontal"
                          rangeColors={['#ffc428']}
                          showDateDisplay={false}
                        />
                      </div>
                    )}
                  </div>

                  {/* Liczba pasażerów */}
                  <div className="flex-1 min-w-[150px]">
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc428]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <input
                        type="number"
                        name="passengerCount"
                        value={formData.passengerCount}
                        onChange={handleChange}
                        placeholder="Osoby"
                        min="1"
                        required
                        className="w-full pl-11 pr-4 py-3.5 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                      />
                    </div>
                  </div>

                  {/* Przycisk Submit */}
                  <div className="flex-shrink-0">
                    <button
                      type="submit"
                      className="w-full lg:w-auto px-8 py-3.5 text-base bg-[#ffc428] text-[#215387] rounded-xl hover:bg-[#f5b920] transition-all font-bold shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Szukaj
                    </button>
                  </div>
                </div>

                {/* Więcej opcji */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowMoreOptions(!showMoreOptions)}
                    className="text-[#215387] hover:text-[#ffc428] font-medium transition-colors text-sm"
                  >
                    {showMoreOptions ? '▲ Ukryj dodatkowe opcje' : '▼ Wyświetl więcej opcji'}
                  </button>
                </div>

                {/* Dodatkowe opcje */}
                {showMoreOptions && (
                  <div className="grid md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
                    <div className="md:col-span-2">
                      <textarea
                        name="luggageInfo"
                        value={formData.luggageInfo}
                        onChange={handleChange}
                        placeholder="Informacje o bagażu (np. walizki, rowery)"
                        rows={2}
                        className="w-full px-6 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <textarea
                        name="specialRequirements"
                        value={formData.specialRequirements}
                        onChange={handleChange}
                        placeholder="Wymagania specjalne (np. klimatyzacja, WiFi)"
                        rows={2}
                        className="w-full px-6 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        name="budgetMax"
                        value={formData.budgetMax}
                        onChange={handleChange}
                        placeholder="Maksymalny budżet (PLN)"
                        min="0"
                        step="100"
                        className="w-full px-6 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Dlaczego wayoo?</h2>
          <p className="text-xl text-gray-600">Prosty i szybki sposób na transport grupowy</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-[#ffc428] rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-[#215387]">Prosty proces</h3>
            <p className="text-gray-600 leading-relaxed">
              Dodaj zapytanie, porównaj oferty i wybierz najlepszą dla swojej grupy. Wszystko w jednym miejscu.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-[#ffc428] rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-[#215387]">Najlepsze ceny</h3>
            <p className="text-gray-600 leading-relaxed">
              Konkurencja między przewoźnikami gwarantuje atrakcyjne ceny. Oszczędzaj na każdej trasie.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="w-16 h-16 bg-[#ffc428] rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-[#215387]">Bezpieczeństwo</h3>
            <p className="text-gray-600 leading-relaxed">
              Tylko zweryfikowani przewoźnicy z licencjami i ubezpieczeniem. Opinie innych pasażerów.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-24 bg-gradient-to-r from-[#215387] to-[#1a4469] rounded-2xl shadow-2xl p-12">
          <h3 className="text-3xl font-bold text-white text-center mb-12">wayoo w liczbach</h3>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-[#ffc428] mb-2">150+</div>
              <div className="text-white/90 text-lg">Przewoźników</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-[#ffc428] mb-2">2,500+</div>
              <div className="text-white/90 text-lg">Zrealizowanych tras</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-[#ffc428] mb-2">4.8</div>
              <div className="text-white/90 text-lg">Średnia ocen</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-[#ffc428] mb-2">98%</div>
              <div className="text-white/90 text-lg">Zadowolonych klientów</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
