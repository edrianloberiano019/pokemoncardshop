const MIN_ARRIVAL_DAYS = 3;
const KM_PER_EXTRA_DAY = 500;
const MAX_ARRIVAL_DAYS = 14;
const FALLBACK_ARRIVAL_DAYS = MIN_ARRIVAL_DAYS + 2;

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Simplified distance-tier estimate — not a real carrier rate lookup.
 * Always at least MIN_ARRIVAL_DAYS; falls back to a conservative default
 * when either address is missing coordinates.
 */
export function estimateArrivalDays(distanceKm: number | null): number {
  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm < 0) {
    return FALLBACK_ARRIVAL_DAYS;
  }
  const extraDays = Math.floor(distanceKm / KM_PER_EXTRA_DAY);
  return Math.min(MIN_ARRIVAL_DAYS + extraDays, MAX_ARRIVAL_DAYS);
}

export function addDays(days: number, from: Date = new Date()): Date {
  const result = new Date(from);
  result.setDate(result.getDate() + days);
  return result;
}
