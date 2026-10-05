'use client';

import { FormEvent, useState, useEffect, ReactNode } from 'react';
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

const inputClass = 'reg-field';
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

/* ── Display helpers (presentation only — no logic change) ── */

const INSTITUTION_SHORT: Record<string, string> = {
  'EC-ERC': 'EC-ERC',
  'PUBLIQUE': 'École publique',
  'CATHOLIQUE': 'École catholique',
  'ISLAMIQUE': 'École islamique',
  'INDEPENDANTE': 'École indépendante',
};
const INSTITUTION_DESC: Record<string, string> = {
  'EC-ERC': 'Églises du Réveil du Congo',
  'PUBLIQUE': 'Établissement public',
  'CATHOLIQUE': 'Conventionné catholique',
  'ISLAMIQUE': 'Établissement islamique',
  'INDEPENDANTE': 'Établissement indépendant',
};
const ROLE_DESC: Record<string, string> = {
  'COORDINATION_NATIONALE': 'Administration nationale',
  'COORDINATION_PROVINCIALE': 'Administration provinciale',
  'COORDINATION_SOUS_PROVINCIALE': 'Administration sous-provinciale',
  'DIRECTION_ECOLE': 'Gestion d’établissement',
  'ENSEIGNANT': 'Corps enseignant',
  'ELEVE': 'Espace élève',
  'PARENT': 'Espace parent',
};

