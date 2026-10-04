'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { Icon } from '@/components/ui/Icon';
import { ROLE_LABELS, ROLE_RANK } from '@/lib/rbac';
import { navigationGroups, type NavItem } from '@/lib/navigation';

type SessionUser = {
  id: string;
  nom: string;
  postNom?: string | null;
  prenom: string;
  email: string;
  role: string;
  profilePhotoUrl?: string | null;
};

/** Raccourcis affichés sur le dashboard, filtrés par rôle. */
function getQuickActions(role: string): { label: string; href: string; icon: string; desc: string }[] {
  const allItems = navigationGroups.flatMap((g) => g.items);
  const visible = allItems.filter(
    (item) => !item.minRole || (ROLE_RANK[role] ?? 0) >= (ROLE_RANK[item.minRole] ?? 0)
  );
  // Prend les 6 premiers modules pertinents (hors dashboard lui-même)
  return visible
    .filter((item) => item.href !== '/dashboard')
    .slice(0, 6)
    .map((item) => ({
      label: item.label,
      href: item.href,
      icon: item.icon,
      desc: getShortcutDesc(item.href),
    }));
}

function getShortcutDesc(href: string): string {
  const descs: Record<string, string> = {
    '/etablissements': 'Écoles et infrastructures',
    '/eleves': 'Inscriptions et dossiers',
    '/enseignants': 'Corps enseignant',
    '/cahier-de-notes': 'Cotes et évaluations',
    '/carte-scolaire': 'Zones et secteurs',
    '/recherche-eleves': 'Rechercher un élève',
    '/photo-passeport': 'Photos officielles',
    '/cartes-qr': 'Cartes numériques QR',
    '/provinces': 'Découpage territorial',
    '/ec-erc': 'Établissements EC-ERC',
    '/coordination-nationale': 'Pilotage national',
    '/coordination-provinciale': 'Bureaux provinciaux',
    '/coordination-sous-provinciale': 'Sous-divisions',
    '/admin/users': 'Comptes et accès',
    '/bureaux-fonctions': 'Bureaux et grades',
    '/grades': 'Échelons et grades',
    '/dossiers': 'Dossiers administratifs',
    '/visites': 'Visites numériques',
    '/services': 'Services administratifs',
    '/admin': 'Configuration système',
    '/notifications': 'Alertes et messages',
    '/schoolchat': 'Messagerie interne',
    '/paiements': 'Paiements et premium',
    '/geolocalisation': 'Localisation écoles',
    '/parametres': 'Réglages du compte',
    '/enseignant/dashboard': 'Classes et présence',
  };
  return descs[href] ?? 'Module School Manager RDC';
}

export default function DashboardPage() {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.authenticated) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const quickActions = user ? getQuickActions(user.role) : [];
  const roleLabel = user ? ROLE_LABELS[user.role] ?? user.role : '';

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          {/* ── En-tête de bienvenue ── */}
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Tableau de bord</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">
              {user ? `Bienvenue, ${user.prenom}` : 'Vue d\u2019ensemble'}
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {user
                ? `${roleLabel} — Synthèse de l'activité scolaire.`
                : 'Synthèse de l\u2019activité scolaire — élèves, enseignants, établissements et documents.'}
            </p>
          </div>

          {/* ── Cartes statistiques ── */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Élèves', value: '2 640', hint: 'Inscrits cette année', icon: 'users', color: 'blue' },
              { label: 'Enseignants', value: '184', hint: 'Actifs', icon: 'teacher', color: 'emerald' },
              { label: 'Classes', value: '48', hint: 'Tous niveaux', icon: 'school', color: 'amber' },
              { label: 'Documents', value: '1 289', hint: 'Dossiers numériques', icon: 'folder', color: 'violet' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="dash-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:shadow-md"
                style={{ animationDelay: `${0.06 * i}s` }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon name={stat.icon} className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                {stat.hint && <p className="mt-1 text-xs text-slate-400">{stat.hint}</p>}
              </div>
            ))}
          </div>

          {/* ── Raccourcis ── */}
          {quickActions.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Accès rapides</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {quickActions.map((action, i) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="dash-card group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:border-blue-300 hover:shadow-md active:scale-[0.98]"
                    style={{ animationDelay: `${0.04 * i}s` }}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition duration-300 group-hover:bg-blue-100 group-hover:scale-105">
                      <Icon name={action.icon} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{action.label}</p>
                      <p className="truncate text-xs text-slate-400">{action.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Activité récente + QR ── */}
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {/* Activité récente */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Activité récente</h2>
              <ul className="mt-4 space-y-3">
                {[
                  'Nouvelle inscription — École Lumumba',
                  'Cahier de notes mis à jour — 6e année',
                  'Visite numérique planifiée — Kongo-Central',
                  'Carte scolaire générée — 12 élèves',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Modules QR */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Modules numériques QR</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { label: 'Carte scolaire', href: '/cartes-qr', icon: 'qr', desc: 'QR' },
                  { label: 'Présence', href: '/carte-scolaire', icon: 'qr', desc: 'QR' },
                  { label: 'Bulletin', href: '/cahier-de-notes', icon: 'qr', desc: 'QR' },
                ].map((qr) => (
                  <Link
                    key={qr.label}
                    href={qr.href}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 text-center transition duration-300 hover:border-blue-300 hover:bg-blue-50/40 active:scale-[0.97]"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:scale-105">
                      <Icon name={qr.icon} className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">{qr.label}</p>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                      {qr.desc}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
