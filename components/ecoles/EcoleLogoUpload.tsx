'use client';

import { useRef, useState } from 'react';

type Props = {
  ecoleId?: string | null;
  logoUrl: string;
  onChange: (url: string) => void;
};

/**
 * Téléversement du logo de l'établissement.
 * Le fichier est envoyé vers `/api/ecoles/[id]/logo`, qui contrôle la session,
 * l'institution et le périmètre de l'école avant d'écrire.
 * Les logos sont stockés publiquement (anyone with the link can open them).
 */
export function EcoleLogoUpload({ ecoleId, logoUrl, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File | null) {
    if (!file || !ecoleId) return;
    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await fetch(`/api/ecoles/${ecoleId}/logo`, { method: 'POST', body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? 'Téléversement impossible.');
        return;
      }
      onChange(data.logoUrl ?? '');
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleRemove() {
    if (!ecoleId) {
      onChange('');
      return;
    }
    setError('');
    setUploading(true);
    try {
      const res = await fetch(`/api/ecoles/${ecoleId}/logo`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? 'Suppression impossible.');
        return;
      }
      onChange('');
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {logoUrl ? (
        <img src={logoUrl} alt="Logo de l'établissement" className="h-20 w-20 shrink-0 rounded-2xl border border-slate-200 object-cover" />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-2xl text-slate-300">
          🏫
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!ecoleId || uploading}
          className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
        >
          {uploading ? 'Envoi…' : logoUrl ? 'Changer le logo' : 'Ajouter un logo'}
        </button>
        {logoUrl && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            Retirer
          </button>
        )}
        {!ecoleId && (
          <p className="w-full text-xs text-slate-500">
            Enregistrez d&apos;abord l&apos;école, puis ajoutez son logo en la modifiant.
          </p>
        )}
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
