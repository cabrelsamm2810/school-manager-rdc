'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/Table';

type Coordinateur = {
  id: string;
  nom: string;
  postNom: string;
  prenom: string;
  email: string;
  telephone: string;
  provinceAdministrative: string;
  fonction: string;
  grade: string;
  isActive: boolean;
  userStatus: string;
  createdAt: string;
};

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] outline-none transition focus:border-brand-500';
const labelClass = 'mb-1 block text-[11.5px] font-semibold uppercase tracking-wide text-slate-500';

const EMPTY_FORM = {
  nom: '',
  postNom: '',
  prenom: '',
  email: '',
  telephone: '',
  provinceAdministrative: '',
  fonction: '',
  grade: '',
  password: '',
};

function StatusBadge({ userStatus }: { userStatus: string }) {
  if (userStatus === 'ACTIF') return <Badge color="green">Actif</Badge>;
  if (userStatus === 'SUSPENDU') return <Badge color="red">Suspendu</Badge>;
  if (userStatus === 'DESACTIVE') return <Badge color="slate">Désactivé</Badge>;
  return <Badge color="amber">En attente</Badge>;
}

/** Gestion des comptes de coordination provinciale par le niveau national. */
export function ProvincialCoordinatorPanel() {
  const [coordinateurs, setCoordinateurs] = useState<Coordinateur[]>([]);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/coordination-nationale/coordinateurs');
      if (!response.ok) throw new Error('load');
      const data = await response.json();
      setCoordinateurs(data.coordinateurs ?? []);
      setProvinces(data.provinces ?? []);
    } catch {
      setMessage({ type: 'error', message: 'Impossible de charger les comptes de coordination provinciale.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return coordinateurs;
    return coordinateurs.filter((c) =>
      [c.nom, c.postNom, c.prenom, c.email, c.provinceAdministrative, c.fonction]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [coordinateurs, search]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('/api/coordination-nationale/coordinateurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: 'error', message: data.error || 'Création impossible.' });
        return;
      }
      setForm(EMPTY_FORM);
      setShowForm(false);
      setMessage({ type: 'success', message: 'Compte de coordination provinciale créé et activé.' });
      await load();
    } catch {
      setMessage({ type: 'error', message: 'Erreur réseau lors de la création.' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatus(coordinateur: Coordinateur) {
    const suspend = coordinateur.userStatus === 'ACTIF';
    if (!confirm(`${suspend ? 'Suspendre' : 'Réactiver'} le compte de ${coordinateur.prenom} ${coordinateur.nom} ?`)) return;
    setMessage(null);
    try {
      const response = await fetch(`/api/coordination-nationale/coordinateurs/${coordinateur.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: suspend ? 'suspend' : 'reactivate' }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: 'error', message: data.error || 'Action impossible.' });
        return;
      }
      setMessage({ type: 'success', message: suspend ? 'Compte suspendu.' : 'Compte réactivé.' });
      await load();
    } catch {
      setMessage({ type: 'error', message: 'Erreur réseau.' });
    }
  }

  const columns: Column<Coordinateur>[] = [
    {
      key: 'nom',
      label: 'Coordinateur',
      render: (c) => (
        <div>
          <p className="font-semibold text-slate-900">{c.prenom} {c.nom}</p>
          <p className="text-[11.5px] text-slate-400">{c.email}</p>
        </div>
      ),
    },
    { key: 'provinceAdministrative', label: 'Province', render: (c) => <span className="font-medium text-slate-700">{c.provinceAdministrative || '—'}</span> },
    { key: 'fonction', label: 'Fonction', render: (c) => c.fonction || '—' },
    { key: 'telephone', label: 'Téléphone', render: (c) => c.telephone || '—' },
    { key: 'userStatus', label: 'Statut', render: (c) => <StatusBadge userStatus={c.userStatus} /> },
    {
      key: 'actions',
      label: '',
      className: 'text-right',
      render: (c) => (
        <button
          onClick={() => handleStatus(c)}
          className="rounded-full border border-slate-200 px-3 py-1 text-[11.5px] font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
        >
          {c.userStatus === 'ACTIF' ? 'Suspendre' : 'Réactiver'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {message && (
        <div className={`rounded-xl px-4 py-3 text-[13px] font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {message.message}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un coordinateur…"
            className={`${inputClass} pl-9`}
          />
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-700"
        >
          <Icon name="plus" className="h-4 w-4" />
          {showForm ? 'Fermer le formulaire' : 'Nouveau coordinateur provincial'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="rounded-2xl border border-brand-100 bg-brand-50/40 p-4">
          <h3 className="text-[13px] font-bold text-slate-900">Créer un compte de coordination provinciale</h3>
          <p className="mt-0.5 text-[11.5px] text-slate-500">
            Le rôle « Coordination provinciale » est imposé côté serveur ; aucun autre rôle ne peut être attribué ici.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className={labelClass} htmlFor="coord-prenom">Prénom *</label>
              <input id="coord-prenom" required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="coord-nom">Nom *</label>
              <input id="coord-nom" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="coord-postnom">Post-nom</label>
              <input id="coord-postnom" value={form.postNom} onChange={(e) => setForm({ ...form, postNom: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="coord-email">Email *</label>
              <input id="coord-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="coord-telephone">Téléphone</label>
              <input id="coord-telephone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="coord-province">Province *</label>
              <select id="coord-province" required value={form.provinceAdministrative} onChange={(e) => setForm({ ...form, provinceAdministrative: e.target.value })} className={inputClass}>
                <option value="">Sélectionner…</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>{province}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="coord-fonction">Fonction</label>
              <input id="coord-fonction" value={form.fonction} onChange={(e) => setForm({ ...form, fonction: e.target.value })} placeholder="Coordonnateur provincial" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="coord-grade">Grade</label>
              <input id="coord-grade" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="coord-password">Mot de passe provisoire *</label>
              <input id="coord-password" type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-full border border-slate-300 px-4 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-white">
              Annuler
            </button>
            <button type="submit" disabled={submitting} className="rounded-full bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60">
              {submitting ? 'Création…' : 'Créer le compte'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-500">Chargement des comptes…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
          <p className="text-[13px] font-medium text-slate-600">Aucun compte de coordination provinciale.</p>
          <p className="mt-1 text-[11.5px] text-slate-400">Créez le premier compte avec le bouton ci-dessus.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          mobileCard={(c) => (
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-semibold text-slate-900">{c.prenom} {c.nom}</p>
                <StatusBadge userStatus={c.userStatus} />
              </div>
              <p className="text-[12px] text-slate-500">{c.email}</p>
              <p className="text-[12px] text-slate-500">{c.provinceAdministrative || '—'} · {c.fonction || 'Coordonnateur'}</p>
              <button
                onClick={() => handleStatus(c)}
                className="mt-1 w-full rounded-full border border-slate-200 px-3 py-1.5 text-[11.5px] font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
              >
                {c.userStatus === 'ACTIF' ? 'Suspendre' : 'Réactiver'}
              </button>
            </div>
          )}
        />
      )}
    </div>
  );
}
