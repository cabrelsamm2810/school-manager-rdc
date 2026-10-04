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
  default?: string | number | boolean;
  half?: boolean; // half-width on desktop
};

export type StatConfig = {
  label: string;
  value: (items: Record<string, any>[]) => string;
  hint?: string;
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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, any>>(() => emptyForm(config));
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
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
  }, [search]);

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

  const columnsWithActions: Column<Record<string, any>>[] = [
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
                      {f.options?.map((o) => (
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
      ) : (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="mb-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
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
