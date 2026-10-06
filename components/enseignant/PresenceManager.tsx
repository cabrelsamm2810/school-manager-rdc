'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PresenceScanner } from './PresenceScanner';

type Eleve = {
  id: string;
  matricule: string;
  nom: string;
  postNom: string;
  prenom: string;
  classe: string;
};

type Presence = {
  id: string;
  eleveId: string;
  date: string;
  present: boolean;
  classe: string;
  latitude: number | null;
  longitude: number | null;
  eleve: { id: string; matricule: string; nom: string; postNom: string; prenom: string };
};

const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

export function PresenceManager() {
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [presences, setPresences] = useState<Record<string, boolean>>({});
  const [existingPresences, setExistingPresences] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  // Charger les classes disponibles
  useEffect(() => {
    fetch('/api/eleves')
      .then((r) => r.json())
      .then((data) => {
        if (data.eleves) {
          const uniqueClasses = [...new Set((data.eleves as Eleve[]).map((e) => e.classe))].sort();
          setClasses(uniqueClasses);
        }
      })
      .catch(() => {});
  }, []);

  // Charger les élèves de la classe sélectionnée
  useEffect(() => {
    if (!selectedClass) {
      setEleves([]);
      return;
    }
    fetch(`/api/eleves?classe=${encodeURIComponent(selectedClass)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.eleves) {
          setEleves(data.eleves);
          // Initialiser toutes les présences à true par défaut
          const initial: Record<string, boolean> = {};
          data.eleves.forEach((e: Eleve) => { initial[e.id] = true; });
          setPresences(initial);
        }
      })
      .catch(() => {});
  }, [selectedClass]);

  // Charger les présences existantes pour la date/classe
  useEffect(() => {
    if (!selectedClass || !selectedDate) {
      setExistingPresences([]);
      return;
    }
    setLoading(true);
    fetch(`/api/presences?classe=${encodeURIComponent(selectedClass)}&date=${selectedDate}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.presences) {
          setExistingPresences(data.presences);
          // Pré-remplir avec les présences existantes
          const existing: Record<string, boolean> = {};
          data.presences.forEach((p: Presence) => {
            existing[p.eleveId] = p.present;
          });
          if (data.presences.length > 0) {
            setPresences(existing);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedClass, selectedDate]);

  function togglePresence(eleveId: string) {
    setPresences((prev) => ({ ...prev, [eleveId]: !prev[eleveId] }));
  }

  async function handleSave() {
    if (!selectedClass || !selectedDate || eleves.length === 0) return;
    setSaving(true);
    setMessage('');

    try {
      // Pour chaque élève, créer ou mettre à jour la présence
      const promises = eleves.map(async (eleve) => {
        const existing = existingPresences.find((p) => p.eleveId === eleve.id);
        const present = presences[eleve.id] ?? true;

        if (existing) {
          // Mettre à jour si la valeur a changé
          if (existing.present !== present) {
            return fetch(`/api/presences/${existing.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ date: selectedDate, present, classe: selectedClass }),
            });
          }
        } else {
          // Créer nouvelle présence
          return fetch('/api/presences', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eleveId: eleve.id, date: selectedDate, present, classe: selectedClass }),
          });
        }
      });

      await Promise.all(promises);
      setMessage('Présences enregistrées avec succès.');
      // Recharger les présences
      const res = await fetch(`/api/presences?classe=${encodeURIComponent(selectedClass)}&date=${selectedDate}`);
      const data = await res.json();
      if (data.presences) setExistingPresences(data.presences);
    } catch {
      setMessage('Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePresence(id: string) {
    if (!confirm('Supprimer cet enregistrement de présence ?')) return;
    try {
      const res = await fetch(`/api/presences/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExistingPresences((prev) => prev.filter((p) => p.id !== id));
      }
    } catch {
      // ignore
    }
  }

  const presentCount = Object.values(presences).filter(Boolean).length;
  const absentCount = eleves.length - presentCount;

  return (
    <Card className="mt-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Gestion des présences</h2>
        <button
          onClick={() => setShowScanner(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h2v2H7zM15 8h2v2h-2zM7 14h2v2H7zM15 14h2v2h-2zM10 11h4" />
          </svg>
          Scanner QR
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Classe</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className={inputClass}>
            <option value="">— Sélectionner —</option>
            {classes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Date</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className={inputClass} />
        </div>
      </div>

      {selectedClass && (
        <>
          <div className="mt-4 flex gap-4 text-sm">
            <span className="font-medium text-green-600">Présents : {presentCount}</span>
            <span className="font-medium text-red-600">Absents : {absentCount}</span>
            <span className="text-slate-500">Total : {eleves.length}</span>
          </div>

          {loading ? (
            <p className="py-4 text-center text-sm text-slate-500">Chargement…</p>
          ) : eleves.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">Aucun élève dans cette classe.</p>
          ) : (
            <>
              <div className="mt-4 space-y-2">
                {eleves.map((eleve) => (
                  <div key={eleve.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5">
                    <span className="text-sm font-medium text-slate-700">
                      {eleve.nom} {eleve.postNom} {eleve.prenom}
                      <span className="ml-2 text-xs text-slate-400">{eleve.matricule}</span>
                    </span>
                    <button
                      onClick={() => togglePresence(eleve.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                        presences[eleve.id]
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {presences[eleve.id] ? '✓ Présent' : '✗ Absent'}
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto sm:px-8"
              >
                {saving ? 'Enregistrement…' : 'Enregistrer les présences'}
              </button>
            </>
          )}

          {existingPresences.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-slate-700">Présences enregistrées pour cette date</h3>
              <div className="space-y-1.5">
                {existingPresences.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-700">
                        {p.eleve.nom} {p.eleve.postNom} {p.eleve.prenom}
                        <span className={`ml-2 rounded px-2 py-0.5 text-xs font-medium ${p.present ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {p.present ? 'Présent' : 'Absent'}
                        </span>
                      </span>
                      {p.latitude != null && p.longitude != null && (
                        <a
                          href={`https://www.google.com/maps?q=${p.latitude},${p.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
                            <circle cx="12" cy="9" r="2.5" />
                          </svg>
                          {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeletePresence(p.id)}
                      className="text-xs text-red-500 transition hover:text-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {message && (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{message}</p>
      )}

      {showScanner && (
        <PresenceScanner onClose={() => setShowScanner(false)} />
      )}
    </Card>
  );
}
