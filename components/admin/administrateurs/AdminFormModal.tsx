'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';

const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

export type AdminFormValues = {
  nom: string;
  postNom: string;
  prenom: string;
  telephone: string;
  email: string;
  statutPrevu: 'ACTIF' | 'INACTIF';
};

const emptyForm: AdminFormValues = {
  nom: '', postNom: '', prenom: '', telephone: '', email: '', statutPrevu: 'ACTIF',
};

/**
 * Formulaire de préenregistrement d'un administrateur.
 * Le rôle (Admin School Manager RDC) est fixé côté serveur ; l'adresse email
 * d'une autorisation existante n'est pas modifiable (un Gmail = un compte).
 */
export function AdminFormModal({
  open,
  mode,
  initial,
  busy,
  error,
  onSubmit,
  onClose,
}: {
  open: boolean;
  mode: 'create' | 'edit';
  initial?: Partial<AdminFormValues> | null;
  busy?: boolean;
  error?: string;
  onSubmit: (values: AdminFormValues) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<AdminFormValues>(emptyForm);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLocalError('');
    setForm({ ...emptyForm, ...(initial ?? {}) } as AdminFormValues);
  }, [open, initial]);

  if (!open) return null;

  function submit() {
    if (!form.nom.trim() || !form.prenom.trim()) {
      setLocalError('Le nom et le prénom sont obligatoires.');
      return;
    }
    if (mode === 'create' && !/^[^\s@]+@gmail\.com$/.test(form.email.trim().toLowerCase())) {
      setLocalError("L'adresse doit être une adresse Gmail (@gmail.com).");
      return;
    }
    setLocalError('');
    onSubmit({
      ...form,
      nom: form.nom.trim(),
      postNom: form.postNom.trim(),
      prenom: form.prenom.trim(),
      telephone: form.telephone.trim(),
      email: form.email.trim().toLowerCase(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'create' ? 'Ajouter un administrateur' : 'Modifier l’administrateur'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Rôle attribué : <span className="font-medium text-slate-700">Admin School Manager RDC</span>
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Fermer">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="admin-nom">Nom *</label>
              <input id="admin-nom" className={inputClass} value={form.nom} onChange={(e) => setForm((c) => ({ ...c, nom: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass} htmlFor="admin-postnom">Post-nom</label>
              <input id="admin-postnom" className={inputClass} value={form.postNom} onChange={(e) => setForm((c) => ({ ...c, postNom: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass} htmlFor="admin-prenom">Prénom *</label>
              <input id="admin-prenom" className={inputClass} value={form.prenom} onChange={(e) => setForm((c) => ({ ...c, prenom: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass} htmlFor="admin-telephone">Téléphone</label>
              <input id="admin-telephone" className={inputClass} type="tel" placeholder="+243 ..." value={form.telephone} onChange={(e) => setForm((c) => ({ ...c, telephone: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="admin-email">Adresse Gmail *</label>
            <input
              id="admin-email"
              className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
              type="email"
              placeholder="administrateur@gmail.com"
              value={form.email}
              disabled={mode === 'edit'}
              onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
            />
            <p className="mt-1 text-xs text-slate-500">
              {mode === 'edit'
                ? 'L’adresse Gmail d’une autorisation ne peut pas être modifiée.'
                : 'Cette adresse sera la seule autorisée à créer ce compte administrateur.'}
            </p>
          </div>

          <div>
            <label className={labelClass}>Statut d’activation prévu</label>
            <select
              className={inputClass}
              value={form.statutPrevu}
              onChange={(e) => setForm((c) => ({ ...c, statutPrevu: e.target.value as 'ACTIF' | 'INACTIF' }))}
            >
              <option value="ACTIF">Actif après vérification de l’email</option>
              <option value="INACTIF">Inactif — activation manuelle par le Super Administrateur</option>
            </select>
          </div>

          {(localError || error) && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? 'Enregistrement…' : mode === 'create' ? 'Enregistrer l’autorisation' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
