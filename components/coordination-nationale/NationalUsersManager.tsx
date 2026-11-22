'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useSessionUser } from '@/lib/use-session-user';
import { nationalCapabilities, NATIONAL_FONCTIONS, nationalFonctionLabel } from '@/lib/national-fonctions';
import { NATIONAL_MANAGED_ROLE_LABELS, NATIONAL_MANAGED_ROLES } from '@/lib/national-users';
import { PROVINCE_NAMES } from '@/lib/provinces-rdc';

type ManagedUser = {
  id: string;
  nom: string;
  postNom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
  fonction: string;
  provinceAdministrative: string;
  provinceEducationnelle: string;
  bureauAffectation: string;
  isActive: boolean;
  createdAt: string;
};

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-[13px] text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';
const labelClass = 'mb-1.5 block text-[12px] font-semibold text-slate-700';

const ROLE_STYLES: Record<string, string> = {
  COORDINATION_NATIONALE: 'bg-brand-50 text-brand-700 ring-brand-100',
  COORDINATION_PROVINCIALE: 'bg-cyan-50 text-cyan-700 ring-cyan-100',
  AGENT_PROVINCIAL: 'bg-violet-50 text-violet-700 ring-violet-100',
  COORDINATION_SOUS_PROVINCIALE: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  AGENT_SOUS_PROVINCIAL: 'bg-amber-50 text-amber-700 ring-amber-100'
};

/**
 * Gestion des comptes de la sphère EC-ERC par la Coordination nationale.
 * Création, fonction, affectation et activation — chaque action est revérifiée
 * côté serveur (permission `national:users`) et journalisée.
 */
export function NationalUsersManager() {
  const session = useSessionUser();
  const canManage = nationalCapabilities(session?.fonction).utilisateurs;

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [role, setRole] = useState<string>('COORDINATION_PROVINCIALE');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`/api/coordination-nationale/utilisateurs?${params.toString()}`);
      const payload = res.ok ? await res.json() : { users: [] };
      setUsers(payload.users ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [canManage, search, roleFilter]);

  useEffect(() => {
    const id = window.setTimeout(load, search ? 300 : 0);
    return () => window.clearTimeout(id);
  }, [load, search]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const form = event.currentTarget;
    const formData = new FormData(form);
    const body = {
      nom: formData.get('nom'),
      postNom: formData.get('postNom'),
      prenom: formData.get('prenom'),
      email: formData.get('email'),
      telephone: formData.get('telephone'),
      password: formData.get('password'),
      role,
      fonction: role === 'COORDINATION_NATIONALE' ? formData.get('fonction') : '',
      provinceAdministrative: formData.get('provinceAdministrative'),
      isActive: formData.get('isActive') === 'on'
    };

    setSaving(true);
    try {
      const res = await fetch('/api/coordination-nationale/utilisateurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const payload = await res.json();
      if (!res.ok) {
        setFormError(payload.error ?? 'Création impossible.');
        return;
      }
      form.reset();
      setRole('COORDINATION_PROVINCIALE');
      setFormOpen(false);
      load();
    } catch {
      setFormError('Impossible de joindre le serveur.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: ManagedUser) {
    setBusyId(user.id);
    try {
      const res = await fetch(`/api/coordination-nationale/utilisateurs/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)));
      }
    } finally {
      setBusyId(null);
    }
  }

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <Icon name="lock" className="mx-auto h-7 w-7 text-amber-600" />
        <p className="mt-2 text-[14px] font-semibold text-amber-900">Gestion des comptes non autorisée</p>
        <p className="mt-1 text-[12.5px] text-amber-800">
          Votre fonction à la Coordination nationale ne permet pas de gérer les comptes. Seuls le coordinateur
          national et le chef d'administration national disposent de cette autorisation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">Coordination nationale EC-ERC</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">Comptes & permissions</h1>
          <p className="mt-1 text-[13px] text-slate-500">
            Comptes nationaux, coordonnateurs provinciaux et agents — chaque fonction a ses propres permissions.
          </p>
        </div>
        <button
          onClick={() => setFormOpen((open) => !open)}
          className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-brand-700"
        >
          <Icon name={formOpen ? 'close' : 'plus'} className="h-4 w-4" />
          {formOpen ? 'Fermer' : 'Créer un compte'}
        </button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className={labelClass}>Nom *</span>
              <input name="nom" required className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Post-nom</span>
              <input name="postNom" className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Prénom *</span>
              <input name="prenom" required className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Email *</span>
              <input name="email" type="email" required className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Téléphone</span>
              <input name="telephone" className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Mot de passe * (8 caractères min.)</span>
              <input name="password" type="password" minLength={8} required className={inputClass} />
            </label>
            <label className="block">
              <span className={labelClass}>Rôle *</span>
              <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
                {NATIONAL_MANAGED_ROLES.map((r) => (
                  <option key={r} value={r}>{NATIONAL_MANAGED_ROLE_LABELS[r]}</option>
                ))}
              </select>
            </label>
            {role === 'COORDINATION_NATIONALE' ? (
              <label className="block">
                <span className={labelClass}>Fonction nationale *</span>
                <select name="fonction" required className={inputClass} defaultValue="AGENT_NATIONAL">
                  {NATIONAL_FONCTIONS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block">
                <span className={labelClass}>Province d'affectation</span>
                <select name="provinceAdministrative" className={inputClass} defaultValue="">
                  <option value="">— Aucune —</option>
                  {PROVINCE_NAMES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex items-center gap-2 pt-6">
              <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-brand-600" />
              <span className="text-[12.5px] font-medium text-slate-700">Compte actif immédiatement</span>
            </label>
          </div>
          {formError && <p className="mt-2 text-[12px] font-medium text-rose-600">{formError}</p>}
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              <Icon name="user" className="h-4 w-4" />
              {saving ? 'Création…' : 'Créer le compte'}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700">
          <option value="">Tous les rôles</option>
          {NATIONAL_MANAGED_ROLES.map((r) => (
            <option key={r} value={r}>{NATIONAL_MANAGED_ROLE_LABELS[r]}</option>
          ))}
        </select>
        <div className="ml-auto flex min-w-[200px] flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 sm:max-w-xs">
          <Icon name="search" className="h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un compte…"
            className="w-full bg-transparent text-[12.5px] text-slate-800 outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="h-24 animate-pulse bg-slate-100" />
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Icon name="users" className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-[13px] font-medium text-slate-500">Aucun compte dans ce périmètre.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="bg-slate-50 text-[10.5px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Compte</th>
                  <th className="px-3 py-2.5 font-semibold">Rôle</th>
                  <th className="px-3 py-2.5 font-semibold">Fonction</th>
                  <th className="px-3 py-2.5 font-semibold">Province</th>
                  <th className="px-3 py-2.5 font-semibold">Statut</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-slate-800">{u.prenom} {u.nom}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${ROLE_STYLES[u.role] ?? 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
                        {NATIONAL_MANAGED_ROLE_LABELS[u.role as keyof typeof NATIONAL_MANAGED_ROLE_LABELS] ?? u.role}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{u.fonction ? nationalFonctionLabel(u.fonction) : '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600">{u.provinceAdministrative || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {u.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => toggleActive(u)}
                        disabled={busyId === u.id || u.id === session?.id}
                        className="rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-40"
                      >
                        {u.isActive ? 'Désactiver' : 'Activer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
