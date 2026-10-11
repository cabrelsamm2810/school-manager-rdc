'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { clsx } from 'clsx';
import { PERIODES, getCurrentAnneeScolaire, calculateGrades, isValidCote, getMention } from '@/lib/cahier-de-cote';
import { BulletinPreview } from './BulletinPreview';
import { BulletinBatchPreview } from './BulletinBatchPreview';
import { BulletinSinglePreview } from './BulletinSinglePreview';

type SessionUser = {
  id: string;
  nom: string;
  prenom: string;
  role: string;
  ecoleId?: string | null;
  typeInstitution?: string;
};

type Eleve = {
  id: string;
  matricule: string;
  nom: string;
  postNom: string;
  prenom: string;
  classe: string;
};

type CahierDeCoteEntry = {
  id: string;
  eleveId: string;
  devoir1: number;
  devoir2: number;
  examen: number;
  total: number;
  moyenne: number;
  pourcentage: number;
  mention: string;
  statut: string;
  saisieParId: string;
};

type GradeInput = {
  devoir1: string;
  devoir2: string;
  examen: string;
};

const ANNEE_SCOLAIRE = getCurrentAnneeScolaire();

const MENTION_COLORS: Record<string, string> = {
  'Excellent': 'bg-emerald-100 text-emerald-700',
  'Très Bien': 'bg-blue-100 text-blue-700',
  'Bien': 'bg-sky-100 text-sky-700',
  'Assez Bien': 'bg-amber-100 text-amber-700',
  'Passable': 'bg-orange-100 text-orange-700',
  'Insuffisant': 'bg-red-100 text-red-700',
};

