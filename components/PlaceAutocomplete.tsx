import { useState, useRef, useEffect } from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  name: string;
  icon: React.ReactNode;
}

export default function PlaceAutocomplete({
  value,
  onChange,
  placeholder,
  name,
  icon,
}: PlaceAutocompleteProps) {
  const {
    ready,
    value: autocompleteValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'pl' },
    },
    debounce: 300,
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    setValue(inputValue);
    setShowDropdown(true);
  };

  const handleSelect = (description: string) => {
    onChange(description);
    setValue(description, false);
    clearSuggestions();
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ffc428] z-10">
          {icon}
        </div>
        <input
          type="text"
          name={name}
          value={value}
          onChange={handleInput}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          required
          disabled={!ready}
          className="w-full pl-11 pr-4 py-3.5 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
        />
      </div>

      {showDropdown && status === 'OK' && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 max-h-[300px] overflow-y-auto">
          {data.map((suggestion) => {
            const {
              place_id,
              structured_formatting: { main_text, secondary_text },
            } = suggestion;

            return (
              <button
                key={place_id}
                type="button"
                onClick={() => handleSelect(suggestion.description)}
                className="w-full text-left px-4 py-3 hover:bg-[#ffc428]/10 transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-[#ffc428] flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#215387] truncate">
                      {main_text}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {secondary_text}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
