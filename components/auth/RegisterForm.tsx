'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  registrationInstitutionTypes,
  allRegistrationRoleOptions,
  allProvinces,
  provincialBureaux,
  fonctionsByRole,
  gradesByRole,
  fonctionsByBureau,
  gradesByBureau,
  rolesNeedingFonctionGrade,
  rolesNeedingDinacope,
  educationProvincesByAdminFromSousDivisions,
  sousDivisionsByEducationProvince,
  ecoleTypes,
  type RoleOption,
} from '@/lib/meta-data';
import { ErcLogo } from '@/components/ui/ErcLogo';
import { ProfilePhotoUpload } from '@/components/auth/ProfilePhotoUpload';

const STEP_LABELS = ['Institution', 'Structure', 'Fonction', 'Informations', 'Compte', 'Vérification'];

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

type FormState = {
  typeInstitution: string;
  role: string;
  bureauAffectation: string;
  fonction: string;
  grade: string;
  dinacope: string;
  provinceAdministrative: string;
  provinceEducationnelle: string;
  coordSousProvinciale: string;
  ecoleNom: string;
  ecoleCommune: string;
  ecoleAdresse: string;
  ecoleTelephone: string;
  ecoleEmail: string;
  ecoleType: string;
  nom: string;
  postNom: string;
  prenom: string;
  sexe: string;
  telephone: string;
  profilePhotoUrl: string;
  email: string;
  password: string;
  confirmPassword: string;
  institutionName: string;
};

const emptyForm: FormState = {
  typeInstitution: '', role: '', bureauAffectation: '', fonction: '', grade: '', dinacope: '',
  provinceAdministrative: '', provinceEducationnelle: '', coordSousProvinciale: '',
  ecoleNom: '', ecoleCommune: '', ecoleAdresse: '', ecoleTelephone: '', ecoleEmail: '', ecoleType: '',
  nom: '', postNom: '', prenom: '', sexe: '', telephone: '', profilePhotoUrl: '',
  email: '', password: '', confirmPassword: '', institutionName: '',
};

const ROLES_NEEDING_LOCATION = new Set([
  'COORDINATION_PROVINCIALE', 'COORDINATION_SOUS_PROVINCIALE', 'DIRECTION_ECOLE', 'ENSEIGNANT', 'ELEVE', 'PARENT',
]);
const ROLES_NEEDING_EDUC_PROVINCE = new Set(['COORDINATION_SOUS_PROVINCIALE', 'DIRECTION_ECOLE']);
const ROLES_NEEDING_SCHOOL_FORM = new Set(['DIRECTION_ECOLE']);

