'use client';

import { useEffect, useState, useCallback, useMemo, FormEvent } from 'react';
import { clsx } from 'clsx';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { StatutBadge } from '@/components/ui/StatutBadge';
import { Icon } from '@/components/ui/Icon';
import { AffectationPanel } from './AffectationPanel';
import { PROVINCE_NAMES, PROVINCES_EDUCATIONNELLES } from '@/lib/provinces-rdc';
import { CLASSES_RDC, CYCLES_RDC } from '@/lib/curriculum-rdc';
import { isSimpleFlowClass, getCycleForClass } from '@/lib/presence-flow';

/* ── Types ── */

type Enseignant = {
  id: string;
  nom: string;
  matricule: string;
  grade?: string;
  ecole?: string;
  ecoleId?: string | null;
  ecoleRattachee?: { id: string; nom: string } | null;
  specialite?: string;
  telephone?: string;
  email?: string;
  statut: string;
};

type AffectationInfo = {
  classe: string;
  matiere: string;
  niveau: string;
};

type FilterState = Record<string, string>;

/* ── Niveaux (cycles) pour les filtres ── */
const NIVEAU_OPTIONS = CYCLES_RDC.map((c) => ({ value: c, label: c }));

/* ── Classes groupées par flux pour les filtres ── */
const CLASSE_OPTIONS = CLASSES_RDC.map((c) => ({ value: c.nom, label: c.nom }));

const STATUT_OPTIONS = [
  { value: 'Actif', label: 'Actif' },
  { value: 'Congé', label: 'En congé' },
  { value: 'Inactif', label: 'Inactif' },
];

const FORM_FIELDS = [
  { name: 'nom', label: 'Nom complet', type: 'text' as const, required: true },
  { name: 'matricule', label: 'Matricule', type: 'text' as const, required: true, half: true },
  { name: 'grade', label: 'Grade', type: 'text' as const, half: true },
  { name: 'ecoleId', label: 'École', type: 'select' as const, half: true, endpoint: '/api/ecoles', dataKey: 'ecoles' },
  { name: 'specialite', label: 'Spécialité', type: 'text' as const, half: true },
  { name: 'telephone', label: 'Téléphone', type: 'text' as const, half: true },
  { name: 'email', label: 'Email', type: 'text' as const, half: true },
  { name: 'statut', label: 'Statut', type: 'select' as const, half: true, default: 'Actif', options: STATUT_OPTIONS },
];

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/15';
const labelClass = 'mb-1.5 block text-[13px] font-medium text-slate-600';

/* ── Helpers ── */

function emptyForm(): Record<string, any> {
  const form: Record<string, any> = {};
  for (const f of FORM_FIELDS) {
    form[f.name] = f.default ?? '';
  }
  return form;
}

function itemToForm(item: Enseignant): Record<string, any> {
  return {
    nom: item.nom ?? '',
    matricule: item.matricule ?? '',
    grade: item.grade ?? '',
    ecoleId: item.ecoleId ?? '',
    specialite: item.specialite ?? '',
    telephone: item.telephone ?? '',
    email: item.email ?? '',
    statut: item.statut ?? 'Actif',
  };
}

function formToPayload(form: Record<string, any>): Record<string, any> {
  return { ...form };
}

