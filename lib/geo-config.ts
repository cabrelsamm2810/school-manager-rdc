/**
 * Paramètres de géolocalisation pour le scan de présence.
 * Stockés côté client (localStorage) car la géolocalisation est une API navigateur.
 */

export type GeoConfig = {
  enabled: boolean;
  highAccuracy: boolean;
  timeout: number;       // ms — délai max pour obtenir une position
  maxAge: number;        // ms — âge max d'une position en cache
  geofenceEnabled: boolean;
  schoolLatitude: number | null;
  schoolLongitude: number | null;
  schoolRadius: number;  // mètres — rayon de la zone scolaire
};

export const defaultGeoConfig: GeoConfig = {
  enabled: true,
  highAccuracy: true,
  timeout: 10000,
  maxAge: 60000,
  geofenceEnabled: false,
  schoolLatitude: null,
  schoolLongitude: null,
  schoolRadius: 500,
};

const STORAGE_KEY = 'geo-config';

export function getGeoConfig(): GeoConfig {
  if (typeof window === 'undefined') return defaultGeoConfig;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultGeoConfig;
    return { ...defaultGeoConfig, ...JSON.parse(raw) };
  } catch {
    return defaultGeoConfig;
  }
}

export function saveGeoConfig(config: GeoConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Calcule la distance entre deux coordonnées (formule de Haversine), en mètres.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // rayon de la Terre en mètres
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}
