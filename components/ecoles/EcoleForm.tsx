'use client';

import { useState, useEffect, FormEvent } from 'react';
import { INSTITUTIONS, DOCUMENT_TYPES, VALIDATION_STATUTS } from '@/lib/institutions';
import { allProvinces, educationProvincesByAdmin } from '@/lib/meta-data';

export type EcoleFormData = {
  nom: string;
  type: string;
  institution: string;
  dinacope: string;
  province: string;
  provinceEducationnelle: string;
  ville: string;
  commune: string;
  adresse: string;
  localisationGeo: string;
  telephone: string;
  email: string;
  chefEcole: string;
  logoUrl: string;
  effectif: string;
  statut: string;
  statutValidation: string;
  coordSousProvincialeId: string;
  ecErcId: string;
  structureRattachementId: string;
  structureRattachementType: string;
};

export const emptyForm: EcoleFormData = {
  nom: '', type: '', institution: '', dinacope: '', province: '',
  provinceEducationnelle: '', ville: '', commune: '', adresse: '',
  localisationGeo: '', telephone: '', email: '', chefEcole: '',
  logoUrl: '', effectif: '', statut: 'Actif', statutValidation: 'Brouillon',
  coordSousProvincialeId: '', ecErcId: '', structureRattachementId: '',
  structureRattachementType: '',
};

type Structure = { id: string; nom: string; province: string };

const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';
const requiredMark = <span className="text-red-500"> *</span>;

