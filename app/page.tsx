'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SplashScreen } from '@/components/SplashScreen';
import { Icon } from '@/components/ui/Icon';

/* ── Data ── */

const accessCards = [
  { icon: 'school', title: 'Établissement scolaire', desc: 'Gestion numérique de l’établissement.', href: '/etablissements' },
  { icon: 'organization', title: 'EC-ERC', desc: 'Écoles conventionnées des Églises du Réveil du Congo.', href: '/ec-erc' },
  { icon: 'users', title: 'Élève', desc: 'Accès aux informations et services scolaires.', href: '/eleves' },
  { icon: 'teacher', title: 'Personnel éducatif', desc: 'Outils numériques pour le personnel scolaire.', href: '/enseignants' },
  { icon: 'user', title: 'Parent', desc: 'Suivi de la scolarité.', href: '/login' },
  { icon: 'shield', title: 'Administration', desc: 'Gestion et supervision administrative.', href: '/admin' },
];

const services = [
  { icon: 'users', label: 'Gestion des élèves' },
  { icon: 'notebook', label: 'Cahiers de cotes' },
  { icon: 'document', label: 'Bulletins scolaires' },
  { icon: 'qr', label: 'Cartes scolaires QR' },
  { icon: 'folder', label: 'Documents scolaires' },
  { icon: 'send', label: 'Transmission des dossiers' },
  { icon: 'visit', label: 'Visites numériques' },
  { icon: 'chat', label: 'Communication scolaire' },
  { icon: 'school', label: 'Gestion des établissements' },
  { icon: 'services', label: 'Gestion administrative' },
];

const features = [
  { emoji: '🔐', title: 'Sécurité', desc: 'Gestion numérique des informations scolaires.' },
  { emoji: '📱', title: 'Accessible partout', desc: 'Une plateforme adaptée aux téléphones et ordinateurs.' },
  { emoji: '📊', title: 'Gestion numérique', desc: 'Centralisation des opérations scolaires.' },
  { emoji: '🇨🇩', title: 'Pensé pour la RDC', desc: 'Interface et fonctionnalités adaptées au contexte scolaire congolais.' },
];

