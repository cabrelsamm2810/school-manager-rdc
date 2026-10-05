'use client';

import { useEffect, useState } from 'react';

const STEP_META: Record<number, { title: string; subtitle: string; color: string }> = {
  0: { title: 'Votre institution', subtitle: 'Choisissez votre type d\'établissement', color: '#0066FF' },
  1: { title: 'Votre structure', subtitle: 'Définissez votre niveau dans l\'organisation', color: '#2563EB' },
  2: { title: 'Votre fonction', subtitle: 'Renseignez vos informations professionnelles', color: '#1D4ED8' },
  3: { title: 'Vos informations', subtitle: 'Complétez votre profil personnel', color: '#0066FF' },
  4: { title: 'Votre compte', subtitle: 'Créez vos identifiants de connexion', color: '#2563EB' },
  5: { title: 'Vérification', subtitle: 'Confirmez votre inscription', color: '#16A34A' },
};

/* ── SVG illustrations — clean, modern, school-themed ── */

function IllustrationInstitution() {
  return (
    <svg viewBox="0 0 320 240" fill="none" className="h-full w-full">
      {/* Ground */}
      <ellipse cx="160" cy="210" rx="120" ry="12" fill="#0066FF" opacity="0.06" />
      {/* Building */}
      <rect x="90" y="100" width="140" height="100" rx="6" fill="#EFF6FF" stroke="#0066FF" strokeWidth="2" />
      <rect x="90" y="100" width="140" height="20" rx="6" fill="#0066FF" opacity="0.12" />
      {/* Roof flag */}
      <line x1="160" y1="60" x2="160" y2="100" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M160 62 L195 72 L160 82 Z" fill="#0066FF" />
      {/* Windows */}
      <rect x="105" y="135" width="28" height="28" rx="4" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" />
      <rect x="146" y="135" width="28" height="28" rx="4" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" />
      <rect x="187" y="135" width="28" height="28" rx="4" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" />
      {/* Door */}
      <rect x="142" y="170" width="36" height="30" rx="4" fill="#0066FF" opacity="0.25" stroke="#0066FF" strokeWidth="1.5" />
      <circle cx="171" cy="186" r="2" fill="#0066FF" />
      {/* Steps */}
      <rect x="120" y="200" width="80" height="4" rx="2" fill="#0066FF" opacity="0.15" />
    </svg>
  );
}

function IllustrationStructure() {
  return (
    <svg viewBox="0 0 320 240" fill="none" className="h-full w-full">
      <ellipse cx="160" cy="210" rx="120" ry="12" fill="#2563EB" opacity="0.06" />
      {/* Top node */}
      <circle cx="160" cy="55" r="18" fill="#2563EB" opacity="0.15" stroke="#2563EB" strokeWidth="2" />
      <circle cx="160" cy="55" r="7" fill="#2563EB" />
      {/* Lines */}
      <line x1="160" y1="73" x2="160" y2="100" stroke="#93C5FD" strokeWidth="2" />
      <line x1="160" y1="100" x2="90" y2="120" stroke="#93C5FD" strokeWidth="2" />
      <line x1="160" y1="100" x2="160" y2="120" stroke="#93C5FD" strokeWidth="2" />
      <line x1="160" y1="100" x2="230" y2="120" stroke="#93C5FD" strokeWidth="2" />
      {/* Middle nodes */}
      <circle cx="90" cy="135" r="14" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
      <circle cx="160" cy="135" r="14" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
      <circle cx="230" cy="135" r="14" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" />
      {/* Lines to bottom */}
      <line x1="90" y1="149" x2="90" y2="170" stroke="#BFDBFE" strokeWidth="1.5" />
      <line x1="160" y1="149" x2="160" y2="170" stroke="#BFDBFE" strokeWidth="1.5" />
      <line x1="230" y1="149" x2="230" y2="170" stroke="#BFDBFE" strokeWidth="1.5" />
      {/* Bottom nodes */}
      <circle cx="90" cy="185" r="10" fill="#2563EB" opacity="0.2" stroke="#2563EB" strokeWidth="1.5" />
      <circle cx="160" cy="185" r="10" fill="#2563EB" opacity="0.2" stroke="#2563EB" strokeWidth="1.5" />
      <circle cx="230" cy="185" r="10" fill="#2563EB" opacity="0.2" stroke="#2563EB" strokeWidth="1.5" />
    </svg>
  );
}

