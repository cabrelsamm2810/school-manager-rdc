'use client';

import { FormEvent, useState } from 'react';

type EleveFormProps = {
  onCreated: () => void;
};

const emptyForm = {
  matricule: '',
  nom: '',
  postNom: '',
  prenom: '',
  sexe: '',
  dateNaissance: '',
  lieuNaissance: '',
  classe: '',
  telephone: '',
  email: '',
  adresse: '',
  nomTuteur: '',
  telephoneTuteur: ''
};

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

export function EleveForm({ onCreated }: EleveFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function updateField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/eleves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? 'Impossible d’enregistrer l’élève.');
        return;
      }

      setSuccess(true);
      setForm(emptyForm);
      onCreated();
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Identité</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="matricule" className={labelClass}>Matricule *</label>
          <input
            id="matricule"
            type="text"
            value={form.matricule}
            onChange={(e) => updateField('matricule', e.target.value)}
            className={inputClass}
            placeholder="Ex. ELV-2026-001"
            required
          />
        </div>
        <div>
          <label htmlFor="classe" className={labelClass}>Classe *</label>
          <input
            id="classe"
            type="text"
            value={form.classe}
            onChange={(e) => updateField('classe', e.target.value)}
            className={inputClass}
            placeholder="Ex. 6ème primaire"
            required
          />
        </div>
        <div>
          <label htmlFor="nom" className={labelClass}>Nom *</label>
          <input
            id="nom"
            type="text"
            value={form.nom}
            onChange={(e) => updateField('nom', e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="postNom" className={labelClass}>Post-nom</label>
          <input
            id="postNom"
            type="text"
            value={form.postNom}
            onChange={(e) => updateField('postNom', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="prenom" className={labelClass}>Prénom *</label>
          <input
            id="prenom"
            type="text"
            value={form.prenom}
            onChange={(e) => updateField('prenom', e.target.value)}
            className={inputClass}
            required
          />
        </div>
        <div>
          <label htmlFor="sexe" className={labelClass}>Sexe</label>
          <select
            id="sexe"
            value={form.sexe}
            onChange={(e) => updateField('sexe', e.target.value)}
            className={inputClass}
          >
            <option value="">—</option>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </div>
        <div>
          <label htmlFor="dateNaissance" className={labelClass}>Date de naissance</label>
          <input
            id="dateNaissance"
            type="date"
            value={form.dateNaissance}
            onChange={(e) => updateField('dateNaissance', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="lieuNaissance" className={labelClass}>Lieu de naissance</label>
          <input
            id="lieuNaissance"
            type="text"
            value={form.lieuNaissance}
            onChange={(e) => updateField('lieuNaissance', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Informations de contact</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="telephone" className={labelClass}>Téléphone</label>
          <input
            id="telephone"
            type="tel"
            value={form.telephone}
            onChange={(e) => updateField('telephone', e.target.value)}
            className={inputClass}
            placeholder="+243 ..."
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="adresse" className={labelClass}>Adresse</label>
          <input
            id="adresse"
            type="text"
            value={form.adresse}
            onChange={(e) => updateField('adresse', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Contact du tuteur / parent</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nomTuteur" className={labelClass}>Nom du tuteur</label>
          <input
            id="nomTuteur"
            type="text"
            value={form.nomTuteur}
            onChange={(e) => updateField('nomTuteur', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="telephoneTuteur" className={labelClass}>Téléphone du tuteur</label>
          <input
            id="telephoneTuteur"
            type="tel"
            value={form.telephoneTuteur}
            onChange={(e) => updateField('telephoneTuteur', e.target.value)}
            className={inputClass}
            placeholder="+243 ..."
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          Élève enregistré avec succès.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {loading ? 'Enregistrement…' : 'Enregistrer l’élève'}
      </button>
    </form>
  );
}
