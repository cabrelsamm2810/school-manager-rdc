'use client';

import { useState, useEffect, useCallback } from 'react';

interface EnseignantRetardataire {
  id: string;
  nom: string;
  matricule: string;
  email: string;
  ecole: string;
  telephone: string;
}

interface RappelStatut {
  periode: string;
  anneeScolaire: string;
  total: number;
  aJour: number;
  enRetard: number;
  retardataires: EnseignantRetardataire[];
  historique: HistoriqueRappel[];
}

interface HistoriqueRappel {
  id: string;
  enseignantNom: string;
  enseignantEmail: string;
  ecole: string;
  periode: string;
  anneeScolaire: string;
  statut: string;
  messageErreur: string;
  declenchePar: string;
  createdAt: string;
}

export function RappelsCotesManager() {
  const [statut, setStatut] = useState<RappelStatut | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rappels-cotes');
      if (res.ok) {
        const data = await res.json();
        setStatut(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const envoyerRappels = async () => {
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/rappels-cotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.message || `${data.envoyes} rappel(s) envoyé(s)`);
      } else {
        setResult(data.error || 'Erreur lors de l\'envoi');
      }
      fetchData();
    } catch {
      setResult('Erreur de connexion');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (!statut) return null;

  const pctAJour = statut.total > 0 ? Math.round((statut.aJour / statut.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Carte de synthèse */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Période en cours</p>
          <p className="mt-1 text-xl font-bold text-slate-800">{statut.periode}</p>
          <p className="text-sm text-slate-400">{statut.anneeScolaire}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-emerald-600">Enseignants à jour</p>
          <p className="mt-1 text-3xl font-bold text-emerald-700">{statut.aJour}</p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-emerald-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pctAJour}%` }} />
          </div>
          <p className="mt-1 text-xs text-emerald-600">{pctAJour}% du personnel</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-sm font-medium text-amber-600">En retard de saisie</p>
          <p className="mt-1 text-3xl font-bold text-amber-700">{statut.enRetard}</p>
          <p className="text-xs text-amber-600">sur {statut.total} enseignant(s) actif(s)</p>
        </div>
      </div>

      {/* Bouton d'action */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Rappels automatiques</h3>
          <p className="text-sm text-slate-500">
            Envoyer un email de rappel aux enseignants qui n&apos;ont pas encore saisi leurs cotes.
          </p>
        </div>
        <button
          onClick={envoyerRappels}
          disabled={sending || statut.enRetard === 0}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Envoi en cours...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Envoyer {statut.enRetard > 0 ? `${statut.enRetard} ` : ''}rappel(s)
            </>
          )}
        </button>
      </div>

      {result && (
        <div className={`rounded-xl border p-4 text-sm font-medium ${result.includes('Erreur') ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {result}
        </div>
      )}

      {/* Liste des enseignants en retard */}
      {statut.retardataires.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h4 className="font-semibold text-slate-800">Enseignants en retard de saisie</h4>
          </div>
          <div className="divide-y divide-slate-50">
            {statut.retardataires.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{e.nom}</p>
                  <p className="truncate text-xs text-slate-400">
                    {e.matricule} {e.ecole ? `· ${e.ecole}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  {e.email ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                      Email ✓
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                      Pas d&apos;email
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-semibold text-emerald-700">Tous les enseignants sont à jour !</p>
          <p className="mt-1 text-sm text-emerald-600">Aucun rappel à envoyer pour cette période.</p>
        </div>
      )}

      {/* Historique des rappels */}
      {statut.historique && statut.historique.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex w-full items-center justify-between border-b border-slate-100 px-5 py-4"
          >
            <h4 className="font-semibold text-slate-800">Historique des rappels ({statut.historique.length})</h4>
            <svg className={`h-5 w-5 text-slate-400 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showHistory && (
            <div className="divide-y divide-slate-50">
              {statut.historique.map((h) => (
                <div key={h.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${h.statut === 'envoyé' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    {h.statut === 'envoyé' ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{h.enseignantNom}</p>
                    <p className="truncate text-xs text-slate-400">
                      {h.statut === 'envoyé' ? `Envoyé à ${h.enseignantEmail}` : `Échec: ${h.messageErreur}`}
                      {h.declenchePar ? ` · par ${h.declenchePar}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    {new Date(h.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
