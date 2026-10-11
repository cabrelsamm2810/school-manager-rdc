'use client';

import { useEffect, useState, useCallback } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { ROLE_LABELS } from '@/lib/roles';
import { can, PERM } from '@/lib/permissions';
import { UserFormModal, type UserFormData } from './UserFormModal';
import { ConfirmDialog } from './ConfirmDialog';
import { UserDetailPanel, type UserDetail, type AuditEntry } from './UserDetailPanel';

type UserListItem = {
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
  institutionName: string;
  typeInstitution: string;
  fonction: string;
  grade: string;
  ecoleId: string | null;
  coordSousProvincialeId: string | null;
  ecole: { nom: string } | null;
  coordSousProvinciale: { nom: string } | null;
};

type Stats = {
  total: number;
  actifs: number;
  enAttente: number;
  suspendus: number;
  desactives: number;
  nouveaux: number;
};

const STATUS_BADGE: Record<string, { class: string; label: string }> = {
  ACTIF: { class: 'bg-green-100 text-green-700', label: 'Actif' },
  EN_ATTENTE: { class: 'bg-amber-100 text-amber-700', label: 'En attente' },
  SUSPENDU: { class: 'bg-red-100 text-red-700', label: 'Suspendu' },
  DESACTIVE: { class: 'bg-slate-200 text-slate-600', label: 'Désactivé' },
};

const ROLE_OPTIONS = [
  { value: '', label: 'Tous les rôles' },
  { value: 'SUPER_ADMIN', label: 'Super Administrateur' },
  { value: 'ADMIN_SCHOOL_MANAGER_RDC', label: 'Admin School Manager RDC' },
  { value: 'COORDINATION_NATIONALE', label: 'Coordination nationale' },
  { value: 'COORDINATION_PROVINCIALE', label: 'Coordination provinciale' },
  { value: 'AGENT_PROVINCIAL', label: 'Agent provincial' },
  { value: 'COORDINATION_SOUS_PROVINCIALE', label: 'Coordination sous-provinciale' },
  { value: 'AGENT_SOUS_PROVINCIAL', label: 'Agent de coordination sous-provinciale' },
  { value: 'PROMOTEUR', label: 'Promoteur' },
  { value: 'DIRECTION_ECOLE', label: 'Chef d\'établissement' },
  { value: 'SECRETAIRE', label: 'Secrétaire' },
  { value: 'COMPTABLE', label: 'Comptable' },
  { value: 'ENSEIGNANT', label: 'Enseignant' },
  { value: 'ELEVE', label: 'Élève' },
  { value: 'PARENT', label: 'Parent/Tuteur' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'ACTIF', label: 'Actif' },
  { value: 'EN_ATTENTE', label: 'En attente' },
  { value: 'SUSPENDU', label: 'Suspendu' },
  { value: 'DESACTIVE', label: 'Désactivé' },
];

const SCOPE_OPTIONS = [
  { value: '', label: 'Tous les périmètres' },
  { value: 'national', label: 'National' },
  { value: 'province', label: 'Province' },
  { value: 'sous-province', label: 'Sous-province' },
  { value: 'etablissement', label: 'Établissement' },
];

const selectClass = 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

