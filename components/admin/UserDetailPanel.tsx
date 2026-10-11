'use client';

import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { ROLE_LABELS } from '@/lib/roles';
import { can, PERM } from '@/lib/permissions';

export type UserDetail = {
  id: string;
  nom: string;
  postNom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
  isActive: boolean;
  userStatus: string;
  createdAt: string;
  updatedAt: string;
  profilePhotoUrl: string | null;
  provinceAdministrative: string;
  provinceEducationnelle: string;
  institutionName: string;
  typeInstitution: string;
  fonction: string;
  grade: string;
  dinacope: string;
  ecoleId: string | null;
  coordSousProvincialeId: string | null;
  ecole: { id: string; nom: string; province: string; ville: string } | null;
  coordSousProvinciale: { id: string; nom: string; province: string } | null;
};

export type AuditEntry = {
  id: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  result: string;
  details: string;
  createdAt: string;
};

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  ACTIF: { color: 'bg-green-100 text-green-700', label: 'Actif' },
  EN_ATTENTE: { color: 'bg-amber-100 text-amber-700', label: 'En attente' },
  SUSPENDU: { color: 'bg-red-100 text-red-700', label: 'Suspendu' },
  DESACTIVE: { color: 'bg-slate-200 text-slate-600', label: 'Désactivé' },
};

const AUDIT_LABELS: Record<string, string> = {
  CREATE_USER: 'Compte créé',
  UPDATE_USER: 'Informations modifiées',
  ACTIVATE_USER: 'Compte activé',
  SUSPEND_USER: 'Compte suspendu',
  REACTIVATE_USER: 'Compte réactivé',
  DEACTIVATE_USER: 'Compte désactivé',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Détermine le périmètre d'un utilisateur. */
function getScope(user: UserDetail): string {
  if (user.ecole) return `Établissement : ${user.ecole.nom}`;
  if (user.coordSousProvinciale) return `Sous-province : ${user.coordSousProvinciale.nom}`;
  if (user.provinceAdministrative) return `Province : ${user.provinceAdministrative}`;
  return 'National';
}

/**
 * Panneau latéral détaillé du profil utilisateur.
 */
export function UserDetailPanel({
  open,
  user,
  auditHistory,
  loading,
  currentRole,
  onClose,
  onEdit,
  onAction,
}: {
  open: boolean;
  user: UserDetail | null;
  auditHistory: AuditEntry[];
  loading: boolean;
  currentRole: string;
  onClose: () => void;
  onEdit: () => void;
  onAction: (action: 'activate' | 'suspend' | 'reactivate' | 'deactivate') => void;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const status = user ? STATUS_CONFIG[user.userStatus] ?? STATUS_CONFIG.EN_ATTENTE : null;
  const canEdit = user ? can(currentRole, PERM.ADMIN_USERS) : false;
  const canValidate = user ? can(currentRole, PERM.ADMIN_USER_VALIDATE) : false;
  const canSuspend = user ? can(currentRole, PERM.ADMIN_USER_SUSPEND) : false;
  const canReactivate = user ? can(currentRole, PERM.ADMIN_USER_REACTIVATE) : false;

  // Actions disponibles selon le statut actuel
  const availableActions: { action: 'activate' | 'suspend' | 'reactivate' | 'deactivate'; label: string; danger?: boolean }[] = [];
  if (user) {
    if (user.userStatus === 'EN_ATTENTE' && canValidate) {
      availableActions.push({ action: 'activate', label: 'Activer le compte' });
    }
    if (user.userStatus === 'ACTIF' && canSuspend) {
      availableActions.push({ action: 'suspend', label: 'Suspendre', danger: true });
      availableActions.push({ action: 'deactivate', label: 'Désactiver', danger: true });
    }
    if (user.userStatus === 'SUSPENDU' && canReactivate) {
      availableActions.push({ action: 'reactivate', label: 'Réactiver' });
    }
    if (user.userStatus === 'DESACTIVE' && canReactivate) {
      availableActions.push({ action: 'reactivate', label: 'Réactiver' });
    }
  }

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-slate-50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">Profil utilisateur</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        {loading || !user ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Identity card */}
            <div className="bg-white px-5 py-5">
              <div className="flex items-center gap-4">
                <Avatar photoUrl={user.profilePhotoUrl} prenom={user.prenom} nom={user.nom} size="xl" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold text-slate-900">
                    {user.prenom} {user.nom}
                  </h3>
                  {user.postNom && <p className="truncate text-sm text-slate-500">{user.postNom}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status?.color}`}>
                      {status?.label}
                    </span>
                    <span className="text-xs font-medium text-slate-500">{ROLE_LABELS[user.role] ?? user.role}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {availableActions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 bg-white px-5 py-4">
                {canEdit && (
                  <button onClick={onEdit} className="flex items-center gap-1.5 rounded-xl bg-blue-50 px-3.5 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100">
                    <Icon name="settings" className="h-4 w-4" /> Modifier
                  </button>
                )}
                {availableActions.map((a) => (
                  <button
                    key={a.action}
                    onClick={() => onAction(a.action)}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                      a.danger
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {a.danger ? <Icon name="lock" className="h-4 w-4" /> : <Icon name="check-circle" className="h-4 w-4" />}
                    {a.label}
                  </button>
                ))}
              </div>
            )}

            {/* Coordonnées */}
            <div className="mt-3 bg-white px-5 py-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Coordonnées</h4>
              <dl className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <Icon name="user" className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600">{user.email}</span>
                </div>
                {user.telephone && (
                  <div className="flex items-center gap-2.5">
                    <Icon name="phone" className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{user.telephone}</span>
                  </div>
                )}
              </dl>
            </div>

            {/* Périmètre */}
            <div className="mt-3 bg-white px-5 py-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Périmètre d'accès</h4>
              <div className="flex items-center gap-2.5">
                <Icon name="location" className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">{getScope(user)}</span>
              </div>
            </div>

            {/* Informations administratives */}
            <div className="mt-3 bg-white px-5 py-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Informations</h4>
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-slate-400">Fonction</dt>
                  <dd className="text-sm text-slate-700">{user.fonction || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Grade</dt>
                  <dd className="text-sm text-slate-700">{user.grade || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Institution</dt>
                  <dd className="text-sm text-slate-700">{user.institutionName || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Type</dt>
                  <dd className="text-sm text-slate-700">{user.typeInstitution || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Date de création</dt>
                  <dd className="text-sm text-slate-700">{formatDate(user.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">Dernière modification</dt>
                  <dd className="text-sm text-slate-700">{formatDate(user.updatedAt)}</dd>
                </div>
              </dl>
            </div>

            {/* Historique d'audit */}
            <div className="mt-3 bg-white px-5 py-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Historique administratif</h4>
              {auditHistory.length === 0 ? (
                <p className="text-sm text-slate-400">Aucune action enregistrée.</p>
              ) : (
                <ul className="space-y-2.5">
                  {auditHistory.map((entry) => (
                    <li key={entry.id} className="flex items-start gap-2.5">
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${entry.result === 'success' ? 'bg-green-500' : entry.result === 'denied' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700">
                          {AUDIT_LABELS[entry.action] ?? entry.action}
                        </p>
                        <p className="text-xs text-slate-400">
                          {entry.userName || 'Système'} • {formatDateTime(entry.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
