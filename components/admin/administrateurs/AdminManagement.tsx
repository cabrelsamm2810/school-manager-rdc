'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { StatCard } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { AdminFormModal, type AdminFormValues } from './AdminFormModal';
import { AdminDetailPanel, STATUT_LABELS } from './AdminDetailPanel';

type AdminItem = {
  id: string;
  email: string;
  nom: string;
  postNom: string;
  prenom: string;
  telephone: string;
  statut: string;
  statutPrevu: string;
  createdAt: string;
  revokedAt: string | null;
  userId: string | null;
  user: { id: string; isActive: boolean; userStatus: string } | null;
  createdBy: { nom: string; prenom: string } | null;
};

type ActivityEntry = {
  id: string;
  userName: string;
  action: string;
  result: string;
  details: string;
  createdAt: string;
};

type Stats = { total: number; enAttente: number; compteCree: number; revoque: number };

const STATUS_BADGE: Record<string, string> = {
  EN_ATTENTE: 'bg-amber-100 text-amber-700',
  COMPTE_CREE: 'bg-green-100 text-green-700',
  REVOQUE: 'bg-red-100 text-red-700',
};

const selectClass =
  'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Console « Gestion des administrateurs » — réservée au Super Administrateur.
 *
 * Le masquage des boutons n'est qu'ergonomique : toutes les décisions
 * d'autorisation sont prises côté serveur par les routes /api/admin/administrateurs.
 */
