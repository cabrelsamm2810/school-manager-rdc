'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/ui/Icon';
import { StatutBadge } from '@/components/ui/StatutBadge';
import { INSTITUTION_MAP, VALIDATION_STATUT_COLORS } from '@/lib/institutions';

type Responsable = {
  id: string;
  nom: string;
  postNom: string;
  prenom: string;
  role: string;
  email: string;
  telephone: string;
  fonction: string;
  grade: string;
  userStatus: string;
  isActive: boolean;
};

type Document = {
  id: string;
  type: string;
  titre: string;
  fileUrl: string;
  fileName: string;
  createdAt: string;
};

type ValidationLog = {
  id: string;
  statut: string;
  commentaire: string;
  validateurNom: string;
  createdAt: string;
};

type EcoleDetail = {
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
  createdAt: string;
  updatedAt: string;
  coordSousProvinciale?: { id: string; nom: string; province: string } | null;
  ecErc?: { id: string; nom: string; type: string } | null;
  documents: Document[];
  validationLogs: ValidationLog[];
  stats: {
    eleves: number;
    enseignants: number;
    utilisateurs: number;
    classes: string[];
    chatGroups: number;
  };
  responsables: Responsable[];
};

const ROLE_LABELS: Record<string, string> = {
  DIRECTION_ECOLE: 'Chef d\'établissement',
  PROMOTEUR: 'Promoteur',
  SECRETAIRE: 'Secrétaire',
  COMPTABLE: 'Comptable',
};

const sectionClass = 'rounded-2xl border border-slate-200 bg-white p-4';
const labelClass = 'text-xs font-medium uppercase tracking-wide text-slate-400';
const valueClass = 'mt-0.5 text-sm font-medium text-slate-900';

