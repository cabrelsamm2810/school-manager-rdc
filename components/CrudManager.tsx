'use client';

import { useEffect, useState, FormEvent } from 'react';
import { StatCard } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';

/* ── Types ── */

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'checkbox';

export type CrudField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  optionsEndpoint?: string;   // fetch options from API: GET endpoint → { ecoles: [{id, nom}] }
  optionsDataKey?: string;    // key in the JSON response (e.g. 'ecoles')
  default?: string | number | boolean;
  half?: boolean; // half-width on desktop
};

export type StatConfig = {
  label: string;
  value: (items: Record<string, any>[]) => string;
  hint?: string;
};

export type FilterConfig = {
  name: string;          // field name to filter on
  label: string;         // dropdown label
  options?: { value: string; label: string; [key: string]: any }[]; // static options; if omitted, derived from data
  optionsEndpoint?: string;   // fetch options from API
  optionsDataKey?: string;    // key in the JSON response
  dependsOn?: string;         // parent filter name (cascading)
  matchField?: string;        // field in this filter's options to match against parent value
  parentMatchField?: string;  // field in parent's options to get match value (default: parent's value)
};

export type CrudConfig = {
  apiPath: string;        // e.g. '/api/enseignants'
  entityName: string;     // e.g. 'enseignant' (singular, for UI labels)
  entityNamePlural: string; // e.g. 'enseignants'
  icon: string;
  fields: CrudField[];
  searchFields: string[];
  columns: Column<Record<string, any>>[];
  statCards?: StatConfig[];
  defaultSort?: string; // field name to sort by
  filters?: FilterConfig[]; // dropdown filters
};

/* ── Helpers ── */

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

function emptyForm(config: CrudConfig): Record<string, any> {
  const form: Record<string, any> = {};
  for (const f of config.fields) {
    form[f.name] = f.default ?? (f.type === 'number' ? 0 : f.type === 'checkbox' ? false : '');
  }
  return form;
}

function itemToForm(config: CrudConfig, item: Record<string, any>): Record<string, any> {
  const form: Record<string, any> = {};
  for (const f of config.fields) {
    let val = item[f.name];
    if (f.type === 'date' && val) {
      val = new Date(val).toISOString().slice(0, 10);
    }
    form[f.name] = val ?? f.default ?? '';
  }
  return form;
}

function formToPayload(form: Record<string, any>, config: CrudConfig): Record<string, any> {
  const payload: Record<string, any> = {};
  for (const f of config.fields) {
    if (f.type === 'number') {
      payload[f.name] = form[f.name] !== '' ? Number(form[f.name]) : 0;
    } else if (f.type === 'checkbox') {
      payload[f.name] = Boolean(form[f.name]);
    } else if (f.type === 'date') {
      payload[f.name] = form[f.name] ? new Date(form[f.name]).toISOString() : null;
    } else {
      payload[f.name] = form[f.name];
    }
  }
  return payload;
}

/* ── Component ── */

