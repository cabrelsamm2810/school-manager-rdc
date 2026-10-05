'use client';

import { useEffect, useRef, useState } from 'react';

const STEP_META: Record<number, { title: string; subtitle: string; color: string }> = {
  0: { title: 'Votre institution', subtitle: 'Choisissez votre type d\'établissement', color: '#0066FF' },
  1: { title: 'Votre structure', subtitle: 'Définissez votre niveau dans l\'organisation', color: '#2563EB' },
  2: { title: 'Votre fonction', subtitle: 'Renseignez vos informations professionnelles', color: '#1D4ED8' },
  3: { title: 'Vos informations', subtitle: 'Complétez votre profil personnel', color: '#0066FF' },
  4: { title: 'Votre compte', subtitle: 'Créez vos identifiants de connexion', color: '#2563EB' },
  5: { title: 'Vérification', subtitle: 'Confirmez votre inscription', color: '#16A34A' },
};

/* ─────────────────────────────────────────────
   6 illustrations officielles — School Manager RDC
   Images chargées depuis /public/illustrations/
   Fallback SVG si l'image n'est pas trouvée.
   ───────────────────────────────────────────── */

/* ── 1. Institution : bâtiment scolaire avec drapeau ── */
function IllustrationInstitution() {
  return (
    <svg viewBox="0 0 320 240" fill="none" className="h-full w-full">
      <defs>
        <linearGradient id="inst-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EFF6FF" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient id="inst-building" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#EFF6FF" />
        </linearGradient>
        <linearGradient id="inst-roof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0066FF" />
          <stop offset="100%" stopColor="#002868" />
        </linearGradient>
      </defs>
      <rect width="320" height="240" rx="12" fill="url(#inst-sky)" />
      <path d="M0 175 Q60 160 120 170 T240 165 T320 170 V240 H0 Z" fill="#BFDBFE" opacity="0.35" />
      <rect x="0" y="195" width="320" height="45" fill="#DBEAFE" opacity="0.5" />
      <ellipse cx="42" cy="170" rx="16" ry="20" fill="#2563EB" opacity="0.15" />
      <rect x="40" y="180" width="4" height="18" rx="2" fill="#2563EB" opacity="0.2" />
      <ellipse cx="278" cy="168" rx="18" ry="22" fill="#2563EB" opacity="0.12" />
      <rect x="276" y="180" width="4" height="18" rx="2" fill="#2563EB" opacity="0.18" />
      <line x1="160" y1="40" x2="160" y2="95" stroke="#002868" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M160 42 L196 50 L160 60 Z" fill="url(#inst-roof)" />
      <circle cx="162" cy="40" r="3" fill="#002868" />
      <rect x="85" y="95" width="150" height="100" rx="4" fill="url(#inst-building)" stroke="#0066FF" strokeWidth="2" />
      <path d="M75 98 L160 55 L245 98 Z" fill="url(#inst-roof)" stroke="#002868" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="100" y="98" width="6" height="80" rx="2" fill="#BFDBFE" />
      <rect x="120" y="98" width="6" height="80" rx="2" fill="#BFDBFE" />
      <rect x="194" y="98" width="6" height="80" rx="2" fill="#BFDBFE" />
      <rect x="214" y="98" width="6" height="80" rx="2" fill="#BFDBFE" />
      <rect x="142" y="135" width="36" height="43" rx="3" fill="#0066FF" opacity="0.2" stroke="#0066FF" strokeWidth="1.5" />
      <circle cx="171" cy="157" r="2" fill="#0066FF" />
      <rect x="75" y="195" width="170" height="5" rx="2" fill="#0066FF" opacity="0.15" />
      <rect x="85" y="190" width="150" height="5" rx="2" fill="#0066FF" opacity="0.1" />
      <circle cx="160" cy="82" r="10" fill="#fff" stroke="#002868" strokeWidth="1.5" />
      <line x1="160" y1="82" x2="160" y2="76" stroke="#0066FF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="160" y1="82" x2="164" y2="82" stroke="#0066FF" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="280" cy="50" r="14" fill="#60A5FA" opacity="0.2" />
      <circle cx="280" cy="50" r="9" fill="#60A5FA" opacity="0.3" />
    </svg>
  );
}

/* ── 2. Structure : organigramme hiérarchique ── */
function IllustrationStructure() {
  return (
    <svg viewBox="0 0 320 240" fill="none" className="h-full w-full">
      <defs>
        <linearGradient id="str-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EFF6FF" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient id="str-node-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0066FF" />
          <stop offset="100%" stopColor="#002868" />
        </linearGradient>
      </defs>
      <rect width="320" height="240" rx="12" fill="url(#str-bg)" />
      <rect x="120" y="28" width="80" height="36" rx="10" fill="url(#str-node-top)" />
      <circle cx="140" cy="46" r="7" fill="#fff" opacity="0.9" />
      <path d="M133 50 Q140 45 147 50" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.9" />
      <rect x="153" y="40" width="38" height="4" rx="2" fill="#fff" opacity="0.7" />
      <rect x="153" y="48" width="28" height="3" rx="1.5" fill="#fff" opacity="0.5" />
      <path d="M160 64 L160 80 L70 80 L70 96" stroke="#93C5FD" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M160 64 L160 96" stroke="#93C5FD" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M160 64 L160 80 L250 80 L250 96" stroke="#93C5FD" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="30" y="96" width="80" height="34" rx="8" fill="#fff" stroke="#2563EB" strokeWidth="2" />
      <circle cx="48" cy="113" r="6" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
      <rect x="60" y="108" width="38" height="4" rx="2" fill="#2563EB" opacity="0.5" />
      <rect x="60" y="116" width="28" height="3" rx="1.5" fill="#2563EB" opacity="0.35" />
      <rect x="120" y="96" width="80" height="34" rx="8" fill="#fff" stroke="#2563EB" strokeWidth="2" />
      <circle cx="138" cy="113" r="6" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
      <rect x="150" y="108" width="38" height="4" rx="2" fill="#2563EB" opacity="0.5" />
      <rect x="150" y="116" width="28" height="3" rx="1.5" fill="#2563EB" opacity="0.35" />
      <rect x="210" y="96" width="80" height="34" rx="8" fill="#fff" stroke="#2563EB" strokeWidth="2" />
      <circle cx="228" cy="113" r="6" fill="#DBEAFE" stroke="#2563EB" strokeWidth="1.5" />
      <rect x="240" y="108" width="38" height="4" rx="2" fill="#2563EB" opacity="0.5" />
      <rect x="240" y="116" width="28" height="3" rx="1.5" fill="#2563EB" opacity="0.35" />
      <path d="M70 130 L70 152" stroke="#BFDBFE" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M160 130 L160 152" stroke="#BFDBFE" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M250 130 L250 152" stroke="#BFDBFE" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="40" y="152" width="60" height="28" rx="7" fill="#2563EB" opacity="0.1" stroke="#2563EB" strokeWidth="1.5" />
      <circle cx="55" cy="166" r="5" fill="#2563EB" opacity="0.25" />
      <rect x="64" y="162" width="28" height="3" rx="1.5" fill="#2563EB" opacity="0.4" />
      <rect x="64" y="169" width="20" height="3" rx="1.5" fill="#2563EB" opacity="0.3" />
      <rect x="130" y="152" width="60" height="28" rx="7" fill="#2563EB" opacity="0.1" stroke="#2563EB" strokeWidth="1.5" />
      <circle cx="145" cy="166" r="5" fill="#2563EB" opacity="0.25" />
      <rect x="154" y="162" width="28" height="3" rx="1.5" fill="#2563EB" opacity="0.4" />
      <rect x="154" y="169" width="20" height="3" rx="1.5" fill="#2563EB" opacity="0.3" />
      <rect x="220" y="152" width="60" height="28" rx="7" fill="#2563EB" opacity="0.1" stroke="#2563EB" strokeWidth="1.5" />
      <circle cx="235" cy="166" r="5" fill="#2563EB" opacity="0.25" />
      <rect x="244" y="162" width="28" height="3" rx="1.5" fill="#2563EB" opacity="0.4" />
      <rect x="244" y="169" width="20" height="3" rx="1.5" fill="#2563EB" opacity="0.3" />
      <circle cx="20" cy="200" r="3" fill="#2563EB" opacity="0.15" />
      <circle cx="300" cy="205" r="3" fill="#2563EB" opacity="0.15" />
    </svg>
  );
}

/* ── 3. Fonction : badge professionnel avec QR ── */
function IllustrationFonction() {
  return (
    <svg viewBox="0 0 320 240" fill="none" className="h-full w-full">
      <defs>
        <linearGradient id="fon-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EFF6FF" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient id="fon-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#F0F5FF" />
        </linearGradient>
        <linearGradient id="fon-strip" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#0066FF" />
        </linearGradient>
      </defs>
      <rect width="320" height="240" rx="12" fill="url(#fon-bg)" />
      <path d="M130 25 L160 70 L190 25" stroke="#93C5FD" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="130" cy="25" r="4" fill="#1D4ED8" opacity="0.3" />
      <circle cx="190" cy="25" r="4" fill="#1D4ED8" opacity="0.3" />
      <rect x="80" y="65" width="160" height="120" rx="14" fill="url(#fon-card)" stroke="#1D4ED8" strokeWidth="2" />
      <path d="M80 65 H240 V85 Q240 79 234 79 H86 Q80 79 80 85 Z" fill="url(#fon-strip)" />
      <text x="160" y="79" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fff" letterSpacing="2">BADGE</text>
      <circle cx="120" cy="115" r="22" fill="#DBEAFE" stroke="#93C5FD" strokeWidth="2" />
      <circle cx="120" cy="108" r="8" fill="#93C5FD" />
      <path d="M106 126 Q120 118 134 126" stroke="#93C5FD" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="152" y="100" width="70" height="6" rx="3" fill="#1D4ED8" opacity="0.5" />
      <rect x="152" y="112" width="50" height="5" rx="2.5" fill="#93C5FD" opacity="0.5" />
      <rect x="152" y="123" width="60" height="5" rx="2.5" fill="#93C5FD" opacity="0.35" />
      <rect x="152" y="134" width="40" height="5" rx="2.5" fill="#93C5FD" opacity="0.35" />
      <rect x="100" y="145" width="36" height="36" rx="4" fill="#fff" stroke="#1D4ED8" strokeWidth="1.5" />
      <rect x="105" y="150" width="10" height="10" rx="1" fill="#1D4ED8" />
      <rect x="121" y="150" width="10" height="10" rx="1" fill="#1D4ED8" />
      <rect x="105" y="166" width="10" height="10" rx="1" fill="#1D4ED8" />
      <rect x="119" y="163" width="4" height="4" fill="#1D4ED8" />
      <rect x="125" y="166" width="3" height="3" fill="#1D4ED8" />
      <rect x="131" y="163" width="3" height="3" fill="#1D4ED8" />
      <rect x="131" y="169" width="3" height="3" fill="#1D4ED8" />
      <rect x="125" y="173" width="3" height="3" fill="#1D4ED8" />
      <circle cx="225" cy="160" r="14" fill="#16A34A" />
      <path d="M219 160 L223 164 L231 155" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="40" cy="50" r="3" fill="#1D4ED8" opacity="0.15" />
      <circle cx="285" cy="55" r="3" fill="#1D4ED8" opacity="0.15" />
      <circle cx="50" cy="200" r="2.5" fill="#1D4ED8" opacity="0.12" />
    </svg>
  );
}

/* ── 4. Informations : profil personnel avec localisation ── */
function IllustrationInformations() {
  return (
    <svg viewBox="0 0 320 240" fill="none" className="h-full w-full">
      <defs>
        <linearGradient id="info-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EFF6FF" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient id="info-ring" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0066FF" />
          <stop offset="100%" stopColor="#002868" />
        </linearGradient>
      </defs>
      <rect width="320" height="240" rx="12" fill="url(#info-bg)" />
      <circle cx="160" cy="90" r="52" fill="none" stroke="url(#info-ring)" strokeWidth="2.5" strokeDasharray="4 3" opacity="0.4" />
      <circle cx="160" cy="90" r="42" fill="#fff" stroke="#0066FF" strokeWidth="2.5" />
      <circle cx="160" cy="78" r="15" fill="#0066FF" opacity="0.2" />
      <path d="M138 104 Q160 88 182 104" stroke="#0066FF" strokeWidth="2.5" fill="#0066FF" opacity="0.15" strokeLinecap="round" />
      <circle cx="200" cy="120" r="18" fill="#0066FF" />
      <circle cx="200" cy="120" r="18" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.3" />
      <rect x="190" y="114" width="20" height="13" rx="3" fill="#fff" />
      <circle cx="200" cy="120" r="4" fill="#0066FF" />
      <circle cx="200" cy="120" r="2" fill="#fff" />
      <path d="M194 114 L196 110 L204 110 L206 114" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <rect x="80" y="160" width="160" height="14" rx="7" fill="#fff" stroke="#93C5FD" strokeWidth="1.5" />
      <circle cx="91" cy="167" r="4" fill="#93C5FD" opacity="0.4" />
      <rect x="100" y="164" width="80" height="6" rx="3" fill="#93C5FD" opacity="0.25" />
      <rect x="80" y="184" width="160" height="14" rx="7" fill="#fff" stroke="#93C5FD" strokeWidth="1.5" />
      <path d="M91 188 C91 188 86 183 86 179 C86 176 88 174 91 174 C94 174 96 176 96 179 C96 183 91 188 91 188 Z" fill="#0066FF" />
      <circle cx="91" cy="179" r="2" fill="#fff" />
      <rect x="100" y="188" width="70" height="6" rx="3" fill="#93C5FD" opacity="0.25" />
      <circle cx="50" cy="50" r="4" fill="#0066FF" opacity="0.12" />
      <circle cx="270" cy="45" r="3" fill="#0066FF" opacity="0.12" />
      <circle cx="275" cy="195" r="3" fill="#0066FF" opacity="0.1" />
    </svg>
  );
}

/* ── 5. Compte : sécurité, clé et shield ── */
function IllustrationCompte() {
  return (
    <svg viewBox="0 0 320 240" fill="none" className="h-full w-full">
      <defs>
        <linearGradient id="cmp-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EFF6FF" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient id="cmp-shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0066FF" />
          <stop offset="100%" stopColor="#002868" />
        </linearGradient>
        <linearGradient id="cmp-lock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#E0F2FE" />
        </linearGradient>
      </defs>
      <rect width="320" height="240" rx="12" fill="url(#cmp-bg)" />
      <circle cx="160" cy="110" r="62" fill="none" stroke="#2563EB" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.3" />
      <path d="M160 50 L210 68 V120 Q210 162 160 182 Q110 162 110 120 V68 Z" fill="url(#cmp-shield)" />
      <path d="M160 50 L210 68 V120 Q210 162 160 182 Q110 162 110 120 V68 Z" fill="none" stroke="#fff" strokeWidth="1" opacity="0.2" />
      <rect x="138" y="108" width="44" height="36" rx="8" fill="url(#cmp-lock)" stroke="#fff" strokeWidth="1.5" />
      <path d="M146 108 V96 Q146 82 160 82 Q174 82 174 96 V108" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="160" cy="122" r="5" fill="#0066FF" />
      <rect x="158" y="125" width="4" height="10" rx="2" fill="#0066FF" />
      <path d="M232 60 L236 68 L244 72 L236 76 L232 84 L228 76 L220 72 L228 68 Z" fill="#2563EB" opacity="0.35" />
      <circle cx="80" cy="70" r="3" fill="#2563EB" opacity="0.25" />
      <circle cx="85" cy="160" r="2.5" fill="#2563EB" opacity="0.2" />
      <circle cx="245" cy="155" r="3" fill="#2563EB" opacity="0.2" />
      <circle cx="120" cy="205" r="6" fill="none" stroke="#2563EB" strokeWidth="2" opacity="0.3" />
      <rect x="125" y="203" width="14" height="3" rx="1.5" fill="#2563EB" opacity="0.3" />
      <rect x="135" y="203" width="3" height="6" rx="1" fill="#2563EB" opacity="0.3" />
      <circle cx="175" cy="207" r="3" fill="#2563EB" opacity="0.25" />
      <circle cx="187" cy="207" r="3" fill="#2563EB" opacity="0.25" />
      <circle cx="199" cy="207" r="3" fill="#2563EB" opacity="0.25" />
      <circle cx="211" cy="207" r="3" fill="#2563EB" opacity="0.15" />
    </svg>
  );
}

/* ── 6. Vérification : certificat avec sceau et ruban ── */
function IllustrationVerification() {
  return (
    <svg viewBox="0 0 320 240" fill="none" className="h-full w-full">
      <defs>
        <linearGradient id="ver-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0FDF4" />
          <stop offset="100%" stopColor="#DCFCE7" />
        </linearGradient>
        <linearGradient id="ver-doc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#F0FDF4" />
        </linearGradient>
        <linearGradient id="ver-seal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16A34A" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
      </defs>
      <rect width="320" height="240" rx="12" fill="url(#ver-bg)" />
      <rect x="80" y="45" width="160" height="130" rx="8" fill="url(#ver-doc)" stroke="#16A34A" strokeWidth="2" />
      <rect x="80" y="45" width="160" height="22" rx="8" fill="#16A34A" opacity="0.1" />
      <rect x="80" y="55" width="160" height="12" fill="#16A34A" opacity="0.1" />
      <rect x="110" y="78" width="100" height="7" rx="3.5" fill="#16A34A" opacity="0.5" />
      <rect x="120" y="92" width="80" height="5" rx="2.5" fill="#16A34A" opacity="0.3" />
      <rect x="100" y="110" width="120" height="4" rx="2" fill="#86EFAC" opacity="0.6" />
      <rect x="100" y="120" width="100" height="4" rx="2" fill="#86EFAC" opacity="0.5" />
      <rect x="100" y="130" width="110" height="4" rx="2" fill="#86EFAC" opacity="0.4" />
      <circle cx="200" cy="155" r="20" fill="url(#ver-seal)" />
      <circle cx="200" cy="155" r="16" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.5" />
      <path d="M192 155 L198 161 L208 149" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M192 172 L188 195 L200 188 L212 195 L208 172" fill="#16A34A" opacity="0.6" />
      <path d="M192 172 L188 195 L200 188 L212 195 L208 172" fill="none" stroke="#15803D" strokeWidth="1" opacity="0.4" />
      <circle cx="115" cy="155" r="14" fill="#16A34A" opacity="0.15" stroke="#16A34A" strokeWidth="2" />
      <path d="M109 155 L113 159 L121 150" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="45" cy="60" r="4" fill="#16A34A" opacity="0.3" />
      <circle cx="270" cy="55" r="3" fill="#16A34A" opacity="0.25" />
      <circle cx="40" cy="130" r="3" fill="#16A34A" opacity="0.2" />
      <circle cx="280" cy="140" r="4" fill="#16A34A" opacity="0.3" />
      <circle cx="60" cy="200" r="2.5" fill="#16A34A" opacity="0.2" />
      <circle cx="260" cy="200" r="2.5" fill="#16A34A" opacity="0.2" />
      <rect x="30" y="90" width="5" height="5" rx="1" fill="#16A34A" opacity="0.2" transform="rotate(15 32 92)" />
      <rect x="285" y="95" width="5" height="5" rx="1" fill="#16A34A" opacity="0.2" transform="rotate(30 287 97)" />
    </svg>
  );
}

const SVG_FALLBACKS: Record<number, () => JSX.Element> = {
  0: IllustrationInstitution,
  1: IllustrationStructure,
  2: IllustrationFonction,
  3: IllustrationInformations,
  4: IllustrationCompte,
  5: IllustrationVerification,
};

/** Noms des images officielles attendues dans /public/illustrations/ */
const STEP_IMAGES: Record<number, string> = {
  0: '/illustrations/step-1.png',
  1: '/illustrations/step-2.png',
  2: '/illustrations/step-3.png',
  3: '/illustrations/step-4.png',
  4: '/illustrations/step-5.png',
  5: '/illustrations/step-6.png',
};

/** Affiche l'image officielle si elle existe, sinon le fallback SVG */
function StepIllustration({ step }: { step: number }) {
  const [imgError, setImgError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const imageUrl = STEP_IMAGES[step];
  const SvgFallback = SVG_FALLBACKS[step] ?? SVG_FALLBACKS[0];

  // Reset error state when step changes
  useEffect(() => {
    setImgError(false);
  }, [step]);

  // L'image rendue côté serveur peut échouer avant l'hydratation (onError manqué) :
  // on vérifie l'état réel de l'image au montage.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setImgError(true);
  }, [step]);

  if (imgError) {
    return <SvgFallback />;
  }

  return (
    <img
      ref={imgRef}
      src={imageUrl}
      alt={`Illustration étape ${step + 1}`}
      className="h-full w-full rounded-xl object-cover"
      onError={() => setImgError(true)}
    />
  );
}

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

  return (
    <div className="reg-illustration">
      <div
        className={`reg-illustration-img ${fading ? 'reg-illustration-fade-out' : 'reg-illustration-fade-in'}`}
      >
        <StepIllustration step={displayStep} />
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