export function EcoleDetailPanel({
  id,
  onClose,
  onAction,
}: {
  id: string;
  onClose: () => void;
  onAction: (action: string, ecole: EcoleDetail) => void;
}) {
  const [ecole, setEcole] = useState<EcoleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin-smd/ecoles/${id}`);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
      </div>
    );
  }

  if (!ecole) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-slate-500">Établissement introuvable.</p>
        <button onClick={onClose} className="mt-3 text-sm text-blue-600 hover:text-blue-700">← Retour</button>
      </div>
    );
  }

  const inst = INSTITUTION_MAP[ecole.institution];
  const isECERC = ecole.institution === 'EC_ERC';
  const canValidate = ecole.statutValidation !== 'Validée' || ecole.statut !== 'Actif';
  const canSuspend = ecole.statut !== 'Suspendu';
  const canReactivate = ecole.statut === 'Suspendu';
  const canDeactivate = ecole.statut !== 'Inactif';

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700">
          <Icon name="chevron-right" className="h-4 w-4 rotate-180" />
          Retour à la liste
        </button>
      </div>

      {/* Carte d'identité */}
      <div className={`rounded-2xl border-2 p-4 md:p-5 ${inst?.borderColor || 'border-slate-200'} ${inst?.bgColor || 'bg-white'}`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {ecole.logoUrl ? (
              <img src={ecole.logoUrl} alt="Logo" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/60 text-xl font-bold text-slate-400">
                {ecole.nom[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-900 md:text-xl">{ecole.nom}</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {ecole.identifiantSM && <span className="font-mono font-semibold text-blue-600">ID: {ecole.identifiantSM}</span>}
                {ecole.identifiantSM && ecole.dinacope && ' · '}
                {ecole.dinacope && <span>DINACOPE: {ecole.dinacope}</span>}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${inst?.bgColor} ${inst?.color}`}>
                  {inst?.label || ecole.institution}
                </span>
                <StatutBadge statut={ecole.statut} />
                <StatutBadge statut={ecole.statutValidation} />
                {ecole.type && <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{ecole.type}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {canValidate && (
          <button onClick={() => onAction('validate', ecole)} className="flex items-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700">
            <Icon name="check-circle" className="h-4 w-4" /> Valider
          </button>
        )}
        {canSuspend && (
          <button onClick={() => onAction('suspend', ecole)} className="flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-700">
            <Icon name="alert" className="h-4 w-4" /> Suspendre
          </button>
        )}
        {canReactivate && (
          <button onClick={() => onAction('reactivate', ecole)} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700">
            <Icon name="refresh" className="h-4 w-4" /> Réactiver
          </button>
        )}
        {canDeactivate && (
          <button onClick={() => onAction('deactivate', ecole)} className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700">
            <Icon name="x-circle" className="h-4 w-4" /> Désactiver
          </button>
        )}
      </div>

      {/* EC-ERC info */}
      {isECERC && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">EC-ERC — Écoles Conventionnées des Églises du Réveil du Congo</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="rounded-lg bg-white px-2.5 py-1 font-medium text-blue-700">Coordination nationale</span>
            <span className="text-blue-400">→</span>
            <span className="rounded-lg bg-white px-2.5 py-1 font-medium text-blue-700">Coordination provinciale ({ecole.province || '—'})</span>
            <span className="text-blue-400">→</span>
            <span className="rounded-lg bg-white px-2.5 py-1 font-medium text-blue-700">
              {ecole.coordSousProvinciale?.nom || 'Sous-provinciale non assignée'}
            </span>
            <span className="text-blue-400">→</span>
            <span className="rounded-lg bg-blue-600 px-2.5 py-1 font-medium text-white">{ecole.nom}</span>
          </div>
        </div>
      )}

      {/* Localisation */}
      <div className={sectionClass}>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Localisation</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div><p className={labelClass}>Province</p><p className={valueClass}>{ecole.province || '—'}</p></div>
          <div><p className={labelClass}>Province éducationnelle</p><p className={valueClass}>{ecole.provinceEducationnelle || '—'}</p></div>
          <div><p className={labelClass}>Sous-provinciale</p><p className={valueClass}>{ecole.coordSousProvinciale?.nom || '—'}</p></div>
          <div><p className={labelClass}>Ville</p><p className={valueClass}>{ecole.ville || '—'}</p></div>
          <div><p className={labelClass}>Commune</p><p className={valueClass}>{ecole.commune || '—'}</p></div>
          <div><p className={labelClass}>Adresse</p><p className={valueClass}>{ecole.adresse || '—'}</p></div>
          {ecole.localisationGeo && (
            <div className="sm:col-span-2 lg:col-span-3"><p className={labelClass}>Coordonnées géo.</p><p className={valueClass}>{ecole.localisationGeo}</p></div>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className={sectionClass}>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Contact</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><p className={labelClass}>Téléphone</p><p className={valueClass}>{ecole.telephone || '—'}</p></div>
          <div><p className={labelClass}>E-mail</p><p className={valueClass}>{ecole.email || '—'}</p></div>
        </div>
      </div>

      {/* Responsabilité */}
      <div className={sectionClass}>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Responsabilité</h3>
        {ecole.responsables.length > 0 ? (
          <div className="space-y-2">
            {ecole.responsables.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {r.prenom} {r.nom} {r.postNom}
                  </p>
                  <p className="text-xs text-slate-500">
                    {ROLE_LABELS[r.role] || r.role}
                    {r.fonction && ` · ${r.fonction}`}
                    {r.grade && ` · ${r.grade}`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {r.isActive ? (
                    <span className="rounded-lg bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Actif</span>
                  ) : (
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Inactif</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Aucun responsable enregistré.</p>
        )}
        <div className="mt-3 border-t border-slate-100 pt-2">
          <p className={labelClass}>Chef d'établissement (enregistré)</p>
          <p className={valueClass}>{ecole.chefEcole || '—'}</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className={sectionClass}>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Statistiques</h3>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-xl bg-blue-50 px-3 py-2.5">
            <p className="text-xs text-slate-500">Élèves</p>
            <p className="mt-0.5 text-lg font-bold text-blue-700">{ecole.stats.eleves}</p>
          </div>
          <div className="rounded-xl bg-purple-50 px-3 py-2.5">
            <p className="text-xs text-slate-500">Enseignants</p>
            <p className="mt-0.5 text-lg font-bold text-purple-700">{ecole.stats.enseignants}</p>
          </div>
          <div className="rounded-xl bg-green-50 px-3 py-2.5">
            <p className="text-xs text-slate-500">Classes</p>
            <p className="mt-0.5 text-lg font-bold text-green-700">{ecole.stats.classes.length}</p>
          </div>
          <div className="rounded-xl bg-amber-50 px-3 py-2.5">
            <p className="text-xs text-slate-500">Utilisateurs</p>
            <p className="mt-0.5 text-lg font-bold text-amber-700">{ecole.stats.utilisateurs}</p>
          </div>
        </div>
        {ecole.stats.classes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ecole.stats.classes.map((c) => (
              <span key={c} className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{c}</span>
            ))}
          </div>
        )}
      </div>

      {/* Statut */}
      <div className={sectionClass}>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Statut</h3>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Statut :</span>
            <StatutBadge statut={ecole.statut} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Validation :</span>
            <StatutBadge statut={ecole.statutValidation} />
          </div>
        </div>
      </div>

      {/* Historique */}
      <div className={sectionClass}>
        <h3 className="mb-3 text-sm font-bold text-slate-900">Historique</h3>
        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <div><p className={labelClass}>Date de création</p><p className={valueClass}>{new Date(ecole.createdAt).toLocaleString('fr-FR')}</p></div>
          <div><p className={labelClass}>Dernière modification</p><p className={valueClass}>{new Date(ecole.updatedAt).toLocaleString('fr-FR')}</p></div>
        </div>
        {ecole.validationLogs.length > 0 && (
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Activités administratives</p>
            {ecole.validationLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2">
                <StatutBadge statut={log.statut} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-700">{log.commentaire || '—'}</p>
                  <p className="text-xs text-slate-400">
                    {log.validateurNom || 'Système'} · {new Date(log.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      {ecole.documents.length > 0 && (
        <div className={sectionClass}>
          <h3 className="mb-3 text-sm font-bold text-slate-900">Documents ({ecole.documents.length})</h3>
          <div className="space-y-2">
            {ecole.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon name="document" className="h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{doc.titre}</p>
                    <p className="text-xs text-slate-400">{doc.type || 'Sans type'} · {new Date(doc.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50">
                  Voir
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
