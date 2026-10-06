'use client';

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
  return (
    <>
      <SplashScreen />

      <div className="ard-page">
        {/* Header */}
        <header className="ard-header">
          <Link href="/" className="ard-brand">
            <img src="/logo.png" alt="School Manager RDC" />
            <span>School Manager RDC</span>
          </Link>
          <div className="ard-mini">
            <Link href="/login" className="ard-btn">Se connecter</Link>
            <Link href="/register" className="ard-btn ard-btn-alt">Créer un compte</Link>
          </div>
        </header>

        {/* Hero — ruban d'actions prioritaire */}
        <section className="ard-hero">
          <div className="ard-hero-mark">
            <img src="/logo.png" alt="School Manager RDC" />
          </div>
          <h1>
            Bienvenue sur <span>School Manager RDC</span>
          </h1>
          <p>
            La plateforme numérique de gestion scolaire, administrative et éducative de la République Démocratique du Congo.
          </p>
          <div className="ard-ribbon">
            <Link href="/login" className="ard-btn">Se connecter</Link>
            <Link href="/register" className="ard-btn ard-btn-alt">Créer un compte</Link>
          </div>
        </section>

        {/* Pourquoi School Manager RDC */}
        <section className="ard-section ard-why">
          <h2>Pourquoi School Manager RDC ?</h2>
          <div className="ard-features ard-why-grid">
            {features.map((f) => (
              <article key={f.title} className="ard-card">
                <div className="ard-feature-icon">{f.emoji}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Espaces d'accès */}
        <section className="ard-section ard-access">
          <h2>Accéder à votre espace</h2>
          <p className="ard-intro">Choisissez votre espace pour accéder à vos services.</p>
          <div className="ard-access-grid">
            {accessCards.map((card) => (
              <Link key={card.title} href={card.href} className="ard-card ard-access-card">
                <div className="ard-glyph">
                  <Icon name={card.icon} />
                </div>
                <div>
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Services */}
        <section className="ard-section ard-services">
          <h2>Les services de School Manager RDC</h2>
          <p className="ard-intro">Une suite complète d'outils pour la gestion scolaire.</p>
          <div className="ard-services-grid">
            {services.map((s) => (
              <div key={s.label} className="ard-card ard-service">
                <div className="ard-glyph">
                  <Icon name={s.icon} />
                </div>
                {s.label}
              </div>
            ))}
          </div>
        </section>

        {/* EC-ERC */}
        <section className="ard-org">
          <div className="ard-org-inner">
            <img src="/illustrations/ec-erc-logo.jpg" alt="EC-ERC" />
            <div>
              <h2>EC-ERC</h2>
              <p>Écoles conventionnées des Églises du Réveil du Congo</p>
            </div>
          </div>
          <Link href="/ec-erc" className="ard-btn">Accéder à l'espace EC-ERC</Link>
        </section>

        {/* ECCATH */}
        <section className="ard-org">
          <div className="ard-org-inner">
            <img src="/illustrations/eccath-logo.jpg" alt="ECCATH" />
            <div>
              <h2>ECCATH</h2>
              <p>Écoles Conventionnées Catholiques — Coordination Nationale</p>
            </div>
          </div>
          <Link href="/register" className="ard-btn">Accéder à l'espace ECCATH</Link>
        </section>

        {/* Footer */}
        <footer className="ard-footer">
          <div className="ard-footer-brand">
            <img src="/logo.png" alt="School Manager RDC" />
            <span>School Manager RDC</span>
          </div>
          <p className="ard-foot-copy">
            La plateforme numérique de gestion scolaire de la République Démocratique du Congo.
          </p>
          <nav className="ard-links">
            <Link href="/">Accueil</Link>
            <Link href="/login">Se connecter</Link>
            <Link href="/register">Créer un compte</Link>
            <Link href="/about">À propos</Link>
          </nav>
          <p>Solution numérique de gestion scolaire</p>
          <p>Accessible sur téléphone, tablette et ordinateur</p>
          <p>
            <a href="mailto:schoolmanager.rdc@gmail.com">schoolmanager.rdc@gmail.com</a>
          </p>
          <p className="ard-copyright">© 2026 School Manager RDC — Tous droits réservés.</p>
          <p>Un produit de Skybox Business</p>
        </footer>
      </div>
    </>
  );
}
