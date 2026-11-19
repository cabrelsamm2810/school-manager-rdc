'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';

type CoordProvinciale = {
  id: string;
  province: string;
  institution: string;
  bureaux: number;
  agents: number;
  dossiers: number;
  statut: string;
  ecoles: number;
  eleves: number;
  coordinateurs: number;
};

type CoordSousProvinciale = {
  id: string;
  nom: string;
  province: string;
  institution: string;
  bureaux: number;
  agents: number;
  statut: string;
  provinceParente: string;
  ecoles: number;
  eleves: number;
  coordinateurs: number;
};

type EcoleRow = {
  id: string;
  nom: string;
  type: string;
  province: string;
  commune: string;
  statutValidation: string;
  effectif: number;
};

type Activite = {
  id: string;
  action: string;
  module: string;
  userName: string;
  result: string;
  details: string;
  createdAt: string;
};

type SupervisionData = {
  coordinationsProvinciales: CoordProvinciale[];
  coordinationsSousProvinciales: CoordSousProvinciale[];
  ecoles: EcoleRow[];
  activites: Activite[];
};

const TABS = [
  { key: 'provinciales', label: 'Coord. provinciales' },
  { key: 'sous', label: 'Sous-coordinations' },
  { key: 'ecoles', label: 'Établissements' },
  { key: 'activites', label: 'Activités nationales' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] outline-none transition focus:border-brand-500';

const fmt = (n: number) => n.toLocaleString('fr-FR');

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatutCell({ statut }: { statut: string }) {
  return <Badge color={statut === 'Actif' ? 'green' : 'slate'}>{statut || '—'}</Badge>;
}

/** Supervision des coordinations et consultation des établissements. */
export function SupervisionPanel() {
  const [data, setData] = useState<SupervisionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<TabKey>('provinciales');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('/api/coordination-nationale/supervision');
      if (!response.ok) throw new Error('supervision');
      setData((await response.json()) as SupervisionData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredEcoles = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    if (!term) return data.ecoles;
    return data.ecoles.filter((e) =>
      [e.nom, e.province, e.commune, e.type].join(' ').toLowerCase().includes(term),
    );
  }, [data, search]);

  if (loading) return <p className="py-8 text-center text-sm text-slate-500">Chargement de la supervision…</p>;

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-700">Impossible de charger les données de supervision.</p>
        <button onClick={load} className="mt-3 rounded-full bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-rose-700">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-xl font-bold tabular-nums text-brand-700">{fmt(data.coordinationsProvinciales.length)}</p>
          <p className="text-[11.5px] font-medium text-slate-500">Coord. provinciales</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-xl font-bold tabular-nums text-brand-700">{fmt(data.coordinationsSousProvinciales.length)}</p>
          <p className="text-[11.5px] font-medium text-slate-500">Coord. sous-provinciales</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-xl font-bold tabular-nums text-brand-700">{fmt(data.ecoles.length)}</p>
          <p className="text-[11.5px] font-medium text-slate-500">Établissements consultables</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-xl font-bold tabular-nums text-brand-700">{fmt(data.activites.length)}</p>
          <p className="text-[11.5px] font-medium text-slate-500">Activités récentes</p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${
              tab === item.key ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'provinciales' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Province</th>
                <th className="px-4 py-3 text-right font-semibold">Coordinateurs</th>
                <th className="px-4 py-3 text-right font-semibold">Écoles</th>
                <th className="px-4 py-3 text-right font-semibold">Élèves</th>
                <th className="px-4 py-3 text-right font-semibold">Bureaux</th>
                <th className="px-4 py-3 text-right font-semibold">Agents</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.coordinationsProvinciales.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{c.province}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{fmt(c.coordinateurs)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{fmt(c.ecoles)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{fmt(c.eleves)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{fmt(c.bureaux)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{fmt(c.agents)}</td>
                  <td className="px-4 py-2.5"><StatutCell statut={c.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'sous' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Sous-coordination</th>
                <th className="px-4 py-3 font-semibold">Province</th>
                <th className="px-4 py-3 font-semibold">Coord. provinciale</th>
                <th className="px-4 py-3 text-right font-semibold">Coordinateurs</th>
                <th className="px-4 py-3 text-right font-semibold">Écoles</th>
                <th className="px-4 py-3 text-right font-semibold">Élèves</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.coordinationsSousProvinciales.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{c.nom}</td>
                  <td className="px-4 py-2.5 text-slate-600">{c.province || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{c.provinceParente || '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{fmt(c.coordinateurs)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{fmt(c.ecoles)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{fmt(c.eleves)}</td>
                  <td className="px-4 py-2.5"><StatutCell statut={c.statut} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'ecoles' && (
        <div className="space-y-3">
          <div className="relative w-full sm:max-w-sm">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un établissement…"
              className={`${inputClass} pl-9`}
            />
          </div>

          {filteredEcoles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
              <p className="text-[13px] font-medium text-slate-600">Aucun établissement enregistré.</p>
              <p className="mt-1 text-[11.5px] text-slate-400">Les écoles validées apparaîtront ici.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[700px] text-left text-[13px]">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Établissement</th>
                    <th className="px-4 py-3 font-semibold">Province</th>
                    <th className="px-4 py-3 font-semibold">Commune</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 text-right font-semibold">Effectif</th>
                    <th className="px-4 py-3 font-semibold">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEcoles.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{e.nom}</td>
                      <td className="px-4 py-2.5 text-slate-600">{e.province || '—'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{e.commune || '—'}</td>
                      <td className="px-4 py-2.5 text-slate-600">{e.type || '—'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{fmt(e.effectif)}</td>
                      <td className="px-4 py-2.5"><Badge color={e.statutValidation === 'Validée' ? 'green' : 'amber'}>{e.statutValidation || '—'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'activites' && (
        <div className="rounded-2xl border border-slate-200 bg-white">
          {data.activites.length === 0 ? (
            <p className="px-4 py-10 text-center text-[13px] text-slate-500">Aucune activité enregistrée.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.activites.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${a.result === 'failure' ? 'bg-rose-500' : 'bg-brand-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-800">{a.action}</p>
                    <p className="text-[11.5px] text-slate-500">
                      {a.userName || 'Système'}{a.module ? ` · ${a.module}` : ''}{a.details ? ` · ${a.details}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10.5px] text-slate-400">{dateLabel(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