export function CrudManager({ config }: { config: CrudConfig }) {
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>(() => emptyForm(config));
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [asyncOptions, setAsyncOptions] = useState<Record<string, { value: string; label: string; [key: string]: any }[]>>({});

  // Load async options for fields and filters with optionsEndpoint
  useEffect(() => {
    const fieldEndpoints = config.fields.filter((f) => f.optionsEndpoint);
    const filterEndpoints = (config.filters ?? []).filter((f) => f.optionsEndpoint);
    const all = [
      ...fieldEndpoints.map((f) => ({ name: f.name, endpoint: f.optionsEndpoint!, dataKey: f.optionsDataKey })),
      ...filterEndpoints.map((f) => ({ name: f.name, endpoint: f.optionsEndpoint!, dataKey: f.optionsDataKey })),
    ];
    if (all.length === 0) return;
    // Deduplicate by endpoint
    const seen = new Set<string>();
    const unique = all.filter((e) => {
      const key = `${e.endpoint}::${e.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        unique.map(async (e) => {
          try {
            const res = await fetch(e.endpoint);
            const data = await res.json();
            const key = e.dataKey || 'items';
            const items = data[key] ?? [];
            return [e.name, items.map((i: any) => ({ ...i, value: i.id, label: i.nom }))] as const;
          } catch {
            return [e.name, []] as const;
          }
        })
      );
      if (!cancelled) {
        setAsyncOptions((prev) => {
          const next = { ...prev };
          for (const [name, opts] of entries) (next as any)[name] = opts;
          return next;
        });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Actions groupées ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [batchForm, setBatchForm] = useState<Record<string, any>>(() => emptyForm(config));
  const [batchFields, setBatchFields] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      for (const [key, val] of Object.entries(filters)) {
        if (val) params.set(key, val);
      }
      const res = await fetch(`${config.apiPath}?${params.toString()}`);
      const data = await res.json();
      const key = config.entityNamePlural;
      if (res.ok) setItems(data[key] ?? data.items ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadData, search ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm(config));
    setShowForm(true);
  }

  function startEdit(item: Record<string, any>) {
    setEditingId(item.id);
    setForm(itemToForm(config, item));
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const url = editingId ? `${config.apiPath}/${editingId}` : config.apiPath;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formToPayload(form, config)),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Erreur lors de l'enregistrement.");
      } else {
        setForm(emptyForm(config));
        setEditingId(null);
        setShowForm(false);
        loadData();
      }
    } catch {
      setFormError('Impossible de joindre le serveur.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`Voulez-vous vraiment supprimer cet élément ?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${config.apiPath}/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  // ── Sélection groupée ──
  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setShowBatchForm(false);
  }

  async function handleBatchDelete() {
    const count = selectedIds.size;
    if (!confirm(`Voulez-vous vraiment supprimer ${count} enregistrement(s) ?`)) return;
    setBatchLoading(true);
    try {
      const res = await fetch(config.apiPath, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selectedIds] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBatchError(data.error ?? 'Erreur lors de la suppression.');
      } else {
        clearSelection();
        loadData();
      }
    } catch {
      setBatchError('Impossible de joindre le serveur.');
    } finally {
      setBatchLoading(false);
    }
  }

  function startBatchEdit() {
    setBatchForm(emptyForm(config));
    setBatchFields(new Set());
    setBatchError('');
    setShowBatchForm(true);
  }

  function toggleBatchField(name: string) {
    setBatchFields((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleBatchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBatchError('');

    if (batchFields.size === 0) {
      setBatchError('Sélectionnez au moins un champ à modifier.');
      return;
    }

    const data: Record<string, any> = {};
    for (const name of batchFields) {
      data[name] = batchForm[name];
    }

    setBatchLoading(true);
    try {
      const res = await fetch(config.apiPath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [...selectedIds], data }),
      });
      const result = await res.json();
      if (!res.ok) {
        setBatchError(result.error ?? 'Erreur lors de la modification.');
      } else {
        clearSelection();
        loadData();
      }
    } catch {
      setBatchError('Impossible de joindre le serveur.');
    } finally {
      setBatchLoading(false);
    }
  }

  // ── Colonne checkbox ──
  const selectColumn: Column<Record<string, any>> = {
    key: '_select',
    label: (
      <input
        type="checkbox"
        checked={items.length > 0 && selectedIds.size === items.length}
        onChange={toggleSelectAll}
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
    ) as any,
    render: (item) => (
      <input
        type="checkbox"
        checked={selectedIds.has(item.id)}
        onChange={() => toggleSelect(item.id)}
        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
    ),
  };

  const columnsWithActions: Column<Record<string, any>>[] = [
    selectColumn,
    ...config.columns,
    {
      key: '_actions',
      label: 'Actions',
      render: (item) => (
        <div className="flex gap-2">
          <button
            onClick={() => startEdit(item)}
            className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
          >
            Modifier
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            disabled={deletingId === item.id}
            className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          >
            {deletingId === item.id ? '…' : 'Supprimer'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {config.statCards && config.statCards.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {config.statCards.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value(items)} hint={s.hint} />
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <button onClick={startCreate} className="btn-primary px-4 py-2.5 text-sm">
          + Nouveau
        </button>
      </div>

      {showForm ? (
        <div className="rounded-2xl bg-white p-5 shadow-soft md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId ? `Modifier` : 'Nouvel enregistrement'}
            </h2>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="text-sm text-slate-500 transition hover:text-slate-700"
            >
              ← Retour à la liste
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              {config.fields.map((f) => (
                <div key={f.name} className={f.half ? '' : 'sm:col-span-2'}>
                  <label className={labelClass} htmlFor={`fld-${f.name}`}>
                    {f.label} {f.required && '*'}
                  </label>
                  {f.type === 'select' ? (
                    <select
                      id={`fld-${f.name}`}
                      value={form[f.name]}
                      onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">— Choisir —</option>
                      {(f.options ?? asyncOptions[f.name] ?? []).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : f.type === 'checkbox' ? (
                    <label className="flex items-center gap-2">
                      <input
                        id={`fld-${f.name}`}
                        type="checkbox"
                        checked={form[f.name]}
                        onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })}
                        className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{f.label}</span>
                    </label>
                  ) : (
                    <input
                      id={`fld-${f.name}`}
                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
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
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="btn-secondary-light px-4 py-2.5 text-sm"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="btn-primary px-6 py-2.5 text-sm"
              >
                {formLoading ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </div>
      ) : showBatchForm ? (
        /* ── Formulaire de modification groupée ── */
        <div className="rounded-2xl bg-white p-5 shadow-soft md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              Modifier {selectedIds.size} enregistrement(s)
            </h2>
            <button
              onClick={() => setShowBatchForm(false)}
              className="text-sm text-slate-500 transition hover:text-slate-700"
            >
              ← Retour à la liste
            </button>
          </div>
          <p className="mb-5 rounded-xl bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
            Cochez les champs à appliquer, puis saisissez la nouvelle valeur. Seuls les champs cochés seront modifiés.
          </p>
          <form onSubmit={handleBatchSubmit} className="space-y-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              {config.fields.map((f) => (
                <div key={f.name} className={f.half ? '' : 'sm:col-span-2'}>
                  <div className="mb-1.5 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={batchFields.has(f.name)}
                      onChange={() => toggleBatchField(f.name)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label className="text-sm font-medium text-slate-700" htmlFor={`batch-${f.name}`}>
                      {f.label}
                    </label>
                  </div>
                  {f.type === 'select' ? (
                    <select
                      id={`batch-${f.name}`}
                      value={batchForm[f.name]}
                      disabled={!batchFields.has(f.name)}
                      onChange={(e) => setBatchForm({ ...batchForm, [f.name]: e.target.value })}
                      className={`${inputClass} disabled:opacity-40`}
                    >
                      <option value="">— Choisir —</option>
                      {(f.options ?? asyncOptions[f.name] ?? []).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : f.type === 'checkbox' ? (
                    <label className="flex items-center gap-2">
                      <input
                        id={`batch-${f.name}`}
                        type="checkbox"
                        checked={batchForm[f.name]}
                        disabled={!batchFields.has(f.name)}
                        onChange={(e) => setBatchForm({ ...batchForm, [f.name]: e.target.checked })}
                        className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                      />
                      <span className="text-sm text-slate-700">{f.label}</span>
                    </label>
                  ) : (
                    <input
                      id={`batch-${f.name}`}
                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                      value={batchForm[f.name]}
                      disabled={!batchFields.has(f.name)}
                      onChange={(e) => setBatchForm({ ...batchForm, [f.name]: e.target.value })}
                      className={`${inputClass} disabled:opacity-40`}
                    />
                  )}
                </div>
              ))}
            </div>
            {batchError && (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{batchError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBatchForm(false)}
                className="btn-secondary-light px-4 py-2.5 text-sm"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={batchLoading || batchFields.size === 0}
                className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
              >
                {batchLoading ? 'Modification…' : `Appliquer à ${selectedIds.size} élément(s)`}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          {/* ── Barre de recherche + filtres ── */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher…"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            {config.filters?.map((f) => {
              let options = f.options ?? asyncOptions[f.name] ?? [...new Set(items.map((i) => i[f.name]).filter(Boolean))].sort().map((v) => ({ value: String(v), label: String(v) }));

              // Cascading: filter options based on parent filter's value
              if (f.dependsOn && f.matchField) {
                const parentValue = filters[f.dependsOn];
                if (parentValue) {
                  let matchValue: string = parentValue;
                  if (f.parentMatchField) {
                    const parentFilter = config.filters?.find((ff) => ff.name === f.dependsOn);
                    const parentOptions = parentFilter?.options ?? asyncOptions[f.dependsOn] ?? [];
                    const parentRecord = parentOptions.find((o: any) => o.value === parentValue);
                    if (parentRecord) matchValue = (parentRecord as any)[f.parentMatchField];
                  }
                  options = options.filter((o: any) => (o as any)[f.matchField!] === matchValue);
                } else {
                  options = [];
                }
              }

              return (
                <select
                  key={f.name}
                  value={filters[f.name] ?? ''}
                  disabled={!!f.dependsOn && !filters[f.dependsOn]}
                  onChange={(e) => {
                    const newFilters = { ...filters, [f.name]: e.target.value };
                    // Reset every descendant filter (enfant, petit-enfant…) : sinon une valeur
                    // devenue invalide resterait appliquée à la requête alors que la liste est masquée.
                    const resetDescendants = (parent: string) => {
                      for (const child of config.filters ?? []) {
                        if (child.dependsOn === parent) {
                          newFilters[child.name] = '';
                          resetDescendants(child.name);
                        }
                      }
                    };
                    resetDescendants(f.name);
                    setFilters(newFilters);
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-40 sm:w-52"
                >
                  <option value="">{f.label}</option>
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              );
            })}
          </div>

          {/* ── Barre d'actions groupées ── */}
          {selectedIds.size > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/60 px-4 py-3">
              <span className="text-sm font-semibold text-blue-700">
                {selectedIds.size} sélectionné(s)
              </span>
              <div className="flex-1" />
              <button
                onClick={toggleSelectAll}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
              >
                {selectedIds.size === items.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
              <button
                onClick={startBatchEdit}
                className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Modifier en lot
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={batchLoading}
                className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {batchLoading ? '…' : 'Supprimer en lot'}
              </button>
              <button
                onClick={clearSelection}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
              >
                Annuler
              </button>
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Chargement…
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Aucun enregistrement. Cliquez sur « + Nouveau » pour commencer.
            </div>
          ) : (
            <DataTable
              columns={columnsWithActions}
              data={items}
              mobileCard={(item) => (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-slate-400">Sélectionner</span>
                  </div>
                  {config.columns.map((col) => (
                    <div key={col.key} className="flex justify-between gap-2 text-sm">
                      <span className="text-slate-500">{col.label}</span>
                      <span className="text-right font-medium text-slate-900">
                        {col.render ? col.render(item) : item[col.key]}
                      </span>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => startEdit(item)}
                      className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      {deletingId === item.id ? '…' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              )}
            />
          )}
        </>
      )}
    </>
  );
}
