'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { ErcLogo } from '@/components/ui/ErcLogo';

const TYPE_OPTIONS = [
  { value: 'CIRCULAIRE', label: 'Circulaire' },
  { value: 'DECISION', label: 'Décision' },
  { value: 'LETTRE_OFFICIELLE', label: 'Lettre officielle' },
  { value: 'RAPPORT_PROVINCIAL', label: 'Rapport provincial' },
  { value: 'DOCUMENT_ADMIN', label: 'Document administratif' },
] as const;

const STATUT_OPTIONS = ['Brouillon', 'Publié', 'Archivé'] as const;

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] outline-none transition focus:border-brand-500';
const labelClass = 'mb-1 block text-[11.5px] font-semibold uppercase tracking-wide text-slate-500';

type DocumentNational = {
  id: string;
  type: string;
  reference: string;
  titre: string;
  description: string;
  province: string;
  statut: string;
  hasFile: boolean;
  fileName: string;
  fileSize: number;
  auteurNom: string;
  createdAt: string;
};

const EMPTY_FORM = {
  type: 'CIRCULAIRE',
  reference: '',
  titre: '',
  description: '',
  province: '',
  statut: 'Publié',
};

function typeLabel(type: string) {
  return TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type;
}

function statutColor(statut: string): 'green' | 'amber' | 'slate' {
  if (statut === 'Publié') return 'green';
  if (statut === 'Brouillon') return 'amber';
  return 'slate';
}

function fileSizeLabel(size: number) {
  if (!size) return '';
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} Ko`;
  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
}

/** Gestion des documents institutionnels nationaux. */
export function DocumentsManager() {
  const [documents, setDocuments] = useState<DocumentNational[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(`/api/coordination-nationale/documents?${params.toString()}`);
      if (!response.ok) throw new Error('documents');
      const data = await response.json();
      setDocuments(data.documents ?? []);
    } catch {
      setMessage({ type: 'error', message: 'Impossible de charger les documents nationaux.' });
    } finally {
      setLoading(false);
    }
  }, [typeFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const groupedCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const doc of documents) counts[doc.type] = (counts[doc.type] ?? 0) + 1;
    return counts;
  }, [documents]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.append('type', form.type);
      body.append('reference', form.reference);
      body.append('titre', form.titre);
      body.append('description', form.description);
      body.append('province', form.province);
      body.append('statut', form.statut);
      if (file) body.append('file', file);

      const response = await fetch('/api/coordination-nationale/documents', {
        method: 'POST',
        body,
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: 'error', message: data.error || 'Enregistrement impossible.' });
        return;
      }
      setForm(EMPTY_FORM);
      setFile(null);
      setShowForm(false);
      setMessage({ type: 'success', message: 'Document national enregistré.' });
      await load();
    } catch {
      setMessage({ type: 'error', message: 'Erreur réseau lors de l\u2019enregistrement.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(doc: DocumentNational) {
    if (!confirm(`Supprimer « ${doc.titre} » ?`)) return;
    setMessage(null);
    try {
      const response = await fetch(`/api/coordination-nationale/documents?id=${encodeURIComponent(doc.id)}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: 'error', message: data.error || 'Suppression impossible.' });
        return;
      }
      setMessage({ type: 'success', message: 'Document supprimé.' });
      await load();
    } catch {
      setMessage({ type: 'error', message: 'Erreur réseau lors de la suppression.' });
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className={`rounded-xl px-4 py-3 text-[13px] font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {message.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {TYPE_OPTIONS.map((type) => (
          <div key={type.value} className="rounded-xl border border-slate-200/80 bg-white p-3">
            <p className="text-lg font-bold tabular-nums text-brand-700">{groupedCount[type.value] ?? 0}</p>
            <p className="text-[11px] font-medium text-slate-500">{type.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative w-full sm:max-w-xs">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un document…"
              className={`${inputClass} pl-9`}
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={`${inputClass} sm:max-w-[220px]`}>
            <option value="">Tous les types</option>
            {TYPE_OPTIONS.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-700"
        >
          <Icon name="plus" className="h-4 w-4" />
          {showForm ? 'Fermer' : 'Nouveau document'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
          <h3 className="text-[13px] font-bold text-slate-900">Enregistrer un document institutionnel</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass} htmlFor="doc-type">Type *</label>
              <select id="doc-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
                {TYPE_OPTIONS.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="doc-reference">Référence</label>
              <input id="doc-reference" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Ex. CIRC/001/2026" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="doc-statut">Statut</label>
              <select id="doc-statut" value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })} className={inputClass}>
                {STATUT_OPTIONS.map((statut) => (
                  <option key={statut} value={statut}>{statut}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="doc-titre">Titre *</label>
              <input id="doc-titre" required value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="doc-province">Province concernée</label>
              <input id="doc-province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} placeholder="Toutes / nom de la province" className={inputClass} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass} htmlFor="doc-description">Description</label>
              <textarea id="doc-description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className={labelClass} htmlFor="doc-file">Fichier (optionnel)</label>
              <input
                id="doc-file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px] file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-[12px] file:font-semibold file:text-brand-700"
              />
              <p className="mt-1 text-[10.5px] text-slate-400">PDF, images ou documents bureautiques — 10 Mo maximum.</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-slate-300 px-4 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-white">
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="rounded-full bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60">
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Chargement des documents…</p>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
          <ErcLogo size={44} className="mx-auto opacity-60" />
          <p className="mt-3 text-[13px] font-medium text-slate-600">Aucun document national enregistré.</p>
          <p className="mt-1 text-[11.5px] text-slate-400">Circulaires, décisions, lettres et rapports apparaîtront ici.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <li key={doc.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Icon name="document" className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold text-slate-900">{doc.titre}</p>
                    <Badge color="blue">{typeLabel(doc.type)}</Badge>
                    <Badge color={statutColor(doc.statut)}>{doc.statut}</Badge>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-slate-500">
                    {doc.reference ? `${doc.reference} · ` : ''}
                    {doc.province ? `${doc.province} · ` : ''}
                    {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                    {doc.auteurNom ? ` · ${doc.auteurNom}` : ''}
                    {doc.fileSize ? ` · ${fileSizeLabel(doc.fileSize)}` : ''}
                  </p>
                  {doc.description && <p className="mt-0.5 line-clamp-1 text-[11.5px] text-slate-400">{doc.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {doc.hasFile && (
                    <>
                      <a
                        href={`/api/coordination-nationale/documents/${doc.id}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 px-3 py-1.5 text-[11.5px] font-semibold text-brand-700 transition hover:bg-brand-50"
                      >
                        <Icon name="eye" className="h-3.5 w-3.5" /> Consulter
                      </a>
                      <a
                        href={`/api/coordination-nationale/documents/${doc.id}/file?download=1`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-50"
                      >
                        <Icon name="download" className="h-3.5 w-3.5" /> Télécharger
                      </a>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(doc)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 px-3 py-1.5 text-[11.5px] font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <Icon name="trash" className="h-3.5 w-3.5" /> Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
