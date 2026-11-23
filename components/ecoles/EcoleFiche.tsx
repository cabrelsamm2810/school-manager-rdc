'use client';

import { useState, useEffect, useMemo } from 'react';
import { INSTITUTION_MAP, DOCUMENT_TYPES } from '@/lib/institutions';
import { StatutBadge } from '@/components/ui/StatutBadge';
import { useSessionUser } from '@/lib/use-session-user';
import { DocumentAuditTrail } from '@/components/ecoles/DocumentAuditTrail';
import type { DocumentAudit } from '@/components/ecoles/DocumentAuditTrail';
import { checkEcoleConfigured } from '@/lib/ecole-config';
import { GeoLocationMap } from '@/components/ecoles/GeoLocationMap';

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
  nomAbrege: string;
  idSecope: string;
  type: string;
  regimeGestion: string;
  institution: string;
  numeroAgrement: string;
  dateCreation: string | null;
  dateFermeture: string | null;
  sections: string[];
  options: string[];
  nombreSections: number;
  dinacope: string;
  numeroNU: string;
  numeroNP: string;
  province: string;
  provinceEducationnelle: string;
  ville: string;
  commune: string;
  secteur: string;
  quartier: string;
  avenue: string;
  numeroParcelle: string;
  adresse: string;
  localisationGeo: string;
  latitude: number | null;
  longitude: number | null;
  coordinationProvinciale: string;
  codeCoordProv: string;
  codeCoordSous: string;
  sousDivision: string;
  promoteur: string;
  directeurEtudes: string;
  responsableAdministratif: string;
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
  documentAudits: DocumentAudit[];
  validationLogs: ValidationLog[];
};

const sectionClass = 'rounded-2xl border border-slate-200 bg-white p-5';
const labelClass = 'text-xs font-medium uppercase tracking-wide text-slate-400';
const valueClass = 'mt-0.5 text-sm font-medium text-slate-900';

const STATUT_ETABLISSEMENT_STYLES: Record<string, string> = {
  Actif: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'En attente': 'bg-amber-50 text-amber-700 border-amber-200',
  Suspendu: 'bg-orange-50 text-orange-700 border-orange-200',
  Fermé: 'bg-red-50 text-red-700 border-red-200',
};