function getScopeLabel(u: UserListItem): string {
  if (u.ecole) return u.ecole.nom;
  if (u.coordSousProvinciale) return `Sous-prov. : ${u.coordSousProvinciale.nom}`;
  if (u.provinceAdministrative) return `Province : ${u.provinceAdministrative}`;
  return 'National';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Console professionnelle de gestion des utilisateurs — Admin School Manager RDC.
 */
export function UserManagement({ currentRole }: { currentRole: string }) {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, actifs: 0, enAttente: 0, suspendus: 0, desactives: 0, nouveaux: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    danger: boolean;
    action: 'activate' | 'suspend' | 'reactivate' | 'deactivate' | null;
    userId: string | null;
  }>({ open: false, title: '', message: '', confirmLabel: '', danger: false, action: null, userId: null });

  const canCreate = can(currentRole, PERM.ADMIN_USERS);
  const canEdit = can(currentRole, PERM.ADMIN_USERS);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (roleFilter) params.set('role', roleFilter);
      if (scopeFilter) params.set('scope', scopeFilter);
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));

      const res = await fetch(`/api/admin-smd/users?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users ?? []);
        setTotal(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setStats(data.stats ?? stats);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, roleFilter, scopeFilter, page, pageSize]);

  useEffect(() => {
    const timer = setTimeout(loadData, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, statusFilter, roleFilter, scopeFilter]);

  // Load user detail
  useEffect(() => {
    if (!selectedUserId) return;
    setDetailLoading(true);
    setDetailUser(null);
    fetch(`/api/admin-smd/users/${selectedUserId}`)
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setDetailUser(data.user);
          setAuditHistory(data.auditHistory ?? []);
        }
      })
      .finally(() => setDetailLoading(false));
  }, [selectedUserId]);

  // ── Actions ──

  async function handleFormSubmit(data: UserFormData, editingId: string | null) {
    const url = editingId ? `/api/admin-smd/users/${editingId}` : '/api/admin-smd/users';
    const method = editingId ? 'PATCH' : 'POST';
    const payload: Record<string, unknown> = { ...data };
    if (editingId && !data.password) delete (payload as any).password;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error ?? 'Erreur lors de l\'enregistrement.');

    setFormOpen(false);
    setEditingUser(null);
    loadData();
  }

  function openEdit(user: UserListItem) {
    setEditingUser(user);
    setFormOpen(true);
  }

  function handleAction(action: 'activate' | 'suspend' | 'reactivate' | 'deactivate') {
    if (!selectedUserId) return;
    const messages: Record<string, { title: string; message: string; confirmLabel: string; danger: boolean }> = {
      activate: { title: 'Activer le compte', message: 'Voulez-vous vraiment activer ce compte ? L\'utilisateur pourra se connecter.', confirmLabel: 'Activer', danger: false },
      suspend: { title: 'Suspendre le compte', message: 'Voulez-vous vraiment suspendre ce compte ? L\'utilisateur ne pourra plus se connecter.', confirmLabel: 'Suspendre', danger: true },
      reactivate: { title: 'Réactiver le compte', message: 'Voulez-vous vraiment réactiver ce compte ?', confirmLabel: 'Réactiver', danger: false },
      deactivate: { title: 'Désactiver le compte', message: 'Voulez-vous vraiment désactiver ce compte ? L\'utilisateur ne pourra plus se connecter.', confirmLabel: 'Désactiver', danger: true },
    };
    const cfg = messages[action];
    setConfirmState({ open: true, ...cfg, action, userId: selectedUserId });
  }

  async function executeAction() {
    if (!confirmState.userId || !confirmState.action) return;
    try {
      const res = await fetch(`/api/admin-smd/users/${confirmState.userId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: confirmState.action }),
      });
      if (res.ok) {
        // Refresh detail and list
        if (selectedUserId) {
          const detailRes = await fetch(`/api/admin-smd/users/${selectedUserId}`);
          const detailData = await detailRes.json();
          if (detailData.user) {
            setDetailUser(detailData.user);
            setAuditHistory(detailData.auditHistory ?? []);
          }
        }
        loadData();
      }
    } catch {
      // ignore
    } finally {
      setConfirmState(s => ({ ...s, open: false }));
    }
  }

  return (
    <div className="space-y-4">
      {/* ── En-tête ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Gestion des utilisateurs</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {total} utilisateur{total > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Icon name="refresh" className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          {canCreate && (
            <button
              onClick={() => { setEditingUser(null); setFormOpen(true); }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Icon name="user" className="h-4 w-4" />
              <span className="hidden sm:inline">Ajouter un utilisateur</span>
              <span className="sm:hidden">Ajouter</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Statistiques ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        <StatMini label="Total" value={stats.total} icon="users" color="text-blue-600" />
        <StatMini label="Actifs" value={stats.actifs} icon="check-circle" color="text-green-600" />
        <StatMini label="En attente" value={stats.enAttente} icon="clock" color="text-amber-600" />
        <StatMini label="Suspendus" value={stats.suspendus} icon="lock" color="text-red-600" />
        <StatMini label="Nouveaux (7j)" value={stats.nouveaux} icon="activity" color="text-brand-600" />
      </div>

      {/* ── Recherche & Filtres ── */}
      <div className="space-y-3">
        <div className="relative">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone, établissement..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={selectClass}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={selectClass}>
            {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)} className={selectClass}>
            {SCOPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {(statusFilter || roleFilter || scopeFilter) && (
            <button
              onClick={() => { setStatusFilter(''); setRoleFilter(''); setScopeFilter(''); }}
              className="rounded-xl px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* ── Liste des utilisateurs ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icon name="users" className="h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm text-slate-400">Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-soft md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Utilisateur</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Périmètre</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Créé le</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const badge = STATUS_BADGE[u.userStatus] ?? STATUS_BADGE.EN_ATTENTE;
                  return (
                    <tr key={u.id} className="cursor-pointer transition hover:bg-blue-50/30" onClick={() => setSelectedUserId(u.id)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar photoUrl={u.profilePhotoUrl} prenom={u.prenom} nom={u.nom} size="sm" loading="lazy" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {u.prenom} {u.nom} {u.postNom}
                            </p>
                            <p className="truncate text-xs text-slate-400">{u.id.slice(0, 12)}…</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">{ROLE_LABELS[u.role] ?? u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">{getScopeLabel(u)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="truncate text-sm text-slate-600">{u.email}</p>
                        {u.telephone && <p className="text-xs text-slate-400">{u.telephone}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.class}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-500">{formatDate(u.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedUserId(u.id); }}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-blue-600"
                        >
                          <Icon name="chevron-right" className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2.5 md:hidden">
            {users.map((u) => {
              const badge = STATUS_BADGE[u.userStatus] ?? STATUS_BADGE.EN_ATTENTE;
              return (
                <div
                  key={u.id}
                  className="cursor-pointer rounded-2xl bg-white p-3.5 shadow-soft transition active:scale-[0.99]"
                  onClick={() => setSelectedUserId(u.id)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar photoUrl={u.profilePhotoUrl} prenom={u.prenom} nom={u.nom} size="md" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {u.prenom} {u.nom}
                        </p>
                        <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.class}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{ROLE_LABELS[u.role] ?? u.role}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{getScopeLabel(u)}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="truncate text-xs text-slate-400">{u.email}</span>
                        <span className="ml-auto text-xs text-slate-300">{formatDate(u.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} sur {total}</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Précédent
              </button>
              <span className="px-2 text-sm font-medium text-slate-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Panneau de détail ── */}
      <UserDetailPanel
        open={!!selectedUserId}
        user={detailUser}
        auditHistory={auditHistory}
        loading={detailLoading}
        currentRole={currentRole}
        onClose={() => setSelectedUserId(null)}
        onEdit={() => {
          if (detailUser) {
            setEditingUser(detailUser);
            setSelectedUserId(null);
            setFormOpen(true);
          }
        }}
        onAction={handleAction}
      />

      {/* ── Modal formulaire ── */}
      <UserFormModal
        open={formOpen}
        editingUser={editingUser}
        onClose={() => { setFormOpen(false); setEditingUser(null); }}
        onSubmit={handleFormSubmit}
      />

      {/* ── Dialogue de confirmation ── */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        danger={confirmState.danger}
        onConfirm={executeAction}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
      />
    </div>
  );
}

function StatMini({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-soft">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 ${color}`}>
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight text-slate-900">{value}</p>
        <p className="truncate text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}
