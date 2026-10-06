'use client';

import { useEffect, useState, useCallback } from 'react';

type Cours = {
  id: string;
  titre: string;
  type: string;
  classe: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  salle: string;
  enseignant: string;
  description: string;
  couleur: string;
  eleve: { id: string; nom: string; prenom: string } | null;
};

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function CalendarView({ classeFilter }: { classeFilter: string }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cours, setCours] = useState<Cours[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCours, setEditingCours] = useState<Cours | null>(null);
  const [saving, setSaving] = useState(false);

  const loadCours = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ mois: monthKey(currentDate) });
    if (classeFilter) params.set('classe', classeFilter);
    try {
      const res = await fetch(`/api/cours?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setCours(data.cours ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [currentDate, classeFilter]);

  useEffect(() => {
    loadCours();
  }, [loadCours]);

  // Group cours by date
  const coursByDay: Record<string, Cours[]> = {};
  for (const c of cours) {
    const key = toKey(new Date(c.date));
    if (!coursByDay[key]) coursByDay[key] = [];
    coursByDay[key].push(c);
  }

  // Build calendar grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Monday = 0
  let startWeekday = firstDay.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;
  const daysInMonth = lastDay.getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = toKey(new Date());
  const selectedCours = selectedDay ? (coursByDay[selectedDay] ?? []) : [];

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      titre: formData.get('titre') as string,
      type: formData.get('type') as string,
      classe: formData.get('classe') as string,
      date: formData.get('date') as string,
      heureDebut: formData.get('heureDebut') as string,
      heureFin: formData.get('heureFin') as string,
      salle: formData.get('salle') as string,
      enseignant: formData.get('enseignant') as string,
      description: formData.get('description') as string,
    };
    setSaving(true);
    try {
      const url = editingCours ? `/api/cours/${editingCours.id}` : '/api/cours';
      const method = editingCours ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowForm(false);
        setEditingCours(null);
        loadCours();
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce cours ?')) return;
    try {
      await fetch(`/api/cours/${id}`, { method: 'DELETE' });
      loadCours();
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-3">
      {/* En-tête calendrier */}
      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-soft">
        <button
          onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
        >
          ←
        </button>
        <h3 className="text-base font-bold text-slate-900">
          {MOIS[month]} {year}
        </h3>
        <button
          onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
          className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
        >
          →
        </button>
      </div>

      {/* Grille calendrier */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {JOURS.map((j) => (
            <div key={j} className="px-1 py-2 text-center text-xs font-semibold uppercase text-slate-500">
              {j}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            if (!date) return <div key={i} className="min-h-[64px] border-b border-r border-slate-100 bg-slate-50/50" />;
            const key = toKey(date);
            const dayCours = coursByDay[key] ?? [];
            const isToday = key === todayKey;
            const isSelected = key === selectedDay;
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(isSelected ? null : key)}
                className={`relative min-h-[64px] border-b border-r border-slate-100 p-1 text-left transition hover:bg-blue-50/50 ${
                  isSelected ? 'bg-blue-50 ring-1 ring-inset ring-blue-300' : ''
                }`}
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                    isToday ? 'bg-blue-600 text-white' : 'text-slate-700'
                  }`}
                >
                  {date.getDate()}
                </span>
                <div className="mt-0.5 space-y-0.5">
                  {dayCours.slice(0, 2).map((c) => (
                    <div
                      key={c.id}
                      className={`truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${
                        c.type === 'activite'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {c.heureDebut && `${c.heureDebut} `}{c.titre}
                    </div>
                  ))}
                  {dayCours.length > 2 && (
                    <div className="text-[10px] text-slate-400">+{dayCours.length - 2}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Détails du jour sélectionné */}
      {selectedDay && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">
              {new Date(selectedDay).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h4>
            <button
              onClick={() => { setEditingCours(null); setShowForm(true); }}
              className="btn-primary px-3 py-1.5 text-xs"
            >
              + Ajouter
            </button>
          </div>
          {loading ? (
            <p className="py-4 text-center text-sm text-slate-500">Chargement…</p>
          ) : selectedCours.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">Aucun cours ce jour.</p>
          ) : (
            <div className="space-y-2">
              {selectedCours.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-start justify-between rounded-xl border p-3 ${
                    c.type === 'activite' ? 'border-amber-200 bg-amber-50' : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        c.type === 'activite' ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'
                      }`}>
                        {c.type}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{c.titre}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-600">
                      {c.heureDebut && <span>⏰ {c.heureDebut}{c.heureFin ? `–${c.heureFin}` : ''}</span>}
                      {c.salle && <span>📍 {c.salle}</span>}
                      {c.enseignant && <span>👤 {c.enseignant}</span>}
                      <span>🏫 {c.classe}</span>
                    </div>
                    {c.description && <p className="mt-1 text-xs text-slate-500">{c.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingCours(c); setShowForm(true); }}
                      title="Modifier"
                      className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      title="Supprimer"
                      className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulaire ajout/édition */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowForm(false)}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-base font-bold text-slate-900">
              {editingCours ? 'Modifier le cours' : 'Nouveau cours / activité'}
            </h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Titre *</label>
                <input
                  name="titre"
                  defaultValue={editingCours?.titre ?? ''}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
                  <select
                    name="type"
                    defaultValue={editingCours?.type ?? 'cours'}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="cours">Cours</option>
                    <option value="activite">Activité</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Classe *</label>
                  <input
                    name="classe"
                    defaultValue={editingCours?.classe ?? classeFilter ?? ''}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Date *</label>
                <input
                  name="date"
                  type="date"
                  defaultValue={editingCours ? toKey(new Date(editingCours.date)) : selectedDay ?? ''}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Heure début</label>
                  <input
                    name="heureDebut"
                    type="time"
                    defaultValue={editingCours?.heureDebut ?? ''}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Heure fin</label>
                  <input
                    name="heureFin"
                    type="time"
                    defaultValue={editingCours?.heureFin ?? ''}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Salle</label>
                  <input
                    name="salle"
                    defaultValue={editingCours?.salle ?? ''}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Enseignant</label>
                  <input
                    name="enseignant"
                    defaultValue={editingCours?.enseignant ?? ''}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingCours?.description ?? ''}
                  rows={2}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingCours(null); }}
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 px-4 py-2.5 text-sm disabled:opacity-50"
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
