'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { PERM, ROLE_PERMISSIONS } from '@/lib/permissions';
import { ROLE_LABELS } from '@/lib/roles';

type AuditEntry = {
  id: string;
  userId: string;
  userRole: string;
  userName: string;
  action: string;
  module: string;
  resource: string;
  resourceId: string;
  result: string;
  details: string;
  ipAddress: string;
  createdAt: string;
};

const NATIONAL_PERMISSIONS = [
  { key: PERM.NATIONAL_DASHBOARD, label: 'Tableau de bord national' },
  { key: PERM.NATIONAL_STATS, label: 'Statistiques nationales' },
  { key: PERM.NATIONAL_REPORTS, label: 'Rapports nationaux' },
  { key: PERM.NATIONAL_SUPERVISION, label: 'Supervision des coordinations' },
  { key: PERM.NATIONAL_ACCOUNTS, label: 'Gestion des comptes provinciaux' },
  { key: PERM.NATIONAL_DOCUMENTS, label: 'Documents institutionnels' },
  { key: PERM.NATIONAL_AUDIT, label: 'Journal des opérations' },
];

const MATRIX_ROLES = [
  'COORDINATION_NATIONALE',
  'COORDINATION_PROVINCIALE',
  'COORDINATION_SOUS_PROVINCIALE',
  'ADMIN_SCHOOL_MANAGER_RDC',
  'SUPER_ADMIN',
];

const SECURITY_RULES = [
  { icon: 'lock', title: 'Accès national réservé', text: 'Seul le rôle « Coordination nationale » ouvre cet espace ; la vérification est faite sur la session serveur, jamais sur une valeur du navigateur.' },
  { icon: 'shield', title: 'Permissions par rôle', text: 'Deny by default : toute permission non explicitement accordée est refusée, et chaque route API contrôle le rôle avant toute lecture.' },
  { icon: 'clipboard', title: 'Historique des opérations', text: 'Créations de comptes, documents et suppressions sont journalisées avec l\u2019auteur, la date et l\u2019adresse IP.' },
  { icon: 'database', title: 'Protection des données', text: 'Aucune donnée existante n\u2019est supprimée ni modifiée par cet espace ; les écritures sont additives et tracées.' },
];

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] outline-none transition focus:border-brand-500';

function resultBadge(result: string) {
  if (result === 'success') return <Badge color="green">Succès</Badge>;
  if (result === 'denied') return <Badge color="amber">Refusé</Badge>;
  if (result === 'failure') return <Badge color="red">Échec</Badge>;
  return <Badge color="slate">{result || '—'}</Badge>;
}

function dateLabel(value: string) {
  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Sécurité : matrice des permissions nationales et journal des opérations. */
export function SecurityPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (actionFilter.trim()) params.set('action', actionFilter.trim());
      if (resultFilter) params.set('result', resultFilter);
      const response = await fetch(`/api/coordination-nationale/journal?${params.toString()}`);
      if (!response.ok) throw new Error('journal');
      const data = await response.json();
      setEntries(data.entries ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, resultFilter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {SECURITY_RULES.map((rule) => (
          <div key={rule.title} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Icon name={rule.icon} className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-slate-900">{rule.title}</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500">{rule.text}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-[15px] font-semibold text-slate-900">Permissions nationales par rôle</h2>
          <p className="mt-0.5 text-[11.5px] text-slate-400">Contrôle effectué côté serveur par `lib/permissions.ts`</p>
        </div>
        <table className="w-full min-w-[760px] text-left text-[12.5px]">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Permission</th>
              {MATRIX_ROLES.map((role) => (
                <th key={role} className="px-3 py-3 text-center font-semibold">{ROLE_LABELS[role] ?? role}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {NATIONAL_PERMISSIONS.map((permission) => (
              <tr key={permission.key} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium text-slate-700">{permission.label}</td>
                {MATRIX_ROLES.map((role) => {
                  const granted = (ROLE_PERMISSIONS[role] ?? []).includes(permission.key);
                  return (
                    <td key={role} className="px-3 py-2.5 text-center">
                      {granted ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600" title="Autorisé">
                          <Icon name="check" className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400" title="Refusé">
                          <Icon name="close" className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Journal des opérations</h2>
            <p className="mt-0.5 text-[11.5px] text-slate-400">{total.toLocaleString('fr-FR')} entrée(s) — lecture seule</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="search"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Filtrer par action…"
              className={`${inputClass} sm:w-56`}
            />
            <select value={resultFilter} onChange={(e) => setResultFilter(e.target.value)} className={`${inputClass} sm:w-40`}>
              <option value="">Tous les résultats</option>
              <option value="success">Succès</option>
              <option value="failure">Échec</option>
              <option value="denied">Refusé</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Chargement du journal…</p>
        ) : entries.length === 0 ? (
          <p className="py-10 text-center text-[13px] text-slate-500">Aucune opération journalisée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[12.5px]">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Utilisateur</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Module</th>
                  <th className="px-4 py-3 font-semibold">Détails</th>
                  <th className="px-4 py-3 font-semibold">Résultat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{dateLabel(entry.createdAt)}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-slate-800">{entry.userName || 'Système'}</p>
                      <p className="text-[10.5px] text-slate-400">{ROLE_LABELS[entry.userRole] || entry.userRole || '—'}</p>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-700">{entry.action}</td>
                    <td className="px-4 py-2.5 text-slate-600">{entry.module || '—'}</td>
                    <td className="max-w-[240px] truncate px-4 py-2.5 text-slate-500">{entry.details || '—'}</td>
                    <td className="px-4 py-2.5">{resultBadge(entry.result)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
