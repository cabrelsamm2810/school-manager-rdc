'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useSessionUser } from '@/lib/use-session-user';
import { nationalCapabilities } from '@/lib/national-fonctions';
import { PROVINCE_NAMES } from '@/lib/provinces-rdc';

type Communication = { id: string; titre: string; message: string; createdAt: string };

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-[13px] text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

/** Communications officielles de la Coordination nationale vers les provinces. */
export function Communications() {
  const user = useSessionUser();
  const canSend = nationalCapabilities(user?.fonction).communications;

  const [items, setItems] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/coordination-nationale/communications');
      const payload = res.ok ? await res.json() : { communications: [] };
      setItems(payload.communications ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSent(false);
    const form = event.currentTarget;
    const formData = new FormData(form);
    setSending(true);
    try {
      const res = await fetch('/api/coordination-nationale/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: formData.get('titre'),
          message: formData.get('message'),
          province: formData.get('province'),
        }),
      });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? 'Envoi impossible.');
        return;
      }
      form.reset();
      setSent(true);
      load();
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-600">Coordination nationale EC-ERC</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">Communications officielles</h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Messages adressés aux coordinations provinciales — ils apparaissent dans les notifications de l'application.
        </p>
      </div>

      {canSend ? (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Titre *</span>
              <input name="titre" required className={inputClass} placeholder="Note de service…" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Province destinataire</span>
              <select name="province" className={inputClass} defaultValue="">
                <option value="">Toutes les provinces</option>
                {PROVINCE_NAMES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Message *</span>
              <textarea name="message" rows={3} required className={inputClass} placeholder="Contenu de la communication…" />
            </label>
          </div>
          {error && <p className="mt-2 text-[12px] font-medium text-rose-600">{error}</p>}
          {sent && <p className="mt-2 text-[12px] font-medium text-emerald-600">Communication envoyée.</p>}
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              <Icon name="send" className="h-4 w-4" />
              {sending ? 'Envoi…' : 'Envoyer'}
            </button>
          </div>
        </form>
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          Votre fonction permet de consulter les communications, pas d'en envoyer.
        </p>
      )}

      <div className="space-y-2.5">
        {loading ? (
          <div className="h-20 animate-pulse rounded-2xl bg-slate-200/60" />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Icon name="send" className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-2 text-[13px] font-medium text-slate-500">Aucune communication envoyée.</p>
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <p className="text-[13.5px] font-semibold text-slate-900">{item.titre}</p>
              <p className="mt-1 text-[12.5px] text-slate-600">{item.message}</p>
              <p className="mt-1 text-[11px] text-slate-400">
                {new Date(item.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
