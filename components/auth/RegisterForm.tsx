'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  registrationInstitutionTypes,
  ecErcRoleOptions,
  nonEcErcRoleOptions,
  allProvinces,
  educationProvincesByAdmin,
  provincialBureaux,
  fonctionsByRole,
  gradesByRole,
  rolesNeedingAffectation,
  rolesNeedingFonctionGrade,
  rolesNeedingDinacope,
  rolesNeedingEducationProvince,
  type RoleOption,
} from '@/lib/meta-data';

const STEP_LABELS = [
  'Informations',
  'Institution',
  'Rôle',
  'Affectation',
  'Fonction',
  'Vérification',
  'Création',
];

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

type FormState = {
  nom: string;
  postNom: string;
  prenom: string;
  sexe: string;
  telephone: string;
  email: string;
  password: string;
  confirmPassword: string;
  typeInstitution: string;
  institutionName: string;
  role: string;
  provinceAdministrative: string;
  provinceEducationnelle: string;
  bureauAffectation: string;
  fonction: string;
  grade: string;
  dinacope: string;
};

const emptyForm: FormState = {
  nom: '',
  postNom: '',
  prenom: '',
  sexe: '',
  telephone: '',
  email: '',
  password: '',
  confirmPassword: '',
  typeInstitution: '',
  institutionName: '',
  role: '',
  provinceAdministrative: '',
  provinceEducationnelle: '',
  bureauAffectation: '',
  fonction: '',
  grade: '',
  dinacope: '',
};

