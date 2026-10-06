'use client';

import { useEffect, useState } from 'react';

/* Étapes réelles du démarrage, affichées au fur et à mesure. */
const STEPS = [
  'Initialisation de l’application',
  'Chargement des services',
  'Préparation de votre espace'
];

/* Ressources nécessaires au premier écran (logo + logos institutionnels). */
const CRITICAL_ASSETS = ['/logo.png', '/illustrations/ec-erc-logo.jpg', '/illustrations/eccath-logo.jpg'];

const MIN_VISIBLE_MS = 650; /* évite un simple clignotement quand tout est déjà en cache */
const MAX_VISIBLE_MS = 5000; /* garde-fou : l'écran ne peut jamais rester bloqué */
const STEP_DWELL_MS = 300; /* laisse chaque étape lisible */
const FADE_MS = 550;
const ASSET_TIMEOUT_MS = 1500; /* borne le décodage des images */
const READY_TIMEOUT_MS = 1000; /* borne l'attente des polices et du premier rendu */

function waitForWindowLoad() {
  if (document.readyState === 'complete') return Promise.resolve();
  return new Promise<void>((resolve) => {
    window.addEventListener('load', () => resolve(), { once: true });
  });
}

function decodeAsset(src: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => {
      image.decode().then(() => resolve(), () => resolve());
    };
    image.onerror = () => resolve();
    image.src = src;
  });
}

function waitForFonts() {
  if (typeof document === 'undefined' || !('fonts' in document)) return Promise.resolve();
  return document.fonts.ready.then(() => undefined, () => undefined);
}

function afterPaint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export function SplashScreen() {
  const [step, setStep] = useState(0);
  const [fading, setFading] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const startedAt = Date.now();
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;
    let finished = false;
    let lastStepAt = startedAt;

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(setTimeout(resolve, ms));
      });

    const showStep = async (index: number) => {
      const dwell = STEP_DWELL_MS - (Date.now() - lastStepAt);
      if (dwell > 0) await wait(dwell);
      if (cancelled || finished) return;
      lastStepAt = Date.now();
      setStep(index);
    };

    const finish = () => {
      if (cancelled || finished) return;
      finished = true;
      const remaining = MIN_VISIBLE_MS - (Date.now() - startedAt);
      const close = () => {
        if (cancelled) return;
        setStep(STEPS.length);
        setFading(true);
        timers.push(setTimeout(() => setVisible(false), FADE_MS));
      };
      if (remaining > 0) timers.push(setTimeout(close, remaining));
      else close();
    };

    const guard = setTimeout(finish, MAX_VISIBLE_MS);

    (async () => {
      /* 1 — initialisation : la page et ses ressources sont chargées */
      await waitForWindowLoad();
      await showStep(1);
      /* 2 — services : les images du premier écran sont décodées */
      await Promise.all(CRITICAL_ASSETS.map((src) => Promise.race([decodeAsset(src), wait(ASSET_TIMEOUT_MS)])));
      await showStep(2);
      /* 3 — préparation : polices prêtes et premier rendu de la page d'accueil */
      await Promise.race([Promise.all([waitForFonts(), afterPaint()]), wait(READY_TIMEOUT_MS)]);
      finish();
    })();

    return () => {
      cancelled = true;
      clearTimeout(guard);
      timers.forEach(clearTimeout);
    };
  }, []);

  /* Bloque le défilement de la page tant que l'écran de démarrage est affiché. */
  useEffect(() => {
    document.body.style.overflow = visible ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  if (!visible) return null;

  const done = step >= STEPS.length;
  const progress = Math.round((Math.min(step, STEPS.length) / STEPS.length) * 100);

  return (
    <div
      className={`splash-overlay ${fading ? 'opacity-0' : 'opacity-100'}`}
      role="status"
      aria-live="polite"
    >
      <div className="splash-mark">
        <img src="/logo.png" alt="School Manager RDC" />
      </div>

      <p className="splash-title">School Manager RDC</p>
      <p className="splash-subtitle">Plateforme numérique de gestion scolaire</p>

      <div className="splash-progress">
        <div
          className="splash-track"
          role="progressbar"
          aria-label="Chargement de l’application"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div className="splash-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="splash-step" key={step}>
          {done ? 'Espace prêt' : STEPS[step]}
        </p>
      </div>
    </div>
  );
}
