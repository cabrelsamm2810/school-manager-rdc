'use client';

type Props = {
  latitude: number | null;
  longitude: number | null;
  className?: string;
};

/**
 * Affiche une carte OpenStreetMap pour les coordonnées données.
 * Si aucune coordonnée, affiche un message d'absence.
 */
export function GeoLocationMap({ latitude, longitude, className }: Props) {
  const hasCoords = latitude != null && longitude != null;

  if (!hasCoords) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 ${className ?? ''}`}>
        <p className="text-sm text-slate-400">Aucune coordonnée GPS enregistrée.</p>
      </div>
    );
  }

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude! - 0.008},${latitude! - 0.008},${longitude! + 0.008},${latitude! + 0.008}&layer=mapnik&marker=${latitude},${longitude}`;
  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const osmLink = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;

  return (
    <div className={className}>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <iframe
          src={mapUrl}
          className="h-56 w-full"
          style={{ border: 0 }}
          loading="lazy"
          title="Carte de localisation de l'école"
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          📍 {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
        </p>
        <div className="flex gap-2">
          <a
            href={osmLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
          >
            OSM
          </a>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
          >
            Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
