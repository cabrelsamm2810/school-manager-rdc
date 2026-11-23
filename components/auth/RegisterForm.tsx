'use client';

import { FormEvent, useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import {
  registrationStructureTypes,
  registrationRoleOptions,
  rolesByStructureCategorie,
  schoolBureauxByRole,
  allProvinces,
  fonctionsByRole,
  gradesByRole,
  rolesNeedingFonctionGrade,
  educationProvincesByAdmin,
  type RoleOption,
} from '@/lib/meta-data';
import { institutionsForCategorie, getInstitution } from '@/lib/institutions';
import { describeRolePermissions } from '@/lib/structure-permissions';
import { ProfilePhotoUpload } from '@/components/auth/ProfilePhotoUpload';
import { SchoolSelector, type SchoolOption } from '@/components/auth/SchoolSelector';

const STEP_LABELS = ['Structure', 'Établissement', 'Rôle', 'Province', 'Compte', 'Vérification'];

const inputClass = 'reg-field';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

type FormState = {
  structureType: string;
  typeInstitution: string;
  ecoleId: string;
  institutionName: string;
  role: string;
  bureauAffectation: string;
  fonction: string;
  grade: string;
  dinacope: string;
  provinceAdministrative: string;
  provinceEducationnelle: string;
  nom: string;
  postNom: string;
  prenom: string;
  sexe: string;
  telephone: string;
  profilePhotoUrl: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const emptyForm: FormState = {
  structureType: '', typeInstitution: '', ecoleId: '', institutionName: '',
  role: '', bureauAffectation: '', fonction: '', grade: '', dinacope: '',
  provinceAdministrative: '', provinceEducationnelle: '',
  nom: '', postNom: '', prenom: '', sexe: '', telephone: '', profilePhotoUrl: '',
  email: '', password: '', confirmPassword: '',
};

/* ── Display helpers (presentation only — no logic change) ── */

const INSTITUTION_SHORT: Record<string, string> = {
  'EC_ERC': 'EC-ERC',
  'PUBLIQUE': 'École publique',
  'CATHOLIQUE': 'École catholique',
  'ISLAMIQUE': 'École islamique',
  'PRIVE_AGREE': 'Privé agréé',
  'INDEPENDANTE': 'Privé indépendant',
};
const INSTITUTION_DESC: Record<string, string> = {
  'EC_ERC': 'Écoles Conventionnées des Églises du Réveil du Congo',
  'PUBLIQUE': 'École publique',
  'CATHOLIQUE': 'Conventionné catholique',
  'ISLAMIQUE': 'École islamique',
  'PRIVE_AGREE': 'Établissement privé agréé',
  'INDEPENDANTE': 'Établissement privé indépendant',
};
const ROLE_DESC: Record<string, string> = {
  'DIRECTION_ECOLE': 'Gestion d’école',
  'PROMOTEUR': 'Promotion de l’établissement',
  'SECRETAIRE': 'Secrétariat et scolarité',
  'COMPTABLE': 'Comptabilité et finances',
  'ENSEIGNANT': 'Corps enseignant',
  'ELEVE': 'Espace élève',
  'PARENT': 'Espace parent',
};

function CheckBadge() {
  return (
    <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-100">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function InstitutionIcon({ type, selected }: { type: string; selected: boolean }) {
  if (type === 'EC_ERC') return (<img src="/illustrations/ec-erc-logo.jpg" alt="EC-ERC" className="h-14 w-14 rounded-lg object-contain" />);
  if (type === 'CATHOLIQUE') return (<img src="/illustrations/eccath-logo.jpg" alt="ECCATH" className="h-14 w-14 rounded-lg object-contain" />);
  const bg = selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500';
  let path: ReactNode = null;
  if (type === 'PUBLIQUE') path = (<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h9v18h-9V3zM13.5 8.25h6v12.75h-6V8.25z" />);
  else if (type === 'CATHOLIQUE') path = (<path strokeLinecap="round" strokeLinejoin="round" d="M12 3v6M9 6h6M5 21V11l7-3 7 3v10M5 21h14" />);
  else if (type === 'ISLAMIQUE') path = (<path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />);
  else if (type === 'PRIVE_AGREE') path = (<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />);
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
  if (type === 'DIRECTION_ECOLE') content = (<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h9v18h-9V3zM13.5 8.25h6v12.75h-6V8.25z" />);
  else if (type === 'PROMOTEUR') content = (<path strokeLinecap="round" strokeLinejoin="round" d="M12 3l2.4 4.86 5.36.78-3.88 3.78.92 5.34L12 15.24l-4.8 2.52.92-5.34L4.24 8.64l5.36-.78L12 3z" />);
  else if (type === 'SECRETAIRE') content = (<path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6.75h-9A2.25 2.25 0 005.25 9v9a2.25 2.25 0 002.25 2.25h9A2.25 2.25 0 0018.75 18V9a2.25 2.25 0 00-2.25-2.25zM8.25 11.25h7.5M8.25 15h4.5" />);
  else if (type === 'COMPTABLE') content = (<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5M7.5 3.75v16.5m9-16.5v16.5" />);
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
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600 ring-1 ring-blue-100">{num}</span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold leading-tight text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{desc}</p>
        </div>
      </div>
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

const UserIcon: ReactNode = <User className="h-5 w-5" strokeWidth={1.8} />;
const PhoneIcon: ReactNode = <Phone className="h-5 w-5" strokeWidth={1.8} />;
const MailIcon: ReactNode = <Mail className="h-5 w-5" strokeWidth={1.8} />;
const LockIcon: ReactNode = <Lock className="h-5 w-5" strokeWidth={1.8} />;
const EyeIcon: ReactNode = <Eye className="h-5 w-5" strokeWidth={1.8} />;
const EyeOffIcon: ReactNode = <EyeOff className="h-5 w-5" strokeWidth={1.8} />;

export function RegisterForm({ onStepChange }: { onStepChange?: (step: number) => void }) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedSchool, setSelectedSchool] = useState<SchoolOption | null>(null);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  }

  function prevStep() {
    setError('');
    setDirection('back');
    setStep((s) => Math.max(s - 1, 0));
  }

  function goToStep(target: number) {
    setDirection(target < step ? 'back' : 'forward');
    setStep(target);
  }

  function validateStep(s: number): string {
    switch (s) {
      case 0:
        if (!form.structureType) return 'Veuillez sélectionner un type de structure.';
        if (!form.typeInstitution) return 'Veuillez sélectionner une institution.';
        return '';
      case 1:
        if (!form.ecoleId) return 'Veuillez sélectionner votre établissement scolaire.';
        return '';
      case 2:
        if (!form.role) return 'Veuillez sélectionner votre rôle.';
        if ((schoolBureauxByRole[form.role]?.length ?? 0) > 0 && !form.bureauAffectation)
          return 'Veuillez sélectionner un bureau d’affectation.';
        if (rolesNeedingFonctionGrade.has(form.role) && !form.fonction)
          return 'Veuillez sélectionner une fonction.';
        if (rolesNeedingFonctionGrade.has(form.role) && (gradesByRole[form.role]?.length ?? 0) > 0 && !form.grade)
          return 'Veuillez sélectionner un grade.';
        return '';
      case 3:
        if (!form.provinceAdministrative) return 'Veuillez sélectionner une province.';
        return '';
      case 4:
        if (!form.nom.trim()) return 'Le nom est obligatoire.';
        if (!form.prenom.trim()) return 'Le prénom est obligatoire.';
        if (!form.email.trim()) return 'L’email est obligatoire.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'L’email est invalide.';
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
    for (let s = 0; s < STEP_LABELS.length - 1; s++) {
      const v = validateStep(s);
      if (v) { setStep(s); setError(v); return; }
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
          institutionName: form.institutionName,
          ecoleId: form.ecoleId,
          provinceAdministrative: form.provinceAdministrative,
          provinceEducationnelle: form.provinceEducationnelle,
          bureauAffectation: form.bureauAffectation, fonction: form.fonction,
          grade: form.grade, dinacope: form.dinacope,
          profilePhotoUrl: form.profilePhotoUrl || undefined,
        }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error ?? 'Impossible de créer le compte.'); return; }
      setVerificationEmailSent(result.verificationEmailSent !== false);
      setSuccess(true);
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  }

  /* ── Cascade : chaque changement réinitialise les champs devenus incompatibles ── */

  function handleStructureType(value: string) {
    setForm((cur) => ({
      ...cur,
      structureType: value,
      typeInstitution: '', ecoleId: '', institutionName: '', role: '',
      bureauAffectation: '', fonction: '', grade: '', dinacope: '',
      provinceAdministrative: '', provinceEducationnelle: '',
    }));
    setSelectedSchool(null);
  }

  function handleInstitution(value: string) {
    setForm((cur) => ({
      ...cur,
      typeInstitution: value,
      ecoleId: '', institutionName: '', role: '',
      bureauAffectation: '', fonction: '', grade: '',
      provinceAdministrative: '', provinceEducationnelle: '',
    }));
    setSelectedSchool(null);
  }

  function handleSchool(id: string, nom: string, school?: SchoolOption | null) {
    setSelectedSchool(id ? school ?? null : null);
    setForm((cur) => ({
      ...cur,
      ecoleId: id,
      institutionName: nom,
      provinceAdministrative: school?.province ?? '',
      provinceEducationnelle: school?.provinceEducationnelle ?? '',
      bureauAffectation: '', fonction: '', grade: '',
    }));
  }

  function handleRole(value: string) {
    setForm((cur) => ({ ...cur, role: value, bureauAffectation: '', fonction: '', grade: '' }));
  }

  const structure = registrationStructureTypes.find((s) => s.value === form.structureType);
  const institutions = form.structureType ? institutionsForCategorie(form.structureType) : [];
  const institution = getInstitution(form.typeInstitution);
  const availableRoleCodes = rolesByStructureCategorie[form.structureType] ?? [];
  const roleOptions: RoleOption[] = registrationRoleOptions.filter((r) => availableRoleCodes.includes(r.value));
  const availableBureaux = schoolBureauxByRole[form.role] ?? [];
  const availableFonctions = fonctionsByRole[form.role] ?? [];
  const availableGrades = gradesByRole[form.role] ?? [];
  const permissionSummary = describeRolePermissions(form.role);
  const educationProvinces = form.provinceAdministrative
    ? educationProvincesByAdmin[form.provinceAdministrative] ?? []
    : [];

  const currentVisiblePosition = step + 1;
  const visibleCount = STEP_LABELS.length;
  const animClass = direction === 'forward' ? 'step-enter' : 'step-enter-back';
  const isLastStep = step === STEP_LABELS.length - 1;

  if (success) {
    return (
      <div className="reg-fade-up space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 ring-4 ring-green-100/60">
          <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-xl font-bold text-slate-900">Votre compte a été créé avec succès.</p>
          <p className="mt-2 break-words text-sm text-slate-600">
            {verificationEmailSent ? 'Un code de validation a été envoyé à ' : 'Votre compte est enregistré, mais le code n’a pas pu être envoyé à '}
            <span className="font-medium text-blue-600">{form.email.trim().toLowerCase()}</span>.
            {verificationEmailSent ? ' Saisissez ce code pour activer votre compte.' : ' Ouvrez l’activation pour renvoyer le code.'}
          </p>
          <p className="mt-1 text-xs text-slate-500">Vérifiez également votre dossier spam ou courriers indésirables.</p>
        </div>
        <Link
          href={`/verify?email=${encodeURIComponent(form.email.trim().toLowerCase())}`}
          className="btn-primary w-full px-6 py-3.5 text-sm sm:w-auto sm:min-w-[280px]"
          style={{ borderRadius: '9999px' }}
        >
          Activer mon compte →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Progress indicator */}
      <div className="sticky top-0 z-10 -mx-5 rounded-t-[2rem] bg-white/95 px-5 pb-3 pt-1 backdrop-blur-md sm:-mx-8 sm:px-8">
        <div className="hidden items-center justify-between sm:flex">
          {STEP_LABELS.map((label, i) => {
            const isActive = i === step;
            const isPast = i < step;
            return (
              <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
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
                  ) : i + 1}
                </button>
                <span className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : isPast ? 'text-blue-400' : 'text-slate-400'}`}>{label}</span>
              </div>
            );
          })}
        </div>
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
        <div className="mt-2 hidden h-1 w-full rounded-full bg-slate-100 sm:block">
          <div className="h-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${(currentVisiblePosition / visibleCount) * 100}%` }} />
        </div>
      </div>

      {/* Step content */}
      <div key={step} className={animClass}>
        {/* STEP 0: Type de structure → Institution */}
        {step === 0 && (
          <div className="space-y-5">
            <StepHeader num={1} title="Type de structure" desc="Choisissez la catégorie de votre établissement." />
            <div className="grid gap-3 sm:grid-cols-2">
              {registrationStructureTypes.map((type) => (
                <div key={type.value} onClick={() => handleStructureType(type.value)}
                  className={`select-card rounded-2xl border-2 p-4 ${form.structureType === type.value ? 'selected' : 'border-slate-200'}`}>
                  {form.structureType === type.value && <CheckBadge />}
                  <p className="font-bold tracking-tight text-slate-900">{type.label}</p>
                  <p className="mt-1 text-xs leading-snug text-slate-500">{type.description}</p>
                </div>
              ))}
            </div>

            {form.structureType && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 rounded-full bg-blue-500" />
                  <p className="text-sm font-semibold text-slate-700">Institution</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {institutions.map((inst) => (
                    <div key={inst.code} onClick={() => handleInstitution(inst.code)}
                      className={`select-card rounded-2xl border-2 p-4 ${form.typeInstitution === inst.code ? 'selected' : 'border-slate-200'}`}>
                      {form.typeInstitution === inst.code && <CheckBadge />}
                      <div className="flex items-start gap-3">
                        <div className="flex shrink-0 items-center justify-center">
                          <InstitutionIcon type={inst.code} selected={form.typeInstitution === inst.code} />
                        </div>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="font-bold tracking-tight text-slate-900">{INSTITUTION_SHORT[inst.code] ?? inst.label}</p>
                          <p className="text-xs leading-snug text-slate-500">{INSTITUTION_DESC[inst.code] ?? inst.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 1: Établissement scolaire */}
        {step === 1 && (
          <div className="space-y-4">
            <StepHeader num={2} title="Établissement scolaire" desc="Sélectionnez votre établissement dans l’institution choisie." />
            <SchoolSelector
              institution={form.typeInstitution}
              value={form.ecoleId}
              onChange={handleSchool}
              required
              label="Votre établissement"
            />
            {selectedSchool && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-sm">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-4 w-1 rounded-full bg-blue-500" />
                  <p className="font-semibold text-slate-700">Établissement sélectionné</p>
                </div>
                <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
                  <SummaryLine label="Nom officiel" value={selectedSchool.nom} />
                  <SummaryLine label="Province" value={selectedSchool.province} />
                  <SummaryLine label="Province éducationnelle" value={selectedSchool.provinceEducationnelle} />
                  <SummaryLine label="Commune" value={selectedSchool.commune} />
                  {selectedSchool.dinacope && <SummaryLine label="DINACOPE" value={selectedSchool.dinacope} />}
                </dl>
              </div>
            )}
            {form.typeInstitution && !form.ecoleId && (
              <p className="text-xs text-slate-500">
                Votre établissement n’apparaît pas ? Contactez l’administration de votre institution.
              </p>
            )}
          </div>
        )}

        {/* STEP 2: Rôle, bureau et fonction */}
        {step === 2 && (
          <div className="space-y-4">
            <StepHeader num={3} title="Rôle" desc={`Rôles disponibles pour ${institution ? INSTITUTION_SHORT[institution.code] ?? institution.label : 'cette institution'}.`} />
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

            {availableBureaux.length > 0 && (
              <div>
                <label className={labelClass}>Bureau d’affectation *</label>
                <select className={inputClass} value={form.bureauAffectation} onChange={(e) => updateField('bureauAffectation', e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {availableBureaux.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            )}

            {form.role !== 'ELEVE' && form.role !== 'PARENT' && (
              <div>
                <label className={labelClass}>Fonction *</label>
                <select className={inputClass} value={form.fonction} onChange={(e) => updateField('fonction', e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {availableFonctions.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
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

            {(form.role === 'DIRECTION_ECOLE' || form.role === 'ENSEIGNANT') && (
              <div>
                <label className={labelClass}>Numéro DINACOPE</label>
                <input className={inputClass} value={form.dinacope} onChange={(e) => updateField('dinacope', e.target.value)} placeholder="Numéro DINACOPE (optionnel)" />
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Province → Permissions */}
        {step === 3 && (
          <div className="space-y-4">
            <StepHeader num={4} title="Province et permissions" desc="La province découle de votre établissement. Vérifiez les permissions accordées." />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Province administrative *</label>
                {selectedSchool?.province ? (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                    <span>{form.provinceAdministrative}</span>
                    <span className="text-xs text-slate-400">Établissement</span>
                  </div>
                ) : (
                  <select className={inputClass} value={form.provinceAdministrative} onChange={(e) => updateField('provinceAdministrative', e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {allProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className={labelClass}>Province éducationnelle</label>
                {selectedSchool?.provinceEducationnelle ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                    {form.provinceEducationnelle}
                  </div>
                ) : (
                  <select className={inputClass} value={form.provinceEducationnelle} onChange={(e) => updateField('provinceEducationnelle', e.target.value)}
                    disabled={!form.provinceAdministrative}>
                    <option value="">— Sélectionner —</option>
                    {educationProvinces.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-blue-500" />
                <p className="text-sm font-semibold text-slate-700">Permissions — {permissionSummary.roleLabel || 'rôle à sélectionner'}</p>
              </div>
              {permissionSummary.items.length > 0 ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {permissionSummary.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                      <svg className="h-4 w-4 shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Sélectionnez un rôle à l’étape précédente.</p>
              )}
              <p className="mt-3 text-xs text-slate-500">
                Ces permissions sont limitées à votre établissement : vous ne voyez que les données de l’école sélectionnée.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: Identité et compte */}
        {step === 4 && (
          <div className="space-y-4">
            <StepHeader num={5} title="Identité et compte" desc="Vos informations personnelles et vos identifiants." />

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-blue-500" />
                <p className="text-sm font-semibold text-slate-700">Photo de profil</p>
              </div>
              <ProfilePhotoUpload value={form.profilePhotoUrl} onChange={(url) => updateField('profilePhotoUrl', url)} />
            </div>

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
              <div>
                <label className={labelClass}>E-mail *</label>
                <IconInput icon={MailIcon}>
                  <input type="email" className={`${inputClass} pl-11`} value={form.email} onChange={(e) => updateField('email', e.target.value)} placeholder="votre@email.com" />
                </IconInput>
              </div>
              <div>
                <label className={labelClass}>Mot de passe *</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{LockIcon}</span>
                  <input type={showPassword ? 'text' : 'password'} className={`${inputClass} pl-11 pr-12`} value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="Minimum 8 caractères" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1} aria-label={showPassword ? 'Masquer' : 'Afficher'}>
                    {showPassword ? EyeOffIcon : EyeIcon}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Confirmation du mot de passe *</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{LockIcon}</span>
                  <input type={showConfirmPassword ? 'text' : 'password'} className={`${inputClass} pl-11 pr-12`} value={form.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} placeholder="Confirmer le mot de passe" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1} aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}>
                    {showConfirmPassword ? EyeOffIcon : EyeIcon}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Vérification */}
        {step === 5 && (
          <div className="space-y-4">
            <StepHeader num={6} title="Vérification" desc="Vérifiez le récapitulatif avant de valider votre inscription." />
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-blue-500" />
                <p className="text-sm font-semibold text-slate-700">Récapitulatif de votre inscription</p>
              </div>
              <div className="space-y-2 text-sm">
                <SummaryRow label="Type de structure" value={structure?.label ?? '—'} onEdit={() => goToStep(0)} />
                <SummaryRow label="Institution" value={institution?.label ?? '—'} onEdit={() => goToStep(0)} />
                <SummaryRow label="Établissement" value={form.institutionName || '—'} onEdit={() => goToStep(1)} />
                <SummaryRow label="Rôle" value={roleOptions.find((r) => r.value === form.role)?.label ?? '—'} onEdit={() => goToStep(2)} />
                {form.bureauAffectation && <SummaryRow label="Bureau" value={form.bureauAffectation} onEdit={() => goToStep(2)} />}
                {form.fonction && <SummaryRow label="Fonction" value={form.fonction} onEdit={() => goToStep(2)} />}
                {form.grade && <SummaryRow label="Grade" value={form.grade} onEdit={() => goToStep(2)} />}
                {form.dinacope && <SummaryRow label="DINACOPE" value={form.dinacope} onEdit={() => goToStep(2)} />}
                <SummaryRow label="Province" value={form.provinceAdministrative || '—'} onEdit={() => goToStep(3)} />
                {form.provinceEducationnelle && <SummaryRow label="Province éduc." value={form.provinceEducationnelle} onEdit={() => goToStep(3)} />}
                {permissionSummary.items.length > 0 && (
                  <SummaryRow label="Permissions" value={permissionSummary.items.join(' · ')} onEdit={() => goToStep(3)} />
                )}
                <SummaryRow label="Nom complet" value={`${form.nom} ${form.postNom} ${form.prenom}`.trim()} onEdit={() => goToStep(4)} />
                {form.sexe && <SummaryRow label="Sexe" value={form.sexe === 'M' ? 'Masculin' : 'Féminin'} onEdit={() => goToStep(4)} />}
                {form.telephone && <SummaryRow label="Téléphone" value={form.telephone} onEdit={() => goToStep(4)} />}
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
        <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" style={{ animation: 'loginShake 0.4s ease' }}>
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-stretch justify-between gap-3">
        {step > 0 ? (
          <button type="button" onClick={prevStep}
            className="btn-secondary-light min-h-[3rem] flex-1 px-5 py-3 text-sm sm:flex-none"
            style={{ borderRadius: '9999px' }}
          >
            ← Retour
          </button>
        ) : <div className="hidden sm:block" />}
        {!isLastStep ? (
          <button type="button" onClick={nextStep}
            className="btn-primary min-h-[3rem] flex-1 px-6 py-3 text-sm sm:flex-none"
            style={{ borderRadius: '9999px' }}
          >
            Continuer →
          </button>
        ) : (
          <button type="submit" disabled={loading}
            className={`btn-primary min-h-[3rem] flex-1 px-6 py-3 text-sm sm:flex-none ${loading ? 'btn-loading' : ''}`}
            style={{ borderRadius: '9999px' }}
          >
            {loading ? (<><span className="btn-spinner" /> Création du compte…</>) : 'Confirmer l’inscription'}
          </button>
        )}
      </div>
    </form>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="text-slate-800">{value || '—'}</dd>
    </div>
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