function IllustrationFonction() {
  return (
    <svg viewBox="0 0 320 240" fill="none" className="h-full w-full">
      <ellipse cx="160" cy="210" rx="110" ry="12" fill="#1D4ED8" opacity="0.06" />
      {/* Badge / ID card */}
      <rect x="95" y="75" width="130" height="90" rx="10" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="2" />
      {/* Header strip */}
      <rect x="95" y="75" width="130" height="22" rx="10" fill="#1D4ED8" opacity="0.15" />
      <rect x="95" y="85" width="130" height="12" fill="#1D4ED8" opacity="0.15" />
      {/* Lanyard */}
      <line x1="140" y1="55" x2="160" y2="75" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
      <line x1="180" y1="55" x2="160" y2="75" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
      {/* Photo placeholder */}
      <circle cx="125" cy="120" r="14" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="1.5" />
      <circle cx="125" cy="116" r="5" fill="#93C5FD" />
      <path d="M115 128 Q125 122 135 128" stroke="#93C5FD" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Text lines */}
      <rect x="150" y="112" width="60" height="5" rx="2.5" fill="#93C5FD" opacity="0.5" />
      <rect x="150" y="122" width="45" height="5" rx="2.5" fill="#93C5FD" opacity="0.35" />
      <rect x="150" y="132" width="55" height="5" rx="2.5" fill="#93C5FD" opacity="0.35" />
      {/* Check mark */}
      <circle cx="200" cy="155" r="10" fill="#16A34A" opacity="0.15" stroke="#16A34A" strokeWidth="1.5" />
      <path d="M196 155 L199 158 L204 152" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function IllustrationInformations() {
  return (
    <svg viewBox="0 0 320 240" fill="none" className="h-full w-full">
      <ellipse cx="160" cy="210" rx="110" ry="12" fill="#0066FF" opacity="0.06" />
      {/* Profile circle */}
      <circle cx="160" cy="100" r="50" fill="#EFF6FF" stroke="#0066FF" strokeWidth="2" />
      {/* Avatar */}
      <circle cx="160" cy="85" r="18" fill="#0066FF" opacity="0.2" />
      <path d="M135 120 Q160 100 185 120" stroke="#0066FF" strokeWidth="2" fill="#0066FF" opacity="0.15" strokeLinecap="round" />
      {/* Camera badge */}
      <circle cx="195" cy="125" r="14" fill="#0066FF" />
      <rect x="189" y="120" width="12" height="8" rx="2" fill="#fff" />
      <circle cx="195" cy="124" r="2.5" fill="#0066FF" />
      <path d="M191 120 L193 117 L197 117 L199 120" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Info lines */}
      <rect x="110" y="165" width="100" height="5" rx="2.5" fill="#93C5FD" opacity="0.5" />
      <rect x="120" y="178" width="80" height="5" rx="2.5" fill="#93C5FD" opacity="0.35" />
    </svg>
  );
}

function IllustrationCompte() {
  return (
    <svg viewBox="0 0 320 240" fill="none" className="h-full w-full">
      <ellipse cx="160" cy="210" rx="100" ry="12" fill="#2563EB" opacity="0.06" />
      {/* Shield */}
      <path d="M160 55 L200 70 V125 Q200 165 160 180 Q120 165 120 125 V70 Z" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" />
      {/* Lock body */}
      <rect x="140" y="110" width="40" height="32" rx="6" fill="#2563EB" opacity="0.2" stroke="#2563EB" strokeWidth="2" />
      {/* Lock shackle */}
      <path d="M147 110 V100 Q147 88 160 88 Q173 88 173 100 V110" stroke="#2563EB" strokeWidth="2" fill="none" strokeLinecap="round" />
      {/* Keyhole */}
      <circle cx="160" cy="124" r="4" fill="#2563EB" />
      <rect x="158.5" y="126" width="3" height="8" rx="1.5" fill="#2563EB" />
      {/* Sparkle */}
      <path d="M210 65 L214 72 L221 76 L214 80 L210 87 L206 80 L199 76 L206 72 Z" fill="#2563EB" opacity="0.3" />
    </svg>
  );
}

function IllustrationVerification() {
  return (
    <svg viewBox="0 0 320 240" fill="none" className="h-full w-full">
      <ellipse cx="160" cy="210" rx="110" ry="12" fill="#16A34A" opacity="0.06" />
      {/* Outer circle */}
      <circle cx="160" cy="110" r="55" fill="#F0FDF4" stroke="#16A34A" strokeWidth="2" />
      {/* Check mark */}
      <path d="M135 112 L153 130 L188 92" stroke="#16A34A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Confetti dots */}
      <circle cx="95" cy="70" r="4" fill="#16A34A" opacity="0.3" />
      <circle cx="225" cy="75" r="3" fill="#16A34A" opacity="0.25" />
      <circle cx="85" cy="140" r="3" fill="#16A34A" opacity="0.2" />
      <circle cx="235" cy="135" r="4" fill="#16A34A" opacity="0.3" />
      <circle cx="110" cy="50" r="2.5" fill="#16A34A" opacity="0.2" />
      <circle cx="210" cy="50" r="2.5" fill="#16A34A" opacity="0.2" />
    </svg>
  );
}

const ILLUSTRATIONS: Record<number, () => JSX.Element> = {
  0: IllustrationInstitution,
  1: IllustrationStructure,
  2: IllustrationFonction,
  3: IllustrationInformations,
  4: IllustrationCompte,
  5: IllustrationVerification,
};

export function RegisterIllustration({ step }: { step: number }) {
  const [displayStep, setDisplayStep] = useState(step);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (step === displayStep) return;
    setFading(true);
    const t = setTimeout(() => {
      setDisplayStep(step);
      setFading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const meta = STEP_META[displayStep] ?? STEP_META[0];
  const Illustration = ILLUSTRATIONS[displayStep] ?? ILLUSTRATIONS[0];

  return (
    <div className="reg-illustration">
      <div
        className={`reg-illustration-img ${fading ? 'reg-illustration-fade-out' : 'reg-illustration-fade-in'}`}
      >
        <Illustration />
      </div>
      <div
        className={`reg-illustration-text ${fading ? 'reg-illustration-fade-out' : 'reg-illustration-fade-in'}`}
      >
        <h3 className="reg-illustration-title" style={{ color: meta.color }}>{meta.title}</h3>
        <p className="reg-illustration-subtitle">{meta.subtitle}</p>
      </div>
    </div>
  );
}
