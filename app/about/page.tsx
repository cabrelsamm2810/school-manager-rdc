'use client';

import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';

const features = [
  {
    icon: 'card',
    title: 'Carte scolaire numérique avec QR',
    description:
      'Une carte scolaire numérique permettant d\u2019identifier rapidement l\u2019élève grâce à un QR Code sécurisé.',
    highlights: [
      'Identité de l\u2019élève',
      'Photo',
      'Informations scolaires essentielles',
      'QR Code',
      'Vérification rapide',
    ],
  },
  {
    icon: 'qr',
    title: 'Présence avec QR Code',
    description:
      'Un système de présence numérique permettant d\u2019enregistrer rapidement la présence des élèves grâce au scan d\u2019un QR Code.',
    highlights: [
      'Scan rapide',
      'Enregistrement numérique',
      'Historique des présences',
      'Réduction des saisies manuelles',
    ],
  },
  {
    icon: 'notebook',
    title: 'Bulletin numérique avec QR Code',
    description:
      'Un bulletin scolaire numérique sécurisé avec QR Code permettant de vérifier facilement son authenticité et les informations scolaires associées.',
    highlights: [
      'Résultats scolaires',
      'Informations de l\u2019élève',
      'QR Code de vérification',
      'Consultation numérique',
      'Réduction des documents papier',
    ],
  },
];

export default function AboutPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: 'url(/school-background.svg)' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/70 to-slate-950/90" />

      {/* Nav bar */}
      <nav className="relative z-10 flex items-center justify-between px-5 py-4 md:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white shadow-md md:h-12 md:w-12">
            <img src="/logo.png" alt="School Manager RDC" className="h-full w-full object-contain" />
          </div>
          <span className="nav-brand text-sm font-bold tracking-wide md:text-base">School Manager RDC</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-3">
          <Link href="/login" className="btn-secondary px-4 py-2 text-xs md:px-5 md:py-2.5 md:text-sm">
            Se connecter
          </Link>
          <Link href="/register" className="btn-primary px-5 py-2 text-xs md:px-6 md:py-2.5 md:text-sm">
            Créer un compte
          </Link>
        </div>
      </nav>

      {/* Page header */}
      <section className="relative z-10 flex flex-col items-center px-5 pt-8 pb-6 text-center md:pt-12 md:pb-8">
        <h1 className="hero-title text-3xl font-extrabold leading-tight tracking-tight md:text-5xl md:tracking-tighter">
          <span className="hero-name">School Manager</span>{' '}
          <span className="hero-name-rdc">RDC</span>
        </h1>
        <p className="hero-tagline mt-4 max-w-md text-sm font-medium leading-relaxed text-slate-100 md:max-w-lg md:text-lg">
          À propos de la plateforme
        </p>
      </section>

      {/* Digital features section */}
      <section className="relative z-10 mx-auto max-w-5xl px-5 pb-12 md:px-10 md:pb-16">
        <h2 className="mb-3 text-center text-lg font-bold md:mb-4 md:text-2xl">
          Des outils scolaires intelligents
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-xs leading-relaxed text-slate-400 md:mb-10 md:text-sm">
          School Manager RDC intègre des fonctionnalités numériques innovantes pour moderniser la gestion scolaire en République Démocratique du Congo.
        </p>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="feature-item group flex flex-col rounded-2xl border border-slate-700/40 bg-slate-900/40 p-5 shadow-sm shadow-blue-950/20 backdrop-blur-sm transition duration-300 hover:border-blue-500/40 hover:bg-slate-800/50 hover:shadow-lg hover:shadow-blue-950/30 md:p-6"
              style={{ animationDelay: `${0.1 * i}s` }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/15 text-blue-400 transition duration-300 group-hover:bg-blue-600/25 group-hover:scale-105">
                <Icon name={feature.icon} className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-sm font-semibold text-white md:text-base">{feature.title}</h3>
              <p className="mb-4 text-xs leading-relaxed text-slate-400">{feature.description}</p>
              <ul className="mt-auto flex flex-col gap-1.5">
                {feature.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/60 bg-slate-950/80">
        <div className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-12">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
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
            <nav className="flex flex-col items-center gap-3 md:items-start">
              <Link href="/" className="footer-link">Accueil</Link>
              <Link href="/login" className="footer-link">Se connecter</Link>
              <Link href="/register" className="footer-link">Créer un compte</Link>
              <span className="footer-link cursor-default">À propos</span>
              <span className="footer-link cursor-default">Contact</span>
            </nav>
            <div className="flex flex-col items-center gap-2 text-center md:items-start md:text-left">
              <p className="text-xs font-medium text-slate-300 md:text-sm">Solution numérique de gestion scolaire</p>
              <p className="text-xs text-slate-500 md:text-sm">Accessible sur téléphone, tablette et ordinateur</p>
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
  );
}
