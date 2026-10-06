'use client';

import { useEffect, useState } from 'react';

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2200);
    const removeTimer = setTimeout(() => setVisible(false), 2900);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900 transition-opacity duration-700 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/25 blur-3xl splash-glow" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-300/15 blur-2xl splash-glow-delay" />
      </div>

      <div className="relative splash-logo overflow-hidden rounded-3xl bg-white p-3 shadow-2xl">
        <img src="/logo.png" alt="School Manager RDC" className="h-28 w-28 object-contain md:h-36 md:w-36" />
      </div>

      <div className="relative mt-6 text-center splash-text">
        <h1 className="text-xl font-bold tracking-wide text-white md:text-2xl">School Manager RDC</h1>
        <div className="mx-auto mt-3 h-0.5 w-20 overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-full origin-left scale-x-0 bg-indigo-400 splash-bar" />
        </div>
        <p className="mt-3 text-xs text-slate-400 md:text-sm">Plateforme nationale de gestion scolaire</p>
      </div>
    </div>
  );
}
