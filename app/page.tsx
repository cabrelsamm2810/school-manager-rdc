'use client';

import Link from 'next/link';
import { StartupGate } from '@/components/StartupGate';
import { Icon } from '@/components/ui/Icon';

/* ── Data ── */

const accessCards = [
  { icon: 'school', title: 'École scolaire', desc: 'Gestion numérique de l’école.', href: '/ecoles' },
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
  { icon: 'school', label: 'Gestion des écoles' },
  { icon: 'services', label: 'Gestion administrative' },
];

const features = [
  { emoji: '🔐', title: 'Sécurité', desc: 'Gestion numérique des informations scolaires.' },
  { emoji: '📱', title: 'Accessible partout', desc: 'Une plateforme adaptée aux téléphones et ordinateurs.' },
  { emoji: '📊', title: 'Gestion numérique', desc: 'Centralisation des opérations scolaires.' },
  { emoji: '🇨🇩', title: 'Pensé pour la RDC', desc: 'Interface et fonctionnalités adaptées au contexte scolaire congolais.' },
];

/* ── Éléments d'interface ── */

function Chevron() {
  return (
    <svg className="lp-chevron" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Page ── */

export default function HomePage() {
  return (
    <>
      <StartupGate />

      <div className="lp-page">
        {/* En-tête */}
        <header className="lp-header">
          <Link href="/" className="lp-brand">
            <img src="/logo.png" alt="School Manager RDC" />
            <span>School Manager RDC</span>
          </Link>
          <div className="lp-header-actions">
            <Link href="/login" className="lp-btn lp-btn-sm">Se connecter</Link>
            <Link href="/register" className="lp-btn lp-btn-sm lp-btn-ghost">Créer un compte</Link>
          </div>
        </header>

        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            <div className="lp-hero-logo">
              <img src="/logo.png" alt="School Manager RDC" />
            </div>
            <p className="lp-eyebrow">
              <span className="lp-dot" aria-hidden="true" />
              Plateforme numérique de gestion scolaire
            </p>
            <h1>
              Bienvenue sur <span>School Manager RDC</span>
            </h1>
            <p className="lp-hero-text">
              La plateforme numérique de gestion scolaire, administrative et éducative de la République Démocratique du Congo.
            </p>
            <div className="lp-hero-actions">
              <Link href="/login" className="lp-btn">Se connecter</Link>
              <Link href="/register" className="lp-btn lp-btn-ghost">Créer un compte</Link>
            </div>
          </div>
        </section>

        {/* Pourquoi School Manager RDC */}
        <section className="lp-section">
          <div className="lp-section-head">
            <h2>Pourquoi School Manager RDC ?</h2>
          </div>
          <div className="lp-why-grid">
            {features.map((f) => (
              <article key={f.title} className="lp-card">
                <div className="lp-emoji" aria-hidden="true">{f.emoji}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Espaces d'accès */}
        <section className="lp-section">
          <div className="lp-section-head">
            <h2>Accéder à votre espace</h2>
            <p className="lp-intro">Choisissez votre espace pour accéder à vos services.</p>
          </div>
          <div className="lp-access-grid">
            {accessCards.map((card) => (
              <Link key={card.title} href={card.href} className="lp-card lp-access-card">
                <div className="lp-icon">
                  <Icon name={card.icon} />
                </div>
                <div className="lp-access-text">
                  <h3>{card.title}</h3>
                  <p>{card.desc}</p>
                </div>
                <Chevron />
              </Link>
            ))}
          </div>
        </section>

        {/* Services */}
        <section className="lp-section">
          <div className="lp-section-head">
            <h2>Les services de School Manager RDC</h2>
            <p className="lp-intro">Une suite complète d'outils pour la gestion scolaire.</p>
          </div>
          <div className="lp-services-grid">
            {services.map((s) => (
              <div key={s.label} className="lp-card lp-service">
                <div className="lp-icon">
                  <Icon name={s.icon} />
                </div>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Blocs institutionnels */}
        <div className="lp-orgs">
          <section className="lp-org">
            <div className="lp-org-inner">
              <div className="lp-org-logo">
                <img src="/illustrations/ec-erc-logo.jpg" alt="EC-ERC" />
              </div>
              <div>
                <h2>EC-ERC</h2>
                <p>Écoles conventionnées des Églises du Réveil du Congo</p>
              </div>
            </div>
            <Link href="/ec-erc" className="lp-btn">Accéder à l'espace EC-ERC</Link>
          </section>

          <section className="lp-org">
            <div className="lp-org-inner">
              <div className="lp-org-logo">
                <img src="/illustrations/eccath-logo.jpg" alt="ECCATH" />
              </div>
              <div>
                <h2>ECCATH</h2>
                <p>Écoles Conventionnées Catholiques — Coordination Nationale</p>
              </div>
            </div>
            <Link href="/register" className="lp-btn">Accéder à l'espace ECCATH</Link>
          </section>
        </div>

        {/* Pied de page */}
        <footer className="lp-footer">
          <div className="lp-footer-brand">
            <img src="/logo.png" alt="School Manager RDC" />
            <span>School Manager RDC</span>
          </div>
          <p className="lp-foot-copy">
            La plateforme numérique de gestion scolaire de la République Démocratique du Congo.
          </p>
          <nav className="lp-links">
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
          <p className="lp-copyright">© 2026 School Manager RDC — Tous droits réservés.</p>
          <p>Un produit de Skybox Business</p>
        </footer>
      </div>
    </>
  );
}
