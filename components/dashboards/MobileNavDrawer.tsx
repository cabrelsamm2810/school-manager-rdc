'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import type { NavGroup } from '@/lib/navigation';
import { ROLE_LABELS, hasAtLeastRole } from '@/lib/rbac';
import { Icon } from '@/components/ui/Icon';
import { Avatar } from '@/components/ui/Avatar';
import type { SessionUser } from '@/lib/use-session-user';

/**
 * Rôle minimal attendu par les API `/api/eleves` et `/api/enseignants`.
 * La recherche du menu ne propose donc que ce que le rôle peut déjà consulter.
 */
const SCHOOL_SEARCH_MIN_ROLE = 'DIRECTION_ECOLE';

/** Nombre de résultats affichés par catégorie dans le menu. */
const RESULTS_PER_CATEGORY = 4;

type EleveResult = {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  classe: string;
  etablissement?: { nom: string } | null;
};

type EnseignantResult = {
  id: string;
  nom: string;
  matricule: string;
  grade?: string;
  etablissement?: string;
  specialite?: string;
};

/** Ignore la casse et les accents : « eleve » retrouve « Élèves ». */
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** Assemble les informations secondaires d'un résultat (« matricule · classe · école »). */
function details(parts: (string | undefined | null)[]) {
  return parts.filter((part) => !!part && part !== '').join(' · ');
}

/**
 * Menu latéral mobile (drawer sombre).
 *
 * Présentation uniquement : les groupes et les droits viennent toujours de
 * `visibleNavigationGroups`, et les liens pointent sur les routes existantes.
 * La recherche filtre le menu, puis interroge les modules Élèves et Enseignants
 * par leurs API existantes (mêmes contrôles de rôle que ces modules).
 */
