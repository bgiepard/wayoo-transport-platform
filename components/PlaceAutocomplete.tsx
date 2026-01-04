import { useState, useRef, useEffect, useCallback } from 'react';

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  placeholder: string;
  name: string;
  icon: React.ReactNode;
}

interface MapboxFeature {
  id: string;
  place_name: string;
  text: string;
  place_type: string[];
  context?: Array<{ id: string; text: string }>;
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmdpZXBhcmQiLCJhIjoiY2p1eDNhMHdnMGY0YzRlbWwyd3J2NXRmcCJ9.kjB17ZZEQMzaABOCR6d-Gw';

export default function PlaceAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  name,
  icon,
}: PlaceAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        country: 'PL',
        language: 'pl',
        limit: '5',
        types: 'place,locality,address',
      });

      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.features) {
        setSuggestions(data.features);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    setShowDropdown(true);

    // Debounce API calls
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(inputValue);
    }, 300);
  };

  const handleSelect = (placeName: string) => {
    // Remove "województwo" from the place name
    const cleanedPlaceName = placeName.replace(/województwo\s*/gi, '').replace(/,\s*,/g, ',').trim();
    onChange(cleanedPlaceName);
    setSuggestions([]);
    setShowDropdown(false);
    if (onSelect) {
      onSelect(cleanedPlaceName);
    }
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
          className="w-full pl-11 pr-4 py-3.5 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ffc428] focus:border-[#ffc428] transition-all"
        />
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 max-h-[300px] overflow-y-auto">
          {suggestions.map((suggestion) => {
            // Extract main text and context (region, country)
            const mainText = suggestion.text;
            const contextText = suggestion.context
              ?.map(c => c.text.replace(/województwo\s*/gi, ''))
              .filter(text => text.trim() !== '')
              .join(', ') || '';

            return (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => handleSelect(suggestion.place_name)}
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
                      {mainText}
                    </div>
                    {contextText && (
                      <div className="text-sm text-gray-500 truncate">
                        {contextText}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showDropdown && isLoading && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 px-4 py-3 text-center text-gray-500">
          Wyszukiwanie...
        </div>
      )}
    </div>
  );
}
