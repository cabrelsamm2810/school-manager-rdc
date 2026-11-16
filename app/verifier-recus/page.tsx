'use client';

import { useEffect, useState } from 'react';

type Recu = {
  recuNumero: string;
  statut: string;
  categorieNom: string;
  montant: number;
  soldeApres: number;
  modePaiement: string;
  referenceTransaction: string;
  dateOperation: string;
  anneeScolaire: string;
  enregistreParNom: string;
  eleve: { matricule: string; nom: string; postNom: string; prenom: string; classe: string };
  ecole: string | null;
};

/**
 * Vérification publique d'un reçu de frais scolaire (QR code du reçu).
 * Page accessible sans session : elle n'affiche que les mentions du reçu.
 */
export default function VerifierRecusPage() {
  const [numero, setNumero] = useState('');
  const [loading, setLoading] = useState(false);
  const [recu, setRecu] = useState<Recu | null>(null);
  const [error, setError] = useState('');

  async function verifier(value: string) {
    const cible = value.trim();
    if (!cible) return;
    setLoading(true);
    setError('');
    setRecu(null);
    try {
      const res = await fetch(`/api/finances/recus/${encodeURIComponent(cible)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Reçu introuvable.');
        return;
      }
      setRecu(data.recu);
    } catch {
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get('numero');
    if (initial) {
      setNumero(initial);
      verifier(initial);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">Vérification d&apos;un reçu</h1>
          <p className="mt-1 text-sm text-slate-500">
            School Manager RDC — authentification des reçus de frais scolaires
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifier(numero);
          }}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <label className="mb-1.5 block text-xs font-medium text-slate-600">Numéro du reçu</label>
          <div className="flex gap-2">
            <input
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="REC-2026-XXXXXX"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex-none rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? '…' : 'Vérifier'}
            </button>
          </div>
          {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>}
        </form>

        {recu && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <p className="bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              ✓ Reçu authentique — {recu.recuNumero}
            </p>
            <dl className="divide-y divide-slate-100 px-4 py-2 text-sm">
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-slate-500">Élève</dt>
                <dd className="text-right font-medium text-slate-800">
                  {recu.eleve.nom} {recu.eleve.postNom} {recu.eleve.prenom}
                </dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-slate-500">Classe / matricule</dt>
                <dd className="text-right font-medium text-slate-800">
                  {recu.eleve.classe} · {recu.eleve.matricule}
                </dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-slate-500">Établissement</dt>
                <dd className="text-right font-medium text-slate-800">{recu.ecole ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-slate-500">Frais</dt>
                <dd className="text-right font-medium text-slate-800">{recu.categorieNom}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-slate-500">Montant payé</dt>
                <dd className="text-right font-semibold text-emerald-700">
                  {new Intl.NumberFormat('fr-FR').format(recu.montant)} FC
                </dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-slate-500">Solde restant</dt>
                <dd className="text-right font-medium text-slate-800">
                  {new Intl.NumberFormat('fr-FR').format(recu.soldeApres)} FC
                </dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-slate-500">Date et heure</dt>
                <dd className="text-right font-medium text-slate-800">
                  {new Date(recu.dateOperation).toLocaleString('fr-FR')}
                </dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-slate-500">Mode de paiement</dt>
                <dd className="text-right font-medium text-slate-800">{recu.modePaiement}</dd>
              </div>
              <div className="flex justify-between gap-3 py-2">
                <dt className="text-slate-500">Enregistré par</dt>
                <dd className="text-right font-medium text-slate-800">{recu.enregistreParNom || '—'}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