export function MobileNavDrawer({
  open,
  groups,
  pathname,
  user,
  onClose,
  onLogout
}: {
  open: boolean;
  groups: NavGroup[];
  pathname: string;
  user: SessionUser | null;
  onClose: () => void;
  onLogout: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ eleves: EleveResult[]; enseignants: EnseignantResult[] }>({
    eleves: [],
    enseignants: []
  });
  const [searching, setSearching] = useState(false);

  const trimmed = query.trim();
  const canSearchSchool = !!user && hasAtLeastRole(user.role, SCHOOL_SEARCH_MIN_ROLE);

  // Recherche remise à zéro à la fermeture : le menu se rouvre toujours complet
  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults({ eleves: [], enseignants: [] });
      setSearching(false);
    }
  }, [open]);

  // Recherche des élèves et des enseignants (mêmes API et mêmes droits que les modules)
  useEffect(() => {
    if (!canSearchSchool || trimmed.length < 2) {
      setResults({ eleves: [], enseignants: [] });
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = `search=${encodeURIComponent(trimmed)}`;
        const [elevesRes, enseignantsRes] = await Promise.all([
          fetch(`/api/eleves?${params}`, { signal: controller.signal }),
          fetch(`/api/enseignants?${params}`, { signal: controller.signal })
        ]);
        const elevesJson = elevesRes.ok ? await elevesRes.json() : null;
        const enseignantsJson = enseignantsRes.ok ? await enseignantsRes.json() : null;
        setResults({
          eleves: (elevesJson?.eleves ?? []).slice(0, RESULTS_PER_CATEGORY),
          enseignants: (enseignantsJson?.enseignants ?? []).slice(0, RESULTS_PER_CATEGORY)
        });
      } catch {
        // Requête annulée (frappe suivante) ou réseau indisponible : aucun résultat
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, canSearchSchool]);

  const filteredGroups = useMemo(() => {
    const q = normalize(trimmed);
    if (!q) return groups;
    return groups
      .map((group) => ({ ...group, items: group.items.filter((item) => normalize(item.label).includes(q)) }))
      .filter((group) => group.items.length > 0);
  }, [groups, trimmed]);

  const resultCount = results.eleves.length + results.enseignants.length;

  return (
    <>
      {/* Fond assombri */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-slate-950/60 transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Tiroir */}
      <aside
        className={clsx(
          'fixed left-0 top-0 z-50 flex h-full w-[85vw] max-w-[20rem] flex-col overflow-hidden bg-[#0c1421] shadow-2xl transition-transform duration-300 ease-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Navigation principale"
      >
        {/* Marque + fermeture */}
        <div className="flex shrink-0 items-center gap-2.5 px-3.5 pb-3 pt-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#5346f5]">
            <Icon name="teacher" className="h-[18px] w-[18px] text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold leading-tight text-white">School Manager</p>
            <p className="truncate text-[11px] leading-tight text-[#7d8798]">RDC · Gestion scolaire</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#a0a0a0] transition hover:bg-white/10 hover:text-white"
            aria-label="Fermer le menu"
          >
            <Icon name="close" className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Recherche : menu, élèves et enseignants */}
        <div className="shrink-0 px-3.5 pb-2.5">
          <div className="flex items-center gap-2 rounded-xl bg-[#162030] px-3 py-2.5">
            <Icon name="search" className="h-4 w-4 shrink-0 text-[#6e7a8f]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={canSearchSchool ? 'Rechercher élève, enseignant…' : 'Rechercher dans le menu'}
              aria-label={canSearchSchool ? 'Rechercher un élève, un enseignant ou un module' : 'Rechercher dans le menu'}
              className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-[#6e7a8f]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="shrink-0 text-[#6e7a8f] transition hover:text-white"
                aria-label="Effacer la recherche"
              >
                <Icon name="close" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-3" aria-label="Navigation principale">
          {/* Résultats : élèves */}
          {results.eleves.length > 0 && (
            <section className="mb-4">
              <h2 className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6e7a8f]">
                Élèves
              </h2>
              <ul className="space-y-1">
                {results.eleves.map((eleve) => (
                  <li key={eleve.id}>
                    <Link
                      href={`/recherche-eleves?search=${encodeURIComponent(`${eleve.nom} ${eleve.prenom}`)}`}
                      onClick={onClose}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition hover:bg-white/5"
                    >
                      <Icon name="users" className="h-[18px] w-[18px] shrink-0 text-[#7d8798]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-white">
                          {eleve.nom} {eleve.prenom}
                        </span>
                        <span className="block truncate text-[11px] text-[#8b94a6]">
                          {details([eleve.matricule, eleve.classe, eleve.etablissement?.nom])}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Résultats : enseignants */}
          {results.enseignants.length > 0 && (
            <section className="mb-4">
              <h2 className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6e7a8f]">
                Enseignants
              </h2>
              <ul className="space-y-1">
                {results.enseignants.map((enseignant) => (
                  <li key={enseignant.id}>
                    <Link
                      href="/enseignants"
                      onClick={onClose}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition hover:bg-white/5"
                    >
                      <Icon name="teacher" className="h-[18px] w-[18px] shrink-0 text-[#7d8798]" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-white">{enseignant.nom}</span>
                        <span className="block truncate text-[11px] text-[#8b94a6]">
                          {details([enseignant.matricule, enseignant.grade, enseignant.etablissement])}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* État de la recherche */}
          {canSearchSchool && trimmed.length >= 2 && searching && (
            <p className="px-2.5 pb-3 text-[12px] text-[#6e7a8f]">Recherche…</p>
          )}
          {canSearchSchool && trimmed.length >= 2 && !searching && resultCount === 0 && (
            <p className="px-2.5 pb-3 text-[12px] text-[#6e7a8f]">
              Aucun élève ni enseignant ne correspond à « {trimmed} ».
            </p>
          )}

          {/* Menu filtré */}
          {filteredGroups.map((group) => (
            <section key={group.title} className="mb-4 last:mb-0">
              <h2 className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6e7a8f]">
                {group.title}
              </h2>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={clsx(
                          'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition',
                          active
                            ? 'bg-[#5346f5] text-white shadow-lg shadow-[#5346f5]/25'
                            : 'text-[#a0a0a0] hover:bg-white/5 hover:text-white'
                        )}
                      >
                        <Icon
                          name={item.icon}
                          className={clsx('h-[18px] w-[18px] shrink-0', active ? 'text-white' : 'text-[#7d8798]')}
                        />
                        <span className="min-w-0 truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {filteredGroups.length === 0 && resultCount === 0 && (
            <p className="px-2.5 py-8 text-center text-[13px] text-[#6e7a8f]">Aucun élément ne correspond.</p>
          )}
        </nav>

        {/* Profil + déconnexion */}
        {user && (
          <div className="shrink-0 border-t border-white/10 px-3.5 py-3">
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                onClick={onClose}
                className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-1 transition hover:opacity-90"
              >
                <Avatar
                  photoUrl={user.profilePhotoUrl}
                  prenom={user.prenom}
                  nom={user.nom}
                  size="sm"
                  className="ring-2 ring-white/15"
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold leading-tight text-white">
                    {user.prenom} {user.nom}
                  </p>
                  <p className="truncate text-[11px] leading-tight text-[#8b94a6]">
                    {ROLE_LABELS[user.role] ?? user.role}
                  </p>
                </div>
              </Link>
              <button
                onClick={onLogout}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-[12px] font-semibold text-[#ff9b9b] transition hover:bg-red-500/10"
                aria-label="Déconnexion"
              >
                <Icon name="logout" className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
