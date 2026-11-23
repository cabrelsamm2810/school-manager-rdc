'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';

export type EcolesDirectoryRow = {
  id: string;
  nom: string;
  type: string;
  institution: string;
  province: string;
  commune: string;
  statutValidation: string;
  effectif: number;
  _count: { eleves: number; enseignants: number };
};

export type EleveDirectoryRow = {
  id: string;
  matricule: string;
  nom: string;
  postNom: string;
  prenom: string;
  sexe: string;
  classe: string;
  ecole: { nom: string; province: string } | null;
};

export type EnseignantDirectoryRow = {
  id: string;
  nom: string;
  matricule: string;
  grade: string;
  specialite: string;
  statut: string;
  ecole: string;
  ecoleRattachee: { nom: string; province: string } | null;
};

type ReseauData = {
  stats: { ecoles: number; eleves: number; enseignants: number };
  ecoles: EcolesDirectoryRow[];
  eleves: EleveDirectoryRow[];
  enseignants: EnseignantDirectoryRow[];
};

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] outline-none transition focus:border-brand-500';

const fmt = (n: number) => n.toLocaleString('fr-FR');

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full sm:max-w-sm">
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pl-9`}
      />
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
      <p className="text-[13px] font-medium text-slate-600">{title}</p>
      <p className="mt-1 text-[11.5px] text-slate-400">{hint}</p>
    </div>
  );
}

function ResultCount({ shown, label }: { shown: number; label: string }) {
  return <p className="text-[11.5px] text-slate-400">{fmt(shown)} {label} affiché(s)</p>;
}

const thClass = 'px-4 py-3 font-semibold';
const thNumClass = 'px-4 py-3 text-right font-semibold';
const tdClass = 'px-4 py-2.5 text-slate-600';
const tdNumClass = 'px-4 py-2.5 text-right tabular-nums text-slate-600';

/** Liste nationale des écoles du réseau. */
export function EcolesTable({ ecoles }: { ecoles: EcolesDirectoryRow[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ecoles;
    return ecoles.filter((e) =>
      [e.nom, e.province, e.commune, e.type, e.institution].join(' ').toLowerCase().includes(term),
    );
  }, [ecoles, search]);

  return (
    <div className="space-y-3">
      <SearchField value={search} onChange={setSearch} placeholder="Rechercher une école…" />

      {filtered.length === 0 ? (
        <EmptyState
          title={ecoles.length === 0 ? 'Aucune école enregistrée.' : 'Aucune école ne correspond à la recherche.'}
          hint={ecoles.length === 0 ? 'Les écoles validées du réseau apparaîtront ici.' : 'Affinez le nom, la province ou la commune.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[780px] text-left text-[13px]">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className={thClass}>École</th>
                <th className={thClass}>Province</th>
                <th className={thClass}>Commune</th>
                <th className={thClass}>Type</th>
                <th className={thNumClass}>Élèves</th>
                <th className={thNumClass}>Enseignants</th>
                <th className={thClass}>Validation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{e.nom}</td>
                  <td className={tdClass}>{e.province || '—'}</td>
                  <td className={tdClass}>{e.commune || '—'}</td>
                  <td className={tdClass}>{e.type || '—'}</td>
                  <td className={tdNumClass}>{fmt(e._count.eleves)}</td>
                  <td className={tdNumClass}>{fmt(e._count.enseignants)}</td>
                  <td className="px-4 py-2.5">
                    <Badge color={e.statutValidation === 'Validée' ? 'green' : 'amber'}>{e.statutValidation || '—'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && <ResultCount shown={filtered.length} label="école(s)" />}
    </div>
  );
}

/** Liste nationale des élèves de toutes les écoles. */
export function ElevesTable({ eleves }: { eleves: EleveDirectoryRow[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return eleves;
    return eleves.filter((e) =>
      [e.nom, e.postNom, e.prenom, e.matricule, e.classe, e.ecole?.nom ?? '']
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [eleves, search]);

  return (
    <div className="space-y-3">
      <SearchField value={search} onChange={setSearch} placeholder="Rechercher un élève…" />

      {filtered.length === 0 ? (
        <EmptyState
          title={eleves.length === 0 ? 'Aucun élève enregistré.' : 'Aucun élève ne correspond à la recherche.'}
          hint={eleves.length === 0 ? 'Les élèves inscrits dans les écoles du réseau apparaîtront ici.' : 'Affinez le nom, le matricule ou la classe.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className={thClass}>Élève</th>
                <th className={thClass}>Matricule</th>
                <th className={thClass}>Classe</th>
                <th className={thClass}>École</th>
                <th className={thClass}>Province</th>
                <th className={thClass}>Sexe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {`${e.nom} ${e.postNom} ${e.prenom}`.replace(/\s+/g, ' ').trim()}
                  </td>
                  <td className={tdClass}>{e.matricule}</td>
                  <td className={tdClass}>{e.classe || '—'}</td>
                  <td className={tdClass}>{e.ecole?.nom || '—'}</td>
                  <td className={tdClass}>{e.ecole?.province || '—'}</td>
                  <td className={tdClass}>{e.sexe || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && <ResultCount shown={filtered.length} label="élève(s)" />}
    </div>
  );
}

/** Liste nationale des enseignants de toutes les écoles. */
export function EnseignantsTable({ enseignants }: { enseignants: EnseignantDirectoryRow[] }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return enseignants;
    return enseignants.filter((e) =>
      [e.nom, e.matricule, e.grade, e.specialite, e.ecole, e.ecoleRattachee?.nom ?? '']
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [enseignants, search]);

  return (
    <div className="space-y-3">
      <SearchField value={search} onChange={setSearch} placeholder="Rechercher un enseignant…" />

      {filtered.length === 0 ? (
        <EmptyState
          title={enseignants.length === 0 ? 'Aucun enseignant enregistré.' : 'Aucun enseignant ne correspond à la recherche.'}
          hint={enseignants.length === 0 ? 'Les enseignants du réseau apparaîtront ici.' : 'Affinez le nom, le matricule ou l’école.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[780px] text-left text-[13px]">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className={thClass}>Enseignant</th>
                <th className={thClass}>Matricule</th>
                <th className={thClass}>Grade</th>
                <th className={thClass}>Spécialité</th>
                <th className={thClass}>École</th>
                <th className={thClass}>Province</th>
                <th className={thClass}>Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{e.nom}</td>
                  <td className={tdClass}>{e.matricule}</td>
                  <td className={tdClass}>{e.grade || '—'}</td>
                  <td className={tdClass}>{e.specialite || '—'}</td>
                  <td className={tdClass}>{e.ecoleRattachee?.nom || e.ecole || '—'}</td>
                  <td className={tdClass}>{e.ecoleRattachee?.province || '—'}</td>
                  <td className="px-4 py-2.5">
                    <Badge color={e.statut === 'Actif' ? 'green' : 'slate'}>{e.statut || '—'}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && <ResultCount shown={filtered.length} label="enseignant(s)" />}
    </div>
  );
}

const TABS = [
  { key: 'ecoles', label: 'Écoles', icon: 'school' },
  { key: 'eleves', label: 'Élèves', icon: 'users' },
  { key: 'enseignants', label: 'Enseignants', icon: 'teacher' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

/** Réseau scolaire national : toutes les écoles, tous les élèves, tous les enseignants. */
export function NetworkDirectory() {
  const [data, setData] = useState<ReseauData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<TabKey>('ecoles');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('/api/coordination-nationale/reseau');
      if (!response.ok) throw new Error('reseau');
      setData((await response.json()) as ReseauData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="py-8 text-center text-sm text-slate-500">Chargement du réseau scolaire…</p>;

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-700">Impossible de charger le réseau scolaire.</p>
        <button onClick={load} className="mt-3 rounded-full bg-rose-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-rose-700">
          Réessayer
        </button>
      </div>
    );
  }

  const counts: Record<TabKey, number> = {
    ecoles: data.stats.ecoles,
    eleves: data.stats.eleves,
    enseignants: data.stats.enseignants,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-xl font-bold tabular-nums text-brand-700">{fmt(data.stats.ecoles)}</p>
          <p className="text-[11.5px] font-medium text-slate-500">Écoles</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-xl font-bold tabular-nums text-brand-700">{fmt(data.stats.eleves)}</p>
          <p className="text-[11.5px] font-medium text-slate-500">Élèves</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <p className="text-xl font-bold tabular-nums text-brand-700">{fmt(data.stats.enseignants)}</p>
          <p className="text-[11.5px] font-medium text-slate-500">Enseignants</p>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
        {TABS.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${
              tab === item.key ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
            }`}
          >
            <Icon name={item.icon} className="h-3.5 w-3.5" />
            {item.label}
            <span className={tab === item.key ? 'text-white/80' : 'text-slate-400'}>{fmt(counts[item.key])}</span>
          </button>
        ))}
      </div>

      {tab === 'ecoles' && <EcolesTable ecoles={data.ecoles} />}
      {tab === 'eleves' && <ElevesTable eleves={data.eleves} />}
      {tab === 'enseignants' && <EnseignantsTable enseignants={data.enseignants} />}
    </div>
  );
}
