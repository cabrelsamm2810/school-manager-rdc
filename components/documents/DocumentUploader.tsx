'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { clsx } from 'clsx';

type Doc = {
  id: string;
  categorie: string;
  type: string;
  titre: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  description: string;
  createdAt: string;
};

const CATEGORIES = [
  { value: 'document', label: 'Document', icon: '📄', accept: 'image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip' },
  { value: 'photo', label: 'Photo', icon: '🖼️', accept: 'image/jpeg,image/png,image/webp,image/gif' },
];

const DOC_TYPES = [
  'Acte de naissance', 'Bulletin', 'Certificat médical', 'Certificat de scolarité',
  'Contrat', 'Relevé de notes', 'Photo d\'identité', 'Lettre de motivation',
  'Diplôme', 'Facture', 'Autre',
];

function formatSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

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

function isPreviewable(fileType: string) {
  return fileType.includes('image') || fileType.includes('pdf');
}

export function DocumentUploader() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [preview, setPreview] = useState<Doc | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Form state
  const [categorie, setCategorie] = useState('document');
  const [titre, setTitre] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      if (Array.isArray(data)) setDocs(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter ? docs.filter((d) => d.categorie === filter) : docs;
  const photos = docs.filter((d) => d.categorie === 'photo');
  const documents = docs.filter((d) => d.categorie === 'document');

  function resetForm() {
    setTitre('');
    setType('');
    setDescription('');
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleFileSelect(file: File | null) {
    if (!file) return;
    setSelectedFile(file);
    if (!titre) setTitre(file.name.replace(/\.[^.]+$/, ''));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) { setError('Veuillez sélectionner un fichier.'); return; }
    if (!titre.trim()) { setError('Le titre est obligatoire.'); return; }

    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('titre', titre.trim());
      fd.append('categorie', categorie);
      fd.append('type', type);
      fd.append('description', description);

      const res = await fetch('/api/documents', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors du téléversement.');
      } else {
        setSuccess('Fichier téléversé avec succès.');
        resetForm();
        load();
      }
    } catch {
      setError('Erreur de connexion.');
    }
    setUploading(false);
  }

  async function handleDelete(docId: string) {
    if (!confirm('Supprimer ce fichier ? Le fichier sera retiré du stockage.')) return;
    await fetch(`/api/documents?docId=${docId}`, { method: 'DELETE' });
    load();
  }

  function handleDownload(doc: Doc) {
    if (!doc.fileUrl) return;
    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.fileName || doc.titre;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const currentCat = CATEGORIES.find((c) => c.value === categorie) || CATEGORIES[0];

  return (
    <div className="space-y-5">
      {/* Stats rapides */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📄</span>
            <div>
              <p className="text-2xl font-bold text-slate-900">{documents.length}</p>
              <p className="text-xs text-slate-500">Documents</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🖼️</span>
            <div>
              <p className="text-2xl font-bold text-slate-900">{photos.length}</p>
              <p className="text-xs text-slate-500">Photos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
      )}
      {success && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{success}</div>
      )}

      {/* Formulaire d'upload */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-bold text-slate-900">Téléverser un fichier</h3>

        {/* Sélecteur de catégorie */}
        <div className="mb-4 flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => { setCategorie(cat.value); setSelectedFile(null); if (fileRef.current) fileRef.current.value = ''; }}
              className={clsx(
                'flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition',
                categorie === cat.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
              )}
            >
              <span className="text-lg">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Zone de dépôt */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className={clsx(
            'mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition',
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50',
          )}
          onClick={() => fileRef.current?.click()}
        >
          {selectedFile ? (
            <>
              <span className="text-3xl">{getFileIcon(selectedFile.type)}</span>
              <p className="text-sm font-medium text-slate-700">{selectedFile.name}</p>
              <p className="text-xs text-slate-400">{formatSize(selectedFile.size)}</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                className="mt-1 text-xs text-red-500 hover:underline"
              >
                Changer de fichier
              </button>
            </>
          ) : (
            <>
              <span className="text-3xl">{currentCat.icon}</span>
              <p className="text-sm font-medium text-slate-600">
                Glissez un fichier ici ou cliquez pour parcourir
              </p>
              <p className="text-xs text-slate-400">
                {categorie === 'photo' ? 'JPG, PNG, WebP, GIF — max 5 Mo' : 'PDF, images, documents — max 10 Mo'}
              </p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={currentCat.accept}
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Champs */}
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Titre *</label>
            <input
              type="text"
              required
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Bulletin 1er trimestre"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">— Sélectionner —</option>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={uploading || !selectedFile || !titre.trim()}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
          >
            {uploading ? 'Envoi vers R2…' : 'Téléverser'}
          </button>
        </div>
      </form>

      {/* Filtres */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setFilter('')}
          className={clsx('shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition', filter === '' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
        >
          Tous ({docs.length})
        </button>
        <button
          onClick={() => setFilter('document')}
          className={clsx('shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition', filter === 'document' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
        >
          📄 Documents ({documents.length})
        </button>
        <button
          onClick={() => setFilter('photo')}
          className={clsx('shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition', filter === 'photo' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
        >
          🖼️ Photos ({photos.length})
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <p className="py-8 text-center text-sm text-slate-400">Chargement…</p>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-12 text-center">
          <span className="mb-2 text-4xl opacity-40">{filter === 'photo' ? '🖼️' : '📎'}</span>
          <p className="text-sm font-medium text-slate-600">Aucun fichier</p>
          <p className="mt-1 text-xs text-slate-400">Téléversez vos documents et photos ci-dessus.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <div key={doc.id} className="rounded-xl border border-slate-100 bg-white p-3 transition hover:border-slate-200">
              <div className="flex items-center gap-3">
                {doc.categorie === 'photo' && doc.fileUrl && doc.fileType.includes('image') ? (
                  <img src={doc.fileUrl} alt={doc.titre} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-2xl">
                    {getFileIcon(doc.fileType)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-slate-900">{doc.titre}</p>
                    {doc.type && <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600">{doc.type}</span>}
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {doc.description || doc.fileName || 'Sans description'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(doc.createdAt)}{doc.fileSize ? ` · ${formatSize(doc.fileSize)}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  {isPreviewable(doc.fileType) && (
                    <button onClick={() => setPreview(doc)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Prévisualiser" title="Prévisualiser">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    </button>
                  )}
                  <button onClick={() => handleDownload(doc)} className="rounded-lg p-1.5 text-green-600 hover:bg-green-50" aria-label="Télécharger" title="Télécharger">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                  </button>
                  <button onClick={() => handleDelete(doc.id)} className="rounded-lg p-1.5 text-red-500 hover:bg-red-50" aria-label="Supprimer" title="Supprimer">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale de prévisualisation */}
      {preview && <PreviewModal doc={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function PreviewModal({ doc, onClose }: { doc: Doc; onClose: () => void }) {
  const isImage = doc.fileType.includes('image');
  const isPdf = doc.fileType.includes('pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getFileIcon(doc.fileType)}</span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{doc.titre}</p>
              {doc.type && <p className="text-xs text-slate-500">{doc.type}</p>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Fermer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-slate-50 p-4">
          {isImage ? (
            <img src={doc.fileUrl} alt={doc.titre} className="mx-auto max-h-[70vh] rounded-lg shadow-md" />
          ) : isPdf ? (
            <iframe src={doc.fileUrl} className="h-[70vh] w-full rounded-lg border-0 bg-white" title={doc.titre} />
          ) : (
            <div className="flex h-48 flex-col items-center justify-center text-slate-400">
              <span className="mb-2 text-4xl">{getFileIcon(doc.fileType)}</span>
              <p className="text-sm">Prévisualisation non disponible.</p>
              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700">
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
