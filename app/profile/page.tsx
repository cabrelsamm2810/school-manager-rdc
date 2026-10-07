'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { Icon } from '@/components/ui/Icon';
import { ROLE_LABELS } from '@/lib/rbac';

type Profile = {
  id: string;
  nom: string;
  postNom?: string | null;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
  profilePhotoUrl?: string | null;
  typeInstitution?: string;
  institutionName?: string;
  provinceAdministrative?: string;
  bureauAffectation?: string | null;
  fonction?: string | null;
};

const INSTITUTION_LABELS: Record<string, string> = {
  'EC-ERC': 'EC-ERC',
  'PUBLIQUE': 'École publique',
  'CATHOLIQUE': 'École catholique (ECCATH)',
  'ISLAMIQUE': 'École islamique',
  'INDEPENDANTE': 'École indépendante',
};

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
        <div className="h-28 bg-gradient-to-r from-blue-600 to-blue-800" />
        <div className="px-6 pb-8">
          <div className="-mt-14 flex flex-col items-center">
            <div className="h-28 w-28 rounded-full bg-slate-200 ring-4 ring-white" />
            <div className="mt-4 h-6 w-48 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-2 h-4 w-32 animate-pulse rounded-lg bg-slate-100" />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
        <Icon name={icon} className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-800">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.authenticated) setProfile(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch('/api/users/me/photo', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.profilePhotoUrl) {
        setProfile({ ...profile, profilePhotoUrl: data.profilePhotoUrl });
        window.dispatchEvent(new Event('profile-photo-updated'));
        setMessage({ type: 'success', text: 'Photo de profil mise à jour.' });
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Erreur lors du téléversement.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Impossible de joindre le serveur.' });
    } finally {
      setUploading(false);
    }
  }

  async function handleRemovePhoto() {
    if (!profile) return;
    setUploading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/users/me/photo', { method: 'DELETE' });
      if (res.ok) {
        setProfile({ ...profile, profilePhotoUrl: null });
        window.dispatchEvent(new Event('profile-photo-updated'));
        setMessage({ type: 'success', text: 'Photo de profil supprimée.' });
      } else {
        setMessage({ type: 'error', text: 'Erreur lors de la suppression.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Impossible de joindre le serveur.' });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const body = Object.fromEntries(formData.entries());
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setProfile({ ...profile, ...data.user });
        window.dispatchEvent(new Event('profile-photo-updated'));
        setMessage({ type: 'success', text: 'Profil mis à jour avec succès.' });
        setEditing(false);
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Erreur lors de la mise à jour.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Impossible de joindre le serveur.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    /* Session fermée : retour à l'accueil public. */
    window.location.href = '/';
  }

  const initials = profile
    ? `${profile.prenom?.[0] ?? ''}${profile.nom?.[0] ?? ''}`.toUpperCase()
    : 'SM';

  const fullName = profile ? `${profile.prenom} ${profile.nom} ${profile.postNom ?? ''}`.trim() : '';

  return (
    <AppShell>
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          {loading ? (
            <ProfileSkeleton />
          ) : profile ? (
            <>
              {/* ── Profile Card ── */}
              <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
                {/* Banner */}
                <div className="relative h-24 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-800 md:h-28">
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                </div>

                {/* Avatar + name */}
                <div className="px-5 pb-5 md:px-8 md:pb-7">
                  <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
                    <div className="relative -mt-14 shrink-0">
                      <div className="h-28 w-28 overflow-hidden rounded-full bg-blue-600 ring-4 ring-white shadow-lg">
                        {profile.profilePhotoUrl ? (
                          <img src={profile.profilePhotoUrl} alt="Photo de profil" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                            {initials}
                          </div>
                        )}
                      </div>
                      {/* Camera button */}
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-md ring-2 ring-white transition hover:bg-blue-500 disabled:opacity-60"
                        aria-label="Changer la photo"
                      >
                        {uploading ? (
                          <span className="btn-spinner h-4 w-4" />
                        ) : (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h2l1.5-2h7L17 7h2a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <circle cx="12" cy="13" r="3" />
                          </svg>
                        )}
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handlePhotoChange}
                        disabled={uploading}
                        className="hidden"
                      />
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                      <h1 className="text-xl font-bold text-slate-900 md:text-2xl">{fullName}</h1>
                      <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          <Icon name="shield" className="h-3.5 w-3.5" />
                          {ROLE_LABELS[profile.role] ?? profile.role}
                        </span>
                        {profile.typeInstitution && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                            <Icon name="school" className="h-3.5 w-3.5" />
                            {INSTITUTION_LABELS[profile.typeInstitution] ?? profile.typeInstitution}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove photo button */}
                    {profile.profilePhotoUrl && !uploading && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="shrink-0 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      >
                        Supprimer la photo
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-slate-400">JPG, PNG, WebP ou GIF — 5 Mo max</p>
                </div>
              </div>

              {/* ── Message ── */}
              {message && (
                <div
                  className={`mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ${
                    message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  <Icon name={message.type === 'success' ? 'shield' : 'bell'} className="h-4 w-4 shrink-0" />
                  {message.text}
                </div>
              )}

              {/* ── Edit / View toggle ── */}
              {!editing ? (
                <>
                  {/* Read-only info sections */}
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="rounded-3xl bg-white p-5 shadow-soft md:p-6">
                      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                        <Icon name="user" className="h-4 w-4 text-blue-500" />
                        Informations personnelles
                      </h2>
                      <div className="space-y-3">
                        <InfoRow icon="user" label="Nom" value={profile.nom} />
                        <InfoRow icon="user" label="Post-nom" value={profile.postNom ?? ''} />
                        <InfoRow icon="user" label="Prénom" value={profile.prenom} />
                        <InfoRow icon="phone" label="Téléphone" value={profile.telephone} />
                      </div>
                    </div>

                    <div className="rounded-3xl bg-white p-5 shadow-soft md:p-6">
                      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                        <Icon name="settings" className="h-4 w-4 text-blue-500" />
                        Compte & rattachement
                      </h2>
                      <div className="space-y-3">
                        <InfoRow icon="user" label="Email" value={profile.email} />
                        <InfoRow icon="shield" label="Rôle" value={ROLE_LABELS[profile.role] ?? profile.role} />
                        {profile.institutionName && (
                          <InfoRow icon="school" label="École" value={profile.institutionName} />
                        )}
                        {profile.provinceAdministrative && (
                          <InfoRow icon="location" label="Province" value={profile.provinceAdministrative} />
                        )}
                        {profile.bureauAffectation && (
                          <InfoRow icon="office" label="Bureau d'affectation" value={profile.bureauAffectation} />
                        )}
                        {profile.fonction && (
                          <InfoRow icon="shield" label="Fonction" value={profile.fonction} />
                        )}
                        <InfoRow icon="shield" label="Statut" value="Compte actif" />
                      </div>
                    </div>
                  </div>

                  {/* ── Action buttons ── */}
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="btn-primary flex-1 px-6 py-3 text-sm sm:flex-none"
                      style={{ borderRadius: '9999px' }}
                    >
                      Modifier le profil
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex-1 rounded-full border border-red-200 px-6 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 sm:flex-none"
                    >
                      Se déconnecter
                    </button>
                  </div>
                </>
              ) : (
                /* ── Edit form ── */
                <form onSubmit={handleSave} className="mt-5 rounded-3xl bg-white p-5 shadow-soft md:p-8">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Nom</label>
                      <input
                        name="nom"
                        defaultValue={profile.nom}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Post-nom</label>
                      <input
                        name="postNom"
                        defaultValue={profile.postNom ?? ''}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Prénom</label>
                      <input
                        name="prenom"
                        defaultValue={profile.prenom}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">Téléphone</label>
                      <input
                        name="telephone"
                        defaultValue={profile.telephone}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                      <input
                        name="email"
                        type="email"
                        defaultValue={profile.email}
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700">Rôle</label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
                        defaultValue={ROLE_LABELS[profile.role] ?? profile.role}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary flex-1 px-6 py-3 text-sm sm:flex-none"
                      style={{ borderRadius: '9999px' }}
                    >
                      {saving ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="flex-1 rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 sm:flex-none"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="rounded-3xl bg-white p-12 text-center shadow-soft">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <Icon name="bell" className="h-8 w-8 text-red-400" />
              </div>
              <p className="text-slate-600">Impossible de charger le profil.</p>
              <a href="/login" className="mt-4 inline-block rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
                Se connecter
              </a>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
