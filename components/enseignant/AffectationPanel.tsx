'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { Icon } from '@/components/ui/Icon';
import { CLASSES_RDC, MATIERES_RDC, CYCLES_RDC, type CycleRdc } from '@/lib/curriculum-rdc';
import { isSimpleFlowClass, getCycleForClass, getMatieresForCycle } from '@/lib/presence-flow';

type Affectation = {
  id: string;
  classe: string;
  matiere: string;
  niveau: string;
  statut: string;
};

type Props = {
  enseignantId: string;
  enseignantNom: string;
  ecoleId?: string | null;
  onClose: () => void;
  onChanged: () => void;
};

const inputClass =
  'w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/15';
const labelClass = 'mb-1.5 block text-[13px] font-medium text-slate-600';

export function AffectationPanel({ enseignantId, enseignantNom, ecoleId, onClose, onChanged }: Props) {
  const [affectations, setAffectations] = useState<Affectation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClasse, setSelectedClasse] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadAffectations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/enseignant-affectations?enseignantId=${enseignantId}`);
      const data = await res.json();
      setAffectations(data.affectations ?? []);
    } catch {
      setAffectations([]);
    } finally {
      setLoading(false);
    }
  }, [enseignantId]);

  useEffect(() => {
    loadAffectations();
  }, [loadAffectations]);

  // Classes déjà affectées (pour éviter les doublons visuels)
  const affectedClasses = new Set(affectations.map((a) => a.classe));

  // Déterminer si la classe sélectionnée est en flux simple ou séance
  const isSimple = selectedClasse ? isSimpleFlowClass(selectedClasse) : false;
  const cycle = selectedClasse ? getCycleForClass(selectedClasse) : null;

  // Matières disponibles pour la classe sélectionnée (flux séance uniquement)
  const matieresDisponibles = cycle ? getMatieresForCycle(cycle) : [];

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClasse) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/enseignant-affectations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enseignantId,
          classe: selectedClasse,
          matiere: isSimple ? '' : selectedMatiere,
          ecoleId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'affectation.');
      } else {
        setSelectedClasse('');
        setSelectedMatiere('');
        await loadAffectations();
        onChanged();
      }
    } catch {
      setError('Erreur réseau.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    try {
      await fetch('/api/enseignant-affectations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await loadAffectations();
      onChanged();
    } catch {
      // ignore
    }
  }

  // Grouper les affectations par classe
  const grouped = affectations.reduce<Record<string, Affectation[]>>((acc, a) => {
    if (!acc[a.classe]) acc[a.classe] = [];
    acc[a.classe].push(a);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        {/* En-tête */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
              <Icon name="teacher" className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Affectations pédagogiques</h2>
              <p className="text-xs text-slate-500">{enseignantNom}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          {/* Info pédagogique */}
          <div className="mb-4 rounded-xl bg-brand-50 px-4 py-3 text-xs text-brand-700">
            <strong>Titulaire</strong> (Maternel/Primaire/6e) → affectation par classe.
            <br />
            <strong>Professeur</strong> (7e–4e Humanités) → affectation par classe + matière.
          </div>

          {/* Formulaire d'ajout */}
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className={labelClass}>Classe / Niveau *</label>
              <select
                value={selectedClasse}
                onChange={(e) => {
                  setSelectedClasse(e.target.value);
                  setSelectedMatiere('');
                }}
                className={inputClass}
                required
              >
                <option value="">— Sélectionner une classe —</option>
                <optgroup label="Maternel & Primaire (Titulaire)">
                  {CLASSES_RDC.filter((c) => isSimpleFlowClass(c.nom)).map((c) => (
                    <option key={c.nom} value={c.nom}>
                      {c.nom} {affectedClasses.has(c.nom) ? '✓' : ''}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Secondaire (Professeur)">
                  {CLASSES_RDC.filter((c) => !isSimpleFlowClass(c.nom)).map((c) => (
                    <option key={c.nom} value={c.nom}>
                      {c.nom} {affectedClasses.has(c.nom) ? '✓' : ''}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Matière — uniquement pour le flux séance */}
            {selectedClasse && !isSimple && (
              <div>
                <label className={labelClass}>
                  Matière / Cours * <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedMatiere}
                  onChange={(e) => setSelectedMatiere(e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">— Sélectionner une matière —</option>
                  {matieresDisponibles.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {cycle && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Cycle: {cycle} — {matieresDisponibles.length} matière(s) disponible(s)
                  </p>
                )}
              </div>
            )}

            {selectedClasse && isSimple && (
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <Icon name="check-circle" className="mr-1 inline h-3.5 w-3.5 text-green-500" />
                Affectation en tant que titulaire — aucune matière requise.
              </div>
            )}

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={!selectedClasse || (!isSimple && !selectedMatiere) || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Ajout…</>
              ) : (
                <><Icon name="plus" className="h-4 w-4" /> Ajouter l'affectation</>
              )}
            </button>
          </form>

          {/* Liste des affectations existantes */}
          <div className="mt-5">
            <h3 className="mb-2 text-sm font-bold text-slate-800">
              Affectations actuelles ({affectations.length})
            </h3>
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : affectations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                <Icon name="teacher" className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                <p className="text-sm text-slate-400">Aucune affectation enregistrée.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(grouped).map(([classe, affs]) => {
                  const isSimpleClasse = isSimpleFlowClass(classe);
                  const cycleName = getCycleForClass(classe);
                  return (
                    <div key={classe} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={clsx(
                            'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium',
                            isSimpleClasse ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          )}>
                            {isSimpleClasse ? 'Titulaire' : 'Professeur'}
                          </span>
                          <span className="text-sm font-semibold text-slate-800">{classe}</span>
                          {cycleName && (
                            <span className="text-[11px] text-slate-400">· {cycleName}</span>
                          )}
                        </div>
                      </div>
                      {affs.map((a) => (
                        <div key={a.id} className="mt-2 flex items-center justify-between rounded-lg bg-white px-3 py-1.5">
                          <span className="text-xs text-slate-600">
                            {a.matiere || 'Classe entière (titulaire)'}
                          </span>
                          <button
                            onClick={() => handleRemove(a.id)}
                            className="rounded-md p-1 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Retirer l'affectation"
                          >
                            <Icon name="close" className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
