'use client';

import { useState, useEffect } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { Card } from '@/components/ui/Card';
import { getGeoConfig, saveGeoConfig, defaultGeoConfig, haversineDistance, type GeoConfig } from '@/lib/geo-config';
import { GeoScanTracker } from '@/components/enseignant/GeoScanTracker';

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

export default function ConfigGeolocalisationPage() {
  const [config, setConfig] = useState<GeoConfig>(defaultGeoConfig);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    setConfig(getGeoConfig());
  }, []);

  function update<K extends keyof GeoConfig>(key: K, value: GeoConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    saveGeoConfig(config);
    setSaved(true);
  }

  async function handleTest() {
    setTestStatus('testing');
    setTestResult('');
    if (!navigator.geolocation) {
      setTestStatus('error');
      setTestResult('La géolocalisation n\'est pas supportée par ce navigateur.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        let result = `Position obtenue : ${latitude.toFixed(5)}, ${longitude.toFixed(5)} (précision ±${Math.round(accuracy)}m)`;
        if (config.geofenceEnabled && config.schoolLatitude != null && config.schoolLongitude != null) {
          const dist = haversineDistance(latitude, longitude, config.schoolLatitude, config.schoolLongitude);
          const inside = dist <= config.schoolRadius;
          result += ` — ${inside ? '✅ Dans la zone scolaire' : `⚠️ Hors zone (${dist}m > ${config.schoolRadius}m)`}`;
        }
        setTestResult(result);
        setTestStatus('success');
      },
      (err) => {
        setTestStatus('error');
        setTestResult(err.message || 'Impossible d\'obtenir la position.');
      },
      {
        enableHighAccuracy: config.highAccuracy,
        timeout: config.timeout,
        maximumAge: config.maxAge,
      },
    );
  }

  function handleUseCurrentAsSchool() {
    setTestStatus('testing');
    setTestResult('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update('schoolLatitude', pos.coords.latitude);
        update('schoolLongitude', pos.coords.longitude);
        setTestStatus('success');
        setTestResult(`Coordonnées de l'école définies : ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
      },
      (err) => {
        setTestStatus('error');
        setTestResult(err.message || 'Impossible d\'obtenir la position.');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <ModulePage
      icon="location"
      eyebrow="Services"
      title="Configuration de la géolocalisation"
      description="Paramètres de capture GPS lors du scan de présence et géo-repérage de l'école."
    >
      <div className="space-y-6">
        {/* Activation */}
        <Card>
          <h3 className="mb-4 font-bold text-slate-900">Activation</h3>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
            <div>
              <span className="text-sm font-medium text-slate-700">Capturer la géolocalisation lors du scan</span>
              <p className="text-xs text-slate-400">Enregistre les coordonnées GPS de l'appareil à chaque scan de présence</p>
            </div>
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => update('enabled', e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
        </Card>

        {/* Paramètres GPS */}
        <Card>
          <h3 className="mb-4 font-bold text-slate-900">Paramètres GPS</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
              <div>
                <span className="text-sm font-medium text-slate-700">Haute précision</span>
                <p className="text-xs text-slate-400">Utilise le GPS pour une meilleure précision (consomme plus de batterie)</p>
              </div>
              <input
                type="checkbox"
                checked={config.highAccuracy}
                onChange={(e) => update('highAccuracy', e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Délai d'attente (secondes)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={Math.round(config.timeout / 1000)}
                  onChange={(e) => update('timeout', Math.max(1, Number(e.target.value)) * 1000)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Cache de position (secondes)</label>
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={Math.round(config.maxAge / 1000)}
                  onChange={(e) => update('maxAge', Math.max(0, Number(e.target.value)) * 1000)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Géo-repérage de l'école */}
        <Card>
          <h3 className="mb-4 font-bold text-slate-900">Géo-repérage de l'école</h3>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
            <div>
              <span className="text-sm font-medium text-slate-700">Vérifier la zone scolaire</span>
              <p className="text-xs text-slate-400">Valide que le scan est effectué dans le rayon de l'école</p>
            </div>
            <input
              type="checkbox"
              checked={config.geofenceEnabled}
              onChange={(e) => update('geofenceEnabled', e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
          </label>

          {config.geofenceEnabled && (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Latitude de l'école</label>
                  <input
                    type="number"
                    step="any"
                    value={config.schoolLatitude ?? ''}
                    onChange={(e) => update('schoolLatitude', e.target.value ? Number(e.target.value) : null)}
                    className={inputClass}
                    placeholder="-4.325"
                  />
                </div>
                <div>
                  <label className={labelClass}>Longitude de l'école</label>
                  <input
                    type="number"
                    step="any"
                    value={config.schoolLongitude ?? ''}
                    onChange={(e) => update('schoolLongitude', e.target.value ? Number(e.target.value) : null)}
                    className={inputClass}
                    placeholder="15.322"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Rayon de la zone scolaire (mètres)</label>
                <input
                  type="number"
                  min={50}
                  max={5000}
                  value={config.schoolRadius}
                  onChange={(e) => update('schoolRadius', Math.max(50, Number(e.target.value)))}
                  className={inputClass}
                />
              </div>
              <button
                onClick={handleUseCurrentAsSchool}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                📍 Utiliser ma position actuelle
              </button>
            </div>
          )}
        </Card>

        {/* Test */}
        <Card>
          <h3 className="mb-4 font-bold text-slate-900">Tester la géolocalisation</h3>
          <button
            onClick={handleTest}
            disabled={testStatus === 'testing'}
            className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {testStatus === 'testing' ? 'Test en cours…' : 'Lancer le test'}
          </button>
          {testResult && (
            <p className={`mt-3 rounded-xl px-4 py-3 text-sm ${testStatus === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {testResult}
            </p>
          )}
        </Card>

        {/* Suivi des scans */}
        <GeoScanTracker />

        {/* Sauvegarde */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className="rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 px-8 py-3 font-semibold text-white shadow-md transition hover:shadow-lg"
          >
            Enregistrer les paramètres
          </button>
          {saved && (
            <span className="text-sm font-medium text-green-600">✓ Paramètres enregistrés</span>
          )}
        </div>
      </div>
    </ModulePage>
  );
}
