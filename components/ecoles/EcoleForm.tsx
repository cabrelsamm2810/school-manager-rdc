'use client';

import { useState, useEffect, FormEvent, type ReactNode } from 'react';
import { INSTITUTIONS, VALIDATION_STATUTS } from '@/lib/institutions';
import { allProvinces, educationProvincesByAdmin, NIVEAUX_SCOLAIRES } from '@/lib/meta-data';
import { getCommunesForProvinceEduc } from '@/lib/communes-rdc';
import { GeoLocationInput } from '@/components/ecoles/GeoLocationInput';
import { EcoleLogoUpload } from '@/components/ecoles/EcoleLogoUpload';
import { SectionsOptionsModal } from '@/components/ecoles/SectionsOptionsModal';

export type EcoleFormData = {
  nom: string;
  nomAbrege: string;
  idSecope: string;
  type: string;
  regimeGestion: string;
  institution: string;
  numeroAgrement: string;
  dateCreation: string;
  dateFermeture: string;
  sections: string[];
  options: string[];
  dinacope: string;
  numeroNU: string;
  numeroNP: string;
  province: string;
  provinceEducationnelle: string;
  ville: string;
  commune: string;
  secteur: string;
  quartier: string;
  avenue: string;
  numeroParcelle: string;
  adresse: string;
  localisationGeo: string;
  latitude: number | null;
  longitude: number | null;
  coordinationProvinciale: string;
  codeCoordProv: string;
  codeCoordSous: string;
  sousDivision: string;
  promoteur: string;
  directeurEtudes: string;
  responsableAdministratif: string;
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
  nom: '', nomAbrege: '', idSecope: '', type: '', regimeGestion: '', institution: '',
  numeroAgrement: '', dateCreation: '', dateFermeture: '', sections: [], options: [],
  dinacope: '', numeroNU: '', numeroNP: '', province: '',
  provinceEducationnelle: '', ville: '', commune: '', secteur: '', quartier: '', avenue: '', numeroParcelle: '', adresse: '',
  localisationGeo: '', latitude: null, longitude: null,
  coordinationProvinciale: '', codeCoordProv: '', codeCoordSous: '', sousDivision: '',
  promoteur: '', directeurEtudes: '', responsableAdministratif: '',
  telephone: '', email: '', chefEcole: '',
  logoUrl: '', effectif: '', statut: 'Actif', statutValidation: 'Brouillon',
  coordSousProvincialeId: '', ecErcId: '', structureRattachementId: '',
  structureRattachementType: '',
};

type Structure = { id: string; nom: string; province: string };

/** Régimes de gestion reconnus, alignés sur les catégories de `lib/institutions.ts`. */
const REGIMES_GESTION = ['Public', 'Conventionné', 'Privé agréé', 'Privé indépendant'];

const REGIME_BY_CATEGORIE: Record<string, string> = {
  PUBLIC: 'Public',
  CONVENTIONNE: 'Conventionné',
  PRIVE_AGREE: 'Privé agréé',
  PRIVE_INDEPENDANT: 'Privé indépendant',
};

/** Statuts administratifs de l'établissement. */
export const STATUTS_ETABLISSEMENT = ['Actif', 'En attente', 'Suspendu', 'Fermé'];

/** Champs obligatoires du profil, contrôlés avant l'enregistrement. */
const REQUIRED_FIELDS: { key: keyof EcoleFormData; label: string }[] = [
  { key: 'nom', label: 'Nom officiel de l\u2019établissement' },
  { key: 'type', label: 'Type d\u2019établissement' },
  { key: 'province', label: 'Province' },
  { key: 'provinceEducationnelle', label: 'Province éducationnelle' },
  { key: 'commune', label: 'Commune' },
  { key: 'adresse', label: 'Adresse complète' },
  { key: 'chefEcole', label: 'Chef d\u2019établissement' },
  { key: 'telephone', label: 'Numéro de téléphone' },
];

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
  ecoleId?: string | null;
};