function getInitials(nom: string): string {
  const parts = nom.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

/* ── Component ── */

export function EnseignantsManager() {
  const [items, setItems] = useState<Enseignant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>(() => emptyForm());
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [ecoleOptions, setEcoleOptions] = useState<{ value: string; label: string }[]>([]);
  const [coordOptions, setCoordOptions] = useState<{ value: string; label: string; province?: string }[]>([]);
  const [affectationMap, setAffectationMap] = useState<Record<string, AffectationInfo[]>>({});
  const [affectationTarget, setAffectationTarget] = useState<{ id: string; nom: string; ecoleId?: string | null } | null>(null);

  // ── Batch ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchForm, setBatchForm] = useState<Record<string, any>>(() => emptyForm());
  const [batchFields, setBatchFields] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState('');

  // Load async options
  useEffect(() => {
    (async () => {
      try {
        const [ecoleRes, coordRes] = await Promise.all([
          fetch('/api/ecoles'),
          fetch('/api/coordination-sous-provinciale'),
        ]);
        const ecoleData = await ecoleRes.json();
        const coordData = await coordRes.json();
        setEcoleOptions((ecoleData.ecoles ?? []).map((e: any) => ({ value: e.id, label: e.nom })));
        setCoordOptions((coordData.coordSousProvinciales ?? []).map((c: any) => ({ value: c.id, label: c.nom, province: c.province })));
      } catch {}
    })();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      for (const [key, val] of Object.entries(filters)) {
        if (val) params.set(key, val);
      }
      const res = await fetch(`/api/enseignants?${params.toString()}`);
      const data = await res.json();
      setItems(data.enseignants ?? data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [search, filters]);

  useEffect(() => {
    const timer = setTimeout(loadData, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadData, search]);

  // ── Charger les affectations pour tous les enseignants affichés ──
  useEffect(() => {
    if (items.length === 0) {
      setAffectationMap({});
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/enseignant-affectations');
        const data = await res.json();
        const map: Record<string, AffectationInfo[]> = {};
        for (const a of data.affectations ?? []) {
          if (!map[a.enseignantId]) map[a.enseignantId] = [];
          map[a.enseignantId].push({ classe: a.classe, matiere: a.matiere, niveau: a.niveau });
        }
        setAffectationMap(map);
      } catch {
        setAffectationMap({});
      }
    })();
  }, [items]);

  // ── CRUD ──

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function startEdit(item: Enseignant) {
    setEditingId(item.id);
    setForm(itemToForm(item));
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const url = editingId ? `/api/enseignants/${editingId}` : '/api/enseignants';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formToPayload(form)),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Erreur lors de l'enregistrement.");
      } else {
        setShowForm(false);
        setEditingId(null);
        loadData();
      }
    } catch {
      setFormError('Impossible de joindre le serveur.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cet enseignant ?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/enseignants/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch {} finally {
      setDeletingId(null);
    }
  }

  // ── Batch ──

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(selectedIds.size === displayItems.length ? new Set() : new Set(displayItems.map((i) => i.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setShowBatchForm(false);
  }

  async function handleBatchDelete() {
    if (!confirm(`Supprimer ${selectedIds.size} enseignant(s) ?`)) return;
    setBatchLoading(true);
    try {
      const res = await fetch('/api/enseignants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selectedIds] }),
      });
      if (res.ok) { clearSelection(); loadData(); }
    } catch {} finally {
      setBatchLoading(false);
    }
  }

  function startBatchEdit() {
    setBatchForm(emptyForm());
    setBatchFields(new Set());
    setBatchError('');
    setShowBatchForm(true);
  }

  async function handleBatchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBatchError('');
    if (batchFields.size === 0) { setBatchError('Sélectionnez au moins un champ.'); return; }
    const data: Record<string, any> = {};
    for (const name of batchFields) data[name] = batchForm[name];
    setBatchLoading(true);
    try {
      const res = await fetch('/api/enseignants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selectedIds], data }),
      });
      if (res.ok) { clearSelection(); loadData(); }
      else { const r = await res.json(); setBatchError(r.error ?? 'Erreur.'); }
    } catch {
      setBatchError('Impossible de joindre le serveur.');
    } finally {
      setBatchLoading(false);
    }
  }

  // ── Derived ──

  const totalActifs = items.filter((e) => e.statut === 'Actif').length;
  const totalConge = items.filter((e) => e.statut === 'Congé').length;
  const totalGrades = new Set(items.map((e) => e.grade).filter(Boolean)).size;
  const activeFilters = Object.values(filters).filter(Boolean).length;

  // ── Filtrage client par niveau/classe/matière (basé sur les affectations) ──
  const displayItems = useMemo(() => {
    let list = items;
    if (filters.niveau) {
      list = list.filter((e) => {
        const affs = affectationMap[e.id] ?? [];
        return affs.some((a) => a.niveau === filters.niveau);
      });
    }
    if (filters.classe) {
      list = list.filter((e) => {
        const affs = affectationMap[e.id] ?? [];
        return affs.some((a) => a.classe === filters.classe);
      });
    }
    if (filters.matiere) {
      list = list.filter((e) => {
        const affs = affectationMap[e.id] ?? [];
        return affs.some((a) => a.matiere === filters.matiere);
      });
    }
    return list;
  }, [items, filters, affectationMap]);

  // ── Matières disponibles pour le filtre (selon le niveau sélectionné) ──
  const matiereFilterOptions = useMemo(() => {
    if (!filters.niveau) return [];
    const matieres = new Set<string>();
    for (const affs of Object.values(affectationMap)) {
      for (const a of affs) {
        if (a.niveau === filters.niveau && a.matiere) matieres.add(a.matiere);
      }
    }
    return [...matieres].sort();
  }, [filters.niveau, affectationMap]);

  // Cascading filter options
  const provEducOptions = PROVINCES_EDUCATIONNELLES
    .filter((p) => !filters.provinceAdministrative || p.provinceAdministrative === filters.provinceAdministrative)
    .map((p) => ({ value: p.nom, label: p.nom }));

  const coordFiltered = coordOptions.filter(
    (c) => !filters.provinceEducationnelle || c.province === filters.provinceEducationnelle
  );

  function resetDescendants(name: string, newFilters: FilterState) {
    for (const child of ['provinceEducationnelle', 'coordSousProvincialeId', 'ecoleId']) {
      // simple: reset all if parent changes
    }
    if (name === 'provinceAdministrative') {
      newFilters.provinceEducationnelle = '';
      newFilters.coordSousProvincialeId = '';
    }
    if (name === 'provinceEducationnelle') {
      newFilters.coordSousProvincialeId = '';
    }
  }

  /* ── Render ── */

  if (showForm) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <Icon name="teacher" className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {editingId ? 'Modifier l\'enseignant' : 'Nouvel enseignant'}
            </h2>
          </div>
          <button
            onClick={() => { setShowForm(false); setEditingId(null); }}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Retour"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            {FORM_FIELDS.map((f) => (
              <div key={f.name} className={f.half ? '' : 'sm:col-span-2'}>
                <label className={labelClass} htmlFor={`fld-${f.name}`}>
                  {f.label} {f.required && <span className="text-red-400">*</span>}
                </label>
                {f.type === 'select' ? (
                  <select
                    id={`fld-${f.name}`}
                    value={form[f.name]}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">— Choisir —</option>
                    {(f.options ?? (f.name === 'ecoleId' ? ecoleOptions : [])).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`fld-${f.name}`}
                    type={f.type}
                    required={f.required}
                    value={form[f.name]}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className={inputClass}
                  />
                )}
              </div>
            ))}
          </div>
          {formError && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{formError}</p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary-light px-4 py-2.5 text-sm">
              Annuler
            </button>
            <button type="submit" disabled={formLoading} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
              {formLoading ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (showBatchForm) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Modifier {selectedIds.size} enseignant(s)</h2>
          <button onClick={() => setShowBatchForm(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-5 rounded-xl bg-brand-50 px-4 py-2.5 text-sm text-brand-700">
          Cochez les champs à appliquer. Seuls les champs cochés seront modifiés.
        </p>
        <form onSubmit={handleBatchSubmit} className="space-y-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            {FORM_FIELDS.map((f) => (
              <div key={f.name} className={f.half ? '' : 'sm:col-span-2'}>
                <div className="mb-1.5 flex items-center gap-2">
                  <input type="checkbox" checked={batchFields.has(f.name)} onChange={() => {
                    setBatchFields((prev) => { const n = new Set(prev); if (n.has(f.name)) n.delete(f.name); else n.add(f.name); return n; });
                  }} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <label className="text-[13px] font-medium text-slate-600">{f.label}</label>
                </div>
                {f.type === 'select' ? (
                  <select value={batchForm[f.name]} disabled={!batchFields.has(f.name)} onChange={(e) => setBatchForm({ ...batchForm, [f.name]: e.target.value })} className={clsx(inputClass, 'disabled:opacity-40')}>
                    <option value="">— Choisir —</option>
                    {(f.options ?? (f.name === 'ecoleId' ? ecoleOptions : [])).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input type={f.type} value={batchForm[f.name]} disabled={!batchFields.has(f.name)} onChange={(e) => setBatchForm({ ...batchForm, [f.name]: e.target.value })} className={clsx(inputClass, 'disabled:opacity-40')} />
                )}
              </div>
            ))}
          </div>
          {batchError && <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{batchError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowBatchForm(false)} className="btn-secondary-light px-4 py-2.5 text-sm">Annuler</button>
            <button type="submit" disabled={batchLoading || batchFields.size === 0} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
              {batchLoading ? 'Modification…' : `Appliquer à ${selectedIds.size} élément(s)`}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatMini label="Enseignants" value={items.length} hint="Total recensés" color="brand" icon="M12 14l9-5-9-5-9 5 9 5zm0 2l-7-4v5c0 1 3 3 7 3s7-2 7-3v-5l-7 4z" />
        <StatMini label="Actifs" value={totalActifs} color="green" icon="M5 12l5 5L20 7" />
        <StatMini label="En congé" value={totalConge} color="amber" icon="M12 8v4l3 3" />
        <StatMini label="Grades" value={totalGrades} hint="Distincts" color="slate" icon="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />
      </div>

      {/* ── Search + Actions ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, matricule, école…"
              aria-label="Rechercher"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Effacer la recherche"
              >
                <Icon name="close" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={clsx(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition',
              showFilters || activeFilters > 0
                ? 'border-brand-200 bg-brand-50 text-brand-600'
                : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            )}
            aria-label="Filtres"
          >
            <Icon name="filter" className="h-4.5 w-4.5" />
            {activeFilters > 0 && (
              <span className="absolute -mt-5 ml-5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                {activeFilters}
              </span>
            )}
          </button>

          {/* Add button */}
          <button
            onClick={startCreate}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-4 w-4">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="hidden sm:inline">Nouveau</span>
          </button>
        </div>

        {/* ── Filters panel ── */}
        {showFilters && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-card" style={{ animation: 'chatSlideIn 0.2s ease-out' }}>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              <FilterSelect
                label="Province"
                value={filters.provinceAdministrative ?? ''}
                onChange={(v) => {
                  const nf = { ...filters, provinceAdministrative: v };
                  resetDescendants('provinceAdministrative', nf);
                  setFilters(nf);
                }}
                options={PROVINCE_NAMES.map((p) => ({ value: p, label: p }))}
                placeholder="Toutes les provinces"
              />
              <FilterSelect
                label="Province éduc."
                value={filters.provinceEducationnelle ?? ''}
                onChange={(v) => {
                  const nf = { ...filters, provinceEducationnelle: v };
                  resetDescendants('provinceEducationnelle', nf);
                  setFilters(nf);
                }}
                options={provEducOptions}
                placeholder="Toutes les provinces éduc."
                disabled={!filters.provinceAdministrative}
              />
              <FilterSelect
                label="Coord. SP"
                value={filters.coordSousProvincialeId ?? ''}
                onChange={(v) => setFilters({ ...filters, coordSousProvincialeId: v })}
                options={coordFiltered.map((c) => ({ value: c.value, label: c.label }))}
                placeholder="Toutes les coord. SP"
                disabled={!filters.provinceEducationnelle}
              />
              <FilterSelect
                label="École"
                value={filters.ecoleId ?? ''}
                onChange={(v) => setFilters({ ...filters, ecoleId: v })}
                options={ecoleOptions}
                placeholder="Toutes les écoles"
              />
              <FilterSelect
                label="Niveau (cycle)"
                value={filters.niveau ?? ''}
                onChange={(v) => setFilters({ ...filters, niveau: v, classe: '', matiere: '' })}
                options={NIVEAU_OPTIONS}
                placeholder="Tous les niveaux"
              />
              <FilterSelect
                label="Classe"
                value={filters.classe ?? ''}
                onChange={(v) => setFilters({ ...filters, classe: v, matiere: '' })}
                options={CLASSE_OPTIONS.filter((c) => !filters.niveau || getCycleForClass(c.value) === filters.niveau)}
                placeholder="Toutes les classes"
              />
              <FilterSelect
                label="Matière"
                value={filters.matiere ?? ''}
                onChange={(v) => setFilters({ ...filters, matiere: v })}
                options={matiereFilterOptions.map((m) => ({ value: m, label: m }))}
                placeholder="Toutes les matières"
                disabled={!filters.niveau}
              />
              <FilterSelect
                label="Statut"
                value={filters.statut ?? ''}
                onChange={(v) => setFilters({ ...filters, statut: v })}
                options={STATUT_OPTIONS}
                placeholder="Tous les statuts"
              />
              {activeFilters > 0 && (
                <button
                  onClick={() => setFilters({})}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-500 transition hover:bg-slate-50"
                >
                  <Icon name="close" className="h-3.5 w-3.5" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Batch bar ── */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3">
          <span className="text-sm font-semibold text-brand-700">{selectedIds.size} sélectionné(s)</span>
          <div className="flex-1" />
          <button onClick={toggleSelectAll} className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-brand-100">
            {selectedIds.size === displayItems.length ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
          <button onClick={startBatchEdit} className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700">
            Modifier en lot
          </button>
          <button onClick={handleBatchDelete} disabled={batchLoading} className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
            {batchLoading ? '…' : 'Supprimer'}
          </button>
          <button onClick={clearSelection} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100">
            Annuler
          </button>
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card">
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-48 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Icon name="teacher" className="h-8 w-8" />
          </div>
          <p className="text-base font-semibold text-slate-700">
            {search || activeFilters > 0 ? 'Aucun enseignant trouvé' : 'Aucun enseignant enregistré'}
          </p>
          <p className="mt-1.5 text-sm text-slate-400">
            {search || activeFilters > 0 ? 'Modifiez votre recherche ou vos filtres.' : 'Cliquez sur « Nouveau » pour commencer.'}
          </p>
          {(search || activeFilters > 0) && (
            <button
              onClick={() => { setSearch(''); setFilters({}); }}
              className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Réinitialiser
            </button>
          )}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Icon name="filter" className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Aucun enseignant ne correspond aux filtres</p>
          <p className="mt-1 text-xs text-slate-400">Modifiez les filtres niveau/classe/matière.</p>
          <button
            onClick={() => setFilters({ ...filters, niveau: '', classe: '', matiere: '' })}
            className="mt-3 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={displayItems.length > 0 && selectedIds.size === displayItems.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  </th>
                  <th className="px-4 py-3">Enseignant</th>
                  <th className="px-4 py-3">Rôle / Niveau</th>
                  <th className="px-4 py-3">Classes & Matières</th>
                  <th className="px-4 py-3">École</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayItems.map((item) => {
                  const ecoleNom = item.ecoleRattachee?.nom || item.ecole || '—';
                  const nameParts = item.nom.trim().split(/\s+/);
                  const affs = affectationMap[item.id] ?? [];
                  const isTitulaire = affs.some((a) => !a.matiere);
                  const isProfesseur = affs.some((a) => a.matiere);
                  const classesSet = new Set(affs.map((a) => a.classe));
                  const matieresSet = new Set(affs.filter((a) => a.matiere).map((a) => a.matiere));
                  return (
                    <tr key={item.id} className="group transition hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar prenom={nameParts[0]} nom={nameParts[1]} size="sm" loading="lazy" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{item.nom}</p>
                            <p className="truncate font-mono text-xs text-slate-400">{item.matricule}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {isTitulaire && <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">Titulaire</span>}
                          {isProfesseur && <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700">Professeur</span>}
                          {!isTitulaire && !isProfesseur && <span className="text-xs text-slate-400">Non affecté</span>}
                          {item.grade && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{item.grade}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {[...classesSet].slice(0, 3).map((c) => (
                            <span key={c} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{c}</span>
                          ))}
                          {matieresSet.size > 0 && (
                            <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] text-brand-600">{matieresSet.size} matière(s)</span>
                          )}
                          {classesSet.size > 3 && <span className="text-[11px] text-slate-400">+{classesSet.size - 3}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{ecoleNom}</td>
                      <td className="px-4 py-3"><StatutBadge statut={item.statut} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => setAffectationTarget({ id: item.id, nom: item.nom, ecoleId: item.ecoleId })} className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-brand-100" title="Gérer les affectations">
                            <Icon name="teacher" className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => startEdit(item)} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100">
                            <Icon name="edit" className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50">
                            {deletingId === item.id ? '…' : <Icon name="trash" className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {displayItems.map((item) => {
              const ecoleNom = item.ecoleRattachee?.nom || item.ecole || '—';
              const nameParts = item.nom.trim().split(/\s+/);
              const affs = affectationMap[item.id] ?? [];
              const isTitulaire = affs.some((a) => !a.matiere);
              const isProfesseur = affs.some((a) => a.matiere);
              const classesSet = new Set(affs.map((a) => a.classe));
              const matieresList = [...new Set(affs.filter((a) => a.matiere).map((a) => a.matiere))];
              return (
                <div key={item.id} className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-card">
                  <div className="flex items-start gap-3">
                    <Avatar prenom={nameParts[0]} nom={nameParts[1]} size="md" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[15px] font-bold text-slate-900">{item.nom}</p>
                        <StatutBadge statut={item.statut} />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {isTitulaire && <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">Titulaire</span>}
                        {isProfesseur && <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[11px] font-medium text-purple-700">Professeur</span>}
                        {!isTitulaire && !isProfesseur && <span className="text-[11px] text-slate-400">Non affecté</span>}
                        {item.grade && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{item.grade}</span>}
                      </div>
                      {classesSet.size > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {[...classesSet].map((c) => (
                            <span key={c} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{c}</span>
                          ))}
                        </div>
                      )}
                      {matieresList.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {matieresList.slice(0, 3).map((m) => (
                            <span key={m} className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] text-brand-600">{m}</span>
                          ))}
                          {matieresList.length > 3 && <span className="text-[11px] text-slate-400">+{matieresList.length - 3}</span>}
                        </div>
                      )}
                      <p className="mt-1.5 truncate text-xs text-slate-400">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="mr-1 inline h-3 w-3 text-slate-300">
                          <path d="M3 9l9-6 9 6-9 6-9-6M7 13v6h10v-6" />
                        </svg>
                        {ecoleNom}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-t border-slate-50 pt-3">
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelect(item.id)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                      <span className="text-[11px] text-slate-400">Sél.</span>
                    </label>
                    <div className="flex-1" />
                    <button onClick={() => setAffectationTarget({ id: item.id, nom: item.nom, ecoleId: item.ecoleId })} className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-600 transition hover:bg-brand-100 active:scale-95" title="Affectations">
                      <Icon name="teacher" className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => startEdit(item)} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 active:scale-95">
                      <Icon name="edit" className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 active:scale-95 disabled:opacity-50">
                      {deletingId === item.id ? '…' : <Icon name="trash" className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Modal de gestion des affectations ── */}
      {affectationTarget && (
        <AffectationPanel
          enseignantId={affectationTarget.id}
          enseignantNom={affectationTarget.nom}
          ecoleId={affectationTarget.ecoleId}
          onClose={() => setAffectationTarget(null)}
          onChanged={() => {
            // Recharger les affectations
            (async () => {
              try {
                const res = await fetch('/api/enseignant-affectations');
                const data = await res.json();
                const map: Record<string, AffectationInfo[]> = {};
                for (const a of data.affectations ?? []) {
                  if (!map[a.enseignantId]) map[a.enseignantId] = [];
                  map[a.enseignantId].push({ classe: a.classe, matiere: a.matiere, niveau: a.niveau });
                }
                setAffectationMap(map);
              } catch {}
            })();
          }}
        />
      )}
    </div>
  );
}

/* ── Sub-components ── */

function StatMini({ label, value, hint, color, icon }: {
  label: string;
  value: number;
  hint?: string;
  color: 'brand' | 'green' | 'amber' | 'slate';
  icon: string;
}) {
  const colorMap = {
    brand: { bg: 'bg-brand-50', text: 'text-brand-700', iconBg: 'bg-brand-100', iconText: 'text-brand-600' },
    green: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100', iconText: 'text-green-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-700', iconBg: 'bg-slate-100', iconText: 'text-slate-500' },
  };
  const c = colorMap[color];
  return (
    <div className={clsx('rounded-2xl border border-slate-200/80 p-3.5 shadow-card', c.bg)}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-medium text-slate-500">{label}</p>
        <span className={clsx('flex h-7 w-7 items-center justify-center rounded-lg', c.iconBg)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={clsx('h-3.5 w-3.5', c.iconText)}>
            <path d={icon} />
          </svg>
        </span>
      </div>
      <p className={clsx('mt-1.5 text-2xl font-bold', c.text)}>{value}</p>
      {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, placeholder, disabled }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-slate-400">{label}</label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/15',
          disabled && 'opacity-40'
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
