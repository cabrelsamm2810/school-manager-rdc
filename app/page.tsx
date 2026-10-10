'use client';

import { useState } from 'react';
import Link from 'next/link';
import { StartupGate } from '@/components/StartupGate';
import { Icon } from '@/components/ui/Icon';

/* ── Data ── */

const accessCards = [
  { icon: 'school', title: 'Établissement scolaire', desc: 'Gestion numérique de l\u2019établissement.', href: '/ecoles' },
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
  { icon: 'qr', label: 'Cartes scolaires QR Code' },
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
  { emoji: '🇨🇩', title: 'Pensé pour la RDC', desc: 'Une plateforme adaptée au contexte scolaire congolais.' },
];

/* ── Page ── */

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <StartupGate />

      <div className="lp-page">
        {/* ── Header ── */}
        <header className="lp-header">
          <Link href="/" className="lp-brand" onClick={() => setMenuOpen(false)}>
            <img src="/logo.png" alt="School Manager RDC" />
            <span>SCHOOL MANAGER RDC</span>
          </Link>

          <nav className="lp-header-nav">
            <Link href="/login" className="lp-link-btn">Se connecter</Link>
            <Link href="/register" className="lp-link-btn lp-link-btn-primary">Créer un compte</Link>
          </nav>

          <button
            className="lp-hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </header>

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div className="lp-mobile-menu" onClick={() => setMenuOpen(false)}>
            <Link href="/login" className="lp-mobile-link">
              <Icon name="logout" className="h-4 w-4" />
              Se connecter
            </Link>
            <Link href="/register" className="lp-mobile-link lp-mobile-link-primary">
              <Icon name="user" className="h-4 w-4" />
              Créer un compte
            </Link>
          </div>
        )}

        {/* ── Hero ── */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            <div className="lp-hero-logo">
              <img src="/logo.png" alt="School Manager RDC" />
            </div>
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

        {/* ── Accéder à votre espace ── */}
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
                <svg className="lp-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Services ── */}
        <section className="lp-section lp-section-alt">
          <div className="lp-section-head">
            <h2>Les services de School Manager RDC</h2>
            <p className="lp-intro">Une suite complète d&rsquo;outils pour la gestion scolaire.</p>
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

        {/* ── EC-ERC ── */}
        <section className="lp-section">
          <div className="lp-ecerc">
            <div className="lp-ecerc-content">
              <div className="lp-ecerc-logo">
                <img src="/illustrations/ec-erc-logo.jpg" alt="EC-ERC" />
              </div>
              <div className="lp-ecerc-text">
                <h2>EC-ERC</h2>
                <p>Écoles conventionnées des Églises du Réveil du Congo</p>
              </div>
            </div>
            <Link href="/ec-erc" className="lp-btn lp-btn-ecerc">Accéder à l&rsquo;espace EC-ERC</Link>
          </div>
        </section>

        {/* ── Pourquoi School Manager RDC ── */}
        <section className="lp-section lp-section-alt">
          <div className="lp-section-head">
            <h2>Une gestion scolaire plus simple et plus numérique</h2>
          </div>
          <div className="lp-why-grid">
            {features.map((f) => (
              <article key={f.title} className="lp-card lp-why-card">
                <div className="lp-emoji" aria-hidden="true">{f.emoji}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Appel à l'action ── */}
        <section className="lp-cta">
          <div className="lp-cta-inner">
            <h2>Prêt à utiliser School Manager RDC ?</h2>
            <p>Créez votre compte et accédez à votre espace numérique.</p>
            <div className="lp-cta-actions">
              <Link href="/register" className="lp-btn lp-btn-light">Créer un compte</Link>
              <Link href="/login" className="lp-btn lp-btn-ghost-light">Se connecter</Link>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="lp-footer">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <img src="/logo.png" alt="School Manager RDC" />
              <span>SCHOOL MANAGER RDC</span>
            </div>
            <p className="lp-footer-desc">
              La plateforme numérique de gestion scolaire de la République Démocratique du Congo.
            </p>
            <nav className="lp-footer-links">
              <Link href="/about">À propos</Link>
              <Link href="/login">Se connecter</Link>
              <Link href="/register">Créer un compte</Link>
            </nav>
          </div>
          <div className="lp-footer-bottom">
            <p>© 2026 School Manager RDC — Tous droits réservés.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
