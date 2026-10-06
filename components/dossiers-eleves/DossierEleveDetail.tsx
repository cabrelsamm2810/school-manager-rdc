'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { DossierEleveExportButton } from './DossierEleveExport';
import { DocumentsManager } from './DocumentsManager';

type Eleve = {
  id: string;
  matricule: string;
  nom: string;
  postNom: string;
  prenom: string;
  classe: string;
  sexe: string;
  etablissement: { id: string; nom: string } | null;
};

type Document = {
  id: string;
  type: string;
  titre: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  description: string;
  uploadedBy: string;
  createdAt: string;
};

type Resultat = {
  id: string;
  periode: string;
  matiere: string;
  note: string;
  moyenne: string;
  mention: string;
  appreciation: string;
  anneeScolaire: string;
  createdAt: string;
};

type Interaction = {
  id: string;
  type: string;
  sujet: string;
  description: string;
  date: string;
  intervenant: string;
  statut: string;
  createdAt: string;
};

type Tab = 'documents' | 'resultats' | 'historique';

const INTERACTION_TYPES = ['Entretien parents', 'Sanction disciplinaire', 'Félicitation', 'Orientation', 'Suivi pédagogique', 'Autre'];
const PERIODES = ['1er Trimestre', '2e Trimestre', '3e Trimestre', 'Examen de fin d\'année'];
const MENTIONS = ['Excellent', 'Très Bien', 'Bien', 'Assez Bien', 'Passable', 'Insuffisant'];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function DossierEleveDetail({ eleve }: { eleve: Eleve }) {
  const [tab, setTab] = useState<Tab>('documents');

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {/* En-tête élève */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-slate-50 px-4 py-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white">
          {eleve.prenom[0]}{eleve.nom[0]}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-bold text-slate-900">{eleve.prenom} {eleve.nom}</h2>
          <p className="truncate text-xs text-slate-500">
            {eleve.matricule} • Classe {eleve.classe}
            {eleve.etablissement ? ` • ${eleve.etablissement.nom}` : ''}
          </p>
        </div>
        <DossierEleveExportButton eleve={eleve} />
      </div>

      {/* Onglets */}
      <div className="flex border-b border-slate-200">
        {([
          { key: 'documents', label: 'Documents', icon: '📁' },
          { key: 'resultats', label: 'Résultats', icon: '📊' },
          { key: 'historique', label: 'Historique', icon: '🕐' },
        ] as { key: Tab; label: string; icon: string }[]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'flex-1 px-3 py-2.5 text-center text-sm font-medium transition',
              tab === t.key
                ? 'border-b-2 border-blue-600 text-blue-700'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <span className="mr-1">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="p-4">
        {tab === 'documents' && <DocumentsManager eleveId={eleve.id} />}
        {tab === 'resultats' && <ResultatsTab eleveId={eleve.id} />}
        {tab === 'historique' && <HistoriqueTab eleveId={eleve.id} />}
      </div>
    </div>
  );
}



// ── Onglet Résultats ──
function ResultatsTab({ eleveId }: { eleveId: string }) {
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    periode: '', matiere: '', note: '', moyenne: '', mention: '', appreciation: '', anneeScolaire: '',
  });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/eleves/${eleveId}/resultats`);
      const data = await res.json();
      if (Array.isArray(data)) setResultats(data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [eleveId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.periode.trim()) return;
    await fetch(`/api/eleves/${eleveId}/resultats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ periode: '', matiere: '', note: '', moyenne: '', mention: '', appreciation: '', anneeScolaire: '' });
    setShowForm(false);
    load();
  }

  async function handleDelete(resId: string) {
    if (!confirm('Supprimer ce résultat ?')) return;
    await fetch(`/api/eleves/${eleveId}/resultats?resId=${resId}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <p className="py-6 text-center text-sm text-slate-400">Chargement…</p>;

  return (
    <div>
      <div className="mb-3 flex justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{resultats.length} résultat{resultats.length > 1 ? 's' : ''}</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
        >
          {showForm ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Période *</label>
              <select required value={form.periode} onChange={(e) => setForm({ ...form, periode: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="">— Sélectionner —</option>
                {PERIODES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Année scolaire</label>
              <input type="text" value={form.anneeScolaire} onChange={(e) => setForm({ ...form, anneeScolaire: e.target.value })}
                placeholder="Ex: 2025-2026"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Matière</label>
              <input type="text" value={form.matiere} onChange={(e) => setForm({ ...form, matiere: e.target.value })}
                placeholder="Ex: Mathématiques"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Note</label>
              <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Ex: 15/20"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Moyenne</label>
              <input type="text" value={form.moyenne} onChange={(e) => setForm({ ...form, moyenne: e.target.value })}
                placeholder="Ex: 14.5/20"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Mention</label>
              <select value={form.mention} onChange={(e) => setForm({ ...form, mention: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="">—</option>
                {MENTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Appréciation</label>
            <textarea value={form.appreciation} onChange={(e) => setForm({ ...form, appreciation: e.target.value })} rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <button type="submit" disabled={!form.periode.trim()}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-40">
            Enregistrer
          </button>
        </form>
      )}

      {resultats.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Aucun résultat. Cliquez sur « + Ajouter ».</p>
      ) : (
        <div className="space-y-2">
          {resultats.map((r) => (
            <div key={r.id} className="rounded-lg border border-slate-100 p-3 transition hover:border-slate-200">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">{r.periode}</span>
                    {r.anneeScolaire && <span className="text-xs text-slate-400">{r.anneeScolaire}</span>}
                    {r.matiere && <span className="text-xs text-slate-500">• {r.matiere}</span>}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-3 text-sm">
                    {r.note && <span className="text-slate-700">Note: <strong>{r.note}</strong></span>}
                    {r.moyenne && <span className="text-slate-700">Moyenne: <strong>{r.moyenne}</strong></span>}
                    {r.mention && <span className="text-slate-700">Mention: <strong className="text-blue-600">{r.mention}</strong></span>}
                  </div>
                  {r.appreciation && <p className="mt-1 text-xs text-slate-500">{r.appreciation}</p>}
                </div>
                <button onClick={() => handleDelete(r.id)} className="shrink-0 rounded-lg p-1.5 text-red-500 hover:bg-red-50" aria-label="Supprimer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Onglet Historique ──
function HistoriqueTab({ eleveId }: { eleveId: string }) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: '', sujet: '', description: '', date: '', intervenant: '', statut: 'Enregistré' });

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/eleves/${eleveId}/interactions`);
      const data = await res.json();
      if (Array.isArray(data)) setInteractions(data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [eleveId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.type.trim() || !form.sujet.trim()) return;
    await fetch(`/api/eleves/${eleveId}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ type: '', sujet: '', description: '', date: '', intervenant: '', statut: 'Enregistré' });
    setShowForm(false);
    load();
  }

  async function handleDelete(intId: string) {
    if (!confirm('Supprimer cette interaction ?')) return;
    await fetch(`/api/eleves/${eleveId}/interactions?intId=${intId}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <p className="py-6 text-center text-sm text-slate-400">Chargement…</p>;

  const STATUT_COLORS: Record<string, string> = {
    'Enregistré': 'bg-slate-100 text-slate-600',
    'En cours': 'bg-amber-50 text-amber-600',
    'Résolu': 'bg-green-50 text-green-600',
    'Clôturé': 'bg-blue-50 text-blue-600',
  };

  return (
    <div>
      <div className="mb-3 flex justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{interactions.length} interaction{interactions.length > 1 ? 's' : ''}</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
        >
          {showForm ? 'Annuler' : '+ Ajouter'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Type *</label>
              <select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="">— Sélectionner —</option>
                {INTERACTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
              <input type="date" value={form.date ? form.date.split('T')[0] : ''} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Sujet *</label>
            <input type="text" required value={form.sujet} onChange={(e) => setForm({ ...form, sujet: e.target.value })}
              placeholder="Ex: Entretien avec les parents"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Intervenant</label>
              <input type="text" value={form.intervenant} onChange={(e) => setForm({ ...form, intervenant: e.target.value })}
                placeholder="Nom de l'intervenant"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Statut</label>
              <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="Enregistré">Enregistré</option>
                <option value="En cours">En cours</option>
                <option value="Résolu">Résolu</option>
                <option value="Clôturé">Clôturé</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <button type="submit" disabled={!form.type.trim() || !form.sujet.trim()}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-40">
            Enregistrer
          </button>
        </form>
      )}

      {interactions.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">Aucune interaction. Cliquez sur « + Ajouter ».</p>
      ) : (
        <div className="space-y-2">
          {interactions.map((it) => (
            <div key={it.id} className="relative rounded-lg border border-slate-100 p-3 pl-6 transition hover:border-slate-200">
              <div className="absolute left-3 top-3 h-2 w-2 rounded-full bg-blue-500" />
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">{it.type}</span>
                    <span className={clsx('rounded-full px-2 py-0.5 text-xs', STATUT_COLORS[it.statut] || 'bg-slate-100 text-slate-600')}>{it.statut}</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-900">{it.sujet}</p>
                  {it.description && <p className="mt-0.5 text-xs text-slate-500">{it.description}</p>}
                  <p className="mt-1 text-xs text-slate-400">{formatDate(it.date)} • {it.intervenant}</p>
                </div>
                <button onClick={() => handleDelete(it.id)} className="shrink-0 rounded-lg p-1.5 text-red-500 hover:bg-red-50" aria-label="Supprimer">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
