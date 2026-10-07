'use client';

import { useState, useEffect } from 'react';
import { INSTITUTION_MAP, DOCUMENT_TYPES } from '@/lib/institutions';
import { StatutBadge } from '@/components/ui/StatutBadge';
import { useSessionUser } from '@/lib/use-session-user';

/** Rôles autorisés à téléverser/supprimer des documents (école uniquement). */
const SCHOOL_ROLES = ['DIRECTION_ECOLE', 'PROMOTEUR', 'SECRETAIRE', 'COMPTABLE'];

type Document = {
  id: string;
  type: string;
  titre: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  createdAt: string;
};

type ValidationLog = {
  id: string;
  statut: string;
  commentaire: string;
  validateurNom: string;
  createdAt: string;
};

type Ecole = {
  id: string;
  nom: string;
  type: string;
  institution: string;
  dinacope: string;
  province: string;
  provinceEducationnelle: string;
  ville: string;
  commune: string;
  adresse: string;
  localisationGeo: string;
  telephone: string;
  email: string;
  chefEcole: string;
  logoUrl: string | null;
  identifiantSM: string | null;
  effectif: number;
  statut: string;
  statutValidation: string;
  structureRattachementId: string | null;
  structureRattachementType: string;
  coordSousProvincialeId: string | null;
  coordSousProvinciale?: { id: string; nom: string; province: string } | null;
  ecErcId: string | null;
  ecErc?: { id: string; nom: string; type: string } | null;
  documents: Document[];
  validationLogs: ValidationLog[];
};

const sectionClass = 'rounded-2xl border border-slate-200 bg-white p-5';
const labelClass = 'text-xs font-medium uppercase tracking-wide text-slate-400';
const valueClass = 'mt-0.5 text-sm font-medium text-slate-900';