function isStepNeeded(step: number, role: string): boolean {
  switch (step) {
    case 0: case 1: case 3: case 4: case 5: return true;
    case 2: return rolesNeedingFonctionGrade.has(role) || rolesNeedingDinacope.has(role);
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
  const [success, setSuccess] = useState(false);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((cur) => ({ ...cur, [field]: value }));
  }

  function nextStep() {
    setError('');
    const v = validateStep(step);
    if (v) { setError(v); return; }
    setDirection('forward');
    let next = step + 1;
    while (next < 6 && !isStepNeeded(next, form.role)) next++;
    if (next < 6) setStep(next);
  }

  function prevStep() {
    setError('');
    setDirection('back');
    let prev = step - 1;
    while (prev >= 0 && !isStepNeeded(prev, form.role)) prev--;
    if (prev >= 0) setStep(prev);
  }

  function goToStep(target: number) {
    setDirection(target < step ? 'back' : 'forward');
    setStep(target);
  }

  function validateStep(s: number): string {
    switch (s) {
      case 0:
        if (!form.typeInstitution) return 'Veuillez sélectionner une institution.';
        return '';
      case 1:
        if (!form.role) return 'Veuillez sélectionner un niveau.';
        return '';
      case 2:
        if (rolesNeedingDinacope.has(form.role) && !form.dinacope.trim())
          return 'Le numéro DINACOPE est obligatoire pour ce profil.';
        if (form.role === 'COORDINATION_PROVINCIALE') {
          if (!form.bureauAffectation) return 'Veuillez sélectionner un bureau d\u2019affectation.';
          if (!form.fonction) return 'Veuillez sélectionner une fonction.';
          if (!form.grade) return 'Veuillez sélectionner un grade.';
        }
        if (rolesNeedingFonctionGrade.has(form.role) && !form.fonction)
          return 'Veuillez sélectionner une fonction.';
        if (rolesNeedingFonctionGrade.has(form.role) && gradesByRole[form.role]?.length > 0 && !form.grade)
          return 'Veuillez sélectionner un grade.';
        return '';
      case 3:
        if (!form.nom.trim()) return 'Le nom est obligatoire.';
        if (!form.prenom.trim()) return 'Le prénom est obligatoire.';
        if (ROLES_NEEDING_LOCATION.has(form.role) && !form.provinceAdministrative)
          return 'Veuillez sélectionner une province.';
        if (ROLES_NEEDING_EDUC_PROVINCE.has(form.role) && !form.provinceEducationnelle)
          return 'Veuillez sélectionner une province éducationnelle.';
        if (ROLES_NEEDING_EDUC_PROVINCE.has(form.role) && !form.coordSousProvinciale)
          return 'Veuillez sélectionner une coordination sous-provinciale.';
        if (ROLES_NEEDING_SCHOOL_FORM.has(form.role) && form.typeInstitution === 'EC-ERC') {
          if (!form.ecoleNom.trim()) return 'Le nom de l\u2019école est obligatoire.';
          if (!form.dinacope.trim()) return 'Le numéro DINACOPE de l\u2019école est obligatoire.';
        }
        if (ROLES_NEEDING_SCHOOL_FORM.has(form.role) && form.typeInstitution !== 'EC-ERC' && !form.institutionName.trim())
          return 'Le nom de l\u2019institution est obligatoire.';
        return '';
      case 4:
        if (!form.email.trim()) return 'L\u2019email est obligatoire.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'L\u2019email est invalide.';
        if (form.password.length < 8) return 'Le mot de passe doit faire au moins 8 caractères.';
        if (form.password !== form.confirmPassword) return 'Les mots de passe ne correspondent pas.';
        return '';
      default:
        return '';
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    for (let s = 0; s < 5; s++) {
      if (isStepNeeded(s, form.role)) {
        const v = validateStep(s);
        if (v) { setStep(s); setError(v); return; }
      }
    }
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: form.nom, postNom: form.postNom, prenom: form.prenom, sexe: form.sexe,
          email: form.email, telephone: form.telephone, password: form.password,
          role: form.role, typeInstitution: form.typeInstitution,
          institutionName: form.ecoleNom || form.institutionName,
          provinceAdministrative: form.provinceAdministrative,
          provinceEducationnelle: form.provinceEducationnelle,
          bureauAffectation: form.bureauAffectation, fonction: form.fonction,
          grade: form.grade, dinacope: form.dinacope,
          coordSousProvinciale: form.coordSousProvinciale,
          profilePhotoUrl: form.profilePhotoUrl || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error ?? 'Impossible de créer le compte.'); return; }
      setSuccess(true);
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  }

  // Handlers that reset dependent fields
  function handleInstitutionType(value: string) {
    setForm((cur) => ({ ...cur, typeInstitution: value, role: '', fonction: '', grade: '', bureauAffectation: '' }));
  }
  function handleRole(value: string) {
    setForm((cur) => ({ ...cur, role: value, fonction: '', grade: '', bureauAffectation: '' }));
  }
  function handleAdminProvince(value: string) {
    setForm((cur) => ({ ...cur, provinceAdministrative: value, provinceEducationnelle: '', coordSousProvinciale: '' }));
  }
  function handleEducProvince(value: string) {
    setForm((cur) => ({ ...cur, provinceEducationnelle: value, coordSousProvinciale: '' }));
  }
  function handleBureau(value: string) {
    setForm((cur) => ({ ...cur, bureauAffectation: value, fonction: '', grade: '' }));
  }

  // Computed values
  const isEcErc = form.typeInstitution === 'EC-ERC';
  const roleOptions: RoleOption[] = allRegistrationRoleOptions;
  const availableEdProvinces = form.provinceAdministrative
    ? educationProvincesByAdminFromSousDivisions[form.provinceAdministrative] ?? []
    : [];
  const availableSousDivisions = form.provinceEducationnelle
    ? sousDivisionsByEducationProvince[form.provinceEducationnelle] ?? []
    : [];
  const availableFonctions = form.role === 'COORDINATION_PROVINCIALE'
    ? fonctionsByBureau[form.bureauAffectation] ?? []
    : fonctionsByRole[form.role] ?? [];
  const availableGrades = form.role === 'COORDINATION_PROVINCIALE'
    ? gradesByBureau[form.bureauAffectation] ?? []
    : gradesByRole[form.role] ?? [];

  const visibleStepIndices = STEP_LABELS.map((_, i) => i).filter(
    (i) => i === 0 || i === 5 || isStepNeeded(i, form.role)
  );
  const visibleCount = visibleStepIndices.length;
  const currentVisiblePosition = visibleStepIndices.indexOf(step) + 1;
  const animClass = direction === 'forward' ? 'step-enter' : 'step-enter-back';
  const isLastStep = step === 5;
  const needsLocation = ROLES_NEEDING_LOCATION.has(form.role);
  const needsEducProvince = ROLES_NEEDING_EDUC_PROVINCE.has(form.role);
  const needsSchoolForm = ROLES_NEEDING_SCHOOL_FORM.has(form.role) && isEcErc;
  const needsSimpleSchool = ROLES_NEEDING_SCHOOL_FORM.has(form.role) && !isEcErc;

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-xl font-bold text-slate-900">Votre compte a été créé avec succès.</p>
          <p className="mt-2 text-sm text-slate-500">
            Un code de validation a été envoyé à <span className="font-medium text-blue-600">{form.email}</span>.
            Vérifiez votre email pour activer votre compte.
          </p>
        </div>
        <button
          onClick={() => router.push(`/verify?email=${encodeURIComponent(form.email)}`)}
          className="btn-primary w-full px-6 py-3 text-sm"
        >
          Accéder à mon espace →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Progress bar */}
      <div className="sticky top-0 z-10 -mx-6 bg-white/95 px-6 pb-3 pt-1 backdrop-blur-sm sm:-mx-8 sm:px-8">
        <div className="flex items-center gap-1">
          {visibleStepIndices.map((i, displayIdx) => {
            const label = STEP_LABELS[i];
            const isActive = i === step;
            const isPast = i < step;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  isActive ? 'bg-blue-600 text-white' : isPast ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
                }`}>
                  {isPast ? '✓' : displayIdx + 1}
                </div>
                <span className={`hidden text-[10px] font-medium sm:block ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>{label}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 h-1 w-full rounded-full bg-slate-100">
          <div className="h-1 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${(currentVisiblePosition / visibleCount) * 100}%` }} />
        </div>
      </div>

      {/* Step content */}
      <div key={step} className={animClass}>
        {/* STEP 0: Institution */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Étape 1 — Institution</p>
            <p className="text-sm text-slate-500">
              Sélectionnez votre type d\u2019institution.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {registrationInstitutionTypes.map((inst) => (
                <div key={inst.value} onClick={() => handleInstitutionType(inst.value)}
                  className={`select-card rounded-2xl border-2 p-4 ${form.typeInstitution === inst.value ? 'selected' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    {inst.value === 'EC-ERC'
                      ? <ErcLogo size={40} />
                      : <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${form.typeInstitution === inst.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>◆</div>}
                    <div>
                      <p className="font-semibold text-slate-900">{inst.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: Structure */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Étape 2 — Structure
            </p>
            <p className="text-sm text-slate-500">
              Sélectionnez votre niveau. Chaque niveau donne accès à un espace indépendant.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {roleOptions.map((role) => (
                <div key={role.value} onClick={() => handleRole(role.value)}
                  className={`select-card rounded-2xl border-2 p-4 ${form.role === role.value ? 'selected' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${form.role === role.value ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>✓</div>
                    <p className="font-medium text-slate-900">{role.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Fonction */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Étape 3 — Fonction</p>

            {/* DINACOPE for national/provincial agents */}
            {rolesNeedingDinacope.has(form.role) && (
              <div>
                <label className={labelClass}>Numéro DINACOPE *</label>
                <input className={inputClass} value={form.dinacope} onChange={(e) => updateField('dinacope', e.target.value)} placeholder="Numéro DINACOPE" />
              </div>
            )}

            {/* Bureau for COORDINATION_PROVINCIALE */}
            {form.role === 'COORDINATION_PROVINCIALE' && (
              <div>
                <label className={labelClass}>Bureau d\u2019affectation *</label>
                <select className={inputClass} value={form.bureauAffectation} onChange={(e) => handleBureau(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {provincialBureaux.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            )}

            {/* Fonction */}
            {form.role !== 'ELEVE' && form.role !== 'PARENT' && (
              <div>
                <label className={labelClass}>Fonction *</label>
                <select className={inputClass} value={form.fonction} onChange={(e) => updateField('fonction', e.target.value)}
                  disabled={form.role === 'COORDINATION_PROVINCIALE' && !form.bureauAffectation}>
                  <option value="">— Sélectionner —</option>
                  {availableFonctions.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                {form.role === 'COORDINATION_PROVINCIALE' && !form.bureauAffectation && (
                  <p className="mt-1 text-xs text-slate-400">Sélectionnez d\u2019abord un bureau.</p>
                )}
              </div>
            )}

            {/* Grade */}
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
        )}

        {/* STEP 3: Informations */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Étape 4 — Informations</p>

            {/* Profile photo */}
            <div className="rounded-2xl border border-slate-200 p-4">
              <label className={labelClass}>Photo de profil</label>
              <ProfilePhotoUpload value={form.profilePhotoUrl} onChange={(url) => updateField('profilePhotoUrl', url)} />
            </div>

            {/* Personal info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Nom *</label>
                <input className={inputClass} value={form.nom} onChange={(e) => updateField('nom', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Post-nom</label>
                <input className={inputClass} value={form.postNom} onChange={(e) => updateField('postNom', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Prénom *</label>
                <input className={inputClass} value={form.prenom} onChange={(e) => updateField('prenom', e.target.value)} />
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
            </div>

            {/* Location */}
            {needsLocation && (
              <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-700">Localisation</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Province administrative *</label>
                    <select className={inputClass} value={form.provinceAdministrative} onChange={(e) => handleAdminProvince(e.target.value)}>
                      <option value="">— Sélectionner —</option>
                      {allProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  {needsEducProvince && (
                    <div>
                      <label className={labelClass}>Province éducationnelle *</label>
                      <select className={inputClass} value={form.provinceEducationnelle} onChange={(e) => handleEducProvince(e.target.value)}
                        disabled={!form.provinceAdministrative}>
                        <option value="">— Sélectionner —</option>
                        {availableEdProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      {!form.provinceAdministrative && <p className="mt-1 text-xs text-slate-400">Sélectionnez d\u2019abord une province.</p>}
                    </div>
                  )}
                  {needsEducProvince && (
                    <div className="sm:col-span-2">
                      <label className={labelClass}>Coordination sous-provinciale *</label>
                      <select className={inputClass} value={form.coordSousProvinciale} onChange={(e) => updateField('coordSousProvinciale', e.target.value)}
                        disabled={!form.provinceEducationnelle}>
                        <option value="">— Sélectionner —</option>
                        {availableSousDivisions.map((sd) => <option key={sd} value={sd}>{sd}</option>)}
                      </select>
                      {!form.provinceEducationnelle && <p className="mt-1 text-xs text-slate-400">Sélectionnez d\u2019abord une province éducationnelle.</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* School form for École EC-ERC */}
            {needsSchoolForm && (
              <div className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50/30 p-4">
                <p className="text-sm font-semibold text-slate-700">Établissement EC-ERC</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>Nom de l\u2019école *</label>
                    <input className={inputClass} value={form.ecoleNom} onChange={(e) => updateField('ecoleNom', e.target.value)} placeholder="Nom de l'école" />
                  </div>
                  <div>
                    <label className={labelClass}>DINACOPE *</label>
                    <input className={inputClass} value={form.dinacope} onChange={(e) => updateField('dinacope', e.target.value)} placeholder="Numéro DINACOPE" />
                  </div>
                  <div>
                    <label className={labelClass}>Commune</label>
                    <input className={inputClass} value={form.ecoleCommune} onChange={(e) => updateField('ecoleCommune', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Type d\u2019établissement</label>
                    <select className={inputClass} value={form.ecoleType} onChange={(e) => updateField('ecoleType', e.target.value)}>
                      <option value="">— Sélectionner —</option>
                      {ecoleTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Adresse</label>
                    <input className={inputClass} value={form.ecoleAdresse} onChange={(e) => updateField('ecoleAdresse', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Téléphone (école)</label>
                    <input type="tel" className={inputClass} value={form.ecoleTelephone} onChange={(e) => updateField('ecoleTelephone', e.target.value)} placeholder="+243 ..." />
                  </div>
                  <div>
                    <label className={labelClass}>E-mail (école)</label>
                    <input type="email" className={inputClass} value={form.ecoleEmail} onChange={(e) => updateField('ecoleEmail', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* Simple school name for non-EC-ERC DIRECTION_ECOLE */}
            {needsSimpleSchool && (
              <div>
                <label className={labelClass}>Nom de l\u2019institution / école *</label>
                <input className={inputClass} value={form.institutionName} onChange={(e) => updateField('institutionName', e.target.value)} placeholder="Nom de l'institution" />
              </div>
            )}

            {/* School name for ENSEIGNANT/ELEVE/PARENT */}
            {(form.role === 'ENSEIGNANT' || form.role === 'ELEVE' || form.role === 'PARENT') && (
              <div>
                <label className={labelClass}>Nom de l\u2019institution / école</label>
                <input className={inputClass} value={form.institutionName} onChange={(e) => updateField('institutionName', e.target.value)} placeholder="Nom de l'institution (optionnel)" />
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Compte */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Étape 5 — Compte</p>
            <div className="grid gap-4">
              <div>
                <label className={labelClass}>E-mail *</label>
                <input type="email" className={inputClass} value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="votre@email.com" />
              </div>
              <div>
                <label className={labelClass}>Mot de passe *</label>
                <input type="password" className={inputClass} value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="Minimum 8 caractères" />
              </div>
              <div>
                <label className={labelClass}>Confirmation du mot de passe *</label>
                <input type="password" className={inputClass} value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Vérification */}
        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Étape 6 — Vérification</p>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="mb-4 text-sm text-slate-600">Vérifiez le récapitulatif ci-dessous avant de valider la création de votre compte.</p>
              <div className="space-y-2 text-sm">
                <SummaryRow label="Institution" value={registrationInstitutionTypes.find((i) => i.value === form.typeInstitution)?.label ?? '—'} onEdit={() => goToStep(0)} />
                <SummaryRow label="Niveau / Rôle" value={roleOptions.find((r) => r.value === form.role)?.label ?? '—'} onEdit={() => goToStep(1)} />
                {form.bureauAffectation && <SummaryRow label="Bureau" value={form.bureauAffectation} onEdit={() => goToStep(2)} />}
                {form.fonction && <SummaryRow label="Fonction" value={form.fonction} onEdit={() => goToStep(2)} />}
                {form.grade && <SummaryRow label="Grade" value={form.grade} onEdit={() => goToStep(2)} />}
                {form.dinacope && <SummaryRow label="DINACOPE" value={form.dinacope} onEdit={() => goToStep(2)} />}
                {form.provinceAdministrative && <SummaryRow label="Province" value={form.provinceAdministrative} onEdit={() => goToStep(3)} />}
                {form.provinceEducationnelle && <SummaryRow label="Province éduc." value={form.provinceEducationnelle} onEdit={() => goToStep(3)} />}
                {form.coordSousProvinciale && <SummaryRow label="Coord. sous-prov." value={form.coordSousProvinciale} onEdit={() => goToStep(3)} />}
                {(form.ecoleNom || form.institutionName) && <SummaryRow label="Établissement" value={form.ecoleNom || form.institutionName} onEdit={() => goToStep(3)} />}
                {form.ecoleType && <SummaryRow label="Type école" value={form.ecoleType} onEdit={() => goToStep(3)} />}
                <SummaryRow label="Nom complet" value={`${form.nom} ${form.postNom} ${form.prenom}`.trim()} onEdit={() => goToStep(3)} />
                {form.sexe && <SummaryRow label="Sexe" value={form.sexe === 'M' ? 'Masculin' : 'Féminin'} onEdit={() => goToStep(3)} />}
                {form.telephone && <SummaryRow label="Téléphone" value={form.telephone} onEdit={() => goToStep(3)} />}
                <SummaryRow label="E-mail" value={form.email} onEdit={() => goToStep(4)} />
                {form.profilePhotoUrl && (
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-1.5">
                    <span className="font-medium text-slate-500">Photo</span>
                    <img src={form.profilePhotoUrl} alt="Photo" className="h-10 w-10 rounded-lg object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <button type="button" onClick={prevStep} className="btn-secondary-light px-5 py-2.5 text-sm">← Précédent</button>
        ) : <div />}
        {!isLastStep ? (
          <button type="button" onClick={nextStep} className="btn-primary px-5 py-2.5 text-sm">Continuer →</button>
        ) : (
          <button type="submit" disabled={loading} className={`btn-primary px-5 py-2.5 text-sm ${loading ? 'btn-loading' : ''}`}>
            {loading ? (<><span className="btn-spinner" /> Création…</>) : 'Confirmer l\u2019inscription'}
          </button>
        )}
      </div>
    </form>
  );
}

function SummaryRow({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-1.5">
      <span className="font-medium text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-right text-slate-900">{value}</span>
        {onEdit && (
          <button type="button" onClick={onEdit} className="text-xs font-medium text-blue-600 hover:underline">Modifier</button>
        )}
      </div>
    </div>
  );
}