export function AdminManagement() {
  const [administrateurs, setAdministrateurs] = useState<AdminItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; item?: AdminItem } | null>(null);
  const [modalError, setModalError] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [pendingRevoke, setPendingRevoke] = useState<AdminItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statut) params.set('statut', statut);
      const response = await fetch(`/api/admin/administrateurs?${params.toString()}`, { cache: 'no-store' });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'Impossible de charger les administrateurs.');
      setAdministrateurs(data.administrateurs ?? []);
      setStats(data.stats ?? null);
      setActivity(data.recentActivity ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [search, statut]);

  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submitForm(values: AdminFormValues) {
    if (!modal) return;
    setBusy(true);
    setModalError('');
    try {
      const editing = modal.mode === 'edit' && modal.item;
      const response = await fetch(
        editing ? `/api/admin/administrateurs/${modal.item!.id}` : '/api/admin/administrateurs',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'Enregistrement impossible.');
      setModal(null);
      setNotice(editing ? 'Administrateur modifié.' : 'Autorisation enregistrée.');
      await load();
    } catch (err) {
      setModalError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function runAction(item: AdminItem, action: 'activer' | 'desactiver') {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/administrateurs/${item.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'Action impossible.');
      setNotice(action === 'activer' ? 'Administrateur activé.' : 'Administrateur désactivé.');
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(item: AdminItem) {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/administrateurs/${item.id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error ?? 'Révocation impossible.');
      setNotice('Autorisation révoquée.');
      setPendingRevoke(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Administration</p>
          <h1 className="mt-1.5 text-xl font-bold text-slate-900 md:text-2xl">Gestion des administrateurs</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
            Préenregistrez les adresses Gmail autorisées à créer un compte Admin School Manager RDC. Un Gmail = un seul compte.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setModalError(''); setModal({ mode: 'create' }); }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          <Icon name="plus" className="h-4 w-4" />
          Ajouter un administrateur
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Autorisations" value={stats ? String(stats.total) : '—'} hint="Total" />
        <StatCard label="En attente" value={stats ? String(stats.enAttente) : '—'} hint="Compte non créé" color="amber" />
        <StatCard label="Comptes créés" value={stats ? String(stats.compteCree) : '—'} hint="Inscription effectuée" color="green" />
        <StatCard label="Révoqués" value={stats ? String(stats.revoque) : '—'} hint="Accès retiré" color="red" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" className="h-4 w-4" />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, prénom ou adresse Gmail…"
            className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select value={statut} onChange={(e) => setStatut(e.target.value)} className={selectClass}>
          <option value="">Tous les états</option>
          <option value="EN_ATTENTE">En attente</option>
          <option value="COMPTE_CREE">Compte créé</option>
          <option value="REVOQUE">Révoqué</option>
        </select>
      </div>

      {(error || notice) && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'
          }`}
        >
          <Icon name={error ? 'alert' : 'check'} className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error || notice}</span>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {loading ? (
          <div className="flex items-center justify-center py-14">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          </div>
        ) : administrateurs.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Icon name="shield" className="h-6 w-6" />
            </div>
            <p className="font-semibold text-slate-700">Aucun administrateur préenregistré</p>
            <p className="mt-1 text-sm text-slate-500">Ajoutez une adresse Gmail pour autoriser la création d’un compte administrateur.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {administrateurs.map((item) => {
              const compte = item.user;
              const actif = Boolean(compte?.isActive);
              return (
                <li key={item.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold text-slate-900">
                        {item.prenom} {item.postNom} {item.nom}
                      </p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[item.statut] ?? 'bg-slate-100 text-slate-600'}`}>
                        {STATUT_LABELS[item.statut] ?? item.statut}
                      </span>
                      {item.statut !== 'REVOQUE' && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
                          {item.statutPrevu === 'INACTIF' ? 'Activation manuelle' : 'Actif après vérification'}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 break-all text-sm text-slate-600">{item.email}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {item.telephone || 'Téléphone non renseigné'} · Préenregistré le {formatDate(item.createdAt)}
                      {compte ? ` · Compte ${actif ? 'actif' : 'inactif'}` : ' · Aucun compte créé'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDetailId(item.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <Icon name="eye" className="h-3.5 w-3.5" />
                      Détails
                    </button>
                    {item.statut !== 'REVOQUE' && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setModalError(''); setModal({ mode: 'edit', item }); }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Icon name="edit" className="h-3.5 w-3.5" />
                          Modifier
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runAction(item, actif ? 'desactiver' : 'activer')}
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                            actif ? 'border border-amber-200 text-amber-700 hover:bg-amber-50' : 'border border-green-200 text-green-700 hover:bg-green-50'
                          }`}
                        >
                          <Icon name={actif ? 'lock' : 'check'} className="h-3.5 w-3.5" />
                          {actif ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setPendingRevoke(item)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" />
                          Révoquer
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
        <h2 className="mb-1 font-bold text-slate-900">Activité récente</h2>
        <p className="mb-4 text-xs text-slate-500">Journal d’audit des actions sur les autorisations et comptes administrateurs.</p>
        {activity.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune activité enregistrée.</p>
        ) : (
          <ol className="space-y-3">
            {activity.map((entry) => (
              <li key={entry.id} className="border-l-2 border-blue-200 pl-3">
                <p className="text-sm font-medium text-slate-900">{entry.action}</p>
                <p className="text-xs text-slate-500">
                  {new Date(entry.createdAt).toLocaleString('fr-FR')} · {entry.userName || 'Système'}
                </p>
                {entry.details && <p className="mt-1 text-xs text-slate-600">{entry.details}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>

      <AdminFormModal
        open={modal !== null}
        mode={modal?.mode ?? 'create'}
        initial={modal?.item ? {
          nom: modal.item.nom,
          postNom: modal.item.postNom,
          prenom: modal.item.prenom,
          telephone: modal.item.telephone,
          email: modal.item.email,
          statutPrevu: modal.item.statutPrevu === 'INACTIF' ? 'INACTIF' : 'ACTIF',
        } : null}
        busy={busy}
        error={modalError}
        onSubmit={submitForm}
        onClose={() => setModal(null)}
      />

      <AdminDetailPanel id={detailId} onClose={() => setDetailId(null)} />

      <ConfirmDialog
        open={pendingRevoke !== null}
        title="Révoquer l’autorisation ?"
        message={`${pendingRevoke?.email ?? ''} ne pourra plus créer de compte administrateur et son compte sera désactivé. Cette action est journalisée.`}
        confirmLabel="Révoquer"
        cancelLabel="Annuler"
        danger
        onConfirm={() => { if (pendingRevoke) revoke(pendingRevoke); }}
        onCancel={() => setPendingRevoke(null)}
      />
    </div>
  );
}
