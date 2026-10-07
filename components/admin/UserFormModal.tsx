'use client';

import { useEffect, useState, FormEvent } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ROLE_LABELS } from '@/lib/roles';

export type UserFormData = {
  nom: string;
  postNom: string;
  prenom: string;
  email: string;
  telephone: string;
  password: string;
  role: string;
  provinceAdministrative: string;
  institutionName: string;
  fonction: string;
  grade: string;
  isActive: boolean;
};

const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

const emptyForm: UserFormData = {
  nom: '', postNom: '', prenom: '', email: '', telephone: '',
  password: '', role: 'ELEVE', provinceAdministrative: '',
  institutionName: '', fonction: '', grade: '', isActive: false,
};

/** Rôles que l'Admin SMD peut gérer (exclut SUPER_ADMIN et ADMIN_SCHOOL_MANAGER_RDC). */
const MANAGEABLE_ROLES = [
  'COORDINATION_NATIONALE', 'COORDINATION_PROVINCIALE',
  'AGENT_PROVINCIAL', 'COORDINATION_SOUS_PROVINCIALE', 'AGENT_SOUS_PROVINCIAL',
  'PROMOTEUR', 'DIRECTION_ECOLE', 'SECRETAIRE', 'COMPTABLE',
  'ENSEIGNANT', 'PARENT', 'ELEVE', 'VISITEUR',
];

/**
 * Modal de création / modification d'un utilisateur.
 */
export function UserFormModal({
  open,
  editingUser,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editingUser: { id: string; nom: string; postNom: string; prenom: string; email: string; telephone: string; role: string; provinceAdministrative: string; institutionName: string; fonction: string; grade: string; isActive: boolean } | null;
  onClose: () => void;
  onSubmit: (data: UserFormData, editingId: string | null) => Promise<void>;
}) {
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setForm({
        nom: editingUser.nom, postNom: editingUser.postNom, prenom: editingUser.prenom,
        email: editingUser.email, telephone: editingUser.telephone,
        password: '', role: editingUser.role,
        provinceAdministrative: editingUser.provinceAdministrative || '',
        institutionName: editingUser.institutionName || '',
        fonction: editingUser.fonction || '', grade: editingUser.grade || '',
        isActive: editingUser.isActive,
      });
    } else {
      setForm(emptyForm);
    }
    setError('');
  }, [editingUser, open]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(form, editingUser?.id ?? null);
    } catch (err: any) {
      setError(err.message ?? 'Erreur lors de l\'enregistrement.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Nom *</label>
              <input type="text" required value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Post-nom</label>
              <input type="text" value={form.postNom}
                onChange={(e) => setForm({ ...form, postNom: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Prénom *</label>
              <input type="text" required value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email *</label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Téléphone</label>
              <input type="tel" value={form.telephone}
                onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                className={inputClass} placeholder="+243 ..." />
            </div>
            <div>
              <label className={labelClass}>Rôle *</label>
              <select value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={inputClass}>
                {MANAGEABLE_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Province administrative</label>
              <input type="text" value={form.provinceAdministrative}
                onChange={(e) => setForm({ ...form, provinceAdministrative: e.target.value })}
                className={inputClass} placeholder="Kinshasa, Lubumbashi..." />
            </div>
            <div>
              <label className={labelClass}>Établissement / Institution</label>
              <input type="text" value={form.institutionName}
                onChange={(e) => setForm({ ...form, institutionName: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Fonction</label>
              <input type="text" value={form.fonction}
                onChange={(e) => setForm({ ...form, fonction: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Grade</label>
              <input type="text" value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>
                {editingUser ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe *'}
              </label>
              <input type="password" required={!editingUser} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputClass} placeholder="Min. 8 caractères" />
            </div>
            {!editingUser && (
              <div className="flex items-end">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-slate-700">Activer immédiatement</span>
                </label>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 border-t border-slate-200 px-5 py-4">
          <button type="button" onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100">
            Annuler
          </button>
          <button type="submit" disabled={loading}
            onClick={handleSubmit}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Enregistrement...' : editingUser ? 'Enregistrer' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}
