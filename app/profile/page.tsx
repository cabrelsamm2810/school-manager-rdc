'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/ui/Card';
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
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/users/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setProfile(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setUploading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch('/api/users/me/photo', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.profilePhotoUrl) {
        setProfile({ ...profile, profilePhotoUrl: data.profilePhotoUrl });
        window.dispatchEvent(new Event('profile-photo-updated'));
        setMessage('Photo de profil mise à jour avec succès.');
      } else {
        setMessage(data.error ?? 'Erreur lors du téléversement.');
      }
    } catch {
      setMessage('Impossible de joindre le serveur.');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemovePhoto() {
    if (!profile) return;
    setUploading(true);
    setMessage('');
    try {
      const res = await fetch('/api/users/me/photo', { method: 'DELETE' });
      if (res.ok) {
        setProfile({ ...profile, profilePhotoUrl: null });
        window.dispatchEvent(new Event('profile-photo-updated'));
        setMessage('Photo de profil supprimée.');
      } else {
        setMessage('Erreur lors de la suppression.');
      }
    } catch {
      setMessage('Impossible de joindre le serveur.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage('');
    const formData = new FormData(event.currentTarget);
    const body = Object.fromEntries(formData.entries());
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setProfile({ ...profile, ...data.user });
        setMessage('Profil mis à jour avec succès.');
      } else {
        setMessage(data.error ?? 'Erreur lors de la mise à jour.');
      }
    } catch {
      setMessage('Impossible de joindre le serveur.');
    } finally {
      setSaving(false);
    }
  }

  const initials = profile
    ? `${profile.prenom?.[0] ?? ''}${profile.nom?.[0] ?? ''}`.toUpperCase()
    : 'SM';

  return (
    <AppShell>
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          <PageHeader
            eyebrow="Profil"
            title="Informations du profil"
            description="Gérez vos informations personnelles et votre photo de profil."
          />

          {loading ? (
            <div className="rounded-2xl bg-white p-12 text-center text-slate-500 shadow-soft">Chargement…</div>
          ) : profile ? (
            <form onSubmit={handleSave} className="rounded-3xl bg-white p-6 shadow-soft md:p-8">
              <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-700">Photo de profil</p>
                  <div className="mt-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-3xl font-bold text-white ring-4 ring-white shadow-md">
                    {profile.profilePhotoUrl ? (
                      <img src={profile.profilePhotoUrl} alt="Photo de profil" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="mt-4 flex flex-col gap-2">
                    <label className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-blue-500">
                      {uploading ? 'Téléversement…' : 'Changer la photo'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handlePhotoChange}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                    {profile.profilePhotoUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={uploading}
                        className="rounded-xl border border-red-200 px-4 py-2.5 text-center text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-slate-400">JPG, PNG, WebP ou GIF — 5 Mo max</p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="Nom" name="nom" defaultValue={profile.nom} />
                  <Field label="Post-nom" name="postNom" defaultValue={profile.postNom ?? ''} />
                  <Field label="Prénom" name="prenom" defaultValue={profile.prenom} />
                  <Field label="Téléphone" name="telephone" defaultValue={profile.telephone} />
                  <div className="md:col-span-2">
                    <Field label="Email" name="email" type="email" defaultValue={profile.email} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Rôle</label>
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-600"
                      defaultValue={ROLE_LABELS[profile.role] ?? profile.role}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {message && (
                <p className={`mt-6 rounded-xl px-3 py-2 text-sm ${message.includes('succès') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message}
                </p>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-2xl bg-white p-12 text-center text-slate-500 shadow-soft">
              Impossible de charger le profil. <a href="/login" className="text-blue-600 hover:underline">Se connecter</a>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  name,
  type = 'text',
  defaultValue
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />
    </div>
  );
}
