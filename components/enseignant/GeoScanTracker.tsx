'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { getGeoConfig, haversineDistance } from '@/lib/geo-config';

type Presence = {
  id: string;
  date: string;
  present: boolean;
  classe: string;
  latitude: number | null;
  longitude: number | null;
  eleve: { id: string; matricule: string; nom: string; postNom: string; prenom: string };
};

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

export function GeoScanTracker() {
  const [presences, setPresences] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [classe, setClasse] = useState('');
  const [classes, setClasses] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/eleves')
      .then((r) => r.json())
      .then((data) => {
        if (data.eleves) {
          setClasses([...new Set(data.eleves.map((e: { classe: string }) => e.classe))].sort());
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (classe) params.set('classe', classe);
    fetch(`/api/presences?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setPresences(data.presences ?? []))
      .catch(() => setPresences([]))
      .finally(() => setLoading(false));
  }, [date, classe]);

  const geoConfig = getGeoConfig();
  const hasGeofence =
    geoConfig.geofenceEnabled &&
    geoConfig.schoolLatitude != null &&
    geoConfig.schoolLongitude != null;

  const withGeo = presences.filter((p) => p.latitude != null && p.longitude != null);
  const withoutGeo = presences.filter((p) => p.latitude == null || p.longitude == null);
  const present = presences.filter((p) => p.present);

  const scansWithGeo = withGeo.map((p) => {
    const dist = hasGeofence
      ? haversineDistance(p.latitude!, p.longitude!, geoConfig.schoolLatitude!, geoConfig.schoolLongitude!)
      : null;
    return { ...p, distance: dist };
  });

  const inZone = hasGeofence ? scansWithGeo.filter((s) => s.distance! <= geoConfig.schoolRadius) : [];
  const outZone = hasGeofence ? scansWithGeo.filter((s) => s.distance! > geoConfig.schoolRadius) : [];

  return (
    <Card>
      <h3 className="mb-4 font-bold text-slate-900">Suivi des scans géolocalisés</h3>

      {/* Filtres */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Classe</label>
          <select value={classe} onChange={(e) => setClasse(e.target.value)} className={inputClass}>
            <option value="">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-2xl font-bold text-slate-900">{presences.length}</p>
          <p className="text-xs text-slate-500">Scans totaux</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
          <p className="text-2xl font-bold text-green-700">{present.length}</p>
          <p className="text-xs text-slate-500">Présents</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-center">
          <p className="text-2xl font-bold text-blue-700">{withGeo.length}</p>
          <p className="text-xs text-slate-500">Avec GPS</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-700">{withoutGeo.length}</p>
          <p className="text-xs text-slate-500">Sans GPS</p>
        </div>
      </div>

      {/* Alerte geofencing */}
      {hasGeofence && outZone.length > 0 && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠️ {outZone.length} scan{outZone.length > 1 ? 's' : ''} hors zone scolaire ({geoConfig.schoolRadius}m)
        </div>
      )}
      {hasGeofence && (
        <div className="mb-4 flex gap-4 text-sm">
          <span className="font-medium text-green-600">✅ Dans la zone : {inZone.length}</span>
          <span className="font-medium text-red-600">⚠️ Hors zone : {outZone.length}</span>
        </div>
      )}

      {/* Liste des scans */}
      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Chargement…</p>
      ) : presences.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">Aucun scan enregistré pour cette date.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scansWithGeo.map((p) => {
            const inZoneFlag = hasGeofence && p.distance != null && p.distance <= geoConfig.schoolRadius;
            const outZoneFlag = hasGeofence && p.distance != null && p.distance > geoConfig.schoolRadius;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                  outZoneFlag ? 'border-red-200 bg-red-50' : inZoneFlag ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {p.eleve.nom} {p.eleve.postNom} {p.eleve.prenom}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{p.classe}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.present ? 'Présent' : 'Absent'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{new Date(p.date).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    {p.latitude != null && p.longitude != null ? (
                      <>
                        <a
                          href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
                            <circle cx="12" cy="9" r="2.5" />
                          </svg>
                          {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                        </a>
                        {hasGeofence && p.distance != null && (
                          <span className={inZoneFlag ? 'text-green-600' : 'text-red-600'}>
                            {inZoneFlag ? '✅' : '⚠️'} {p.distance}m de l'établissement
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-amber-500">📍 GPS non capturé</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {withoutGeo.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {p.eleve.nom} {p.eleve.postNom} {p.eleve.prenom}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{p.classe}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.present ? 'Présent' : 'Absent'}
                  </span>
                </div>
                <span className="text-xs text-amber-500">📍 GPS non capturé</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
