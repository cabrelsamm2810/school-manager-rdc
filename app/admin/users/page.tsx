'use client';

import { useEffect, useState, FormEvent } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ROLE_LABELS, ALL_ROLES } from '@/lib/rbac';
import { statutBadge } from '@/lib/demo-data';

type User = {
  id: string;
  nom: string;
  postNom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  fonction: string;
  grade: string;
};

const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
const labelClass = 'mb-1.5 block text-sm font-medium text-slate-700';

const emptyForm = {
  nom: '', postNom: '', prenom: '', email: '', telephone: '',
  password: '', role: 'ELEVE', fonction: '', grade: '', isActive: true,
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      const res = await fetch(`/api/users?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setUsers(data.users ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadData, search ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter]);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(u: User) {
    setEditingId(u.id);
    setForm({
      nom: u.nom, postNom: u.postNom, prenom: u.prenom, email: u.email,
      telephone: u.telephone, password: '', role: u.role,
      fonction: u.fonction, grade: u.grade, isActive: u.isActive,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const url = editingId ? `/api/users/${editingId}` : '/api/users';
      const method = editingId ? 'PUT' : 'POST';
      const payload: Record<string, unknown> = { ...form };
      if (editingId && !form.password) delete payload.password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? 'Erreur lors de l\'enregistrement.');
      } else {
        setForm(emptyForm);
        setEditingId(null);
        setShowForm(false);
        loadData();
      }
    } catch {
      setFormError('Impossible de joindre le serveur.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ModulePage icon="people" eyebrow="Administration" title="Gestion des utilisateurs" description="Création, activation, rôles et permissions des comptes utilisateurs.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Utilisateurs" value={String(users.length)} />
        <StatCard label="Actifs" value={String(users.filter((u) => u.isActive).length)} />
        <StatCard label="Inactifs" value={String(users.filter((u) => !u.isActive).length)} />
        <StatCard label="Administrateurs" value={String(users.filter((u) => u.role === 'SUPER_ADMIN').length)} />
      </div>

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <button onClick={startCreate} className="btn-primary px-4 py-2.5 text-sm">
          + Nouvel utilisateur
        </button>
      </div>

      {showForm ? (
        <div className="rounded-2xl bg-white p-5 shadow-soft md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}
            </h2>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-sm text-slate-500 transition hover:text-slate-700">
              ← Retour à la liste
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
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
                  {editingId ? 'Nouveau mot de passe (laisser vide pour conserver)' : 'Mot de passe *'}
                </label>
                <input type="password" required={!editingId} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputClass} placeholder="Min. 8 caractères" />
              </div>
              <div>
                <label className={labelClass}>Statut</label>
                <select value={form.isActive ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                  className={inputClass}>
                  <option value="true">Actif</option>
                  <option value="false">Inactif</option>
                </select>
              </div>
            </div>

            {formError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>
            )}

            <button type="submit" disabled={formLoading}
              className={`btn-primary px-8 py-3 text-sm ${formLoading ? 'btn-loading' : ''}`}>
              {formLoading ? (<><span className="btn-spinner" /> Enregistrement…</>) : editingId ? 'Modifier l\'utilisateur' : 'Créer l\'utilisateur'}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou email…"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:w-56">
              <option value="">Tous les rôles</option>
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="py-8 text-center text-sm text-slate-500">Chargement…</p>
          ) : users.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">Aucun utilisateur trouvé.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Nom</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Rôle</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {u.prenom} {u.nom} {u.postNom}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{u.email}</td>
                        <td className="px-4 py-3"><Badge color="blue">{ROLE_LABELS[u.role] ?? u.role}</Badge></td>
                        <td className="px-4 py-3">{statutBadge(u.isActive ? 'Actif' : 'Inactif')}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => startEdit(u)}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50">
                              Modifier
                            </button>
                            <button onClick={() => handleDelete(u.id)} disabled={deletingId === u.id}
                              className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                              {deletingId === u.id ? '…' : 'Supprimer'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {users.map((u) => (
                  <div key={u.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="font-semibold text-slate-900">{u.prenom} {u.nom}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{u.email}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge color="blue">{ROLE_LABELS[u.role] ?? u.role}</Badge>
                      {statutBadge(u.isActive ? 'Actif' : 'Inactif')}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => startEdit(u)}
                        className="flex-1 rounded-lg border border-blue-200 px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-50">
                        Modifier
                      </button>
                      <button onClick={() => handleDelete(u.id)} disabled={deletingId === u.id}
                        className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50">
                        {deletingId === u.id ? 'Suppression…' : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </ModulePage>
  );
}