export function EcoleFiche({ id, onEdit, onClose }: { id: string; onEdit: () => void; onClose: () => void }) {
  const session = useSessionUser();
  const canManageDocs = !!session && SCHOOL_ROLES.includes(session.role);

  const [ecole, setEcole] = useState<Ecole | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [docType, setDocType] = useState('');
  const [docTitre, setDocTitre] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ecoles/${id}`);
      const data = await res.json();
      if (res.ok) setEcole(data.ecole);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!docFile || !docTitre) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('type', docType);
      formData.append('titre', docTitre);
      const res = await fetch(`/api/ecoles/${id}/documents`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        setDocType('');
        setDocTitre('');
        setDocFile(null);
        loadData();
      }
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
  }

  async function handleSendDocuments() {
    if (!confirm('Envoyer le dossier de documents à la coordination pour vérification ?')) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`/api/ecoles/${id}/envoyer-documents`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSendResult({ type: 'success', message: data.message || 'Dossier envoyé avec succès.' });
        loadData();
      } else {
        setSendResult({ type: 'error', message: data.error || 'Erreur lors de l\'envoi.' });
      }
    } catch {
      setSendResult({ type: 'error', message: 'Erreur lors de l\'envoi du dossier.' });
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteDoc(docId: string) {
    if (!confirm('Supprimer ce document ?')) return;
    try {
      await fetch(`/api/ecoles/${id}/documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId }),
      });
      loadData();
    } catch {
      // ignore
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-slate-500">Chargement de la fiche…</p>;
  }
  if (!ecole) {
    return <p className="py-8 text-center text-sm text-slate-500">École introuvable.</p>;
  }

  const inst = INSTITUTION_MAP[ecole.institution];

  return (
    <div className="space-y-5">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-sm text-slate-500 transition hover:text-slate-700">
            ← Retour
          </button>
        </div>
        <button onClick={onEdit} className="btn-secondary-light px-4 py-2 text-sm">
          Modifier
        </button>
      </div>

      {/* Carte d'identité */}
      <div className={`rounded-2xl border-2 p-5 ${inst?.borderColor || 'border-slate-200'} ${inst?.bgColor || 'bg-white'}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {ecole.logoUrl ? (
              <img src={ecole.logoUrl} alt="Logo" className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/60 text-2xl font-bold text-slate-400">
                {ecole.nom[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900">{ecole.nom}</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {ecole.identifiantSM && (
                  <span className="font-mono font-semibold text-blue-600">ID: {ecole.identifiantSM}</span>
                )}
                {ecole.identifiantSM && ecole.dinacope && ' · '}
                {ecole.dinacope && <span>DINACOPE: {ecole.dinacope}</span>}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${inst?.bgColor} ${inst?.color}`}>
                  {inst?.label || ecole.institution}
                </span>
                <StatutBadge statut={ecole.statutValidation} />
                {ecole.type && <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{ecole.type}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hiérarchie de rattachement */}
      <div className={sectionClass}>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Hiérarchie de rattachement</h3>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700">{inst?.label || ecole.institution}</span>
          <span className="text-slate-400">→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700">{ecole.province}</span>
          <span className="text-slate-400">→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700">{ecole.provinceEducationnelle}</span>
          <span className="text-slate-400">→</span>
          <span className="rounded-lg bg-blue-50 px-3 py-1.5 font-medium text-blue-700">
            {ecole.coordSousProvinciale?.nom || 'Structure non assignée'}
          </span>
          <span className="text-slate-400">→</span>
          <span className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white">{ecole.nom}</span>
        </div>
      </div>

      {/* Informations générales */}
      <div className={sectionClass}>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Informations générales</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div><p className={labelClass}>Type</p><p className={valueClass}>{ecole.type || '—'}</p></div>
          <div><p className={labelClass}>DINACOPE</p><p className={valueClass}>{ecole.dinacope || '—'}</p></div>
          <div><p className={labelClass}>Chef d'établissement</p><p className={valueClass}>{ecole.chefEcole || '—'}</p></div>
          <div><p className={labelClass}>Téléphone</p><p className={valueClass}>{ecole.telephone || '—'}</p></div>
          <div><p className={labelClass}>Email</p><p className={valueClass}>{ecole.email || '—'}</p></div>
          <div><p className={labelClass}>Effectif</p><p className={valueClass}>{ecole.effectif.toLocaleString('fr-FR')}</p></div>
          <div><p className={labelClass}>Province</p><p className={valueClass}>{ecole.province || '—'}</p></div>
          <div><p className={labelClass}>Province éducationnelle</p><p className={valueClass}>{ecole.provinceEducationnelle || '—'}</p></div>
          <div><p className={labelClass}>Commune</p><p className={valueClass}>{ecole.commune || '—'}</p></div>
          <div><p className={labelClass}>Ville</p><p className={valueClass}>{ecole.ville || '—'}</p></div>
          <div className="sm:col-span-2"><p className={labelClass}>Adresse</p><p className={valueClass}>{ecole.adresse || '—'}</p></div>
          <div className="sm:col-span-2 lg:col-span-1"><p className={labelClass}>Localisation géo.</p><p className={valueClass}>{ecole.localisationGeo || '—'}</p></div>
        </div>
      </div>

      {/* Documents justificatifs */}
      <div className={sectionClass}>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Documents justificatifs ({ecole.documents.length})</h3>
        {ecole.documents.length > 0 ? (
          <div className="space-y-2">
            {ecole.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📄</span>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{doc.titre}</p>
                    <p className="text-xs text-slate-500">{doc.type || 'Sans type'} · {new Date(doc.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50">
                    Voir
                  </a>
                  {canManageDocs && (
                    <button onClick={() => handleDeleteDoc(doc.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50">
                      Suppr.
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Aucun document justificatif.</p>
        )}

        {/* Bouton d'envoi du dossier à la coordination — réservé aux rôles de l'école */}
        {canManageDocs && ['Brouillon', 'Rejetée'].includes(ecole.statutValidation) && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            {sendResult && (
              <div className={`mb-3 rounded-xl px-4 py-2.5 text-sm font-medium ${sendResult.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {sendResult.message}
              </div>
            )}
            <button
              onClick={handleSendDocuments}
              disabled={sending || ecole.documents.length === 0}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
            >
              {sending ? 'Envoi en cours…' : '📤 Envoyer le dossier à la coordination'}
            </button>
            {ecole.documents.length === 0 && (
              <p className="mt-2 text-xs text-amber-600">Veuillez ajouter au moins un document avant d'envoyer le dossier.</p>
            )}
          </div>
        )}

        {/* Upload form — réservé aux rôles de l'école */}
        {canManageDocs && (
        <form onSubmit={handleUpload} className="mt-4 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <input type="text" placeholder="Titre du document" value={docTitre}
              onChange={(e) => setDocTitre(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" required />
          </div>
          <div>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500">
              <option value="">Type…</option>
              {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <input type="file" onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-blue-600" required />
          </div>
          <button type="submit" disabled={uploading || !docFile || !docTitre}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50">
            {uploading ? '…' : 'Ajouter'}
          </button>
        </form>
        )}
      </div>

      {/* Historique de validation */}
      {ecole.validationLogs.length > 0 && (
        <div className={sectionClass}>
          <h3 className="mb-3 text-sm font-bold text-slate-900">Historique de validation</h3>
          <div className="space-y-2">
            {ecole.validationLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-2.5">
                <StatutBadge statut={log.statut} />
                <div className="flex-1">
                  <p className="text-sm text-slate-700">{log.commentaire || '—'}</p>
                  <p className="text-xs text-slate-500">
                    {log.validateurNom || 'Système'} · {new Date(log.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
