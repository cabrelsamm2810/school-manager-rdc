'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useSessionUser } from '@/lib/use-session-user';
import { nationalCapabilities } from '@/lib/national-fonctions';
import {
  NATIONAL_DOCUMENT_CATEGORIES,
  documentCategorieLabel
} from '@/lib/national-documents';

type NationalDocument = {
  id: string;
  titre: string;
  categorie: string;
  reference: string;
  description: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  auteurNom: string;
  auteurFonction: string;
  createdAt: string;
};

const CATEGORY_STYLES: Record<string, string> = {
  circulaire: 'bg-brand-50 text-brand-700 ring-brand-100',
  decision: 'bg-violet-50 text-violet-700 ring-violet-100',
  lettre: 'bg-amber-50 text-amber-700 ring-amber-100',
  rapport: 'bg-emerald-50 text-emerald-700 ring-emerald-100'
};

function formatSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-[13px] text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

/** Espace documentaire national : circulaires, décisions, lettres et rapports. */
export function DocumentSpace() {
  const user = useSessionUser();
  const canWrite = nationalCapabilities(user?.fonction).documents;

  const [documents, setDocuments] = useState<NationalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorie, setCategorie] = useState('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categorie) params.set('categorie', categorie);
      if (search) params.set('search', search);
      const res = await fetch(`/api/coordination-nationale/documents?${params.toString()}`);
      const payload = res.ok ? await res.json() : { documents: [] };
      setDocuments(payload.documents ?? []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [categorie, search]);

  useEffect(() => {
    const id = window.setTimeout(load, search ? 300 : 0);
    return () => window.clearTimeout(id);
  }, [load, search]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file') as File | null;
    if (!file || !file.name) {
      setFormError('Choisissez un fichier.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/coordination-nationale/documents', { method: 'POST', body: formData });
      const payload = await res.json();
      if (!res.ok) {
        setFormError(payload.error ?? 'Échec du téléversement.');
        return;
      }
      form.reset();
      setFormOpen(false);
      load();
    } catch {
      setFormError('Impossible de joindre le serveur.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/coordination-nationale/documents/${id}`, { method: 'DELETE' });
      if (res.ok) setDocuments((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">Coordination nationale EC-ERC</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">Espace documentaire national</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Circulaires nationales, décisions officielles, lettres administratives et rapports des provinces.
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setFormOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-700"
          >
            <Icon name={formOpen ? 'close' : 'plus'} className="h-4 w-4" />
            {formOpen ? 'Fermer' : 'Publier un document'}
          </button>
        )}
      </div>

      {!canWrite && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          Votre fonction permet la consultation des documents, pas leur publication.
        </p>
      )}

      {formOpen && canWrite && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Titre *</span>
              <input name="titre" required className={inputClass} placeholder="Circulaire n°…" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Catégorie *</span>
              <select name="categorie" className={inputClass} defaultValue="circulaire">
                {NATIONAL_DOCUMENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Référence</span>
              <input name="reference" className={inputClass} placeholder="N° / année" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Fichier *</span>
              <input name="file" type="file" required className="block w-full text-[12.5px] text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-[12px] file:font-semibold file:text-brand-700" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Description</span>
              <textarea name="description" rows={2} className={inputClass} placeholder="Objet du document…" />
            </label>
          </div>
          {formError && <p className="mt-2 text-[12px] font-medium text-rose-600">{formError}</p>}
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              <Icon name="upload" className="h-4 w-4" />
              {saving ? 'Envoi…' : 'Publier'}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setCategorie('')}
          className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${categorie === '' ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
        >
          Tous
        </button>
        {NATIONAL_DOCUMENT_CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategorie(c.value)}
            className={`rounded-full px-3 py-1.5 text-[12px] font-semibold transition ${categorie === c.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
          >
            {c.label}
          </button>
        ))}
        <div className="ml-auto flex min-w-[200px] flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 sm:max-w-xs">
          <Icon name="search" className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full bg-transparent text-[12.5px] text-slate-800 outline-none"
          />
        </div>
      </div>

      <div className="space-y-2.5">
        {loading ? (
          <div className="h-24 animate-pulse rounded-2xl bg-slate-200/60" />
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Icon name="document" className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-[13px] font-medium text-slate-500">Aucun document dans cet espace.</p>
            <p className="text-[11.5px] text-slate-400">Les documents publiés apparaîtront ici.</p>
          </div>
        ) : (
          documents.map((doc) => (
            <article key={doc.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <div className="flex flex-wrap items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon name="document" className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[14px] font-semibold text-slate-900">{doc.titre}</h2>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${CATEGORY_STYLES[doc.categorie] ?? 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
                      {documentCategorieLabel(doc.categorie)}
                    </span>
                    {doc.reference && <span className="text-[11px] text-slate-400">{doc.reference}</span>}
                  </div>
                  {doc.description && <p className="mt-1 text-[12.5px] text-slate-600">{doc.description}</p>}
                  <p className="mt-1 text-[11px] text-slate-400">
                    {doc.auteurNom}
                    {doc.auteurFonction ? ` · ${doc.auteurFonction}` : ''} ·{' '}
                    {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                    {doc.fileSize ? ` · ${formatSize(doc.fileSize)}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[12px] font-semibold text-brand-700 transition hover:bg-brand-100"
                  >
                    <Icon name="arrow-down" className="h-3.5 w-3.5" /> Ouvrir
                  </a>
                  {canWrite && (
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                      aria-label={`Supprimer ${doc.titre}`}
                    >
                      <Icon name="trash" className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
