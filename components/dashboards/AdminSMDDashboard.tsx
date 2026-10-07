'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useSessionUser } from '@/lib/use-session-user';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import { ROLE_LABELS } from '@/lib/rbac';

/* ──────────────────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────────────────── */

type AdminStats = {
  users: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    byRole: { role: string; count: number }[];
  };
  ecoles: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    byProvince: { province: string; count: number }[];
    byType: { type: string; count: number }[];
  };
  dossiers: {
    total: number;
    pending: number;
    processed: number;
    new: number;
    recent: {
      id: string; reference: string; objet: string;
      statut: string; demandeur: string; createdAt: string;
    }[];
  };
  signalements: { new: number; inProgress: number; resolved: number };
  serviceClient: {
    id: string; service: string; procedures: number;
    dossiers: number; statut: string;
  }[];
  notifications: {
    unread: number;
    recent: {
      id: string; titre: string; message: string;
      type: string; lu: boolean; createdAt: string;
    }[];
  };
  audit: {
    entries: {
      id: string; userName: string; userRole: string; action: string;
      module: string; result: string; createdAt: string;
    }[];
    total: number;
  };
  activities: {
    id: string; user: string; role: string; action: string;
    module: string; date: string; status: string;
  }[];
};

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function roleLabel(role: string): string {
  return ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role;
}