export function CahierDeCoteManager() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [classes, setClasses] = useState<string[]>([]);
  const [ecoles, setEcoles] = useState<{ id: string; nom: string }[]>([]);
  const [selectedEtab, setSelectedEtab] = useState<string>('');
  const [selectedClasse, setSelectedClasse] = useState('');
  const [selectedCours, setSelectedCours] = useState('');
  const [selectedPeriode, setSelectedPeriode] = useState<string>(PERIODES[0]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [existingCotes, setExistingCotes] = useState<Map<string, CahierDeCoteEntry>>(new Map());
  const [grades, setGrades] = useState<Record<string, GradeInput>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBulletin, setShowBulletin] = useState(false);
  const [bulletinEleveId, setBulletinEleveId] = useState('');
  const [showBatchPreview, setShowBatchPreview] = useState(false);
  const [showSinglePreview, setShowSinglePreview] = useState(false);
  const [singlePreviewEleve, setSinglePreviewEleve] = useState<Eleve | null>(null);
  const [batchDownloading, setBatchDownloading] = useState(false);

  const isDirection = user && (user.role === 'DIRECTION_ECOLE' || user.role === 'SUPER_ADMIN');
  const canValidate = user && (user.role === 'DIRECTION_ECOLE' || user.role === 'SUPER_ADMIN' ||
    user.role === 'COORDINATION_PROVINCIALE' || user.role === 'COORDINATION_SOUS_PROVINCIALE');

  // Charger la session et les options
  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data?.authenticated) {
          setUser(data.user);
          if (data.user.ecoleId) {
            setSelectedEtab(data.user.ecoleId);
          }
        }
      })
      .catch(() => {});

    fetch('/api/cahier-de-cote/options')
      .then((r) => r.json())
      .then((data) => {
        if (data.classes) setClasses(data.classes);
        if (data.ecoles) setEcoles(data.ecoles);
      })
      .catch(() => {});
  }, []);

  // Charger les élèves quand la classe change
  useEffect(() => {
    if (!selectedClasse) {
      setEleves([]);
      return;
    }
    const params = new URLSearchParams({ classe: selectedClasse });
    if (selectedEtab) params.set('ecoleId', selectedEtab);

    fetch(`/api/eleves?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const list: Eleve[] = data.eleves || [];
        setEleves(list);
        // Initialiser les champs de saisie
        const initial: Record<string, GradeInput> = {};
        list.forEach((e) => {
          initial[e.id] = { devoir1: '', devoir2: '', examen: '' };
        });
        setGrades(initial);
      })
      .catch(() => setEleves([]));
  }, [selectedClasse, selectedEtab]);

  // Charger les cotes existantes quand tous les sélecteurs sont choisis
  const loadExistingCotes = useCallback(async () => {
    if (!selectedClasse || !selectedCours || !selectedPeriode) return;

    const params = new URLSearchParams({
      classe: selectedClasse,
      cours: selectedCours,
      periode: selectedPeriode,
      anneeScolaire: ANNEE_SCOLAIRE,
    });
    if (selectedEtab) params.set('ecoleId', selectedEtab);

    try {
      const res = await fetch(`/api/cahier-de-cote?${params}`);
      const data = await res.json();
      const entries: CahierDeCoteEntry[] = data.cahierDeCotes || [];
      const map = new Map<string, CahierDeCoteEntry>();
      entries.forEach((e) => map.set(e.eleveId, e));
      setExistingCotes(map);

      // Pré-remplir les champs avec les cotes existantes
      setGrades((prev) => {
        const updated = { ...prev };
        entries.forEach((e) => {
          updated[e.eleveId] = {
            devoir1: e.devoir1 ? String(e.devoir1) : '',
            devoir2: e.devoir2 ? String(e.devoir2) : '',
            examen: e.examen ? String(e.examen) : '',
          };
        });
        return updated;
      });
    } catch {
      setExistingCotes(new Map());
    }
  }, [selectedClasse, selectedCours, selectedPeriode, selectedEtab]);

  useEffect(() => {
    if (selectedClasse && selectedCours && selectedPeriode) {
      loadExistingCotes();
    }
  }, [loadExistingCotes, selectedClasse, selectedCours, selectedPeriode]);

  // Calculs automatiques pour chaque élève
  const computedGrades = useMemo(() => {
    const result: Record<string, { total: number; moyenne: number; pourcentage: number; mention: string; hasError: boolean; hasData: boolean }> = {};
    eleves.forEach((e) => {
      const g = grades[e.id] || { devoir1: '', devoir2: '', examen: '' };
      const d1 = g.devoir1 === '' ? null : Number(g.devoir1);
      const d2 = g.devoir2 === '' ? null : Number(g.devoir2);
      const ex = g.examen === '' ? null : Number(g.examen);

      const hasData = d1 !== null || d2 !== null || ex !== null;
      const hasError =
        (d1 !== null && !isValidCote(d1)) ||
        (d2 !== null && !isValidCote(d2)) ||
        (ex !== null && !isValidCote(ex));

      if (hasData && !hasError) {
        const calc = calculateGrades(d1 || 0, d2 || 0, ex || 0);
        result[e.id] = { ...calc, hasError: false, hasData: true };
      } else {
        result[e.id] = { total: 0, moyenne: 0, pourcentage: 0, mention: '', hasError, hasData };
      }
    });
    return result;
  }, [eleves, grades]);

  // Statistiques globales
  const stats = useMemo(() => {
    const valid = eleves.filter((e) => computedGrades[e.id]?.hasData && !computedGrades[e.id]?.hasError);
    if (valid.length === 0) return { count: 0, moyenne: 0, pourcentage: 0, mention: '' };
    const totalMoyenne = valid.reduce((sum, e) => sum + computedGrades[e.id].moyenne, 0);
    const moyenne = Math.round((totalMoyenne / valid.length) * 100) / 100;
    const pourcentage = Math.round((moyenne / 20) * 100 * 100) / 100;
    return { count: valid.length, moyenne, pourcentage, mention: getMention(pourcentage) };
  }, [eleves, computedGrades]);

  function handleGradeChange(eleveId: string, field: keyof GradeInput, value: string) {
    setGrades((prev) => ({
      ...prev,
      [eleveId]: { ...prev[eleveId], [field]: value },
    }));
  }

  async function handleSave() {
    if (!selectedClasse || !selectedCours || !selectedPeriode) {
      setError('Veuillez sélectionner la classe, le cours et la période.');
      return;
    }
    if (eleves.length === 0) {
      setError('Aucun élève dans cette classe.');
      return;
    }

    // Vérifier les erreurs de saisie
    const hasErrors = eleves.some((e) => computedGrades[e.id]?.hasError);
    if (hasErrors) {
      setError('Certaines cotes sont invalides (doivent être entre 0 et 20). Veuillez corriger avant d\'enregistrer.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const entries = eleves.map((e) => {
        const g = grades[e.id] || { devoir1: '', devoir2: '', examen: '' };
        return {
          eleveId: e.id,
          eleveMatricule: e.matricule,
          eleveNom: `${e.prenom} ${e.nom} ${e.postNom}`.trim(),
          devoir1: g.devoir1 === '' ? 0 : Number(g.devoir1),
          devoir2: g.devoir2 === '' ? 0 : Number(g.devoir2),
          examen: g.examen === '' ? 0 : Number(g.examen),
        };
      });

      const res = await fetch('/api/cahier-de-cote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ecoleId: selectedEtab || null,
          ecoleNom: ecoles.find((e) => e.id === selectedEtab)?.nom || '',
          classe: selectedClasse,
          cours: selectedCours,
          enseignantNom: user ? `${user.prenom} ${user.nom}`.trim() : '',
          periode: selectedPeriode,
          anneeScolaire: ANNEE_SCOLAIRE,
          entries,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'enregistrement.');

      setSuccess(`${data.saved} cote(s) enregistrée(s) avec succès.`);
      loadExistingCotes();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  }

  async function handleValidate() {
    if (!selectedClasse || !selectedCours || !selectedPeriode) return;

    setValidating(true);
    setError('');

    try {
      const entries = Array.from(existingCotes.values());
      for (const entry of entries) {
        if (entry.statut !== 'Validé') {
          await fetch(`/api/cahier-de-cote/${entry.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ statut: 'Validé' }),
          });
        }
      }
      setSuccess('Cotes validées avec succès.');
      loadExistingCotes();
    } catch {
      setError('Erreur lors de la validation.');
    } finally {
      setValidating(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleGenerateBulletin(eleveId: string) {
    setBulletinEleveId(eleveId);
    setShowBulletin(true);
  }

  function handleSinglePreview(eleve: Eleve) {
    setSinglePreviewEleve(eleve);
    setShowSinglePreview(true);
  }

  async function handleSingleDownloadPdf() {
    if (!singlePreviewEleve) return;
    try {
      // Générer le bulletin d'abord
      const genRes = await fetch('/api/cahier-de-cote/bulletin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eleveId: singlePreviewEleve.id, periode: selectedPeriode, anneeScolaire: ANNEE_SCOLAIRE }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) throw new Error(genData.error || 'Erreur');
      // Télécharger le PDF
      const res = await fetch(`/api/cahier-de-cote/bulletin/pdf?bulletinId=${genData.bulletin.id}`);
      if (!res.ok) throw new Error('Erreur lors de la génération du PDF');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulletin_${singlePreviewEleve.prenom}_${singlePreviewEleve.nom}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setShowSinglePreview(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du téléchargement.');
    }
  }

  async function handleBatchDownloadPdf() {
    if (!selectedClasse || !selectedPeriode) return;
    setBatchDownloading(true);
    setError('');
    setSuccess('');
    try {
      const params = new URLSearchParams({
        classe: selectedClasse,
        periode: selectedPeriode,
        anneeScolaire: ANNEE_SCOLAIRE,
      });
      if (selectedEtab) params.set('ecoleId', selectedEtab);

      const res = await fetch(`/api/cahier-de-cote/bulletin/pdf-batch?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Erreur lors de la génération des bulletins');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulletins_${selectedClasse.replace(/\s+/g, '_')}_${selectedPeriode.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setSuccess('Tous les bulletins ont été téléchargés dans un PDF unique.');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération des bulletins.');
    } finally {
      setBatchDownloading(false);
    }
  }

  const allSelectorsReady = selectedClasse && selectedCours && selectedPeriode;
  const hasData = eleves.length > 0 && allSelectorsReady;

  return (
    <div className="space-y-4">
      {/* ── Sélecteurs ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft md:p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Sélection</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* École (si applicable) */}
          {ecoles.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">École</label>
              <select
                value={selectedEtab}
                onChange={(e) => setSelectedEtab(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Tous</option>
                {ecoles.map((e) => (
                  <option key={e.id} value={e.id}>{e.nom}</option>
                ))}
              </select>
            </div>
          )}

          {/* Classe */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Classe</label>
            <select
              value={selectedClasse}
              onChange={(e) => setSelectedClasse(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">— Sélectionner —</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Cours */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Cours</label>
            <input
              type="text"
              list="cours-list"
              value={selectedCours}
              onChange={(e) => setSelectedCours(e.target.value)}
              placeholder="Nom du cours"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <datalist id="cours-list">
              {Array.from(existingCotes.values()).map((c, i) => (
                <option key={i} value={c.eleveId} />
              ))}
            </datalist>
          </div>

          {/* Période */}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Période</label>
            <select
              value={selectedPeriode}
              onChange={(e) => setSelectedPeriode(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              {PERIODES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Année scolaire */}
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <span className="font-medium">Année scolaire:</span>
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 font-medium text-blue-600">{ANNEE_SCOLAIRE}</span>
        </div>
      </div>

      {/* ── Messages ── */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {/* ── Barre d'actions ── */}
      {hasData && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : '💾 Enregistrer'}
          </button>
          {canValidate && (
            <button
              onClick={handleValidate}
              disabled={validating || existingCotes.size === 0}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {validating ? 'Validation...' : '✓ Valider'}
            </button>
          )}
          <button
            onClick={handlePrint}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            🖨️ Imprimer
          </button>
          <button
            onClick={() => setShowBatchPreview(true)}
            disabled={eleves.length === 0}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Aperçu & bulletins (PDF)
          </button>
        </div>
      )}

      {/* ── Statistiques ── */}
      {hasData && stats.count > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-xs text-slate-500">Élèves notés</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{stats.count}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-xs text-slate-500">Moyenne classe</p>
            <p className="mt-1 text-xl font-bold text-blue-600">{stats.moyenne}/20</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-xs text-slate-500">Pourcentage</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{stats.pourcentage}%</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
            <p className="text-xs text-slate-500">Mention</p>
            <p className={clsx('mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold', MENTION_COLORS[stats.mention] || 'bg-slate-100 text-slate-600')}>
              {stats.mention}
            </p>
          </div>
        </div>
      )}

      {/* ── Tableau des cotes ── */}
      {hasData ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft print-area">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Cahier de cote — {selectedClasse} — {selectedCours}
            </h3>
            <p className="text-xs text-slate-500">{selectedPeriode} — {ANNEE_SCOLAIRE}</p>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-3 py-2 text-left font-medium">Matricule</th>
                  <th className="px-3 py-2 text-left font-medium">Nom</th>
                  <th className="px-3 py-2 text-center font-medium">D1 /20</th>
                  <th className="px-3 py-2 text-center font-medium">D2 /20</th>
                  <th className="px-3 py-2 text-center font-medium">Exam /20</th>
                  <th className="px-3 py-2 text-center font-medium">Total</th>
                  <th className="px-3 py-2 text-center font-medium">Moy.</th>
                  <th className="px-3 py-2 text-center font-medium">%</th>
                  <th className="px-3 py-2 text-center font-medium">Mention</th>
                  <th className="px-3 py-2 text-center font-medium">Statut</th>
                  <th className="px-3 py-2 text-center font-medium">Bulletin</th>
                </tr>
              </thead>
              <tbody>
                {eleves.map((e, idx) => {
                  const cg = computedGrades[e.id];
                  const existing = existingCotes.get(e.id);
                  const isLocked = existing?.statut === 'Validé' && !isDirection;
                  return (
                    <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-600">{e.matricule}</td>
                      <td className="px-3 py-2 font-medium text-slate-900">{e.prenom} {e.nom} {e.postNom}</td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.5}
                          value={grades[e.id]?.devoir1 || ''}
                          onChange={(ev) => handleGradeChange(e.id, 'devoir1', ev.target.value)}
                          disabled={isLocked}
                          className={clsx(
                            'w-16 rounded-lg border px-2 py-1 text-center text-sm focus:ring-2',
                            cg?.hasError ? 'border-red-400 bg-red-50 focus:ring-red-200' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200',
                            isLocked && 'bg-slate-100 text-slate-400'
                          )}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.5}
                          value={grades[e.id]?.devoir2 || ''}
                          onChange={(ev) => handleGradeChange(e.id, 'devoir2', ev.target.value)}
                          disabled={isLocked}
                          className={clsx(
                            'w-16 rounded-lg border px-2 py-1 text-center text-sm focus:ring-2',
                            cg?.hasError ? 'border-red-400 bg-red-50 focus:ring-red-200' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200',
                            isLocked && 'bg-slate-100 text-slate-400'
                          )}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={0.5}
                          value={grades[e.id]?.examen || ''}
                          onChange={(ev) => handleGradeChange(e.id, 'examen', ev.target.value)}
                          disabled={isLocked}
                          className={clsx(
                            'w-16 rounded-lg border px-2 py-1 text-center text-sm focus:ring-2',
                            cg?.hasError ? 'border-red-400 bg-red-50 focus:ring-red-200' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200',
                            isLocked && 'bg-slate-100 text-slate-400'
                          )}
                        />
                      </td>
                      <td className="px-3 py-2 text-center font-medium text-slate-700">{cg?.hasData ? cg.total.toFixed(2) : '—'}</td>
                      <td className="px-3 py-2 text-center font-bold text-slate-900">{cg?.hasData ? cg.moyenne.toFixed(2) : '—'}</td>
                      <td className="px-3 py-2 text-center text-slate-600">{cg?.hasData ? `${cg.pourcentage}%` : '—'}</td>
                      <td className="px-3 py-2 text-center">
                        {cg?.mention && (
                          <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', MENTION_COLORS[cg.mention])}>
                            {cg.mention}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {existing && (
                          <span className={clsx(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            existing.statut === 'Validé' ? 'bg-emerald-100 text-emerald-700' :
                            existing.statut === 'Enregistré' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-500'
                          )}>
                            {existing.statut}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSinglePreview(e)}
                            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
                            title="Aperçu du bulletin"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleGenerateBulletin(e.id)}
                            disabled={!existing}
                            className="rounded-lg p-1.5 text-blue-600 transition hover:bg-blue-50 disabled:opacity-30"
                            title="Générer le bulletin QR"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                              <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14h1v1M14 20h7v1" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 p-3 md:hidden">
            {eleves.map((e, idx) => {
              const cg = computedGrades[e.id];
              const existing = existingCotes.get(e.id);
              const isLocked = existing?.statut === 'Validé' && !isDirection;
              return (
                <div key={e.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{e.prenom} {e.nom}</p>
                      <p className="text-xs text-slate-500">{e.matricule}</p>
                    </div>
                    {existing && (
                      <span className={clsx(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        existing.statut === 'Validé' ? 'bg-emerald-100 text-emerald-700' :
                        existing.statut === 'Enregistré' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-500'
                      )}>
                        {existing.statut}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-slate-500">D1 /20</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        step={0.5}
                        value={grades[e.id]?.devoir1 || ''}
                        onChange={(ev) => handleGradeChange(e.id, 'devoir1', ev.target.value)}
                        disabled={isLocked}
                        className={clsx(
                          'w-full rounded-lg border px-2 py-1.5 text-center text-sm focus:ring-2',
                          cg?.hasError ? 'border-red-400 bg-red-50' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200',
                          isLocked && 'bg-slate-100 text-slate-400'
                        )}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">D2 /20</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        step={0.5}
                        value={grades[e.id]?.devoir2 || ''}
                        onChange={(ev) => handleGradeChange(e.id, 'devoir2', ev.target.value)}
                        disabled={isLocked}
                        className={clsx(
                          'w-full rounded-lg border px-2 py-1.5 text-center text-sm focus:ring-2',
                          cg?.hasError ? 'border-red-400 bg-red-50' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200',
                          isLocked && 'bg-slate-100 text-slate-400'
                        )}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Exam /20</label>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        step={0.5}
                        value={grades[e.id]?.examen || ''}
                        onChange={(ev) => handleGradeChange(e.id, 'examen', ev.target.value)}
                        disabled={isLocked}
                        className={clsx(
                          'w-full rounded-lg border px-2 py-1.5 text-center text-sm focus:ring-2',
                          cg?.hasError ? 'border-red-400 bg-red-50' : 'border-slate-300 focus:border-blue-500 focus:ring-blue-200',
                          isLocked && 'bg-slate-100 text-slate-400'
                        )}
                      />
                    </div>
                  </div>
                  {cg?.hasData && !cg?.hasError && (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5">
                      <span className="text-xs text-slate-500">Moy: <strong className="text-slate-900">{cg.moyenne.toFixed(2)}/20</strong> ({cg.pourcentage}%)</span>
                      <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', MENTION_COLORS[cg.mention])}>
                        {cg.mention}
                      </span>
                    </div>
                  )}
                  {cg?.hasError && (
                    <p className="mt-1 text-xs text-red-600">⚠ Cote invalide (0-20)</p>
                  )}
                  {existing && (
                    <button
                      onClick={() => handleGenerateBulletin(e.id)}
                      className="mt-2 w-full rounded-lg border border-blue-200 bg-blue-50 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
                    >
                      📋 Générer le bulletin QR
                    </button>
                  )}
                  <button
                    onClick={() => handleSinglePreview(e)}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    👁️ Aperçu du bulletin
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : allSelectorsReady ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">Aucun élève trouvé pour cette classe.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">Sélectionnez une classe, un cours et une période pour afficher les élèves.</p>
        </div>
      )}

      {/* ── Modal Bulletin ── */}
      {showBulletin && (
        <BulletinPreview
          eleveId={bulletinEleveId}
          periode={selectedPeriode}
          anneeScolaire={ANNEE_SCOLAIRE}
          onClose={() => setShowBulletin(false)}
        />
      )}

      {/* ── Modal Aperçu bulletin individuel ── */}
      {showSinglePreview && singlePreviewEleve && (
        <BulletinSinglePreview
          eleveId={singlePreviewEleve.id}
          eleveNom={`${singlePreviewEleve.prenom} ${singlePreviewEleve.nom} ${singlePreviewEleve.postNom}`.trim()}
          classe={selectedClasse}
          periode={selectedPeriode}
          anneeScolaire={ANNEE_SCOLAIRE}
          onClose={() => setShowSinglePreview(false)}
          onDownload={handleSingleDownloadPdf}
        />
      )}

      {/* ── Modal Aperçu batch ── */}
      {showBatchPreview && (
        <BulletinBatchPreview
          classe={selectedClasse}
          periode={selectedPeriode}
          anneeScolaire={ANNEE_SCOLAIRE}
          ecoleId={selectedEtab}
          onClose={() => setShowBatchPreview(false)}
          onDownload={handleBatchDownloadPdf}
        />
      )}
    </div>
  );
}