type Props = {
  initialData?: Partial<EcoleFormData> | null;
  onSubmit: (data: EcoleFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  loading?: boolean;
  error?: string;
};

export function EcoleForm({ initialData, onSubmit, onCancel, submitLabel = 'Enregistrer', loading, error }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<EcoleFormData>({ ...emptyForm, ...initialData });
  const [structures, setStructures] = useState<Structure[]>([]);
  const [structuresLoading, setStructuresLoading] = useState(false);

  const selectedInstitution = INSTITUTIONS.find((i) => i.code === form.institution);
  const educationProvinces = form.province ? (educationProvincesByAdmin[form.province] || []) : [];

  // Charger les structures administratives quand l'institution change
  useEffect(() => {
    if (!form.institution) {
      setStructures([]);
      return;
    }
    setStructuresLoading(true);
    fetch(`/api/institutions?institution=${form.institution}`)
      .then((r) => r.json())
      .then((data) => {
        setStructures(data.structures?.coordSousProvinciales || []);
      })
      .catch(() => setStructures([]))
      .finally(() => setStructuresLoading(false));
  }, [form.institution]);

  function update<K extends keyof EcoleFormData>(key: K, value: EcoleFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function selectInstitution(code: string) {
    update('institution', code);
    // Réinitialiser les structures liées
    update('coordSousProvincialeId', '');
    update('structureRattachementId', '');
    update('structureRattachementType', INSTITUTIONS.find((i) => i.code === code)?.structureCompetente || '');
  }

  function handleProvinceChange(prov: string) {
    update('province', prov);
    update('provinceEducationnelle', '');
    update('coordSousProvincialeId', '');
    update('structureRattachementId', '');
  }

  function handleProvinceEducChange(provEduc: string) {
    update('provinceEducationnelle', provEduc);
    update('coordSousProvincialeId', '');
    update('structureRattachementId', '');
  }

  // Filtrer les structures par province administrative sélectionnée (cascade)
  const filteredStructures = form.province
    ? structures.filter((s) => s.province === form.province)
    : structures;

  function canProceedStep1() {
    return !!form.institution;
  }
  function canProceedStep2() {
    return !!form.province && !!form.provinceEducationnelle && !!form.coordSousProvincialeId;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Indicateur d'étapes */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition ${
              step >= s ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {s}
            </div>
            <span className={`hidden text-sm font-medium sm:block ${step >= s ? 'text-slate-900' : 'text-slate-400'}`}>
              {s === 1 ? 'Institution' : s === 2 ? 'Parcours administratif' : 'Informations'}
            </span>
            {s < 3 && <div className={`h-0.5 flex-1 ${step > s ? 'bg-blue-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {/* ── Étape 1 : Sélection de l'institution ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Sélectionnez l'institution de l'école</h3>
            <p className="mt-1 text-sm text-slate-500">L'école sera rattachée à cette institution et suivra son parcours administratif.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {INSTITUTIONS.map((inst) => (
              <button
                key={inst.code}
                type="button"
                onClick={() => selectInstitution(inst.code)}
                className={`rounded-2xl border-2 p-4 text-left transition ${
                  form.institution === inst.code
                    ? `${inst.borderColor} ${inst.bgColor} ring-2 ring-blue-500/30`
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${inst.bgColor} ${inst.color}`}>
                    <span className="text-lg font-bold">{inst.label[0]}</span>
                  </div>
                  <div>
                    <p className={`font-semibold ${inst.color}`}>{inst.label}</p>
                    <p className="text-xs text-slate-500">{inst.description}</p>
                  </div>
                </div>
                {form.institution === inst.code && (
                  <div className="mt-3 rounded-lg bg-white/60 px-3 py-2">
                    <p className="text-xs font-medium text-slate-600">Parcours administratif :</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {inst.adminPath.map((a) => a.label).join(' → ')} → École
                    </p>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={!canProceedStep1()}
              onClick={() => setStep(2)}
              className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50"
            >
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* ── Étape 2 : Parcours administratif ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Parcours administratif</h3>
              <p className="mt-1 text-sm text-slate-500">
                Rattachez l'école à sa province et à sa structure compétente.
              </p>
            </div>
            <span className={`rounded-lg px-3 py-1 text-xs font-medium ${selectedInstitution?.bgColor} ${selectedInstitution?.color}`}>
              {selectedInstitution?.label}
            </span>
          </div>

          {/* Chemin visuel */}
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="font-medium text-slate-600">{selectedInstitution?.label}</span>
              <span className="text-slate-400">→</span>
              <span className="font-medium text-slate-600">{form.province || 'Province'}</span>
              <span className="text-slate-400">→</span>
              <span className="font-medium text-slate-600">{form.provinceEducationnelle || 'Province éduc.'}</span>
              <span className="text-slate-400">→</span>
              <span className="whitespace-nowrap font-medium text-slate-600">
                {filteredStructures.find((s) => s.id === form.coordSousProvincialeId)?.nom || 'Structure compétente'}
              </span>
              <span className="text-slate-400">→</span>
              <span className="whitespace-nowrap font-medium text-blue-600">École</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="etab-province">Province{requiredMark}</label>
              <select id="etab-province" value={form.province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                className={inputClass} required>
                <option value="">— Sélectionner —</option>
                {allProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="etab-prov-educ">Province éducationnelle{requiredMark}</label>
              <select id="etab-prov-educ" value={form.provinceEducationnelle}
                onChange={(e) => handleProvinceEducChange(e.target.value)}
                className={inputClass} required disabled={!form.province}>
                <option value="">— Sélectionner —</option>
                {educationProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="etab-structure">Coordination sous-provinciale{requiredMark}</label>
              <select id="etab-structure" value={form.coordSousProvincialeId}
                onChange={(e) => {
                  update('coordSousProvincialeId', e.target.value);
                  update('structureRattachementId', e.target.value);
                }}
                className={inputClass} required disabled={structuresLoading || !form.province}>
                <option value="">— Sélectionner —</option>
                {filteredStructures.map((s) => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
              {filteredStructures.length === 0 && !structuresLoading && form.institution && form.province && (
                <p className="mt-1 text-xs text-amber-600">
                  Aucune structure enregistrée pour cette province. Créez-en une dans le module correspondant.
                </p>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="etab-commune">Commune{requiredMark}</label>
              <input id="etab-commune" type="text" value={form.commune}
                onChange={(e) => update('commune', e.target.value)}
                className={inputClass} placeholder="Ex. Gombe" required />
            </div>
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(1)}
              className="btn-secondary-light px-6 py-2.5 text-sm">
              ← Retour
            </button>
            <button type="button" disabled={!canProceedStep2()} onClick={() => setStep(3)}
              className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
              Continuer →
            </button>
          </div>
        </div>
      )}

      {/* ── Étape 3 : Informations de l'école ── */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Informations de l'école</h3>
              <p className="mt-1 text-sm text-slate-500">Renseignez les informations obligatoires.</p>
            </div>
            <span className={`rounded-lg px-3 py-1 text-xs font-medium ${selectedInstitution?.bgColor} ${selectedInstitution?.color}`}>
              {selectedInstitution?.label}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="etab-nom">Nom officiel de l'école{requiredMark}</label>
              <input id="etab-nom" type="text" required value={form.nom}
                onChange={(e) => update('nom', e.target.value)}
                className={inputClass} placeholder="Ex. Institut Tuendelee" />
            </div>
            <div>
              <label className={labelClass} htmlFor="etab-dinacope">DINACOPE{requiredMark}</label>
              <input id="etab-dinacope" type="text" required value={form.dinacope}
                onChange={(e) => update('dinacope', e.target.value)}
                className={inputClass} placeholder="Numéro DINACOPE" />
            </div>
            <div>
              <label className={labelClass} htmlFor="etab-type">Type d'école{requiredMark}</label>
              <select id="etab-type" value={form.type}
                onChange={(e) => update('type', e.target.value)}
                className={inputClass} required>
                <option value="">— Sélectionner —</option>
                <option value="Primaire">Primaire</option>
                <option value="Secondaire">Secondaire</option>
                <option value="Supérieur">Supérieur</option>
                <option value="Professionnel">Professionnel</option>
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="etab-chef">Chef d'établissement{requiredMark}</label>
              <input id="etab-chef" type="text" required value={form.chefEcole}
                onChange={(e) => update('chefEcole', e.target.value)}
                className={inputClass} placeholder="Nom du directeur" />
            </div>
            <div>
              <label className={labelClass} htmlFor="etab-tel">Numéro de téléphone{requiredMark}</label>
              <input id="etab-tel" type="tel" required value={form.telephone}
                onChange={(e) => update('telephone', e.target.value)}
                className={inputClass} placeholder="+243 ..." />
            </div>
            <div>
              <label className={labelClass} htmlFor="etab-email">Adresse e-mail</label>
              <input id="etab-email" type="email" value={form.email}
                onChange={(e) => update('email', e.target.value)}
                className={inputClass} placeholder="ecole@example.com" />
            </div>
            <div>
              <label className={labelClass} htmlFor="etab-ville">Ville</label>
              <input id="etab-ville" type="text" value={form.ville}
                onChange={(e) => update('ville', e.target.value)}
                className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="etab-adresse">Adresse{requiredMark}</label>
              <input id="etab-adresse" type="text" required value={form.adresse}
                onChange={(e) => update('adresse', e.target.value)}
                className={inputClass} placeholder="Avenue, numéro, quartier" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="etab-geo">Localisation géographique</label>
              <input id="etab-geo" type="text" value={form.localisationGeo}
                onChange={(e) => update('localisationGeo', e.target.value)}
                className={inputClass} placeholder="Latitude, Longitude (ex. -4.325, 15.322)" />
            </div>
            <div>
              <label className={labelClass} htmlFor="etab-effectif">Effectif</label>
              <input id="etab-effectif" type="number" min="0" value={form.effectif}
                onChange={(e) => update('effectif', e.target.value)}
                className={inputClass} placeholder="0" />
            </div>
            <div>
              <label className={labelClass} htmlFor="etab-statut-val">Statut de validation</label>
              <select id="etab-statut-val" value={form.statutValidation}
                onChange={(e) => update('statutValidation', e.target.value)}
                className={inputClass}>
                {VALIDATION_STATUTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          <div className="flex justify-between">
            <button type="button" onClick={() => setStep(2)}
              className="btn-secondary-light px-6 py-2.5 text-sm">
              ← Retour
            </button>
            <button type="submit" disabled={loading}
              className={`btn-primary px-8 py-3 text-sm ${loading ? 'btn-loading' : ''}`}>
              {loading ? (<><span className="btn-spinner" /> Enregistrement…</>) : submitLabel}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
