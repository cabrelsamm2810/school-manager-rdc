'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const institutionTypes = [
  { value: 'ECOLE', label: 'École' },
  { value: 'COLLEGE', label: 'Collège' },
  { value: 'LYCEE', label: 'Lycée' },
  { value: 'UNIVERSITE', label: 'Université' },
  { value: 'MINISTERE', label: 'Ministère / Administration' },
  { value: 'AUTRE', label: 'Autre' }
];

const roleOptions = [
  { value: 'ELEVE', label: 'Élève' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'ENSEIGNANT', label: 'Enseignant' },
  { value: 'DIRECTION_ECOLE', label: 'Direction d’école' },
  { value: 'AGENT_SOUS_PROVINCIAL', label: 'Agent sous provincial' },
  { value: 'COORDINATION_SOUS_PROVINCIALE', label: 'Coordination sous provinciale' },
  { value: 'AGENT_PROVINCIAL', label: 'Agent provincial' },
  { value: 'COORDINATION_PROVINCIALE', label: 'Coordination provinciale' },
  { value: 'COORDINATION_NATIONALE', label: 'Coordination nationale' },
  { value: 'SUPER_ADMIN', label: 'Super administrateur' }
];

const provinces = [
  'Kinshasa',
  'Kongo-Central',
  'Kasaï',
  'Kasaï-Central',
  'Kasaï-Oriental',
  'Lualaba',
  'Haut-Katanga',
  'Haut-Lomami',
  'Maniema',
  'Tshopo',
  'Ituri',
  'Nord-Kivu',
  'Sud-Kivu',
  'Bas-Uele',
  'Haut-Uele',
  'Tanganyika',
  'Nord-Ubangi',
  'Sud-Ubangi',
  'Mongala',
  'Equateur',
  'Province orientale'
];

const needsEducationProvince = new Set([
  'ELEVE',
  'PARENT',
  'ENSEIGNANT',
  'DIRECTION_ECOLE',
  'AGENT_SOUS_PROVINCIAL',
  'COORDINATION_SOUS_PROVINCIALE',
  'AGENT_PROVINCIAL',
  'COORDINATION_PROVINCIALE'
]);

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    nom: '',
    postNom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    typeInstitution: 'ECOLE',
    institutionName: '',
    role: 'ELEVE',
    provinceAdministrative: 'Kinshasa',
    provinceEducationnelle: 'Kinshasa'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const showEducationProvince = needsEducationProvince.has(form.role);

  function updateField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        nom: form.nom,
        postNom: form.postNom,
        prenom: form.prenom,
        email: form.email,
        telephone: form.telephone,
        password: form.password,
        role: form.role,
        institutionType: form.typeInstitution,
        institutionName: form.institutionName,
        provinceAdministrative: form.provinceAdministrative,
        provinceEducationnelle: form.provinceEducationnelle
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Type d’institution</p>
        <select
          value={form.typeInstitution}
          onChange={(event) => updateField('typeInstitution', event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          {institutionTypes.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="institutionName" className="block text-sm font-medium text-slate-700">Institution / école</label>
        <input
          id="institutionName"
          name="institutionName"
          type="text"
          value={form.institutionName}
          onChange={(event) => updateField('institutionName', event.target.value)}
          placeholder="Nom de l’école ou de l’institution"
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Informations personnelles</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="nom" className="mb-2 block text-sm font-medium text-slate-700">Nom</label>
          <input
            id="nom"
            name="nom"
            type="text"
            value={form.nom}
            onChange={(event) => updateField('nom', event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </div>
        <div>
          <label htmlFor="postNom" className="mb-2 block text-sm font-medium text-slate-700">Post-nom</label>
          <input
            id="postNom"
            name="postNom"
            type="text"
            value={form.postNom}
            onChange={(event) => updateField('postNom', event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label htmlFor="prenom" className="mb-2 block text-sm font-medium text-slate-700">Prénom</label>
          <input
            id="prenom"
            name="prenom"
            type="text"
            value={form.prenom}
            onChange={(event) => updateField('prenom', event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </div>
        <div>
          <label htmlFor="telephone" className="mb-2 block text-sm font-medium text-slate-700">Téléphone</label>
          <input
            id="telephone"
            name="telephone"
            type="tel"
            value={form.telephone}
            onChange={(event) => updateField('telephone', event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Mot de passe</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            minLength={8}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="role" className="block text-sm font-medium text-slate-700">Rôle / fonction</label>
        <select
          id="role"
          name="role"
          value={form.role}
          onChange={(event) => updateField('role', event.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        >
          {roleOptions.map((role) => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="provinceAdministrative" className="mb-2 block text-sm font-medium text-slate-700">Province administrative</label>
          <select
            id="provinceAdministrative"
            name="provinceAdministrative"
            value={form.provinceAdministrative}
            onChange={(event) => updateField('provinceAdministrative', event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            {provinces.map((province) => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>
        </div>

        {showEducationProvince && (
          <div>
            <label htmlFor="provinceEducationnelle" className="mb-2 block text-sm font-medium text-slate-700">Province éducationnelle</label>
            <select
              id="provinceEducationnelle"
              name="provinceEducationnelle"
              value={form.provinceEducationnelle}
              onChange={(event) => updateField('provinceEducationnelle', event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {provinces.map((province) => (
                <option key={province} value={province}>{province}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Création du compte…' : 'Créer un compte'}
      </button>
    </form>
  );
}
