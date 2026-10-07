'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { useSessionUser } from '@/lib/use-session-user';
import { PresenceAppel } from '@/components/enseignant/PresenceAppel';
import { PresenceHistory } from '@/components/enseignant/PresenceHistory';

type Eleve = {
  id: string;
  matricule: string;
  nom: string;
  postNom: string;
  prenom: string;
  classe: string;
  presenceId: string | null;
  statut: string | null;
  heureArrivee: string | null;
};

type Seance = {
  id: string;
  classe: string;
  matiere: string;
  enseignantNom: string;
  anneeScolaire: string;
  date: string;
  statut: string;
};

type View = 'home' | 'appel' | 'history';

export default function PresencesQrPage() {
  const user = useSessionUser();
  const [view, setView] = useState<View>('home');
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [matiere, setMatiere] = useState('');
  const [anneeScolaire, setAnneeScolaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSeance, setActiveSeance] = useState<Seance | null>(null);
  const [seanceEleves, setSeanceEleves] = useState<Eleve[]>([]);

  // Charger les classes disponibles
  useEffect(() => {
    fetch('/api/enseignant/eleves')
      .then((r) => r.json())
      .then((data) => {
        if (data.eleves) {
          const uniqueClasses = [...new Set<string>(data.eleves.map((e: { classe: string }) => e.classe))].sort();
          setClasses(uniqueClasses);
        }
      })
      .catch(() => {});
  }, []);

  // Année scolaire par défaut
  useEffect(() => {
    const now = new Date();
    const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    setAnneeScolaire(`${year}-${year + 1}`);
  }, []);

  // Démarrer une séance (appel)
  async function startAppel() {
    if (!selectedClass) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/presences/seances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classe: selectedClass,
          matiere,
          anneeScolaire,
          date: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création de la séance.');
        return;
      }

      // Charger les détails de la séance (élèves + présences existantes)
      const detailRes = await fetch(`/api/presences/seances/${data.seance.id}`);
      const detailData = await detailRes.json();
      if (detailRes.ok && detailData.eleves) {
        setActiveSeance({
          ...data.seance,
          date: data.seance.date,
        });
        setSeanceEleves(detailData.eleves);
        setView('appel');
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  }

  // Ouvrir une séance existante depuis l'historique
  // L'historique ne fournit pas `anneeScolaire` : on la lit dans le détail de la séance,
  // sinon les scans d'une séance rouverte partiraient sans année scolaire.
  async function openSeance(seance: Omit<Seance, 'anneeScolaire'> & { anneeScolaire?: string }) {
    try {
      const res = await fetch(`/api/presences/seances/${seance.id}`);
      const data = await res.json();
      if (res.ok && data.eleves) {
        setActiveSeance({ ...seance, anneeScolaire: seance.anneeScolaire ?? data.seance?.anneeScolaire ?? '' });
        setSeanceEleves(data.eleves);
        setView('appel');
      }
    } catch {
      // ignore
    }
  }

  // ── Vue: Appel en cours ──
  if (view === 'appel' && activeSeance) {
    return (
      <PresenceAppel
        seance={activeSeance}
        eleves={seanceEleves}
        onBack={() => setView('home')}
        onTerminer={() => {
          setView('home');
          setActiveSeance(null);
        }}
      />
    );
  }

  // ── Vue: Historique ──
  if (view === 'history') {
    return <PresenceHistory onOpenSeance={openSeance} onBack={() => setView('home')} />;
  }

  // ── Vue: Accueil (sélection classe + démarrer) ──
  return (
    <AppShell>
      <div className="min-h-screen bg-slate-50 px-4 py-6">
        <div className="mx-auto max-w-lg">
          {/* Titre */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h2v2H7zM15 8h2v2h-2zM7 14h2v2H7zM15 14h2v2h-2zM10 11h4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Présences par QR Code</h1>
            <p className="mt-1 text-sm text-slate-500">
              Faites l'appel en scannant les cartes scolaires
            </p>
          </div>

          {/* Carte de démarrage */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-slate-800">Nouvel appel</h2>

            {/* Classe */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Classe</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">— Sélectionner une classe —</option>
                {classes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Matière */}
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Matière / Cours <span className="text-slate-400">(optionnel)</span>
              </label>
              <input
                type="text"
                value={matiere}
                onChange={(e) => setMatiere(e.target.value)}
                placeholder="ex: Mathématiques"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Année scolaire */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Année scolaire</label>
              <input
                type="text"
                value={anneeScolaire}
                onChange={(e) => setAnneeScolaire(e.target.value)}
                placeholder="ex: 2026-2027"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {error && (
              <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <button
              onClick={startAppel}
              disabled={!selectedClass || loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-500 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="btn-spinner h-5 w-5" /> Démarrage...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h2v2H7zM15 8h2v2h-2zM7 14h2v2H7zM15 14h2v2h-2zM10 11h4" />
                  </svg>
                  Démarrer l'appel
                </>
              )}
            </button>
          </div>

          {/* Bouton historique */}
          <button
            onClick={() => setView('history')}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:shadow-sm"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Historique des présences
          </button>
        </div>
      </div>
    </AppShell>
  );
}