function CheckBadge() {
  return (
    <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function InstitutionIcon({ type, selected }: { type: string; selected: boolean }) {
  if (type === 'EC-ERC') return (<ErcLogo size={44} />);
  const bg = selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500';
  let path: ReactNode = null;
  if (type === 'PUBLIQUE') path = (<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h9v18h-9V3zM13.5 8.25h6v12.75h-6V8.25z" />);
  else if (type === 'CATHOLIQUE') path = (<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v6M9 6h6M5 21V11l7-3 7 3v10M5 21h14" />);
  else if (type === 'ISLAMIQUE') path = (<path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />);
  else if (type === 'INDEPENDANTE') path = (<path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.5a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.662.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.482 19.34a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />);
  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${bg}`}>
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{path}</svg>
    </div>
  );
}

function RoleIcon({ type, selected }: { type: string; selected: boolean }) {
  const bg = selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500';
  let content: ReactNode = null;
  if (type === 'COORDINATION_NATIONALE') content = (<path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0-18c2.5 3 4 6 4 9s-1.5 6-4 9m-4-18c-2.5 3-4 6-4 9s1.5 6 4 9" />);
  else if (type === 'COORDINATION_PROVINCIALE') content = (<path strokeLinecap="round" strokeLinejoin="round" d="M3 17l4-4 3 3 4-5 4 4 3-3" />);
  else if (type === 'COORDINATION_SOUS_PROVINCIALE') content = (<g><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></g>);
  else if (type === 'DIRECTION_ECOLE') content = (<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h9v18h-9V3zM13.5 8.25h6v12.75h-6V8.25z" />);
  else if (type === 'ENSEIGNANT') content = (<path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25v14.25" />);
  else if (type === 'ELEVE') content = (<path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347M3.75 21.75h4.5a.75.75 0 00.75-.75v-4.5a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75v4.5a.75.75 0 00.75.75h4.5a.75.75 0 00.75-.75v-6a.75.75 0 00-.75-.75h-6a.75.75 0 01-.75-.75v-3a.75.75 0 00-.75-.75H3.75a.75.75 0 00-.75.75v3a.75.75 0 00.75.75h.75" />);
  else if (type === 'PARENT') content = (<path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />);
  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${bg}`}>
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>{content}</svg>
    </div>
  );
}

function StepHeader({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="reg-fade-up mb-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">{num}</span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      <p className="mt-1.5 pl-[2.625rem] text-sm text-slate-500">{desc}</p>
    </div>
  );
}

function IconInput({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
      {children}
    </div>
  );
}

const UserIcon: ReactNode = (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>);
const PhoneIcon: ReactNode = (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.39a12.035 12.035 0 01-7.143-7.143c-.162-.441.014-.928.39-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>);
const MailIcon: ReactNode = (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-6.938 4.007a2.25 2.25 0 01-2.286 0L1.07 8.909A2.25 2.25 0 010 6.993V6.75" /></svg>);
const LockIcon: ReactNode = (<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 00-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>);

export function RegisterForm({ onStepChange }: { onStepChange?: (step: number) => void }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    onStepChange?.(step);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

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
          if (!form.bureauAffectation) return 'Veuillez sélectionner un bureau d’affectation.';
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
          if (!form.ecoleNom.trim()) return 'Le nom de l’école est obligatoire.';
          if (!form.dinacope.trim()) return 'Le numéro DINACOPE de l’école est obligatoire.';
        }
        if (ROLES_NEEDING_SCHOOL_FORM.has(form.role) && form.typeInstitution !== 'EC-ERC' && !form.institutionName.trim())
          return 'Le nom de l’institution est obligatoire.';
        return '';
      case 4:
        if (!form.email.trim()) return 'L’email est obligatoire.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'L’email est invalide.';
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
      <div className="reg-fade-up space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 shadow-lg shadow-green-500/20">
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
          className="btn-primary w-full px-6 py-3.5 text-sm sm:w-auto sm:min-w-[280px]"
          style={{ borderRadius: '9999px' }}
        >
          Accéder à mon espace →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Progress indicator */}
      <div className="sticky top-0 z-10 -mx-5 rounded-t-[2rem] bg-white/95 px-5 pb-3 pt-1 backdrop-blur-md sm:-mx-8 sm:px-8">
        {/* Desktop: full progress with labels */}
        <div className="hidden items-center justify-between sm:flex">
          {visibleStepIndices.map((i, displayIdx) => {
            const label = STEP_LABELS[i];
            const isActive = i === step;
            const isPast = i < step;
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => goToStep(i)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isActive ? 'scale-110 bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : isPast ? 'bg-blue-100 text-blue-700'
                    : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isPast ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : displayIdx + 1}
                </button>
                <span className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : isPast ? 'text-blue-400' : 'text-slate-400'}`}>{label}</span>
              </div>
            );
          })}
        </div>
        {/* Mobile: compact progress bar */}
        <div className="sm:hidden">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600">Étape {currentVisiblePosition}/{visibleCount}</span>
            <span className="text-xs text-slate-400">{STEP_LABELS[step]}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
              style={{ width: `${(currentVisiblePosition / visibleCount) * 100}%` }} />
          </div>
        </div>
        {/* Desktop progress bar */}
        <div className="mt-2 hidden h-1 w-full rounded-full bg-slate-100 sm:block">
          <div className="h-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${(currentVisiblePosition / visibleCount) * 100}%` }} />
        </div>
      </div>

      {/* Step content */}
      <div key={step} className={animClass}>
        {/* STEP 0: Institution */}
        {step === 0 && (
          <div className="space-y-4">
            <StepHeader num={1} title="Institution" desc="Sélectionnez votre type d’institution." />
            <div className="grid gap-3 sm:grid-cols-2">
              {registrationInstitutionTypes.map((inst) => (
                <div key={inst.value} onClick={() => handleInstitutionType(inst.value)}
                  className={`select-card rounded-2xl border-2 p-4 ${form.typeInstitution === inst.value ? 'selected' : 'border-slate-200'}`}>
                  {form.typeInstitution === inst.value && <CheckBadge />}
                  <div className="flex items-center gap-3">
                    <InstitutionIcon type={inst.value} selected={form.typeInstitution === inst.value} />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{INSTITUTION_SHORT[inst.value] ?? inst.label}</p>
                      <p className="truncate text-xs text-slate-500">{INSTITUTION_DESC[inst.value]}</p>
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
            <StepHeader num={2} title="Structure" desc="Sélectionnez votre niveau. Chaque niveau donne accès à un espace indépendant." />
            <div className="grid gap-3 sm:grid-cols-2">
              {roleOptions.map((role) => (
                <div key={role.value} onClick={() => handleRole(role.value)}
                  className={`select-card rounded-2xl border-2 p-4 ${form.role === role.value ? 'selected' : 'border-slate-200'}`}>
                  {form.role === role.value && <CheckBadge />}
                  <div className="flex items-center gap-3">
                    <RoleIcon type={role.value} selected={form.role === role.value} />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">{role.label}</p>
                      <p className="truncate text-xs text-slate-500">{ROLE_DESC[role.value]}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Fonction */}
        {step === 2 && (
          <div className="space-y-4">
            <StepHeader num={3} title="Fonction" desc="Renseignez vos informations professionnelles." />

            {rolesNeedingDinacope.has(form.role) && (
              <div>
                <label className={labelClass}>Numéro DINACOPE *</label>
                <input className={inputClass} value={form.dinacope} onChange={(e) => updateField('dinacope', e.target.value)} placeholder="Numéro DINACOPE" />
              </div>
            )}

            {form.role === 'COORDINATION_PROVINCIALE' && (
              <div>
                <label className={labelClass}>Bureau d’affectation *</label>
                <select className={inputClass} value={form.bureauAffectation} onChange={(e) => handleBureau(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {provincialBureaux.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            )}

            {form.role !== 'ELEVE' && form.role !== 'PARENT' && (
              <div>
                <label className={labelClass}>Fonction *</label>
                <select className={inputClass} value={form.fonction} onChange={(e) => updateField('fonction', e.target.value)}
                  disabled={form.role === 'COORDINATION_PROVINCIALE' && !form.bureauAffectation}>
                  <option value="">— Sélectionner —</option>
                  {availableFonctions.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                {form.role === 'COORDINATION_PROVINCIALE' && !form.bureauAffectation && (
                  <p className="mt-1 text-xs text-slate-400">Sélectionnez d’abord un bureau.</p>
                )}
              </div>
            )}

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
            <StepHeader num={4} title="Informations" desc="Vos informations personnelles et localisation." />

            {/* Profile photo */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <label className={labelClass}>Photo de profil</label>
              <ProfilePhotoUpload value={form.profilePhotoUrl} onChange={(url) => updateField('profilePhotoUrl', url)} />
            </div>

            {/* Personal info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Nom *</label>
                <IconInput icon={UserIcon}>
                  <input className={`${inputClass} pl-11`} value={form.nom} onChange={(e) => updateField('nom', e.target.value)} />
                </IconInput>
              </div>
              <div>
                <label className={labelClass}>Post-nom</label>
                <input className={inputClass} value={form.postNom} onChange={(e) => updateField('postNom', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Prénom *</label>
                <IconInput icon={UserIcon}>
                  <input className={`${inputClass} pl-11`} value={form.prenom} onChange={(e) => updateField('prenom', e.target.value)} />
                </IconInput>
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
                <IconInput icon={PhoneIcon}>
                  <input type="tel" className={`${inputClass} pl-11`} value={form.telephone} onChange={(e) => updateField('telephone', e.target.value)} placeholder="+243 ..." />
                </IconInput>
              </div>
            </div>

            {/* Location */}
            {needsLocation && (
              <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
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
                      {!form.provinceAdministrative && <p className="mt-1 text-xs text-slate-400">Sélectionnez d’abord une province.</p>}
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
                      {!form.provinceEducationnelle && <p className="mt-1 text-xs text-slate-400">Sélectionnez d’abord une province éducationnelle.</p>}
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
                    <label className={labelClass}>Nom de l’école *</label>
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
                    <label className={labelClass}>Type d’établissement</label>
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
                <label className={labelClass}>Nom de l’institution / école *</label>
                <input className={inputClass} value={form.institutionName} onChange={(e) => updateField('institutionName', e.target.value)} placeholder="Nom de l'institution" />
              </div>
            )}

            {/* School name for ENSEIGNANT/ELEVE/PARENT */}
            {(form.role === 'ENSEIGNANT' || form.role === 'ELEVE' || form.role === 'PARENT') && (
              <div>
                <label className={labelClass}>Nom de l’institution / école</label>
                <input className={inputClass} value={form.institutionName} onChange={(e) => updateField('institutionName', e.target.value)} placeholder="Nom de l'institution (optionnel)" />
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Compte */}
        {step === 4 && (
          <div className="space-y-4">
            <StepHeader num={5} title="Compte" desc="Vos identifiants de connexion." />
            <div className="grid gap-4">
              <div>
                <label className={labelClass}>E-mail *</label>
                <IconInput icon={MailIcon}>
                  <input type="email" className={`${inputClass} pl-11`} value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="votre@email.com" />
                </IconInput>
              </div>
              <div>
                <label className={labelClass}>Mot de passe *</label>
                <IconInput icon={LockIcon}>
                  <input type="password" className={`${inputClass} pl-11`} value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="Minimum 8 caractères" />
                </IconInput>
              </div>
              <div>
                <label className={labelClass}>Confirmation du mot de passe *</label>
                <IconInput icon={LockIcon}>
                  <input type="password" className={`${inputClass} pl-11`} value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} />
                </IconInput>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Vérification */}
        {step === 5 && (
          <div className="space-y-4">
            <StepHeader num={6} title="Vérification" desc="Vérifiez le récapitulatif avant de valider votre inscription." />
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
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

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <button type="button" onClick={prevStep}
            className="btn-secondary-light px-5 py-3 text-sm"
            style={{ borderRadius: '9999px' }}
          >
            ← Retour
          </button>
        ) : <div />}
        {!isLastStep ? (
          <button type="button" onClick={nextStep}
            className="btn-primary px-6 py-3 text-sm"
            style={{ borderRadius: '9999px' }}
          >
            Continuer →
          </button>
        ) : (
          <button type="submit" disabled={loading}
            className={`btn-primary px-6 py-3 text-sm ${loading ? 'btn-loading' : ''}`}
            style={{ borderRadius: '9999px' }}
          >
            {loading ? (<><span className="btn-spinner" /> Création du compte…</>) : 'Confirmer l’inscription'}
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
