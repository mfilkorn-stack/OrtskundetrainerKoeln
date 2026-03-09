/**
 * Calculate distance between two points in meters using Haversine formula.
 */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Find the minimum distance from a point to any point on a polyline (in meters).
 */
export function distanceToPolyline(
  lat: number,
  lng: number,
  coordinates: [number, number][] // [lng, lat] GeoJSON format
): number {
  let minDist = Infinity;
  for (const [cLng, cLat] of coordinates) {
    const d = distanceMeters(lat, lng, cLat, cLng);
    if (d < minDist) minDist = d;
  }
  // Also check distance to line segments
  for (let i = 0; i < coordinates.length - 1; i++) {
    const d = distanceToSegment(
      lat,
      lng,
      coordinates[i][1],
      coordinates[i][0],
      coordinates[i + 1][1],
      coordinates[i + 1][0]
    );
    if (d < minDist) minDist = d;
  }
  return minDist;
}

/**
 * Approximate distance from point to line segment.
 */
function distanceToSegment(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const dx = bLng - aLng;
  const dy = bLat - aLat;
  if (dx === 0 && dy === 0) {
    return distanceMeters(pLat, pLng, aLat, aLng);
  }
  let t = ((pLng - aLng) * dx + (pLat - aLat) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));
  const projLng = aLng + t * dx;
  const projLat = aLat + t * dy;
  return distanceMeters(pLat, pLng, projLat, projLng);
}

/**
 * Calculate center of a polyline (midpoint of all coordinates).
 */
export function polylineCenter(
  coordinates: [number, number][] // [lng, lat] GeoJSON format
): [number, number] {
  // Returns [lat, lng] for Leaflet
  let sumLat = 0;
  let sumLng = 0;
  for (const [lng, lat] of coordinates) {
    sumLat += lat;
    sumLng += lng;
  }
  return [sumLat / coordinates.length, sumLng / coordinates.length];
}

/**
 * Get all coordinates from a street geometry (handles both LineString and MultiLineString).
 */
export function getStreetCoordinates(
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString
): [number, number][] {
  if (geometry.type === "LineString") {
    return geometry.coordinates as [number, number][];
  }
  return geometry.coordinates.flat() as [number, number][];
}

/**
 * Get Leaflet-compatible coordinates from GeoJSON coordinates.
 * GeoJSON uses [lng, lat], Leaflet uses [lat, lng].
 */
export function toLeafletCoords(
  coords: [number, number][]
): [number, number][] {
  return coords.map(([lng, lat]) => [lat, lng]);
}

/**
 * Convert a street geometry to Leaflet-compatible positions.
 * Handles both LineString (single path) and MultiLineString (multiple segments).
 * Returns nested arrays for MultiLineString so Leaflet draws separate segments
 * instead of connecting them with diagonal lines.
 */
export function toLeafletPositions(
  geometry: GeoJSON.LineString | GeoJSON.MultiLineString
): [number, number][] | [number, number][][] {
  if (geometry.type === "LineString") {
    return toLeafletCoords(geometry.coordinates as [number, number][]);
  }
  return (geometry.coordinates as [number, number][][]).map((line) =>
    toLeafletCoords(line)
  );
}
