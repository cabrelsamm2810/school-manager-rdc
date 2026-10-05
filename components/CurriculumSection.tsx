'use client';

import { useState } from 'react';
import { CLASSES_RDC, MATIERES_RDC, CYCLES_RDC } from '@/lib/curriculum-rdc';

const cycleDescriptions: Record<string, string> = {
  'Maternel': 'Éveil et développement global de l\'enfant (3 sections).',
  'Primaire': 'Compétences fondamentales : lire, écrire, compter (1ère à 6ème année).',
  'CTEB': 'Cycle Terminal de l\'Éducation de Base — 7ème et 8ème année (TENASOSP).',
  'Secondaire Général': 'Humanités scientifiques, littéraires et pédagogiques (4 ans, EXETAT).',
  'Secondaire Technique': 'Humanités techniques et professionnelles (4 ans, EXETAT).',
};

const cycleIcons: Record<string, string> = {
  'Maternel': '👶',
  'Primaire': '📖',
  'CTEB': '🎓',
  'Secondaire Général': '🔬',
  'Secondaire Technique': '⚙️',
};

export function CurriculumSection() {
  const [activeCycle, setActiveCycle] = useState<string>(CYCLES_RDC[0]);

  const classes = CLASSES_RDC.filter((c) => c.cycle === activeCycle).sort((a, b) => a.ordre - b.ordre);
  const matieres = MATIERES_RDC.filter((m) => m.cycle === activeCycle);

  return (
    <section className="relative z-10 mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
      <h2 className="mb-2 text-center text-lg font-bold md:text-2xl">
        Programme national — MINEDU-NC
      </h2>
      <p className="mx-auto mb-8 max-w-2xl text-center text-xs leading-relaxed text-slate-400 md:text-sm">
        Les classes et matières officiels du système éducatif congolais, conformes aux programmes du Ministère de l'Éducation Nationale et Nouvelle Citoyenneté.
      </p>

      {/* Cycle tabs */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {CYCLES_RDC.map((cycle) => (
          <button
            key={cycle}
            onClick={() => setActiveCycle(cycle)}
            className={`rounded-full px-3.5 py-2 text-xs font-medium transition duration-200 md:text-sm ${
              activeCycle === cycle
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                : 'border border-slate-700/40 bg-slate-900/40 text-slate-400 hover:border-blue-500/30 hover:text-slate-200'
            }`}
          >
            <span className="mr-1">{cycleIcons[cycle]}</span>
            {cycle}
          </button>
        ))}
      </div>

      {/* Active cycle description */}
      <p className="mb-6 text-center text-xs text-slate-500 md:text-sm">
        {cycleDescriptions[activeCycle]}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Classes */}
        <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-5 backdrop-blur-sm md:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white md:text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400 text-xs">📚</span>
            Classes ({classes.length})
          </h3>
          <div className="space-y-2">
            {classes.map((c) => (
              <div
                key={c.nom}
                className="flex items-center justify-between rounded-xl border border-slate-700/30 bg-slate-800/30 px-3.5 py-2.5 transition duration-200 hover:border-blue-500/20"
              >
                <span className="text-xs font-medium text-slate-200 md:text-sm">{c.nom}</span>
                {c.diplome ? (
                  <span className="rounded-lg bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-400 md:text-xs">
                    {c.diplome.split(' (')[0]}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Matières */}
        <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-5 backdrop-blur-sm md:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white md:text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400 text-xs">✏️</span>
            Matières ({matieres.length})
          </h3>
          <div className="space-y-2">
            {matieres.map((m) => (
              <div
                key={m.nom}
                className="flex items-center justify-between rounded-xl border border-slate-700/30 bg-slate-800/30 px-3.5 py-2.5 transition duration-200 hover:border-blue-500/20"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-200 md:text-sm">{m.nom}</p>
                  <p className="text-[10px] text-slate-500 md:text-xs">{m.domaine}</p>
                </div>
                <span className="ml-2 flex-shrink-0 rounded-lg bg-slate-700/40 px-2 py-0.5 text-[10px] font-medium text-slate-400 md:text-xs">
                  Coef. {m.coefficient}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