function isStepNeeded(step: number, role: string): boolean {
  switch (step) {
    case 0: case 1: case 2: case 6: return true;
    case 3: return rolesNeedingAffectation.has(role);
    case 4: return rolesNeedingFonctionGrade.has(role);
    case 5: return rolesNeedingDinacope.has(role);
    default: return true;
  }
}

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((cur) => ({ ...cur, [field]: value }));
  }

  function nextStep() {
    setError('');
    const validation = validateStep(step);
    if (validation) {
      setError(validation);
      return;
    }
    setDirection('forward');
    let next = step + 1;
    while (next < 7 && !isStepNeeded(next, form.role)) next++;
    if (next < 7) setStep(next);
  }

  function prevStep() {
    setError('');
    setDirection('back');
    let prev = step - 1;
    while (prev >= 0 && !isStepNeeded(prev, form.role)) prev--;
    if (prev >= 0) setStep(prev);
  }

  function validateStep(s: number): string {
    switch (s) {
      case 0:
        if (!form.nom.trim()) return 'Le nom est obligatoire.';
        if (!form.prenom.trim()) return 'Le prénom est obligatoire.';
        if (!form.email.trim()) return 'L\u2019email est obligatoire.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'L\u2019email est invalide.';
        if (form.password.length < 8) return 'Le mot de passe doit faire au moins 8 caractères.';
        if (form.password !== form.confirmPassword) return 'Les mots de passe ne correspondent pas.';
        return '';
      case 1:
        if (!form.typeInstitution) return 'Veuillez sélectionner un type d\u2019institution.';
        return '';
      case 2:
        if (!form.role) return 'Veuillez sélectionner un rôle.';
        return '';
      case 3:
        if (!form.provinceAdministrative) return 'Veuillez sélectionner une province administrative.';
        if (rolesNeedingEducationProvince.has(form.role) && !form.provinceEducationnelle)
          return 'Veuillez sélectionner une province éducationnelle.';
        if (['COORDINATION_PROVINCIALE', 'AGENT_PROVINCIAL', 'COORDINATION_SOUS_PROVINCIALE', 'AGENT_SOUS_PROVINCIAL'].includes(form.role) && !form.bureauAffectation)
          return 'Veuillez sélectionner un bureau d\u2019affectation.';
        return '';
      case 4:
        if (!form.fonction) return 'Veuillez sélectionner une fonction.';
        if (gradesByRole[form.role]?.length > 0 && !form.grade) return 'Veuillez sélectionner un grade.';
        return '';
      case 5:
        if (rolesNeedingDinacope.has(form.role) && !form.dinacope.trim())
          return 'Le numéro DINACOPE est obligatoire pour ce profil.';
        return '';
      default:
        return '';
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    // Validate all applicable steps
    for (let s = 0; s < 6; s++) {
      if (isStepNeeded(s, form.role)) {
        const v = validateStep(s);
        if (v) {
          setStep(s);
          setError(v);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: form.nom,
          postNom: form.postNom,
          prenom: form.prenom,
          sexe: form.sexe,
          email: form.email,
          telephone: form.telephone,
          password: form.password,
          role: form.role,
          typeInstitution: form.typeInstitution,
          institutionName: form.institutionName,
          provinceAdministrative: form.provinceAdministrative,
          provinceEducationnelle: form.provinceEducationnelle,
          bureauAffectation: form.bureauAffectation,
          fonction: form.fonction,
          grade: form.grade,
          dinacope: form.dinacope,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? 'Impossible de créer le compte.');
        return;
      }
      router.push('/login');
      router.refresh();
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  }

  const isEcErc = form.typeInstitution === 'EC-ERC';
  const roleOptions: RoleOption[] = isEcErc ? ecErcRoleOptions : nonEcErcRoleOptions;
  const availableEdProvinces = form.provinceAdministrative
    ? educationProvincesByAdmin[form.provinceAdministrative] ?? []
    : [];
  const availableFonctions = fonctionsByRole[form.role] ?? [];
  const availableGrades = gradesByRole[form.role] ?? [];

  // Reset dependent fields when parent selections change
  function handleInstitutionType(value: string) {
    updateField('typeInstitution', value);
    updateField('role', '');
  }
  function handleRole(value: string) {
    updateField('role', value);
    updateField('fonction', '');
    updateField('grade', '');
    updateField('bureauAffectation', '');
  }
  function handleAdminProvince(value: string) {
    updateField('provinceAdministrative', value);
    updateField('provinceEducationnelle', '');
  }

  // Compute visible steps based on the selected role
  const visibleStepIndices = STEP_LABELS.map((_, i) => i).filter(
    (i) => i === 0 || i === 6 || isStepNeeded(i, form.role)
  );
  const visibleCount = visibleStepIndices.length;
  const currentVisiblePosition = visibleStepIndices.indexOf(step) + 1;

  const animClass = direction === 'forward' ? 'step-enter' : 'step-enter-back';
  const isLastStep = step === 6;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {visibleStepIndices.map((i, displayIdx) => {
          const label = STEP_LABELS[i];
          const isActive = i === step;
          const isPast = i < step;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isPast
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {isPast ? '✓' : displayIdx + 1}
              </div>
              <span className={`hidden text-[10px] font-medium sm:block ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="h-1 w-full rounded-full bg-slate-100">
        <div
          className="h-1 rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${(currentVisiblePosition / visibleCount) * 100}%` }}
        />
      </div>

      {/* Step content */}
      <div key={step} className={animClass}>
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Étape 1 — Informations personnelles</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Nom *</label>
                <input className={inputClass} value={form.nom} onChange={(e) => updateField('nom', e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Post-nom</label>
                <input className={inputClass} value={form.postNom} onChange={(e) => updateField('postNom', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Prénom *</label>
                <input className={inputClass} value={form.prenom} onChange={(e) => updateField('prenom', e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Sexe</label>
                <select className={inputClass} value={form.sexe} onChange={(e) => updateField('sexe', e.target.value)}>
                  <option value="">—</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Téléphone</label>
                <input type="tel" className={inputClass} value={form.telephone} onChange={(e) => updateField('telephone', e.target.value)} placeholder="+243 ..." />
              </div>
              <div>
                <label className={labelClass}>E-mail *</label>
                <input type="email" className={inputClass} value={form.email} onChange={(e) => updateField('email', e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Mot de passe *</label>
                <input type="password" className={inputClass} value={form.password} onChange={(e) => updateField('password', e.target.value)} required />
              </div>
              <div>
                <label className={labelClass}>Confirmation *</label>
                <input type="password" className={inputClass} value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} required />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Étape 2 — Institution</p>
            <p className="text-sm text-slate-500">
              {isEcErc
                ? 'Vous avez choisi le parcours EC-ERC. Les rôles spécifiques à ce parcours vous seront proposés à l\u2019étape suivante.'
                : 'Sélectionnez votre type d\u2019institution. Le parcours EC-ERC dispose de rôles dédiés séparés des autres institutions.'}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {registrationInstitutionTypes.map((inst) => (
                <div
                  key={inst.value}
                  onClick={() => handleInstitutionType(inst.value)}
                  className={`select-card rounded-2xl border-2 p-4 ${form.typeInstitution === inst.value ? 'selected' : 'border-slate-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${form.typeInstitution === inst.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {inst.value === 'EC-ERC' ? '★' : '◆'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{inst.label}</p>
                      {inst.value === 'EC-ERC' && <p className="text-xs text-blue-600">Parcours spécifique</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <label className={labelClass}>Nom de l\u2019institution / école</label>
              <input className={inputClass} value={form.institutionName} onChange={(e) => updateField('institutionName', e.target.value)} placeholder="Nom de l\u2019institution (optionnel)" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Étape 3 — Rôle {isEcErc && '(Parcours EC-ERC)'}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {roleOptions.map((role) => (
                <div
                  key={role.value}
                  onClick={() => handleRole(role.value)}
                  className={`select-card rounded-2xl border-2 p-4 ${form.role === role.value ? 'selected' : 'border-slate-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${form.role === role.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      ✓
                    </div>
                    <p className="font-medium text-slate-900">{role.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Étape 4 — Affectation</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Province administrative *</label>
                <select className={inputClass} value={form.provinceAdministrative} onChange={(e) => handleAdminProvince(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {allProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {rolesNeedingEducationProvince.has(form.role) && (
                <div>
                  <label className={labelClass}>Province éducationnelle *</label>
                  <select
                    className={inputClass}
                    value={form.provinceEducationnelle}
                    onChange={(e) => updateField('provinceEducationnelle', e.target.value)}
                    disabled={!form.provinceAdministrative}
                  >
                    <option value="">— Sélectionner —</option>
                    {availableEdProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {!form.provinceAdministrative && <p className="mt-1 text-xs text-slate-400">Sélectionnez d\u2019abord une province administrative.</p>}
                </div>
              )}
              {['COORDINATION_PROVINCIALE', 'AGENT_PROVINCIAL', 'COORDINATION_SOUS_PROVINCIALE', 'AGENT_SOUS_PROVINCIAL'].includes(form.role) && (
                <div className="sm:col-span-2">
                  <label className={labelClass}>Bureau d\u2019affectation *</label>
                  <select className={inputClass} value={form.bureauAffectation} onChange={(e) => updateField('bureauAffectation', e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {provincialBureaux.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Étape 5 — Fonction et grade</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Fonction *</label>
                <select className={inputClass} value={form.fonction} onChange={(e) => updateField('fonction', e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {availableFonctions.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              {availableGrades.length > 0 && (
                <div>
                  <label className={labelClass}>Grade *</label>
                  <select className={inputClass} value={form.grade} onChange={(e) => updateField('grade', e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {availableGrades.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Étape 6 — Identification et vérification</p>
            {rolesNeedingDinacope.has(form.role) && (
              <div>
                <label className={labelClass}>Numéro DINACOPE *</label>
                <input className={inputClass} value={form.dinacope} onChange={(e) => updateField('dinacope', e.target.value)} placeholder="Numéro DINACOPE" />
              </div>
            )}
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">Vérifiez vos informations</p>
              <div className="space-y-1.5 text-sm text-slate-600">
                <p><span className="font-medium text-slate-700">Nom :</span> {form.nom} {form.postNom} {form.prenom}</p>
                <p><span className="font-medium text-slate-700">Email :</span> {form.email}</p>
                {form.sexe && <p><span className="font-medium text-slate-700">Sexe :</span> {form.sexe === 'M' ? 'Masculin' : 'Féminin'}</p>}
                {form.telephone && <p><span className="font-medium text-slate-700">Téléphone :</span> {form.telephone}</p>}
                <p><span className="font-medium text-slate-700">Institution :</span> {registrationInstitutionTypes.find((i) => i.value === form.typeInstitution)?.label ?? '—'}</p>
                {form.institutionName && <p><span className="font-medium text-slate-700">Nom institution :</span> {form.institutionName}</p>}
                <p><span className="font-medium text-slate-700">Rôle :</span> {roleOptions.find((r) => r.value === form.role)?.label ?? '—'}</p>
                {form.provinceAdministrative && <p><span className="font-medium text-slate-700">Province admin. :</span> {form.provinceAdministrative}</p>}
                {form.provinceEducationnelle && <p><span className="font-medium text-slate-700">Province éduc. :</span> {form.provinceEducationnelle}</p>}
                {form.bureauAffectation && <p><span className="font-medium text-slate-700">Bureau :</span> {form.bureauAffectation}</p>}
                {form.fonction && <p><span className="font-medium text-slate-700">Fonction :</span> {form.fonction}</p>}
                {form.grade && <p><span className="font-medium text-slate-700">Grade :</span> {form.grade}</p>}
                {form.dinacope && <p><span className="font-medium text-slate-700">DINACOPE :</span> {form.dinacope}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Étape 7 — Création du compte</p>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="mb-4 text-sm text-slate-600">Veuillez vérifier le récapitulatif ci-dessous avant de valider la création de votre compte.</p>
              <div className="space-y-2 text-sm">
                <SummaryRow label="Nom complet" value={`${form.nom} ${form.postNom} ${form.prenom}`} />
                <SummaryRow label="Email" value={form.email} />
                {form.sexe && <SummaryRow label="Sexe" value={form.sexe === 'M' ? 'Masculin' : 'Féminin'} />}
                {form.telephone && <SummaryRow label="Téléphone" value={form.telephone} />}
                <SummaryRow label="Institution" value={registrationInstitutionTypes.find((i) => i.value === form.typeInstitution)?.label ?? '—'} />
                {form.institutionName && <SummaryRow label="Nom institution" value={form.institutionName} />}
                <SummaryRow label="Rôle" value={roleOptions.find((r) => r.value === form.role)?.label ?? '—'} />
                {form.provinceAdministrative && <SummaryRow label="Province administrative" value={form.provinceAdministrative} />}
                {form.provinceEducationnelle && <SummaryRow label="Province éducationnelle" value={form.provinceEducationnelle} />}
                {form.bureauAffectation && <SummaryRow label="Bureau d\u2019affectation" value={form.bureauAffectation} />}
                {form.fonction && <SummaryRow label="Fonction" value={form.fonction} />}
                {form.grade && <SummaryRow label="Grade" value={form.grade} />}
                {form.dinacope && <SummaryRow label="DINACOPE" value={form.dinacope} />}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <button type="button" onClick={prevStep} className="btn-secondary-light px-5 py-2.5 text-sm">
            ← Précédent
          </button>
        ) : <div />}
        {!isLastStep ? (
          <button type="button" onClick={nextStep} className="btn-primary px-5 py-2.5 text-sm">
            Continuer →
          </button>
        ) : (
          <button type="submit" disabled={loading} className={`btn-primary px-5 py-2.5 text-sm ${loading ? 'btn-loading' : ''}`}>
            {loading ? (<><span className="btn-spinner" /> Création…</>) : 'Créer mon compte'}
          </button>
        )}
      </div>
    </form>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-1.5">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="text-right text-slate-900">{value}</span>
    </div>
  );
}
