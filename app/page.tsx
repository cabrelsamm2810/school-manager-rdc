'use client';

import Link from 'next/link';
import { SplashScreen } from '@/components/SplashScreen';
import { Icon } from '@/components/ui/Icon';
import { CurriculumSection } from '@/components/CurriculumSection';
import { navigationGroups } from '@/lib/navigation';

const groupDescriptions: Record<string, string> = {
  'Tableau de bord': "Vue d'ensemble et statistiques de la plateforme.",
  'Gestion scolaire': 'Établissements, élèves, enseignants et outils pédagogiques.',
  'Organisation territoriale': 'Structures administratives provinciales et nationales.',
  'Administration': 'Utilisateurs, dossiers et services administratifs.',
  'Communication': 'Notifications et messagerie interne.',
  'Services': 'Paiements, géolocalisation et paramètres système.',
};

export default function HomePage() {
  return (
    <>
      <SplashScreen />
      <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
        {/* Background */}
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: 'url(/school-background.svg)' }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950/90" />

        {/* Nav bar */}
        <nav className="relative z-10 flex items-center justify-between px-3 py-4 md:px-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white shadow-md md:h-12 md:w-12">
              <img src="/logo.png" alt="School Manager RDC" className="h-full w-full object-contain" />
            </div>
            <span className="nav-brand hidden text-sm font-bold tracking-wide md:inline md:text-base">School Manager RDC</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3">
            <Link
              href="/login"
              className="home-btn-primary px-4 py-2 text-xs md:px-6 md:py-2.5 md:text-sm"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="home-btn-secondary px-4 py-2 text-xs md:px-6 md:py-2.5 md:text-sm"
            >
              Créer un compte
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="relative z-10 flex flex-col items-center px-5 pt-10 pb-8 text-center md:pt-16 md:pb-12">
          <div className="hero-logo mb-7 overflow-hidden rounded-3xl bg-white p-2 shadow-2xl ring-1 ring-white/20">
            <img src="/logo.png" alt="School Manager RDC" className="h-24 w-24 object-contain md:h-36 md:w-36" />
          </div>
          <h1 className="hero-title text-4xl font-extrabold leading-tight tracking-tight md:text-6xl md:tracking-tighter">
            <span className="hero-name">School Manager</span>{' '}
            <span className="hero-name-rdc">RDC</span>
          </h1>
          <p className="hero-tagline mt-5 max-w-xs text-base font-medium leading-relaxed text-slate-100 md:max-w-md md:text-xl">
            La plateforme numérique pour une gestion scolaire moderne en RDC.
          </p>
          <p className="hero-desc mt-2.5 max-w-xs text-xs leading-relaxed text-slate-400 md:max-w-lg md:text-sm">
            Centralisez la gestion des établissements, des élèves, des enseignants et des services éducatifs dans un espace numérique unique.
          </p>
          <div className="hero-cta mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="home-btn-primary w-full px-8 py-3.5 text-sm sm:w-auto sm:min-w-[220px] md:text-base"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="home-btn-secondary w-full px-8 py-3.5 text-sm sm:w-auto sm:min-w-[220px] md:text-base"
            >
              Créer un compte
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="relative z-10 mx-auto grid max-w-4xl grid-cols-2 gap-3 px-5 md:grid-cols-4 md:gap-4 md:px-10">
          {[
            { value: '30', label: 'Modules' },
            { value: '10', label: 'Rôles RBAC' },
            { value: '26', label: 'Provinces' },
            { value: '∞', label: 'Établissements' },
          ].map((s, i) => (
            <div
              key={s.label}
              className="hero-stat rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4 text-center shadow-sm shadow-blue-950/20 backdrop-blur-sm transition duration-300 hover:border-blue-500/30 hover:bg-slate-800/40 active:scale-[0.97]"
              style={{ animationDelay: `${0.12 * i}s` }}
            >
              <p className="text-2xl font-bold text-blue-400 md:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-slate-400 md:text-sm">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Module access */}
        <section className="relative z-10 mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
          <h2 className="mb-6 text-center text-lg font-bold md:mb-8 md:text-2xl">
            Espaces de la plateforme
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {navigationGroups.map((group, gi) => (
              <Link
                key={group.title}
                href={group.items[0].href}
                className="module-card group flex flex-col rounded-2xl border border-slate-700/40 bg-slate-900/40 p-5 shadow-sm shadow-blue-950/20 backdrop-blur-sm transition duration-300 hover:border-blue-500/40 hover:bg-slate-800/50 hover:shadow-lg hover:shadow-blue-950/30 active:scale-[0.98] md:p-6"
                style={{ animationDelay: `${0.08 * gi}s` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 transition duration-300 group-hover:bg-blue-600/25 group-hover:scale-105 md:h-12 md:w-12">
                  <Icon name={group.items[0].icon} className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-white md:text-base">{group.title}</h3>
                <p className="mb-4 text-xs leading-relaxed text-slate-400">
                  {groupDescriptions[group.title] ?? ''}
                </p>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {group.items.slice(0, 4).map((item) => (
                    <span
                      key={item.href}
                      className="rounded-lg bg-slate-800/50 px-2.5 py-1 text-xs text-slate-400 transition duration-300 group-hover:text-slate-300"
                    >
                      {item.label}
                    </span>
                  ))}
                  {group.items.length > 4 && (
                    <span className="rounded-lg bg-slate-800/50 px-2.5 py-1 text-xs text-slate-500">
                      +{group.items.length - 4}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Programme national */}
        <CurriculumSection />

        {/* Presentation */}
        <section className="relative z-10 mx-auto max-w-5xl px-5 pb-10 md:px-10 md:pb-14">
          <div className="rounded-3xl border border-slate-700/30 bg-slate-900/30 p-6 backdrop-blur-sm md:p-10">
            <h2 className="mb-3 text-center text-lg font-bold md:text-2xl">
              Une gestion scolaire pensée pour la RDC
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-center text-xs leading-relaxed text-slate-400 md:text-sm">
              School Manager RDC centralise les outils essentiels à la gestion des établissements, des élèves, des enseignants et des services éducatifs dans une plateforme numérique moderne, simple et sécurisée.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: 'organization', title: 'Gestion centralisée', desc: 'Une gestion organisée des informations scolaires.' },
                { icon: 'shield', title: 'Accès sécurisé', desc: 'Des espaces adaptés à chaque utilisateur et à son rôle.' },
                { icon: 'globe', title: 'Solution numérique', desc: 'Des outils modernes accessibles sur téléphone, tablette et ordinateur.' },
              ].map((item, i) => (
                <div
                  key={item.title}
                  className="feature-item flex flex-col items-center rounded-2xl border border-slate-700/30 bg-slate-800/30 p-5 text-center transition duration-300 hover:border-blue-500/30 hover:bg-slate-800/50"
                  style={{ animationDelay: `${0.1 * i}s` }}
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400">
                    <Icon name={item.icon} className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <h3 className="mb-1.5 text-sm font-semibold text-white md:text-base">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-slate-800/60 bg-slate-950/80">
          <div className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-12">
            <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
              {/* Identity */}
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white shadow-md">
                    <img src="/logo.png" alt="School Manager RDC" className="h-full w-full object-contain" />
                  </div>
                  <span className="text-sm font-bold tracking-wide md:text-base">School Manager RDC</span>
                </div>
                <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-400 md:text-sm">
                  La plateforme numérique pour une gestion scolaire moderne en RDC.
                </p>
              </div>

              {/* Navigation */}
              <nav className="flex flex-col items-center gap-3 md:items-start">
                <Link href="/" className="footer-link">Accueil</Link>
                <Link href="/login" className="footer-link">Se connecter</Link>
                <Link href="/register" className="footer-link">Créer un compte</Link>
                <Link href="/about" className="footer-link">À propos</Link>
                <span className="footer-link cursor-default">Contact</span>
              </nav>

              {/* Information */}
              <div className="flex flex-col items-center gap-2 text-center md:items-start md:text-left">
                <p className="text-xs font-medium text-slate-300 md:text-sm">Solution numérique de gestion scolaire</p>
                <p className="text-xs text-slate-500 md:text-sm">Accessible sur téléphone, tablette et ordinateur</p>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-10 border-t border-slate-800/60 pt-6">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <p className="text-xs text-slate-500 md:text-sm">© 2026 School Manager RDC — Tous droits réservés.</p>
                <p className="text-xs text-slate-600 md:text-sm">Un produit de Skybox Business</p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