function Info({ label, value }: { label: string; value?: string | number | null }) {
  const display = value === 0 ? '0' : value ? String(value) : '—';
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <p className={valueClass}>{display}</p>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString('fr-FR') : '—';
}

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

  // Hook inconditionnel : doit être appelé avant les retours anticipés.
  const configCheck = useMemo(
    () => (ecole ? checkEcoleConfigured(ecole) : { isConfigured: false, missingFields: [] }),
    [ecole],
  );

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

  // Vérifier que l'école est bien configurée avant l'envoi du dossier
  const isConfigured = configCheck.isConfigured;
  const nombreSections = ecole.nombreSections || ecole.sections?.length || 0;
  const statutStyle = STATUT_ETABLISSEMENT_STYLES[ecole.statut] || 'bg-slate-50 text-slate-700 border-slate-200';

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
              <img src={ecole.logoUrl} alt="Logo de l'établissement" className="h-20 w-20 rounded-2xl border border-white/70 bg-white object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/70 text-3xl font-bold text-slate-400">
                {ecole.nom[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-900">{ecole.nom}</h2>
              {ecole.nomAbrege && <p className="text-sm font-medium text-slate-600">{ecole.nomAbrege}</p>}
              <p className="mt-1 text-sm text-slate-500">
                {ecole.identifiantSM && (
                  <span className="font-mono font-semibold text-blue-600">ID: {ecole.identifiantSM}</span>
                )}
                {ecole.identifiantSM && ecole.idSecope && ' · '}
                {ecole.idSecope && <span>SECOPE: {ecole.idSecope}</span>}
                {!ecole.identifiantSM && !ecole.idSecope && 'Identifiant non attribué'}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${inst?.bgColor} ${inst?.color}`}>
                  {inst?.label || ecole.institution}
                </span>
                {ecole.regimeGestion && (
                  <span className="rounded-lg bg-white/70 px-2.5 py-1 text-xs font-medium text-slate-700">{ecole.regimeGestion}</span>
                )}
                {ecole.type && <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{ecole.type}</span>}
                <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${statutStyle}`}>{ecole.statut || 'Statut non défini'}</span>
                <StatutBadge statut={ecole.statutValidation} />
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
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700">{ecole.province || 'Province'}</span>
          <span className="text-slate-400">→</span>
          <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-700">{ecole.provinceEducationnelle || 'Province éduc.'}</span>
          <span className="text-slate-400">→</span>
          <span className="rounded-lg bg-blue-50 px-3 py-1.5 font-medium text-blue-700">
            {ecole.coordSousProvinciale?.nom || ecole.coordinationProvinciale || 'Structure non assignée'}
          </span>
          <span className="text-slate-400">→</span>
          <span className="rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white">{ecole.nom}</span>
        </div>
      </div>

      {/* Informations administratives */}
      <div className={sectionClass}>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Informations administratives</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Nom officiel" value={ecole.nom} />
          <Info label="Nom abrégé" value={ecole.nomAbrege} />
          <Info label="ID SECOPE" value={ecole.idSecope} />
          <Info label="Type d'établissement" value={ecole.type} />
          <Info label="Régime de gestion" value={ecole.regimeGestion} />
          <Info label="Institution de tutelle" value={INSTITUTION_MAP[ecole.institution]?.label ?? ecole.institution} />
          <Info label="Numéro de l'arrêté d'agrément" value={ecole.numeroAgrement} />
          <Info label="Date de création" value={formatDate(ecole.dateCreation)} />
          <Info label="Date de fermeture" value={ecole.dateFermeture ? formatDate(ecole.dateFermeture) : '—'} />
          <Info label="Statut de l'établissement" value={ecole.statut} />
          <Info label="Effectif" value={ecole.effectif.toLocaleString('fr-FR')} />
        </div>
      </div>

      {/* Localisation géographique */}
      <div className={sectionClass}>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Localisation géographique</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Province" value={ecole.province} />
          <Info label="Province éducationnelle" value={ecole.provinceEducationnelle} />
          <Info label="Ville ou territoire" value={ecole.ville} />
          <Info label="Commune" value={ecole.commune} />
          <Info label="Secteur" value={ecole.secteur} />
          <Info label="Quartier" value={ecole.quartier} />
          <Info label="Avenue" value={ecole.avenue} />
          <Info label="Numéro de parcelle" value={ecole.numeroParcelle} />
          <div className="sm:col-span-2 lg:col-span-3">
            <Info label="Adresse complète" value={ecole.adresse} />
          </div>
        </div>
        <div className="mt-4 border-t border-slate-100 pt-4">
          <GeoLocationMap latitude={ecole.latitude} longitude={ecole.longitude} />
        </div>
      </div>

      {/* Coordination éducationnelle */}
      <div className={sectionClass}>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Coordination éducationnelle</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Coordination provinciale" value={ecole.coordinationProvinciale} />
          <Info label="Code COORD-PROV" value={ecole.codeCoordProv} />
          <Info label="Coordination sous-provinciale" value={ecole.coordSousProvinciale?.nom} />
          <Info label="Code COORD-SOUS" value={ecole.codeCoordSous} />
          <Info label="Sous-division" value={ecole.sousDivision} />
        </div>
      </div>

      {/* Responsables et identification */}
      <div className={sectionClass}>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Responsables et identification</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Promoteur" value={ecole.promoteur} />
          <Info label="Chef d'établissement" value={ecole.chefEcole} />
          <Info label="Directeur des études" value={ecole.directeurEtudes} />
          <Info label="Responsable administratif" value={ecole.responsableAdministratif} />
          <Info label="Téléphone" value={ecole.telephone} />
          <Info label="Adresse électronique" value={ecole.email} />
          <Info label="DINACOPE" value={ecole.dinacope} />
          <Info label="Numéro N.U" value={ecole.numeroNU} />
          <Info label="Numéro N.P" value={ecole.numeroNP} />
        </div>
      </div>

      {/* Sections et options */}
      <div className={sectionClass}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">Sections et options</h3>
          <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {nombreSections} section(s)
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className={labelClass}>Sections</p>
            {ecole.sections?.length ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {ecole.sections.map((section) => (
                  <span key={section} className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-medium text-white">{section}</span>
                ))}
              </div>
            ) : <p className={valueClass}>—</p>}
          </div>
          <div>
            <p className={labelClass}>Options des humanités</p>
            {ecole.options?.length ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {ecole.options.map((option) => (
                  <span key={option} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{option}</span>
                ))}
              </div>
            ) : <p className={valueClass}>—</p>}
          </div>
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
            {!isConfigured && (
              <div className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-sm">
                <p className="font-medium text-amber-700">⚠️ Configuration incomplète</p>
                <p className="mt-1 text-amber-600">Champs manquants : {configCheck.missingFields.map((f) => f.label).join(', ')}.</p>
                <p className="mt-1 text-xs text-amber-500">Complétez la fiche de l'école avant d'envoyer le dossier.</p>
              </div>
            )}
            <button
              onClick={handleSendDocuments}
              disabled={sending || ecole.documents.length === 0 || !isConfigured}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
            >
              {sending ? 'Envoi en cours…' : '📤 Envoyer le dossier à la coordination'}
            </button>
            {!isConfigured && (
              <p className="mt-2 text-xs text-amber-600">L'école doit être complètement configurée avant l'envoi.</p>
            )}
            {isConfigured && ecole.documents.length === 0 && (
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

      {/* Historique d'audit des documents */}
      {ecole.documentAudits && ecole.documentAudits.length > 0 && (
        <div className={sectionClass}>
          <h3 className="mb-3 text-sm font-bold text-slate-900">
            Historique d'audit des documents ({ecole.documentAudits.length})
          </h3>
          <DocumentAuditTrail audits={ecole.documentAudits} />
        </div>
      )}

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