const STATUS_COLORS: Record<string, string> = {
  'En attente': 'bg-amber-100 text-amber-700',
  'Nouveau': 'bg-blue-100 text-blue-700',
  'Traité': 'bg-green-100 text-green-700',
  'Suspendu': 'bg-red-100 text-red-700',
  'Actif': 'bg-green-100 text-green-700',
  'success': 'text-green-600',
  'error': 'text-red-600',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', cls)}>
      {status}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Stat Card
 * ──────────────────────────────────────────────────────────────────────── */

function MiniStat({
  icon, label, value, color, hint,
}: {
  icon: string; label: string; value: number | string;
  color: string; hint?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', color)}>
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-500 truncate">{label}</p>
        <p className="text-lg font-bold text-slate-900 leading-tight">{value}</p>
        {hint && <p className="text-[10px] text-slate-400 truncate">{hint}</p>}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Section wrapper
 * ──────────────────────────────────────────────────────────────────────── */

function Section({
  title, icon, action, children, className,
}: {
  title: string; icon: string; action?: React.ReactNode;
  children: React.ReactNode; className?: string;
}) {
  return (
    <div className={clsx('rounded-2xl border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name={icon} className="h-4 w-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Skeleton
 * ──────────────────────────────────────────────────────────────────────── */

function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Main Dashboard
 * ──────────────────────────────────────────────────────────────────────── */

export function AdminSMDDashboard() {
  const user = useSessionUser();
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<null | {
    users: { id: string; nom: string; prenom: string; email: string; role: string }[];
    ecoles: { id: string; nom: string; province: string; type: string }[];
  }>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/admin-smd/stats');
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Recherche globale (lazy, uniquement quand ≥ 2 caractères)
  useEffect(() => {
    if (search.trim().length < 2) { setSearchResults(null); return; }
    const timer = setTimeout(async () => {
      try {
        const [usersRes, ecolesRes] = await Promise.all([
          fetch(`/api/users?search=${encodeURIComponent(search)}`).then((r) => r.ok ? r.json() : { users: [] }),
          fetch(`/api/ecoles?search=${encodeURIComponent(search)}`).then((r) => r.ok ? r.json() : { ecoles: [] }),
        ]);
        setSearchResults({
          users: (usersRes.users ?? []).slice(0, 5),
          ecoles: (ecolesRes.ecoles ?? []).slice(0, 5),
        });
      } catch { /* ignore */ }
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  if (loading) return <Skeleton />;
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Icon name="alert" className="h-10 w-10 text-red-400" />
        <p className="text-sm text-slate-600">Impossible de charger les statistiques.</p>
        <button onClick={load} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          Réessayer
        </button>
      </div>
    );
  }

  const maxRoleCount = Math.max(...data.users.byRole.map((r) => r.count), 1);
  const maxProvinceCount = Math.max(...data.ecoles.byProvince.map((p) => p.count), 1);

  return (
    <div className="space-y-4">
      {/* ── En-tête compact ── */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Icon name="shield" className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">Admin School Manager RDC</h1>
            <p className="text-xs text-blue-100">Tableau de bord administratif</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/schoolchat" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 transition hover:bg-white/25" title="SchoolChat">
            <Icon name="chat" className="h-4 w-4" />
          </Link>
          <Link href="/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 transition hover:bg-white/25" title="Notifications">
            <Icon name="bell" className="h-4 w-4" />
            {data.notifications.unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {data.notifications.unread > 99 ? '99+' : data.notifications.unread}
              </span>
            )}
          </Link>
          {user && (
            <Link href="/profile" className="flex items-center gap-2 rounded-lg bg-white/15 px-2 py-1.5 transition hover:bg-white/25">
              <Avatar photoUrl={user.profilePhotoUrl} prenom={user.prenom} nom={user.nom} size="xs" />
              <span className="hidden text-xs font-medium sm:inline">{user.prenom} {user.nom}</span>
            </Link>
          )}
          <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 transition hover:bg-white/25" title="Déconnexion">
            <Icon name="logout" className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ── Recherche globale ── */}
      <div className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <Icon name="search" className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur, un établissement…"
            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <Icon name="close" className="h-4 w-4" />
            </button>
          )}
        </div>
        {searchResults && (searchResults.users.length > 0 || searchResults.ecoles.length > 0) && (
          <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            {searchResults.users.length > 0 && (
              <div className="mb-2">
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Utilisateurs</p>
                {searchResults.users.map((u) => (
                  <Link key={u.id} href="/admin/users" className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                    <span className="font-medium text-slate-700">{u.prenom} {u.nom}</span>
                    <span className="text-xs text-slate-400">{roleLabel(u.role)}</span>
                  </Link>
                ))}
              </div>
            )}
            {searchResults.ecoles.length > 0 && (
              <div>
                <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Établissements</p>
                {searchResults.ecoles.map((e) => (
                  <Link key={e.id} href="/ecoles" className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50">
                    <span className="font-medium text-slate-700">{e.nom}</span>
                    <span className="text-xs text-slate-400">{e.province || '—'}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Cartes statistiques ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat icon="users" label="Total utilisateurs" value={data.users.total} color="bg-blue-50 text-blue-600" />
        <MiniStat icon="check-circle" label="Actifs" value={data.users.active} color="bg-green-50 text-green-600" />
        <MiniStat icon="clock" label="En attente" value={data.users.pending} color="bg-amber-50 text-amber-600" />
        <MiniStat icon="x-circle" label="Suspendus" value={data.users.suspended} color="bg-red-50 text-red-600" />
        <MiniStat icon="school" label="Établissements" value={data.ecoles.total} color="bg-indigo-50 text-indigo-600" />
        <MiniStat icon="check-circle" label="Écoles actives" value={data.ecoles.active} color="bg-green-50 text-green-600" />
        <MiniStat icon="folder" label="Dossiers en attente" value={data.dossiers.pending} color="bg-amber-50 text-amber-600" />
        <MiniStat icon="alert" label="Signalements" value={data.signalements.new} color="bg-red-50 text-red-600" hint="Nouveaux" />
      </div>

      {/* ── Ligne 1 : Utilisateurs par rôle + Établissements ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Utilisateurs par rôle */}
        <Section title="Utilisateurs par rôle" icon="people">
          <div className="space-y-1.5">
            {data.users.byRole.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">Aucun utilisateur</p>
            )}
            {data.users.byRole.map((r) => (
              <div key={r.role} className="flex items-center gap-2">
                <span className="w-32 shrink-0 truncate text-xs font-medium text-slate-600">{roleLabel(r.role)}</span>
                <div className="flex-1">
                  <div className="h-5 overflow-hidden rounded-md bg-slate-100">
                    <div
                      className="flex h-full items-center justify-end rounded-md bg-blue-500 px-1.5 text-[10px] font-bold text-white transition-all"
                      style={{ width: `${Math.max((r.count / maxRoleCount) * 100, 8)}%` }}
                    >
                      {r.count}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Établissements */}
        <Section
          title="Établissements"
          icon="school"
          action={<Link href="/ecoles" className="text-xs font-medium text-blue-600 hover:underline">Voir tout →</Link>}
        >
          <div className="mb-3 grid grid-cols-4 gap-2 text-center">
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-lg font-bold text-slate-900">{data.ecoles.total}</p>
              <p className="text-[10px] text-slate-500">Total</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2">
              <p className="text-lg font-bold text-green-700">{data.ecoles.active}</p>
              <p className="text-[10px] text-green-600">Actifs</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2">
              <p className="text-lg font-bold text-amber-700">{data.ecoles.pending}</p>
              <p className="text-[10px] text-amber-600">En attente</p>
            </div>
            <div className="rounded-lg bg-red-50 p-2">
              <p className="text-lg font-bold text-red-700">{data.ecoles.suspended}</p>
              <p className="text-[10px] text-red-600">Suspendus</p>
            </div>
          </div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Par province</p>
          <div className="space-y-1">
            {data.ecoles.byProvince.slice(0, 6).map((p) => (
              <div key={p.province} className="flex items-center gap-2">
                <span className="w-24 shrink-0 truncate text-xs text-slate-600">{p.province}</span>
                <div className="flex-1">
                  <div className="h-4 overflow-hidden rounded bg-slate-100">
                    <div
                      className="h-full rounded bg-indigo-500 transition-all"
                      style={{ width: `${Math.max((p.count / maxProvinceCount) * 100, 8)}%` }}
                    />
                  </div>
                </div>
                <span className="w-6 text-right text-xs font-bold text-slate-700">{p.count}</span>
              </div>
            ))}
            {data.ecoles.byProvince.length === 0 && (
              <p className="py-2 text-center text-xs text-slate-400">Aucune province renseignée</p>
            )}
          </div>
          {data.ecoles.byType.length > 0 && (
            <>
              <p className="mb-1 mt-3 text-[11px] font-bold uppercase tracking-wide text-slate-400">Par type</p>
              <div className="flex flex-wrap gap-1.5">
                {data.ecoles.byType.map((t) => (
                  <span key={t.type} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {t.type} · {t.count}
                  </span>
                ))}
              </div>
            </>
          )}
        </Section>
      </div>

      {/* ── Ligne 2 : Dossiers + Signalements ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Dossiers */}
        <Section
          title="Dossiers"
          icon="folder"
          action={<Link href="/dossiers" className="text-xs font-medium text-blue-600 hover:underline">Voir tous →</Link>}
        >
          <div className="mb-3 grid grid-cols-4 gap-2 text-center">
            <div className="rounded-lg bg-blue-50 p-2">
              <p className="text-base font-bold text-blue-700">{data.dossiers.new}</p>
              <p className="text-[10px] text-blue-600">Nouveaux</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2">
              <p className="text-base font-bold text-amber-700">{data.dossiers.pending}</p>
              <p className="text-[10px] text-amber-600">En attente</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2">
              <p className="text-base font-bold text-green-700">{data.dossiers.processed}</p>
              <p className="text-[10px] text-green-600">Traités</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <p className="text-base font-bold text-slate-700">{data.dossiers.total}</p>
              <p className="text-[10px] text-slate-500">Total</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {data.dossiers.recent.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-700">{d.objet}</p>
                  <p className="text-[10px] text-slate-400">{d.reference} · {formatDate(d.createdAt)}</p>
                </div>
                <StatusBadge status={d.statut} />
              </div>
            ))}
            {data.dossiers.recent.length === 0 && (
              <p className="py-2 text-center text-xs text-slate-400">Aucun dossier</p>
            )}
          </div>
        </Section>

        {/* Signalements */}
        <Section title="Signalements" icon="alert">
          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-red-50 p-2">
              <p className="text-base font-bold text-red-700">{data.signalements.new}</p>
              <p className="text-[10px] text-red-600">Nouveaux</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-2">
              <p className="text-base font-bold text-amber-700">{data.signalements.inProgress}</p>
              <p className="text-[10px] text-amber-600">En cours</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2">
              <p className="text-base font-bold text-green-700">{data.signalements.resolved}</p>
              <p className="text-[10px] text-green-600">Résolus</p>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <Icon name="check-circle" className="mx-auto mb-1 h-6 w-6 text-slate-300" />
            <p className="text-xs text-slate-500">
              {data.signalements.new + data.signalements.inProgress + data.signalements.resolved === 0
                ? 'Aucun signalement enregistré'
                : `${data.signalements.new + data.signalements.inProgress} signalement(s) à traiter`}
            </p>
          </div>
        </Section>
      </div>

      {/* ── Ligne 3 : Activités récentes + Service client ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Activités récentes */}
        <Section title="Activités récentes" icon="activity">
          <div className="space-y-1.5">
            {data.activities.length === 0 && (
              <p className="py-4 text-center text-xs text-slate-400">Aucune activité enregistrée</p>
            )}
            {data.activities.map((a) => (
              <div key={a.id} className="flex items-start gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5">
                <div className={clsx('mt-1 h-2 w-2 shrink-0 rounded-full', a.status === 'success' ? 'bg-green-500' : 'bg-red-500')} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-700">
                    {a.user} <span className="text-slate-400">·</span> <span className="text-slate-500">{a.action}</span>
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {roleLabel(a.role)} · {a.module} · {formatDate(a.date)} à {formatTime(a.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Service client */}
        <Section title="Service client" icon="services">
          <div className="space-y-1.5">
            {data.serviceClient.length === 0 && (
              <p className="py-4 text-center text-xs text-slate-400">Aucune demande enregistrée</p>
            )}
            {data.serviceClient.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-2.5 py-1.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-700">{s.service}</p>
                  <p className="text-[10px] text-slate-400">{s.procedures} procédure(s) · {s.dossiers} dossier(s)</p>
                </div>
                <StatusBadge status={s.statut} />
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── Ligne 4 : Journal d'audit + Notifications ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Journal d'audit */}
        <Section
          title="Journal d'audit"
          icon="lock"
          action={<span className="text-[10px] text-slate-400">Lecture seule</span>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                  <th className="pb-1.5 pr-2 font-semibold">Utilisateur</th>
                  <th className="pb-1.5 pr-2 font-semibold">Action</th>
                  <th className="pb-1.5 pr-2 font-semibold">Module</th>
                  <th className="pb-1.5 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.audit.entries.length === 0 && (
                  <tr><td colSpan={4} className="py-4 text-center text-slate-400">Aucune entrée d'audit</td></tr>
                )}
                {data.audit.entries.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-1.5 pr-2">
                      <p className="font-medium text-slate-700">{e.userName || '—'}</p>
                      <p className="text-[10px] text-slate-400">{roleLabel(e.userRole)}</p>
                    </td>
                    <td className="py-1.5 pr-2">
                      <span className={clsx('font-medium', e.result === 'success' ? 'text-slate-700' : 'text-red-600')}>
                        {e.action}
                      </span>
                    </td>
                    <td className="py-1.5 pr-2 text-slate-500">{e.module || '—'}</td>
                    <td className="py-1.5 text-slate-500 whitespace-nowrap">
                      {formatDate(e.createdAt)}<br />
                      <span className="text-[10px] text-slate-400">{formatTime(e.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.audit.total > 0 && (
            <p className="mt-2 text-right text-[10px] text-slate-400">
              {data.audit.total} entrée(s) au total
            </p>
          )}
        </Section>

        {/* Notifications */}
        <Section
          title="Notifications"
          icon="bell"
          action={
            <Link href="/notifications" className="text-xs font-medium text-blue-600 hover:underline">
              Voir tout →
            </Link>
          }
        >
          <div className="space-y-1.5">
            {data.notifications.recent.length === 0 && (
              <p className="py-4 text-center text-xs text-slate-400">Aucune notification</p>
            )}
            {data.notifications.recent.slice(0, 6).map((n) => (
              <div
                key={n.id}
                className={clsx(
                  'flex items-start gap-2 rounded-lg border px-2.5 py-1.5',
                  n.lu ? 'border-slate-100 bg-white' : 'border-blue-100 bg-blue-50/40',
                )}
              >
                <div className={clsx('mt-1 h-2 w-2 shrink-0 rounded-full', n.lu ? 'bg-slate-300' : 'bg-blue-500')} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700">{n.titre}</p>
                  {n.message && <p className="truncate text-[10px] text-slate-400">{n.message}</p>}
                  <p className="text-[10px] text-slate-400">{formatDate(n.createdAt)} · {formatTime(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* ── Liens rapides ── */}
      <div className="flex flex-wrap gap-2 pb-2">
        {[
          { label: 'Utilisateurs', href: '/admin/users', icon: 'people' },
          { label: 'Établissements', href: '/ecoles', icon: 'school' },
          { label: 'Dossiers', href: '/dossiers', icon: 'folder' },
          { label: 'Notifications', href: '/notifications', icon: 'bell' },
          { label: 'SchoolChat', href: '/schoolchat', icon: 'chat' },
          { label: 'Mon profil', href: '/profile', icon: 'user' },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
          >
            <Icon name={l.icon} className="h-3.5 w-3.5 text-slate-500" />
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
