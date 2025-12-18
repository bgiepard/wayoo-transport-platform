import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Color palette for different routes
const routeColors = [
  '#10b981', // green
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#06b6d4', // cyan
];

// Function to create custom colored marker icon
const createColoredIcon = (color: string, isStart: boolean) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative;">
        <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0Z"
                fill="${color}" stroke="#fff" stroke-width="2"/>
          <circle cx="12.5" cy="12.5" r="6" fill="#fff"/>
          <text x="12.5" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="${color}">
            ${isStart ? 'A' : 'B'}
          </text>
        </svg>
      </div>
    `,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

interface RequestLocation {
  id: string;
  from: {
    city: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  to: {
    city: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  passengerCount: number;
  departureDate: Date;
}

interface RequestsMapProps {
  requests: RequestLocation[];
  selectedRequestId?: string | null;
  centerPoint?: { lat: number; lng: number } | null;
  radius?: number;
  onCenterPointChange?: (point: { lat: number; lng: number } | null) => void;
}

// Component to handle map clicks
function MapClickHandler({ onCenterPointChange }: { onCenterPointChange?: (point: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click: (e) => {
      if (onCenterPointChange) {
        onCenterPointChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

export default function RequestsMap({ requests, selectedRequestId, centerPoint, radius = 50, onCenterPointChange }: RequestsMapProps) {
  const [mounted, setMounted] = useState(false);
  const apiKey = '11da404667ca45a78db6a73c3b6be0d9';
  const [routePaths, setRoutePaths] = useState<{ [key: string]: [number, number][] }>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch routes for all requests
  useEffect(() => {
    const fetchRoutes = async () => {
      const newRoutePaths: { [key: string]: [number, number][] } = {};

      for (const request of requests) {
        if (!request.from.coordinates || !request.to.coordinates) continue;

        try {
          const response = await fetch(
            `https://api.geoapify.com/v1/routing?waypoints=${request.from.coordinates.lat},${request.from.coordinates.lng}|${request.to.coordinates.lat},${request.to.coordinates.lng}&mode=drive&apiKey=${apiKey}`
          );
          const data = await response.json();

          if (data.features && data.features.length > 0) {
            const geometry = data.features[0].geometry;
            let allCoordinates: [number, number][] = [];

            // Handle both LineString and MultiLineString
            if (geometry.type === 'LineString') {
              allCoordinates = geometry.coordinates;
            } else if (geometry.type === 'MultiLineString') {
              allCoordinates = geometry.coordinates.flat();
            }

            // Convert from [lng, lat] to [lat, lng] for Leaflet
            const routePoints: [number, number][] = allCoordinates.map((coord: [number, number]) => [
              coord[1],
              coord[0],
            ]);
            newRoutePaths[request.id] = routePoints;
          }
        } catch (error) {
          console.error('Error fetching route for request', request.id, error);
          // Fallback to straight line
          newRoutePaths[request.id] = [
            [request.from.coordinates.lat, request.from.coordinates.lng],
            [request.to.coordinates.lat, request.to.coordinates.lng],
          ];
        }
      }

      setRoutePaths(newRoutePaths);
    };

    if (mounted && requests.length > 0) {
      fetchRoutes();
    }
  }, [mounted, requests, apiKey]);

  if (!mounted) {
    return (
      <div className="h-full w-full bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-gray-500">Ładowanie mapy...</div>
      </div>
    );
  }

  // Default center of Poland
  const defaultCenter: [number, number] = [52.0, 19.0];
  const defaultZoom = 6;

  return (
    <div className="h-full w-full rounded-xl overflow-hidden shadow-lg">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a>'
          url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${apiKey}`}
        />

        {/* Map click handler */}
        <MapClickHandler onCenterPointChange={onCenterPointChange} />

        {/* Geographic filter circle */}
        {centerPoint && (
          <>
            <Circle
              center={[centerPoint.lat, centerPoint.lng]}
              radius={radius * 1000} // Convert km to meters
              pathOptions={{
                color: '#ffc428',
                fillColor: '#ffc428',
                fillOpacity: 0.15,
                weight: 2,
              }}
            />
            <Marker position={[centerPoint.lat, centerPoint.lng]}>
              <Popup>
                <div className="text-sm">
                  <div className="font-bold text-[#215387] mb-1">Punkt filtrowania</div>
                  <div className="text-xs text-gray-600">
                    Promień: {radius} km
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {requests.map((request, index) => {
          // Skip if no coordinates available
          if (!request.from.coordinates || !request.to.coordinates) {
            return null;
          }

          const fromLat = request.from.coordinates.lat;
          const fromLng = request.from.coordinates.lng;
          const toLat = request.to.coordinates.lat;
          const toLng = request.to.coordinates.lng;

          const isSelected = selectedRequestId === request.id;

          // Assign unique color to each request
          const routeColor = routeColors[index % routeColors.length];
          const lineColor = isSelected ? '#ffc428' : routeColor;
          const lineWeight = isSelected ? 5 : 3;
          const lineOpacity = isSelected ? 0.9 : 0.6;

          // Create colored icons for this request
          const startIconColored = createColoredIcon(routeColor, true);
          const endIconColored = createColoredIcon(routeColor, false);

          return (
            <div key={request.id}>
              {/* Start marker */}
              <Marker position={[fromLat, fromLng]} icon={startIconColored}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold mb-1" style={{ color: routeColor }}>Start (A)</div>
                    <div className="font-semibold">{request.from.city}</div>
                    {request.from.address && (
                      <div className="text-xs text-gray-500">{request.from.address}</div>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* End marker */}
              <Marker position={[toLat, toLng]} icon={endIconColored}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold mb-1" style={{ color: routeColor }}>Cel (B)</div>
                    <div className="font-semibold">{request.to.city}</div>
                    {request.to.address && (
                      <div className="text-xs text-gray-500">{request.to.address}</div>
                    )}
                    <div className="mt-2 text-xs">
                      <div>👥 {request.passengerCount} osób</div>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Route line - use real route if available, otherwise straight line */}
              <Polyline
                positions={
                  routePaths[request.id] || [
                    [fromLat, fromLng],
                    [toLat, toLng],
                  ]
                }
                color={lineColor}
                weight={lineWeight}
                opacity={lineOpacity}
              />
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