function FormCard({ title, description, icon, children }: {
  title: string;
  description?: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-base">{icon}</div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function EcoleForm({ initialData, onSubmit, onCancel, submitLabel = 'Enregistrer', loading, error, ecoleId }: Props) {
  // Une modification existante ouvre directement le profil (étape 3).
  const [step, setStep] = useState(initialData?.institution ? 3 : 1);
  const [form, setForm] = useState<EcoleFormData>({ ...emptyForm, ...initialData });
  const [structures, setStructures] = useState<Structure[]>([]);
  const [structuresLoading, setStructuresLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [sectionsOpen, setSectionsOpen] = useState(false);

  const selectedInstitution = INSTITUTIONS.find((i) => i.code === form.institution);
  const educationProvinces = form.province ? (educationProvincesByAdmin[form.province] || []) : [];
  const communes = form.provinceEducationnelle ? getCommunesForProvinceEduc(form.provinceEducationnelle) : [];
  const selectedStructure = structures.find((s) => s.id === form.coordSousProvincialeId);

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
    // Changer d'institution réinitialise les champs devenus incompatibles :
    // parcours administratif et régime de gestion.
    const institution = INSTITUTIONS.find((i) => i.code === code);
    setForm((prev) => ({
      ...prev,
      institution: code,
      regimeGestion: institution ? (REGIME_BY_CATEGORIE[institution.categorie] ?? prev.regimeGestion) : prev.regimeGestion,
      coordSousProvincialeId: '',
      structureRattachementId: '',
      structureRattachementType: institution?.structureCompetente || '',
    }));
  }

  function handleProvinceChange(prov: string) {
    update('province', prov);
    update('provinceEducationnelle', '');
    update('coordSousProvincialeId', '');
    update('structureRattachementId', '');
    update('commune', '');
  }

  function handleProvinceEducChange(provEduc: string) {
    update('provinceEducationnelle', provEduc);
    update('coordSousProvincialeId', '');
    update('structureRattachementId', '');
    update('commune', '');
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
    const missing = REQUIRED_FIELDS.filter((f) => {
      const value = form[f.key];
      return Array.isArray(value) ? value.length === 0 : !String(value ?? '').trim();
    });
    if (missing.length > 0) {
      setLocalError(`Champs obligatoires manquants : ${missing.map((f) => f.label).join(', ')}.`);
      return;
    }
    setLocalError('');
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
              {s === 1 ? 'Institution' : s === 2 ? 'Parcours administratif' : 'Profil de l\u2019école'}
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
                {selectedStructure?.nom || 'Structure compétente'}
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
                className={inputClass} required disabled={structuresLoading || !form.provinceEducationnelle}>
                <option value="">— Sélectionner —</option>
                {filteredStructures.map((s) => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
              {!form.provinceEducationnelle && (
                <p className="mt-1 text-xs text-slate-400">Sélectionnez d’abord une province éducationnelle.</p>
              )}
              {form.provinceEducationnelle && filteredStructures.length === 0 && !structuresLoading && (
                <p className="mt-1 text-xs text-amber-600">
                  Aucune coordination sous-provinciale enregistrée pour cette province.
                </p>
              )}
            </div>
            <div>
              <label className={labelClass} htmlFor="etab-commune">Commune{requiredMark}</label>
              {communes.length > 0 ? (
                <select id="etab-commune" value={form.commune}
                  onChange={(e) => update('commune', e.target.value)}
                  className={inputClass} required disabled={!form.provinceEducationnelle}>
                  <option value="">— Sélectionner —</option>
                  {communes.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input id="etab-commune" type="text" value={form.commune}
                  onChange={(e) => update('commune', e.target.value)}
                  className={inputClass} placeholder="Ex. Gombe"
                  required disabled={!form.provinceEducationnelle} />
              )}
              {!form.provinceEducationnelle && (
                <p className="mt-1 text-xs text-slate-400">Sélectionnez d'abord une province éducationnelle.</p>
              )}
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

      {/* ── Étape 3 : Profil de l'école ── */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900">Profil de l'école</h3>
              <p className="mt-1 text-sm text-slate-500">Informations administratives, localisation, coordination et responsables.</p>
            </div>
            <span className={`rounded-lg px-3 py-1 text-xs font-medium ${selectedInstitution?.bgColor} ${selectedInstitution?.color}`}>
              {selectedInstitution?.label}
            </span>
          </div>

          {/* 1. Informations administratives */}
          <FormCard title="Informations administratives" icon="🏛️" description="Identification officielle de l'établissement.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="etab-nom">Nom officiel de l'établissement{requiredMark}</label>
                <input id="etab-nom" type="text" required value={form.nom}
                  onChange={(e) => update('nom', e.target.value)}
                  className={inputClass} placeholder="Ex. Institut Tuendelee" />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-nom-abrege">Nom abrégé</label>
                <input id="etab-nom-abrege" type="text" value={form.nomAbrege}
                  onChange={(e) => update('nomAbrege', e.target.value)}
                  className={inputClass} placeholder="Ex. I.T. Tuendelee" />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-secope">ID SECOPE</label>
                <input id="etab-secope" type="text" value={form.idSecope}
                  onChange={(e) => update('idSecope', e.target.value)}
                  className={inputClass} placeholder="Identifiant SECOPE" />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-type">Type d'établissement{requiredMark}</label>
                <select id="etab-type" value={form.type}
                  onChange={(e) => update('type', e.target.value)}
                  className={inputClass} required>
                  <option value="">— Sélectionner —</option>
                  {NIVEAUX_SCOLAIRES.map((niveau) => <option key={niveau} value={niveau}>{niveau}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-regime">Régime de gestion</label>
                <select id="etab-regime" value={form.regimeGestion}
                  onChange={(e) => update('regimeGestion', e.target.value)}
                  className={inputClass}>
                  <option value="">— Sélectionner —</option>
                  {REGIMES_GESTION.map((regime) => <option key={regime} value={regime}>{regime}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Institution de tutelle</label>
                <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
                  {selectedInstitution?.label || '—'}
                </p>
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-agrement">Numéro de l'arrêté d'agrément</label>
                <input id="etab-agrement" type="text" value={form.numeroAgrement}
                  onChange={(e) => update('numeroAgrement', e.target.value)}
                  className={inputClass} placeholder="Ex. AGR/2024/0123" />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-statut-etab">Statut de l'établissement</label>
                <select id="etab-statut-etab" value={form.statut}
                  onChange={(e) => update('statut', e.target.value)}
                  className={inputClass}>
                  {STATUTS_ETABLISSEMENT.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-date-creation">Date de création</label>
                <input id="etab-date-creation" type="date" value={form.dateCreation}
                  onChange={(e) => update('dateCreation', e.target.value)}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-date-fermeture">Date de fermeture (si applicable)</label>
                <input id="etab-date-fermeture" type="date" value={form.dateFermeture}
                  onChange={(e) => update('dateFermeture', e.target.value)}
                  className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Logo ou photo de l'établissement</label>
                <EcoleLogoUpload
                  ecoleId={ecoleId}
                  logoUrl={form.logoUrl}
                  onChange={(url) => update('logoUrl', url)}
                />
              </div>
            </div>
          </FormCard>

          {/* 2. Localisation géographique */}
          <FormCard title="Localisation géographique" icon="📍" description="Découpage administratif et adresse de l'établissement.">
            <div className="mb-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <span className="font-medium">{form.province || 'Province'}</span>
              {' · '}
              <span className="font-medium">{form.provinceEducationnelle || 'Province éducationnelle'}</span>
              {' · '}
              <span className="font-medium">{form.commune || 'Commune'}</span>
              <button type="button" onClick={() => setStep(2)} className="ml-2 font-medium text-blue-600 hover:text-blue-700">
                Modifier
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="etab-ville">Ville ou territoire</label>
                <input id="etab-ville" type="text" value={form.ville}
                  onChange={(e) => update('ville', e.target.value)}
                  className={inputClass} placeholder="Ex. Kinshasa" />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-secteur">Secteur</label>
                <input id="etab-secteur" type="text" value={form.secteur}
                  onChange={(e) => update('secteur', e.target.value)}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-quartier">Quartier</label>
                <input id="etab-quartier" type="text" value={form.quartier}
                  onChange={(e) => update('quartier', e.target.value)}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-avenue">Avenue</label>
                <input id="etab-avenue" type="text" value={form.avenue}
                  onChange={(e) => update('avenue', e.target.value)}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-parcelle">Numéro de parcelle</label>
                <input id="etab-parcelle" type="text" value={form.numeroParcelle}
                  onChange={(e) => update('numeroParcelle', e.target.value)}
                  className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="etab-adresse">Adresse complète{requiredMark}</label>
                <input id="etab-adresse" type="text" required value={form.adresse}
                  onChange={(e) => update('adresse', e.target.value)}
                  className={inputClass} placeholder="Avenue, numéro, quartier, commune" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Géolocalisation</label>
                <GeoLocationInput
                  latitude={form.latitude}
                  longitude={form.longitude}
                  onChange={(lat, lng) => {
                    update('latitude', lat);
                    update('longitude', lng);
                    if (lat != null && lng != null) {
                      update('localisationGeo', `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
                    } else {
                      update('localisationGeo', '');
                    }
                  }}
                />
              </div>
            </div>
          </FormCard>

          {/* 3. Coordination éducationnelle */}
          <FormCard title="Coordination éducationnelle" icon="🏢" description="Hiérarchie administrative de rattachement.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="etab-coord-prov">Coordination provinciale</label>
                <input id="etab-coord-prov" type="text" value={form.coordinationProvinciale}
                  onChange={(e) => update('coordinationProvinciale', e.target.value)}
                  className={inputClass} placeholder="Nom de la coordination provinciale" />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-code-prov">Code COORD-PROV</label>
                <input id="etab-code-prov" type="text" value={form.codeCoordProv}
                  onChange={(e) => update('codeCoordProv', e.target.value)}
                  className={inputClass} placeholder="Ex. COORD-PROV-KIN" />
              </div>
              <div>
                <label className={labelClass}>Coordination sous-provinciale</label>
                <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
                  {selectedStructure?.nom || '—'}
                  <button type="button" onClick={() => setStep(2)} className="ml-2 text-xs font-medium text-blue-600 hover:text-blue-700">
                    Modifier
                  </button>
                </p>
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-code-sous">Code COORD-SOUS</label>
                <input id="etab-code-sous" type="text" value={form.codeCoordSous}
                  onChange={(e) => update('codeCoordSous', e.target.value)}
                  className={inputClass} placeholder="Ex. COORD-SOUS-KIN" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="etab-sous-division">Sous-division</label>
                <input id="etab-sous-division" type="text" value={form.sousDivision}
                  onChange={(e) => update('sousDivision', e.target.value)}
                  className={inputClass} placeholder="Nom de la sous-division" />
              </div>
            </div>
          </FormCard>

          {/* 4. Responsables et identification */}
          <FormCard title="Responsables et identification" icon="👥" description="Personnes responsables et identifiants administratifs.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="etab-promoteur">Promoteur</label>
                <input id="etab-promoteur" type="text" value={form.promoteur}
                  onChange={(e) => update('promoteur', e.target.value)}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-chef">Chef d'établissement{requiredMark}</label>
                <input id="etab-chef" type="text" required value={form.chefEcole}
                  onChange={(e) => update('chefEcole', e.target.value)}
                  className={inputClass} placeholder="Nom du directeur" />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-directeur-etudes">Directeur des études</label>
                <input id="etab-directeur-etudes" type="text" value={form.directeurEtudes}
                  onChange={(e) => update('directeurEtudes', e.target.value)}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-responsable-admin">Responsable administratif</label>
                <input id="etab-responsable-admin" type="text" value={form.responsableAdministratif}
                  onChange={(e) => update('responsableAdministratif', e.target.value)}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-tel">Numéro de téléphone{requiredMark}</label>
                <input id="etab-tel" type="tel" required value={form.telephone}
                  onChange={(e) => update('telephone', e.target.value)}
                  className={inputClass} placeholder="+243 ..." />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-email">Adresse électronique</label>
                <input id="etab-email" type="email" value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  className={inputClass} placeholder="ecole@example.com" />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-dinacope">DINACOPE</label>
                <input id="etab-dinacope" type="text" value={form.dinacope}
                  onChange={(e) => update('dinacope', e.target.value)}
                  className={inputClass} placeholder="Numéro DINACOPE" />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-nu">Numéro d'identification N.U</label>
                <input id="etab-nu" type="text" value={form.numeroNU}
                  onChange={(e) => update('numeroNU', e.target.value)}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass} htmlFor="etab-np">Numéro d'identification N.P</label>
                <input id="etab-np" type="text" value={form.numeroNP}
                  onChange={(e) => update('numeroNP', e.target.value)}
                  className={inputClass} />
              </div>
            </div>
          </FormCard>

          {/* 5. Sections et options */}
          <FormCard title="Sections et options" icon="🎓" description="Sections organisées par l'établissement et options des humanités.">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-600">Nombre de sections</p>
                <p className="mt-1 text-3xl font-bold text-blue-700">{form.sections.length}</p>
              </div>
              <div className="sm:col-span-2">
                <p className={labelClass}>Sections sélectionnées</p>
                {form.sections.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {form.sections.map((section) => (
                      <span key={section} className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-medium text-white">{section}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Aucune section configurée.</p>
                )}
                {form.options.length > 0 && (
                  <>
                    <p className={`${labelClass} mt-3`}>Options des humanités</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.options.map((option) => (
                        <span key={option} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{option}</span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSectionsOpen(true)}
              className="mt-4 w-full rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 sm:w-auto"
            >
              Configurer les sections et options
            </button>
          </FormCard>

          {/* 6. Suivi administratif */}
          <FormCard title="Suivi administratif" icon="📊" description="Effectif déclaré et statut de validation du dossier.">
            <div className="grid gap-4 sm:grid-cols-2">
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
          </FormCard>

          {(localError || error) && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{localError || error}</p>
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

      <SectionsOptionsModal
        open={sectionsOpen}
        initialSections={form.sections}
        initialOptions={form.options}
        onSave={(sections, options) => {
          update('sections', sections);
          update('options', options);
          setSectionsOpen(false);
        }}
        onClose={() => setSectionsOpen(false)}
      />
    </form>
  );
}
