import { useState, useRef } from 'react';

export interface FormData {
  fromCity: string;
  toCity: string;
  stops: string[];
  passengerCount: string;
  departureDate: string;
  departureTime: string;
  hasWifi: boolean;
  hasAirConditioning: boolean;
  hasChildSeat: boolean;
  hasMoreSpace: boolean;
  moreSpaceDescription: string;
  numberOfChildren: number;
  childrenAges: number[];
  additionalDescription: string;
  luggageInfo: string;
  specialRequirements: string;
}

interface SearchFormProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  handleSubmit: (e: React.FormEvent) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setShowRouteModal: (show: boolean) => void;
  getRouteDisplayText: () => string;
}

export default function SearchForm({
  formData,
  setFormData,
  handleSubmit,
  handleChange,
  setShowRouteModal,
  getRouteDisplayText,
}: SearchFormProps) {
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
  const dateTimePickerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mt-12 px-4 relative">
      <form onSubmit={handleSubmit} className="bg-white rounded-sm shadow-lg p-4 relative" style={{ zIndex: 1 }}>
        {/* 5 Kolumn */}
        <div className="grid grid-cols-1 gap-4 items-end" style={{ gridTemplateColumns: '2fr 1fr 0.6fr 0.8fr 0.8fr' }}>
          {/* Kolumna 1 - Trasa */}
          <div>
            <label className="block text-left text-sm font-semibold text-[#215387] mb-2">Trasa</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc428] z-10 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <input
                type="text"
                readOnly
                value={getRouteDisplayText()}
                onClick={() => setShowRouteModal(true)}
                className="w-full pl-11 pr-4 py-3.5 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all cursor-pointer"
                placeholder="Wybierz trasę"
              />
            </div>
          </div>

          {/* Kolumna 2 - Data i godzina */}
          <div>
            <label className="block text-left text-sm font-semibold text-[#215387] mb-2">Data i godzina</label>
            <div className="relative" ref={dateTimePickerRef}>
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc428] z-10 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="text"
                readOnly
                value={`${new Date(formData.departureDate).toLocaleDateString('pl-PL')} ${formData.departureTime}`}
                onClick={() => setShowDateTimePicker(true)}
                className="w-full pl-11 pr-4 py-3.5 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all cursor-pointer"
                placeholder="Wybierz"
              />

              {/* Dropdown */}
              {showDateTimePicker && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#215387] mb-2">Data</label>
                      <input
                        type="date"
                        value={formData.departureDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, departureDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#215387] mb-2">Godzina</label>
                      <input
                        type="time"
                        value={formData.departureTime}
                        onChange={(e) => setFormData((prev) => ({ ...prev, departureTime: e.target.value }))}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDateTimePicker(false)}
                      className="w-full px-4 py-2.5 bg-[#ffc428] text-[#215387] rounded-lg hover:bg-[#f5b920] transition-all font-bold"
                    >
                      Zapisz
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Kolumna 3 - Liczba pasażerów */}
          <div>
            <label className="block text-left text-sm font-semibold text-[#215387] mb-2">Pasażerowie</label>
            <input
              type="number"
              name="passengerCount"
              value={formData.passengerCount}
              onChange={handleChange}
              min="1"
              required
              className="w-full px-4 text-center text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all font-semibold"
              style={{ padding: '14px 16px' }}
            />
          </div>

          {/* Kolumna 4 - Dodatkowe opcje */}
          <div className="relative">
            <label className="block text-left text-sm font-semibold text-[#215387] mb-2">Dodatkowe opcje</label>
            <button
              type="button"
              onClick={() => setShowAdditionalOptions(!showAdditionalOptions)}
              className="w-full px-3 py-3.5 text-sm bg-white border-2 border-gray-300 rounded-xl hover:border-[#ffc428] transition-all font-medium text-[#215387] flex items-center justify-center gap-1.5"
            >
              Wybierz
              <svg
                className={`w-3 h-3 transition-transform ${showAdditionalOptions ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown panel */}
            {showAdditionalOptions && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4" style={{ minWidth: '250px' }}>
                <div className="space-y-3">
                  {/* WiFi */}
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.hasWifi}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hasWifi: e.target.checked }))}
                      className="w-4 h-4 rounded border-2 border-gray-300 text-[#ffc428] focus:ring-2 focus:ring-[#ffc428]"
                    />
                    <svg className="w-4 h-4 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                    <span className="text-xs font-medium text-gray-700">WiFi</span>
                  </label>

                  {/* Klimatyzacja */}
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.hasAirConditioning}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hasAirConditioning: e.target.checked }))}
                      className="w-4 h-4 rounded border-2 border-gray-300 text-[#ffc428] focus:ring-2 focus:ring-[#ffc428]"
                    />
                    <svg className="w-4 h-4 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-xs font-medium text-gray-700">Klimatyzacja</span>
                  </label>

                  {/* Fotelik */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.hasChildSeat}
                        onChange={(e) => setFormData((prev) => ({
                          ...prev,
                          hasChildSeat: e.target.checked,
                          numberOfChildren: e.target.checked ? prev.numberOfChildren : 1,
                          childrenAges: e.target.checked ? prev.childrenAges : []
                        }))}
                        className="w-4 h-4 rounded border-2 border-gray-300 text-[#ffc428] focus:ring-2 focus:ring-[#ffc428]"
                      />
                      <svg className="w-4 h-4 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Fotelik</span>
                    </label>

                    {/* Rozwijane pola dla fotelika */}
                    {formData.hasChildSeat && (
                      <div className="mt-2 ml-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="block text-xs font-semibold text-[#215387] mb-2">
                          Liczba dzieci
                        </label>
                        <div className="flex items-center gap-3 mb-3">
                          {/* Przycisk minus */}
                          <button
                            type="button"
                            onClick={() => {
                              const newCount = Math.max(1, formData.numberOfChildren - 1);
                              const newAges = formData.childrenAges.slice(0, newCount);
                              setFormData((prev) => ({
                                ...prev,
                                numberOfChildren: newCount,
                                childrenAges: newAges
                              }));
                            }}
                            className="w-7 h-7 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center font-bold text-[#215387]"
                          >
                            -
                          </button>

                          {/* Wyświetlanie liczby */}
                          <span className="w-8 text-center font-bold text-[#215387]">
                            {formData.numberOfChildren}
                          </span>

                          {/* Przycisk plus */}
                          <button
                            type="button"
                            onClick={() => {
                              const newCount = Math.min(10, formData.numberOfChildren + 1);
                              setFormData((prev) => ({
                                ...prev,
                                numberOfChildren: newCount
                              }));
                            }}
                            className="w-7 h-7 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center font-bold text-[#215387]"
                          >
                            +
                          </button>
                        </div>

                        {/* Pola wiekowe dla każdego dziecka */}
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#215387] mb-1">
                            Wiek dzieci (w latach)
                          </label>
                          {Array.from({ length: formData.numberOfChildren }).map((_, index) => (
                            <input
                              key={index}
                              type="number"
                              min="0"
                              max="17"
                              value={formData.childrenAges[index] || ''}
                              onChange={(e) => {
                                const newAges = [...formData.childrenAges];
                                newAges[index] = parseInt(e.target.value) || 0;
                                setFormData((prev) => ({
                                  ...prev,
                                  childrenAges: newAges
                                }));
                              }}
                              placeholder={`Dziecko ${index + 1}`}
                              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#ffc428] focus:border-[#ffc428]"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Więcej miejsca */}
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.hasMoreSpace}
                        onChange={(e) => setFormData((prev) => ({
                          ...prev,
                          hasMoreSpace: e.target.checked,
                          moreSpaceDescription: e.target.checked ? prev.moreSpaceDescription : ''
                        }))}
                        className="w-4 h-4 rounded border-2 border-gray-300 text-[#ffc428] focus:ring-2 focus:ring-[#ffc428]"
                      />
                      <svg className="w-4 h-4 text-[#215387]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Więcej miejsca</span>
                    </label>

                    {/* Pole opisu dla więcej miejsca */}
                    {formData.hasMoreSpace && (
                      <div className="mt-2 ml-6">
                        <textarea
                          value={formData.moreSpaceDescription}
                          onChange={(e) => setFormData((prev) => ({
                            ...prev,
                            moreSpaceDescription: e.target.value
                          }))}
                          placeholder="Opisz swoje potrzeby, np. ilość bagażu, sprzęt sportowy..."
                          rows={3}
                          className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#ffc428] focus:border-[#ffc428] resize-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Przycisk Zamknij */}
                  <button
                    type="button"
                    onClick={() => setShowAdditionalOptions(false)}
                    className="w-full mt-2 px-3 py-2 bg-[#ffc428] text-[#215387] rounded-lg hover:bg-[#f5b920] transition-all font-bold text-xs"
                  >
                    Zamknij
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Kolumna 5 - Przycisk Submit */}
          <div>
            <button
              type="submit"
              className="w-full px-6 py-4 text-base bg-[#ffc428] text-[#215387] rounded-xl hover:bg-[#f5b920] transition-all font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Szukaj
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
