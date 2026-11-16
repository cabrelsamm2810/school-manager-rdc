'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { RecuModal } from '@/components/finances/RecuModal';
import { createIdempotencyKey, queuePaiement } from '@/lib/offline-paiements';
import {
  formatDateHeure,
  formatMontant,
  type EleveSituation,
  type PaiementHistorique,
  type RecuPaiement,
} from '@/lib/finance-types';

const STATUT_LABEL: Record<string, { label: string; className: string }> = {
  PAYE: { label: 'Payé', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  PARTIEL: { label: 'Partiel', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  EN_ATTENTE: { label: 'En attente', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
};

function recuFromHistorique(
  paiement: PaiementHistorique,
  situation: EleveSituation,
): RecuPaiement {
  return {
    recuNumero: paiement.recuNumero,
    categorieNom: paiement.categorieNom,
    montant: paiement.montant,
    soldeApres: paiement.soldeApres,
    modePaiement: paiement.modePaiement,
    referenceTransaction: paiement.referenceTransaction,
    dateOperation: paiement.dateOperation,
    enregistreParNom: paiement.enregistreParNom,
    anneeScolaire: situation.eleve.anneeScolaire,
  };
}

/**
 * Dossier financier d'un élève identifié : identité, totaux, situation par
 * frais, enregistrement d'un paiement et historique des reçus.
 */
export function EleveFinancePanel({
  situation,
  canPay,
  offline,
  pendingCount,
  onRefresh,
  onClose,
}: {
  situation: EleveSituation;
  canPay: boolean;
  offline: boolean;
  pendingCount: number;
  onRefresh: () => void;
  onClose: () => void;
}) {
  const premiereLigne = situation.frais.find((row) => row.solde > 0) ?? situation.frais[0];
  const [categorieId, setCategorieId] = useState(premiereLigne?.categorieId ?? '');
  const [montant, setMontant] = useState(premiereLigne ? String(premiereLigne.solde || premiereLigne.montant) : '');
  const [modePaiement, setModePaiement] = useState(situation.modesPaiement[0] ?? 'Espèces');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [recu, setRecu] = useState<{ recu: RecuPaiement; offline: boolean } | null>(null);

  function selectMontant(value: string) {
    setCategorieId(value);
    const row = situation.frais.find((item) => item.categorieId === value);
    if (row) setMontant(String(row.solde || row.montant));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    const row = situation.frais.find((item) => item.categorieId === categorieId);
    const montantNum = Math.round(Number(montant));

    if (!row) {
      setError('Sélectionnez le frais concerné.');
      return;
    }
    if (!Number.isFinite(montantNum) || montantNum <= 0) {
      setError('Saisissez un montant supérieur à zéro.');
      return;
    }
    if (!modePaiement) {
      setError('Sélectionnez un mode de paiement.');
      return;
    }

    const dateOperation = new Date().toISOString();
    const idempotencyKey = createIdempotencyKey();
    const base = {
      eleveId: situation.eleve.id,
      categorieId: row.categorieId,
      montant: montantNum,
      modePaiement,
      referenceTransaction: reference.trim(),
      anneeScolaire: situation.eleve.anneeScolaire,
      dateOperation,
    };

    // Hors connexion : la saisie part dans la file locale, sans doublon possible.
    if (offline) {
      queuePaiement({
        ...base,
        idempotencyKey,
        eleveNom: `${situation.eleve.nom} ${situation.eleve.prenom}`,
        categorieNom: row.nom,
      });
      setRecu({
        offline: true,
        recu: {
          recuNumero: 'En attente de synchro',
          categorieNom: row.nom,
          montant: montantNum,
          soldeApres: Math.max(0, row.solde - montantNum),
          modePaiement,
          referenceTransaction: reference.trim(),
          dateOperation,
          enregistreParNom: '',
          anneeScolaire: situation.eleve.anneeScolaire,
        },
      });
      setReference('');
      onRefresh();
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/finances/paiements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...base, idempotencyKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "L'enregistrement du paiement a échoué.");
        return;
      }
      setRecu({ offline: false, recu: { ...data.paiement, anneeScolaire: base.anneeScolaire } });
      setReference('');
      onRefresh();
    } catch {
      setError('Erreur réseau — utilisez le mode hors connexion une fois la page rechargée.');
    } finally {
      setSubmitting(false);
    }
  }

  const eleve = situation.eleve;

  return (
    <div className="space-y-4">
      {/* Identité */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Avatar photoUrl={eleve.photoUrl} nom={eleve.nom} prenom={eleve.prenom} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold text-slate-900">
              {eleve.nom} {eleve.postNom} {eleve.prenom}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {eleve.classe} · {eleve.ecole ?? 'Établissement non renseigné'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Matricule {eleve.matricule} · Année {eleve.anneeScolaire}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200"
            aria-label="Fermer le dossier"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Total à payer</p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">{formatMontant(situation.totaux.aPayer)}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wide text-emerald-600">Total payé</p>
            <p className="mt-0.5 text-sm font-bold text-emerald-700">{formatMontant(situation.totaux.paye)}</p>
          </div>
          <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wide text-amber-600">Solde restant</p>
            <p className="mt-0.5 text-sm font-bold text-amber-700">{formatMontant(situation.totaux.solde)}</p>
          </div>
        </div>

        {pendingCount > 0 && (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            {pendingCount} paiement(s) en attente de synchronisation sur cet appareil.
          </p>
        )}
      </div>

      {/* Situation financière */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-800">Situation financière de l&apos;élève</h2>
        <div className="-mx-1 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-1 py-2 font-semibold">Frais</th>
                <th className="px-1 py-2 text-right font-semibold">Montant</th>
                <th className="px-1 py-2 text-right font-semibold">Payé</th>
                <th className="px-1 py-2 text-right font-semibold">Solde</th>
                <th className="px-1 py-2 text-right font-semibold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {situation.frais.map((row) => {
                const statut = STATUT_LABEL[row.statut] ?? STATUT_LABEL.EN_ATTENTE;
                return (
                  <tr key={`${row.categorieId ?? row.nom}`} className="border-t border-slate-100">
                    <td className="px-1 py-2.5 font-medium text-slate-800">{row.nom}</td>
                    <td className="px-1 py-2.5 text-right text-slate-600">{formatMontant(row.montant)}</td>
                    <td className="px-1 py-2.5 text-right text-emerald-700">{formatMontant(row.paye)}</td>
                    <td className="px-1 py-2.5 text-right font-semibold text-slate-900">
                      {formatMontant(row.solde)}
                    </td>
                    <td className="px-1 py-2.5 text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${statut.className}`}
                      >
                        {statut.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {situation.frais.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-1 py-4 text-center text-xs text-slate-400">
                    Aucun frais configuré pour cet établissement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enregistrement d'un paiement */}
      {canPay && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-slate-800">Enregistrer un paiement</h2>

          <label className="mb-1.5 block text-xs font-medium text-slate-600">Frais concerné</label>
          <select
            value={categorieId}
            onChange={(e) => selectMontant(e.target.value)}
            className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">— Sélectionner un frais —</option>
            {situation.frais.map((row) => (
              <option key={`opt-${row.categorieId ?? row.nom}`} value={row.categorieId ?? ''}>
                {row.nom} — solde {formatMontant(row.solde)}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Montant payé (FC)</label>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={montant}
                onChange={(e) => setMontant(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Mode de paiement</label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                {situation.modesPaiement.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
                {situation.modesPaiement.length === 0 && <option value="Espèces">Espèces</option>}
              </select>
            </div>
          </div>

          <label className="mb-1.5 mt-3 block text-xs font-medium text-slate-600">
            Référence de transaction (optionnel)
          </label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="N° Airtel / Orange / M-Pesa, bordereau…"
            className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />

          {error && (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-700 hover:to-blue-600 disabled:opacity-60"
          >
            {submitting ? 'Enregistrement…' : offline ? 'Enregistrer hors connexion' : 'Valider le paiement'}
          </button>
          <p className="mt-2 text-center text-[11px] text-slate-400">
            Le reçu numérique est généré automatiquement après validation.
          </p>
        </form>
      )}

      {/* Historique */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-bold text-slate-800">Historique des paiements</h2>
        {situation.paiements.length === 0 ? (
          <p className="text-xs text-slate-400">Aucun paiement enregistré pour cette année scolaire.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {situation.paiements.map((paiement) => (
              <li key={paiement.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{paiement.categorieNom}</p>
                  <p className="text-[11px] text-slate-500">
                    {formatDateHeure(paiement.dateOperation)} · {paiement.modePaiement} ·{' '}
                    {paiement.enregistreParNom || 'Utilisateur'}
                  </p>
                  <p className="text-[11px] text-slate-400">{paiement.recuNumero}</p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{formatMontant(paiement.montant)}</span>
                  <button
                    type="button"
                    onClick={() => setRecu({ offline: false, recu: recuFromHistorique(paiement, situation) })}
                    className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Reçu
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {recu && (
        <RecuModal
          recu={recu.recu}
          offline={recu.offline}
          eleve={{
            matricule: eleve.matricule,
            nom: eleve.nom,
            postNom: eleve.postNom,
            prenom: eleve.prenom,
            classe: eleve.classe,
            ecole: eleve.ecole,
          }}
          onClose={() => setRecu(null)}
        />
      )}
    </div>
  );
}
