'use client';

import { useState, useEffect, useCallback } from 'react';
import { DOCUMENT_TYPES, VALIDATION_STATUT_COLORS } from '@/lib/institutions';
import { useSessionUser } from '@/lib/use-session-user';
import { StatutBadge } from '@/components/ui/StatutBadge';

type Document = {
  id: string;
  type: string;
  titre: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  createdAt: string;
};

type Ecole = {
  id: string;
  nom: string;
  statutValidation: string;
  coordSousProvinciale?: { id: string; nom: string; province: string } | null;
  documents: Document[];
};

type PendingFile = {
  file: File;
  type: string;
  titre: string;
};

const sectionClass = 'rounded-2xl border border-slate-200 bg-white p-5';

export function DocumentSubmissionForm() {
  const session = useSessionUser();
  const ecoleId = session?.ecoleId ?? null;

  const [ecole, setEcole] = useState<Ecole | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // File queue
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const loadData = useCallback(async () => {
    if (!ecoleId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/ecoles/${ecoleId}`);
      const data = await res.json();
      if (res.ok) setEcole(data.ecole);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [ecoleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function addFileToQueue(file: File) {
    const titre = file.name.replace(/\.[^.]+$/, '');
    setPendingFiles((prev) => [...prev, { file, type: '', titre }]);
  }

  function updatePending(index: number, field: 'type' | 'titre', value: string) {
    setPendingFiles((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  }

  function removePending(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUploadAll() {
    if (!ecoleId || pendingFiles.length === 0) return;
    setUploading(true);
    setResult(null);
    try {
      for (const item of pendingFiles) {
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('type', item.type);
        formData.append('titre', item.titre);
        await fetch(`/api/ecoles/${ecoleId}/documents`, { method: 'POST', body: formData });
      }
      setPendingFiles([]);
      await loadData();
      setResult({ type: 'success', message: `${pendingFiles.length} document(s) téléversé(s) avec succès.` });
    } catch {
      setResult({ type: 'error', message: 'Erreur lors du téléversement.' });
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDoc(docId: string) {
    if (!ecoleId || !confirm('Supprimer ce document ?')) return;
    try {
      await fetch(`/api/ecoles/${ecoleId}/documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId }),
      });
      loadData();
    } catch {
      // ignore
    }
  }

  async function handleSubmit() {
    if (!ecoleId) return;
    if (!confirm('Envoyer le dossier de documents officiels à la coordination pour vérification ?')) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch(`/api/ecoles/${ecoleId}/envoyer-documents`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResult({ type: 'success', message: data.message || 'Dossier envoyé avec succès.' });
        loadData();
      } else {
        setResult({ type: 'error', message: data.error || 'Erreur lors de l\'envoi.' });
      }
    } catch {
      setResult({ type: 'error', message: 'Erreur lors de l\'envoi du dossier.' });
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-slate-500">Chargement…</p>;
  }
  if (!ecole) {
    return <p className="py-8 text-center text-sm text-slate-500">École introuvable. Aucun rattachement d\'école à votre compte.</p>;
  }

  const canSubmit = ['Brouillon', 'Rejetée'].includes(ecole.statutValidation);
  const docCount = ecole.documents.length;
  const coordName = ecole.coordSousProvinciale?.nom || 'Coordination sous-provinciale';

  return (
    <div className="space-y-5">
      {/* En-tête statut */}
      <div className={sectionClass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{ecole.nom}</h2>
            <p className="mt-0.5 text-sm text-slate-500">Documents officiels & soumission du dossier</p>
          </div>
          <div className="flex items-center gap-2">
            <StatutBadge statut={ecole.statutValidation} />
          </div>
        </div>
      </div>

      {/* Destinataire */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl">📤</span>
          <div>
            <p className="text-sm font-semibold text-blue-900">Destinataire du dossier</p>
            <p className="mt-0.5 text-sm text-blue-700">
              {coordName} → Coordination provinciale
            </p>
            <p className="mt-1 text-xs text-blue-600">
              Une fois soumis, le dossier sera visible par la coordination sous-provinciale et provinciale pour vérification.
            </p>
          </div>
        </div>
      </div>

      {/* Message de résultat */}
      {result && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.message}
        </div>
      )}

      {/* Zone de téléversement */}
      <div className={sectionClass}>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Téléverser des documents</h3>

        {/* Drop zone */}
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50">
          <span className="text-3xl">📎</span>
          <span className="text-sm font-medium text-slate-600">Cliquez pour sélectionner des fichiers</span>
          <span className="text-xs text-slate-400">PDF, images, documents — plusieurs fichiers possibles</span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              files.forEach(addFileToQueue);
              e.target.value = '';
            }}
          />
        </label>

        {/* File queue */}
        {pendingFiles.length > 0 && (
          <div className="mt-4 space-y-3">
            {pendingFiles.map((item, index) => (
              <div key={index} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-start gap-3">
                  <span className="text-lg">📄</span>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-slate-900">{item.file.name}</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Titre du document"
                        value={item.titre}
                        onChange={(e) => updatePending(index, 'titre', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                      />
                      <select
                        value={item.type}
                        onChange={(e) => updatePending(index, 'type', e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="">Type…</option>
                        {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => removePending(index)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={handleUploadAll}
              disabled={uploading || pendingFiles.some((p) => !p.titre)}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 sm:w-auto"
            >
              {uploading ? 'Téléversement…' : `Téléverser ${pendingFiles.length} fichier(s)`}
            </button>
          </div>
        )}
      </div>

      {/* Documents existants */}
      <div className={sectionClass}>
        <h3 className="mb-3 text-sm font-bold text-slate-900">
          Documents du dossier ({docCount})
        </h3>
        {docCount > 0 ? (
          <div className="space-y-2">
            {ecole.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📄</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{doc.titre}</p>
                    <p className="text-xs text-slate-500">
                      {doc.type || 'Sans type'} · {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                  >
                    Voir
                  </a>
                  {canSubmit && (
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Suppr.
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Aucun document. Téléversez vos documents officiels ci-dessus.</p>
        )}
      </div>

      {/* Soumission */}
      <div className={sectionClass}>
        <h3 className="mb-2 text-sm font-bold text-slate-900">Soumission du dossier</h3>
        {canSubmit ? (
          <>
            <p className="mb-3 text-sm text-slate-600">
              Vous avez <strong>{docCount}</strong> document(s) dans le dossier.
              {docCount === 0
                ? ' Ajoutez au moins un document avant de soumettre.'
                : ' Vérifiez que tous les documents sont complets, puis soumettez le dossier à la coordination.'}
            </p>
            <button
              onClick={handleSubmit}
              disabled={sending || docCount === 0}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
            >
              {sending ? 'Envoi en cours…' : '📤 Soumettre le dossier à la coordination'}
            </button>
          </>
        ) : (
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-600">
              Le dossier a déjà été soumis. Statut actuel :{' '}
              <strong>{VALIDATION_STATUT_COLORS[ecole.statutValidation]?.label || ecole.statutValidation}</strong>.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Vous ne pouvez soumettre un nouveau dossier que lorsque le statut est « Brouillon » ou « Rejetée ».
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
