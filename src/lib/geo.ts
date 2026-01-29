export type LatLng = { lat: number; lng: number };

/**
 * Parses a "lat, lng" string into numbers.
 * Accepts formats like: "34.12345, 35.67890" (whitespace optional).
 */
export function parseLatLngFromString(input: string): LatLng | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/,
  );
  if (!match) return null;

  const lat = Number(match[1]);
  const lng = Number(match[2]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90) return null;
  if (lng < -180 || lng > 180) return null;

  return { lat, lng };
}
