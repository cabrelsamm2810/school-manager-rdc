'use client';

import { useState } from 'react';

const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

type Props = {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
};

export function GeoLocationInput({ latitude, longitude, onChange }: Props) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const hasCoords = latitude != null && longitude != null;

  function handleLocate() {
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      (err) => {
        setError(err.message || 'Impossible d\'obtenir votre position.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function handleLat(value: string) {
    const num = value === '' ? null : Number(value);
    onChange(Number.isNaN(num as number) ? null : num, longitude);
  }

  function handleLng(value: string) {
    const num = value === '' ? null : Number(value);
    onChange(latitude, Number.isNaN(num as number) ? null : num);
  }

  // OpenStreetMap embed (no API key needed)
  const mapUrl = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${longitude! - 0.01},${latitude! - 0.01},${longitude! + 0.01},${latitude! + 0.01}&layer=mapnik&marker=${latitude},${longitude}`
    : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1" style={{ minWidth: '120px' }}>
          <label className={labelClass} htmlFor="geo-lat">Latitude</label>
          <input
            id="geo-lat"
            type="number"
            step="any"
            value={latitude ?? ''}
            onChange={(e) => handleLat(e.target.value)}
            className={inputClass}
            placeholder="-4.325"
          />
        </div>
        <div className="flex-1" style={{ minWidth: '120px' }}>
          <label className={labelClass} htmlFor="geo-lng">Longitude</label>
          <input
            id="geo-lng"
            type="number"
            step="any"
            value={longitude ?? ''}
            onChange={(e) => handleLng(e.target.value)}
            className={inputClass}
            placeholder="15.322"
          />
        </div>
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          className="flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100 disabled:opacity-50"
        >
          {locating ? (
            <span className="btn-spinner h-4 w-4" />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          Ma position
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {mapUrl && (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <iframe
            src={mapUrl}
            className="h-48 w-full"
            style={{ border: 0 }}
            loading="lazy"
            title="Carte de localisation"
          />
        </div>
      )}
    </div>
  );
}
