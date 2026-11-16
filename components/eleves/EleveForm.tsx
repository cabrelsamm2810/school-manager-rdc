'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';

type EleveFormProps = {
  onCreated?: () => void;
  eleve?: {
    id: string;
    matricule: string;
    nom: string;
    postNom: string;
    prenom: string;
    sexe: string;
    dateNaissance: string | null;
    lieuNaissance: string;
    classe: string;
    telephone: string;
    email: string;
    adresse: string;
    nomTuteur: string;
    telephoneTuteur: string;
    emailTuteur: string;
    ecoleId: string | null;
    photoUrl?: string | null;
  };
  onUpdated?: () => void;
};

type Ecole = {
  id: string;
  nom: string;
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
  telephoneTuteur: '',
  emailTuteur: '',
  ecoleId: ''
};

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

export function EleveForm({ onCreated, eleve, onUpdated }: EleveFormProps) {
  const isEdit = !!eleve;
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ecoles, setEcoles] = useState<Ecole[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/ecoles')
      .then((res) => res.json())
      .then((data) => {
        if (data.ecoles) setEcoles(data.ecoles);
      })
      .catch(() => {});
  }, []);

  // Pré-remplir le formulaire en mode édition
  useEffect(() => {
    if (eleve) {
      setForm({
        matricule: eleve.matricule,
        nom: eleve.nom,
        postNom: eleve.postNom,
        prenom: eleve.prenom,
        sexe: eleve.sexe,
        dateNaissance: eleve.dateNaissance ? new Date(eleve.dateNaissance).toISOString().split('T')[0] : '',
        lieuNaissance: eleve.lieuNaissance,
        classe: eleve.classe,
        telephone: eleve.telephone,
        email: eleve.email,
        adresse: eleve.adresse,
        nomTuteur: eleve.nomTuteur,
        telephoneTuteur: eleve.telephoneTuteur,
        emailTuteur: eleve.emailTuteur ?? '',
        ecoleId: eleve.ecoleId ?? '',
      });
      setPhotoUrl(eleve.photoUrl ?? null);
      setPhotoFile(null);
    }
  }, [eleve]);

  /** Téléverse la photo sélectionnée sur la fiche de l'élève. */
  async function uploadPhoto(eleveId: string, file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch(`/api/eleves/${eleveId}/photo`, { method: 'POST', body: formData });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "La photo n'a pas pu être téléversée.");
      return null;
    }
    return (data?.photoUrl as string) ?? null;
  }

  async function handlePhotoChange(file: File | null) {
    setPhotoFile(file);
    setError('');
    if (!file || !isEdit) return;
    setPhotoBusy(true);
    try {
      const url = await uploadPhoto(eleve!.id, file);
      if (url) {
        setPhotoUrl(url);
        setPhotoFile(null);
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleRemovePhoto() {
    if (!isEdit) {
      setPhotoFile(null);
      if (photoRef.current) photoRef.current.value = '';
      return;
    }
    setPhotoBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/eleves/${eleve!.id}/photo`, { method: 'DELETE' });
      if (!res.ok) {
        setError('La photo n\'a pas pu être supprimée.');
        return;
      }
      setPhotoUrl(null);
      setPhotoFile(null);
      if (photoRef.current) photoRef.current.value = '';
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setPhotoBusy(false);
    }
  }

  // Aperçu local du fichier choisi (avant même le téléversement)
  const [previewUrl, setPreviewUrl] = useState<string | null>(photoUrl);
  useEffect(() => {
    if (!photoFile) {
      setPreviewUrl(photoUrl);
      return;
    }
    const objectUrl = URL.createObjectURL(photoFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile, photoUrl]);

  function updateField<K extends keyof typeof form>(field: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const url = isEdit ? `/api/eleves/${eleve!.id}` : '/api/eleves';
      const method = isEdit ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Impossible d'enregistrer l'élève.");
        return;
      }

      // En création, la fiche vient d'exister : la photo peut enfin être téléversée.
      const eleveId = isEdit ? eleve!.id : (result.eleve?.id as string | undefined);
      if (!isEdit && photoFile && eleveId) {
        try {
          await uploadPhoto(eleveId, photoFile);
        } catch {
          setError("Élève enregistré, mais la photo n'a pas pu être téléversée.");
        }
      }

      setSuccess(true);
      if (isEdit) {
        onUpdated?.();
      } else {
        setForm(emptyForm);
        setPhotoFile(null);
        setPreviewUrl(null);
        onCreated?.();
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Photo de profil — visible dans la liste d'appel */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={`Photo de ${form.prenom} ${form.nom}`.trim()}
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <span className="text-2xl font-bold text-slate-300">
              {`${form.prenom.charAt(0)}${form.nom.charAt(0)}`.toUpperCase() || '—'}
            </span>
          )}
        </div>
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold text-slate-800">Photo de profil</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Affichée dans la liste d&apos;appel et sur la fiche scannée. JPG, PNG ou WebP — 5 Mo max.
          </p>
          <div className="mt-2.5 flex flex-wrap justify-center gap-2 sm:justify-start">
            <input
              ref={photoRef}
              id="eleve-photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
            />
            <label
              htmlFor="eleve-photo"
              className={`inline-flex cursor-pointer items-center rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 ${
                photoBusy ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              {photoBusy ? 'Téléversement…' : previewUrl ? 'Changer la photo' : 'Ajouter une photo'}
            </label>
            {previewUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={photoBusy}
                className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                Retirer
              </button>
            )}
          </div>
        </div>
      </div>

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
          <label htmlFor="ecoleId" className={labelClass}>École</label>
          <select
            id="ecoleId"
            value={form.ecoleId}
            onChange={(e) => updateField('ecoleId', e.target.value)}
            className={inputClass}
          >
            <option value="">— Non assigné —</option>
            {ecoles.map((et) => (
              <option key={et.id} value={et.id}>{et.nom}</option>
            ))}
          </select>
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
        <div className="sm:col-span-2">
          <label htmlFor="emailTuteur" className={labelClass}>Email du parent / tuteur</label>
          <input
            id="emailTuteur"
            type="email"
            value={form.emailTuteur}
            onChange={(e) => updateField('emailTuteur', e.target.value)}
            className={inputClass}
            placeholder="parent@example.com"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {success && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          {isEdit ? 'Élève modifié avec succès.' : 'Élève enregistré avec succès.'}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {loading ? 'Enregistrement…' : isEdit ? 'Modifier l\'élève' : "Enregistrer l'élève"}
      </button>
    </form>
  );
}
