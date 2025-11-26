// Haversine formula to calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance); // Round to nearest km
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km} km`;
}

// Calculate route distance using Geoapify Routing API (optional, for more accurate road distance)
export async function calculateRouteDistance(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<number | null> {
  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;

  if (!apiKey) {
    console.warn('Geoapify API key not found, using Haversine distance');
    return calculateDistance(fromLat, fromLng, toLat, toLng);
  }

  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/routing?waypoints=${fromLat},${fromLng}|${toLat},${toLng}&mode=drive&apiKey=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Routing API request failed');
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const distanceInMeters = data.features[0].properties.distance;
      return Math.round(distanceInMeters / 1000); // Convert to km
    }

    // Fallback to Haversine
    return calculateDistance(fromLat, fromLng, toLat, toLng);
  } catch (error) {
    console.error('Error calculating route distance:', error);
    // Fallback to Haversine distance
    return calculateDistance(fromLat, fromLng, toLat, toLng);
  }
}
