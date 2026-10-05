'use client';

import { useEffect, useState, useRef } from 'react';
import { clsx } from 'clsx';

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

const DOC_TYPES = ['Acte de naissance', 'Bulletin', 'Relevé de notes', 'Certificat médical', 'Certificat de scolarité', 'Photo', 'Contrat', 'Autre'];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getFileIcon(fileType: string) {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('word')) return '📝';
  if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
  return '📎';
}

function isPreviewable(fileType: string, fileUrl: string) {
  if (!fileUrl) return false;
  return fileType.includes('image') || fileType.includes('pdf');
}

type SortMode = 'recent' | 'ancien' | 'titre' | 'type';

export function DocumentsManager({ eleveId }: { eleveId: string }) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ type: '', titre: '', description: '' });
  const [filterType, setFilterType] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/eleves/${eleveId}/documents`);
      const data = await res.json();
      if (Array.isArray(data)) setDocs(data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [eleveId]);

  // Filtrage et tri
  const filtered = docs
    .filter((d) => !filterType || d.type === filterType)
    .sort((a, b) => {
      switch (sortMode) {
        case 'recent': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'ancien': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'titre': return a.titre.localeCompare(b.titre);
        case 'type': return (a.type || 'ZZZ').localeCompare(b.type || 'ZZZ');
        default: return 0;
      }
    });

  // Types présents dans les documents (avec compteurs) pour la barre de filtrage
  const typeCounts = (() => {
    const map = new Map<string, number>();
    for (const d of docs) {
      const key = d.type || 'Autre';
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  })();

  // Regroupement par type pour la vue organisée
  const grouped = filtered.reduce<Record<string, Document[]>>((acc, d) => {
    const key = d.type || 'Autre';
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});
  const groupKeys = Object.keys(grouped).sort();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titre.trim()) return;
    const file = fileRef.current?.files?.[0];

    setUploading(true);
    try {
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('type', form.type);
        fd.append('titre', form.titre.trim());
        fd.append('description', form.description);
        await fetch(`/api/eleves/${eleveId}/documents`, { method: 'POST', body: fd });
      } else {
        await fetch(`/api/eleves/${eleveId}/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      setForm({ type: '', titre: '', description: '' });
      setShowForm(false);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch { /* ignore */ }
    setUploading(false);
  }

  async function handleDelete(docId: string) {
    if (!confirm('Supprimer ce document ?')) return;
    await fetch(`/api/eleves/${eleveId}/documents?docId=${docId}`, { method: 'DELETE' });
    load();
  }

  async function handleEdit(docId: string, fields: { titre: string; type: string; description: string }) {
    if (!fields.titre.trim()) return;
    await fetch(`/api/eleves/${eleveId}/documents?docId=${docId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    load();
  }

  async function handleMove(docId: string, targetEleveId: string) {
    await fetch(`/api/eleves/${eleveId}/documents?docId=${docId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newEleveId: targetEleveId }),
    });
    load();
  }

  function handleDownload(doc: Document) {
    if (!doc.fileUrl) return;
    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.fileName || doc.titre;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading) return <p className="py-6 text-center text-sm text-slate-400">Chargement…</p>;

  return (
    <div>
      {/* Barre d'outils */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-700">
            {filtered.length} document{filtered.length > 1 ? 's' : ''}
            {filterType && <span className="ml-1 text-slate-400">· {filterType}</span>}
          </h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
          >
            {showForm ? 'Annuler' : '+ Ajouter'}
          </button>
        </div>

        {/* Barre de filtrage par type — chips cliquables */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterType('')}
            className={clsx(
              'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition',
              filterType === '' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            Tous{docs.length > 0 && <span className="ml-1 opacity-70">({docs.length})</span>}
          </button>
          {typeCounts.map(({ type, count }) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={clsx(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition',
                filterType === type ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {type}<span className="ml-1 opacity-70">({count})</span>
            </button>
          ))}
        </div>

        {/* Tri */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Trier :</span>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="recent">Plus récents</option>
            <option value="ancien">Plus anciens</option>
            <option value="titre">Par titre (A→Z)</option>
            <option value="type">Par type</option>
          </select>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">— Sélectionner —</option>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Titre *</label>
            <input
              type="text"
              required
              value={form.titre}
              onChange={(e) => setForm({ ...form, titre: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Ex: Bulletin 1er trimestre"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Fichier (max 10 Mo)</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
              className="w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-blue-700"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={uploading || !form.titre.trim()}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-40"
          >
            {uploading ? 'Envoi…' : 'Enregistrer'}
          </button>
        </form>
      )}

      {/* Liste des documents */}
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">
          {filterType ? `Aucun document de type « ${filterType} ».` : 'Aucun document. Cliquez sur « + Ajouter ».'}
        </p>
      ) : sortMode === 'type' ? (
        // Vue organisée par type
        <div className="space-y-4">
          {groupKeys.map((group) => (
            <div key={group}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">{group}</span>
                <span className="text-xs text-slate-400">{grouped[group].length} doc{grouped[group].length > 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {grouped[group].map((d) => (
                  <DocCard key={d.id} doc={d} eleveId={eleveId} onPreview={setPreviewDoc} onDownload={handleDownload} onDelete={handleDelete} onEdit={handleEdit} onMove={handleMove} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((d) => (
            <DocCard key={d.id} doc={d} eleveId={eleveId} onPreview={setPreviewDoc} onDownload={handleDownload} onDelete={handleDelete} onEdit={handleEdit} onMove={handleMove} />
          ))}
        </div>
      )}

      {/* Modale de prévisualisation */}
      {previewDoc && (
        <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}

// ── Carte document ──
type EleveOption = { id: string; nom: string; postNom: string; prenom: string; classe: string };

function DocCard({
  doc, eleveId, onPreview, onDownload, onDelete, onEdit, onMove,
}: {
  doc: Document;
  eleveId: string;
  onPreview: (d: Document) => void;
  onDownload: (d: Document) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, fields: { titre: string; type: string; description: string }) => void;
  onMove: (docId: string, targetEleveId: string) => void;
}) {
  const canPreview = isPreviewable(doc.fileType, doc.fileUrl);
  const canDownload = !!doc.fileUrl;
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ titre: doc.titre, type: doc.type, description: doc.description });
  const [moving, setMoving] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<EleveOption[]>([]);
  const [searching, setSearching] = useState(false);

  function startEdit() {
    setEditForm({ titre: doc.titre, type: doc.type, description: doc.description });
    setEditing(true);
  }
  function cancelEdit() {
    setEditing(false);
    setEditForm({ titre: doc.titre, type: doc.type, description: doc.description });
  }
  function submitEdit() {
    if (editForm.titre.trim()) onEdit(doc.id, editForm);
    setEditing(false);
  }

  async function doSearch(q: string) {
    setSearchQ(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/eleves?search=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      setSearchResults((data.eleves || []).filter((e: EleveOption) => e.id !== eleveId).slice(0, 8));
    } catch { /* ignore */ }
    setSearching(false);
  }

  function pickTarget(targetId: string) {
    onMove(doc.id, targetId);
    setMoving(false);
    setSearchQ('');
    setSearchResults([]);
  }

  return (
    <div className="rounded-lg border border-slate-100 p-3 transition hover:border-slate-200">
      {editing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getFileIcon(doc.fileType)}</span>
            <input
              type="text"
              value={editForm.titre}
              onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })}
              autoFocus
              placeholder="Titre *"
              className="flex-1 rounded-lg border border-blue-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <select
            value={editForm.type}
            onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">— Type —</option>
            {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <textarea
            value={editForm.description}
            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            rows={2}
            placeholder="Description"
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <div className="flex justify-end gap-1.5">
            <button onClick={submitEdit} className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">Enregistrer</button>
            <button onClick={cancelEdit} className="rounded-lg px-3 py-1 text-xs text-slate-500 hover:bg-slate-100">Annuler</button>
          </div>
        </div>
      ) : moving ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Déplacer « {doc.titre} » vers le dossier de :</p>
          <input
            type="text"
            value={searchQ}
            onChange={(e) => doSearch(e.target.value)}
            autoFocus
            placeholder="Rechercher un élève (nom, prénom, matricule)…"
            className="w-full rounded-lg border border-blue-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {searching && <p className="text-xs text-slate-400">Recherche…</p>}
          {searchResults.length > 0 && (
            <div className="max-h-44 space-y-1 overflow-auto">
              {searchResults.map((e) => (
                <button
                  key={e.id}
                  onClick={() => pickTarget(e.id)}
                  className="flex w-full items-center gap-2 rounded-lg border border-slate-100 px-2 py-1.5 text-left text-xs transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <span className="text-base">👤</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-800">
                      {e.prenom} {e.nom} {e.postNom || ''}
                    </span>
                    <span className="text-slate-400">{e.classe}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {searchQ.trim().length >= 2 && !searching && searchResults.length === 0 && (
            <p className="text-xs text-slate-400">Aucun élève trouvé.</p>
          )}
          <div className="flex justify-end">
            <button onClick={() => { setMoving(false); setSearchQ(''); setSearchResults([]); }} className="rounded-lg px-3 py-1 text-xs text-slate-500 hover:bg-slate-100">Annuler</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getFileIcon(doc.fileType)}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-slate-900">{doc.titre}</p>
              {doc.type && <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">{doc.type}</span>}
            </div>
            <p className="truncate text-xs text-slate-500">
              {doc.description || doc.fileName || 'Aucune description'}
            </p>
            <p className="text-xs text-slate-400">{formatDate(doc.createdAt)} • par {doc.uploadedBy}</p>
          </div>
          <div className="flex shrink-0 gap-0.5">
            {canPreview && (
              <button onClick={() => onPreview(doc)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Prévisualiser" title="Prévisualiser">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              </button>
            )}
            {canDownload && (
              <button onClick={() => onDownload(doc)} className="rounded-lg p-1.5 text-green-600 hover:bg-green-50" aria-label="Télécharger" title="Télécharger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
              </button>
            )}
            {doc.fileUrl && !canPreview && (
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50" aria-label="Ouvrir" title="Ouvrir">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>
              </a>
            )}
            <button onClick={startEdit} className="rounded-lg p-1.5 text-amber-600 hover:bg-amber-50" aria-label="Modifier" title="Modifier">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            </button>
            <button onClick={() => setMoving(true)} className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50" aria-label="Déplacer" title="Déplacer vers un autre dossier">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><path d="M12 17v-6M9 14l3-3 3 3" /></svg>
            </button>
            <button onClick={() => onDelete(doc.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" aria-label="Supprimer" title="Supprimer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modale de prévisualisation ──
function PreviewModal({ doc, onClose }: { doc: Document; onClose: () => void }) {
  const isImage = doc.fileType.includes('image');
  const isPdf = doc.fileType.includes('pdf');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getFileIcon(doc.fileType)}</span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{doc.titre}</p>
              {doc.type && <p className="text-xs text-slate-500">{doc.type}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = doc.fileUrl;
                link.download = doc.fileName || doc.titre;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="rounded-lg p-1.5 text-green-600 hover:bg-green-50"
              aria-label="Télécharger"
              title="Télécharger"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Fermer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4">
          {isImage ? (
            <img src={doc.fileUrl} alt={doc.titre} className="mx-auto max-h-[70vh] rounded-lg shadow-md" />
          ) : isPdf ? (
            <iframe src={doc.fileUrl} className="h-[70vh] w-full rounded-lg border-0 bg-white" title={doc.titre} />
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-slate-400">
              <span className="mb-2 text-4xl">{getFileIcon(doc.fileType)}</span>
              <p className="text-sm">Prévisualisation non disponible pour ce type de fichier.</p>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700">
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          )}
        </div>

        {/* Pied avec description */}
        {doc.description && (
          <div className="border-t border-slate-200 px-4 py-2">
            <p className="text-xs text-slate-500">{doc.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
