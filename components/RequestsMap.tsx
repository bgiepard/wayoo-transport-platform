import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for start and end points
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

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
}

export default function RequestsMap({ requests, selectedRequestId }: RequestsMapProps) {
  const [mounted, setMounted] = useState(false);
  const apiKey = '11da404667ca45a78db6a73c3b6be0d9';

  useEffect(() => {
    setMounted(true);
  }, []);

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

        {requests.map((request) => {
          // Skip if no coordinates available
          if (!request.from.coordinates || !request.to.coordinates) {
            return null;
          }

          const fromLat = request.from.coordinates.lat;
          const fromLng = request.from.coordinates.lng;
          const toLat = request.to.coordinates.lat;
          const toLng = request.to.coordinates.lng;

          const isSelected = selectedRequestId === request.id;
          const lineColor = isSelected ? '#ffc428' : '#215387';
          const lineWeight = isSelected ? 4 : 2;

          return (
            <div key={request.id}>
              {/* Start marker */}
              <Marker position={[fromLat, fromLng]} icon={startIcon}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold text-[#215387] mb-1">Start</div>
                    <div>{request.from.city}</div>
                    {request.from.address && (
                      <div className="text-xs text-gray-500">{request.from.address}</div>
                    )}
                  </div>
                </Popup>
              </Marker>

              {/* End marker */}
              <Marker position={[toLat, toLng]} icon={endIcon}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-bold text-[#215387] mb-1">Cel</div>
                    <div>{request.to.city}</div>
                    {request.to.address && (
                      <div className="text-xs text-gray-500">{request.to.address}</div>
                    )}
                    <div className="mt-2 text-xs">
                      <div>👥 {request.passengerCount} osób</div>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Line connecting start and end */}
              <Polyline
                positions={[
                  [fromLat, fromLng],
                  [toLat, toLng],
                ]}
                color={lineColor}
                weight={lineWeight}
                opacity={0.7}
              />
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