/* ── Page ── */

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <SplashScreen />
      <main className="relative min-h-screen overflow-x-hidden bg-slate-950 text-white">
        {/* Background — logo officiel en grand */}
        <div
          className="home-bg-logo pointer-events-none fixed inset-0"
          style={{
            backgroundImage: 'url(/logo.png)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            backgroundSize: 'contain',
          }}
        />
        {/* Voile de contraste pour la lisibilité des textes et boutons */}
        <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/75 to-slate-950/85" />

        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-white shadow-md md:h-11 md:w-11">
                <img src="/logo.png" alt="School Manager RDC" className="h-full w-full object-contain" />
              </div>
              <span className="nav-brand text-sm font-bold tracking-wide md:text-base">School Manager RDC</span>
            </Link>

            {/* Desktop buttons */}
            <div className="hidden items-center gap-3 md:flex">
              <Link href="/login" className="home-btn-primary px-6 py-2.5 text-sm">Se connecter</Link>
              <Link href="/register" className="home-btn-secondary px-6 py-2.5 text-sm">Créer un compte</Link>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-900/50 text-slate-200 md:hidden"
              aria-label="Menu"
            >
              <Icon name={menuOpen ? 'close' : 'menu'} className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="border-t border-slate-800/60 bg-slate-950/95 px-4 py-4 md:hidden">
              <div className="flex flex-col gap-3">
                <Link href="/login" className="home-btn-primary w-full px-6 py-3 text-sm" onClick={() => setMenuOpen(false)}>Se connecter</Link>
                <Link href="/register" className="home-btn-secondary w-full px-6 py-3 text-sm" onClick={() => setMenuOpen(false)}>Créer un compte</Link>
              </div>
            </div>
          )}
        </header>

        {/* Hero */}
        <section className="relative z-10 mx-auto max-w-4xl px-4 pt-12 pb-10 text-center md:pt-20 md:pb-16">
          <div className="home-hero-logo mx-auto mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-white/20 md:h-28 md:w-28">
            <img src="/logo.png" alt="School Manager RDC" className="h-full w-full object-contain" />
          </div>
          <h1 className="home-hero-title text-3xl font-extrabold leading-tight tracking-tight md:text-5xl md:tracking-tighter">
            Bienvenue sur <span className="hero-name">School Manager</span>{' '}
            <span className="hero-name-rdc">RDC</span>
          </h1>
          <p className="home-hero-tag mt-5 mx-auto max-w-md text-sm font-medium leading-relaxed text-slate-200 md:max-w-xl md:text-lg">
            La plateforme numérique de gestion scolaire, administrative et éducative de la République Démocratique du Congo.
          </p>
          <div className="home-hero-cta mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/login" className="home-btn-primary w-full px-8 py-3.5 text-sm sm:w-auto sm:min-w-[200px] md:text-base">
              Se connecter
            </Link>
            <Link href="/register" className="home-btn-secondary w-full px-8 py-3.5 text-sm sm:w-auto sm:min-w-[200px] md:text-base">
              Créer un compte
            </Link>
          </div>
        </section>

        {/* Access cards */}
        <section className="relative z-10 mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <h2 className="home-section-title mb-2 text-center text-xl font-bold md:text-2xl">Accéder à votre espace</h2>
          <p className="mb-8 text-center text-sm text-slate-400 md:text-base">Choisissez votre espace pour accéder à vos services.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {accessCards.map((card, i) => (
              <Link
                key={card.title}
                href={card.href}
                className="home-access-card group flex flex-col rounded-2xl border border-slate-700/40 bg-slate-900/40 p-5 backdrop-blur-sm transition duration-300 hover:border-blue-500/40 hover:bg-slate-800/50 active:scale-[0.98] md:p-6"
                style={{ animationDelay: `${0.08 * i}s` }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 transition duration-300 group-hover:bg-blue-600/25 group-hover:scale-105 md:h-12 md:w-12">
                  <Icon name={card.icon} className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-white md:text-base">{card.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400 md:text-sm">{card.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Services */}
        <section className="relative z-10 mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <h2 className="home-section-title mb-2 text-center text-xl font-bold md:text-2xl">Les services de School Manager RDC</h2>
          <p className="mb-8 text-center text-sm text-slate-400 md:text-base">Une suite complète d'outils pour la gestion scolaire.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            {services.map((s, i) => (
              <div
                key={s.label}
                className="home-service-card flex flex-col items-center rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4 text-center backdrop-blur-sm transition duration-300 hover:border-blue-500/40 hover:bg-slate-800/50 active:scale-[0.97] md:p-5"
                style={{ animationDelay: `${0.05 * i}s` }}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 md:h-11 md:w-11">
                  <Icon name={s.icon} className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-slate-200 md:text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* EC-ERC section */}
        <section className="relative z-10 mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <div className="home-ecerc-card relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-950/60 via-slate-900/50 to-slate-900/60 p-6 backdrop-blur-sm md:p-10">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-600/10 blur-3xl" />
            <div className="relative flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:justify-between md:text-left">
              <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/90 p-1 ring-1 ring-blue-500/30 md:h-20 md:w-20">
                  <img src="/illustrations/ec-erc-logo.jpg" alt="EC-ERC" className="h-full w-full rounded-xl object-contain" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white md:text-2xl">EC-ERC</h2>
                  <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-300 md:text-sm">
                    Écoles conventionnées des Églises du Réveil du Congo
                  </p>
                </div>
              </div>
              <Link
                href="/ec-erc"
                className="home-btn-primary shrink-0 px-7 py-3 text-sm md:text-base"
              >
                Accéder à l'espace EC-ERC
              </Link>
            </div>
          </div>
        </section>

        {/* ECCATH section */}
        <section className="relative z-10 mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <div className="home-ecerc-card relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 via-slate-900/50 to-slate-900/60 p-6 backdrop-blur-sm md:p-10">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-600/10 blur-3xl" />
            <div className="relative flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:justify-between md:text-left">
              <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/90 p-1 ring-1 ring-amber-500/30 md:h-20 md:w-20">
                  <img src="/illustrations/eccath-logo.jpg" alt="ECCATH" className="h-full w-full rounded-xl object-contain" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white md:text-2xl">ECCATH</h2>
                  <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-300 md:text-sm">
                    Écoles Conventionnées Catholiques — Coordination Nationale
                  </p>
                </div>
              </div>
              <Link
                href="/register"
                className="home-btn-primary shrink-0 px-7 py-3 text-sm md:text-base"
              >
                Accéder à l'espace ECCATH
              </Link>
            </div>
          </div>
        </section>

        {/* Pourquoi School Manager RDC */}
        <section className="relative z-10 mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
          <h2 className="home-section-title mb-8 text-center text-xl font-bold md:text-2xl">Pourquoi School Manager RDC ?</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="home-feature-card flex flex-col items-center rounded-2xl border border-slate-700/40 bg-slate-900/40 p-5 text-center backdrop-blur-sm transition duration-300 hover:border-blue-500/30 hover:bg-slate-800/50 md:p-6"
                style={{ animationDelay: `${0.1 * i}s` }}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/60 text-2xl">
                  {f.emoji}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-white md:text-base">{f.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400 md:text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 border-t border-slate-800/60 bg-slate-950/80">
          <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-12">
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
                  La plateforme numérique de gestion scolaire de la République Démocratique du Congo.
                </p>
              </div>

              {/* Links */}
              <nav className="flex flex-col items-center gap-3 md:items-start">
                <Link href="/" className="footer-link">Accueil</Link>
                <Link href="/login" className="footer-link">Se connecter</Link>
                <Link href="/register" className="footer-link">Créer un compte</Link>
                <Link href="/about" className="footer-link">À propos</Link>
              </nav>

              {/* Info */}
              <div className="flex flex-col items-center gap-2 text-center md:items-start md:text-left">
                <p className="text-xs font-medium text-slate-300 md:text-sm">Solution numérique de gestion scolaire</p>
                <p className="text-xs text-slate-500 md:text-sm">Accessible sur téléphone, tablette et ordinateur</p>
                <a href="mailto:schoolmanager.rdc@gmail.com" className="footer-link mt-1">schoolmanager.rdc@gmail.com</a>
              </div>
            </div>

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
