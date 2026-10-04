'use client';

import Link from 'next/link';
import { SplashScreen } from '@/components/SplashScreen';
import { Icon } from '@/components/ui/Icon';
import { navigationGroups } from '@/lib/navigation';

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
        <nav className="relative z-10 flex items-center justify-between px-5 py-4 md:px-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white shadow-md md:h-12 md:w-12">
              <img src="/logo.png" alt="School Manager RDC" className="h-full w-full object-contain" />
            </div>
            <span className="nav-brand text-sm font-bold tracking-wide md:text-base">School Manager RDC</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/login"
              className="btn-secondary px-4 py-2 text-xs md:px-5 md:py-2.5 md:text-sm"
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="btn-primary px-5 py-2 text-xs md:px-6 md:py-2.5 md:text-sm"
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
          <p className="hero-sub mt-4 max-w-xl text-sm text-slate-300 md:text-lg">
            La plateforme nationale de gestion scolaire pour la République Démocratique du Congo.
            Gérez les élèves, les établissements, le personnel et l'administration territoriale
            dans un environnement moderne, sécurisé et centralisé.
          </p>
          <div className="hero-cta mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="btn-primary px-8 py-3.5 text-sm md:text-base"
            >
              Créer un compte
            </Link>
            <Link
              href="/login"
              className="btn-secondary px-8 py-3.5 text-sm md:text-base"
            >
              Se connecter
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
              className="hero-stat rounded-2xl border border-slate-700/60 bg-slate-900/50 p-4 text-center backdrop-blur-sm"
              style={{ animationDelay: `${0.15 * i}s` }}
            >
              <p className="text-2xl font-bold text-blue-400 md:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs text-slate-400 md:text-sm">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Module access */}
        <section className="relative z-10 mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
          <h2 className="mb-6 text-center text-lg font-bold md:text-2xl">
            Espaces de la plateforme
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {navigationGroups.map((group, gi) => (
              <Link
                key={group.title}
                href={group.items[0].href}
                className="module-card group rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5 backdrop-blur-sm transition hover:border-blue-500/50 hover:bg-slate-800/60"
                style={{ animationDelay: `${0.1 * gi}s` }}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 transition group-hover:bg-blue-600/30">
                    <Icon name={group.items[0].icon} className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-sm md:text-base">{group.title}</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.slice(0, 4).map((item) => (
                    <span
                      key={item.href}
                      className="rounded-lg bg-slate-800/60 px-2.5 py-1 text-xs text-slate-400 transition group-hover:text-slate-300"
                    >
                      {item.label}
                    </span>
                  ))}
                  {group.items.length > 4 && (
                    <span className="rounded-lg bg-slate-800/60 px-2.5 py-1 text-xs text-slate-500">
                      +{group.items.length - 4}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-slate-800 px-5 py-6 text-center md:px-10">
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white">
              <img src="/logo.png" alt="School Manager RDC" className="h-full w-full object-contain" />
            </div>
            <span className="text-xs text-slate-500 md:text-sm">
              School Manager RDC — République Démocratique du Congo
            </span>
          </div>
        </footer>
      </main>
    </>
  );
}
