'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Icon } from '@/components/ui/Icon';

/**
 * Carte QR de l'établissement.
 * La valeur encodée est fournie par le serveur (`qrPayload`) : code école
 * public + jeton secret, jamais de donnée personnelle.
 */
export function EcoleProfilQr({
  ecoleId,
  qrPayload,
  codeEcole,
  canEdit,
  onRegenerated,
}: {
  ecoleId: string;
  qrPayload: string;
  codeEcole: string;
  canEdit: boolean;
  onRegenerated: (payload: string) => void;
}) {
  const [dataUrl, setDataUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(qrPayload, {
      width: 320,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setError('QR Code indisponible.');
      });
    return () => {
      active = false;
    };
  }, [qrPayload]);

  async function regenerate() {
    if (!confirm('Régénérer le QR Code ? L’ancien QR ne sera plus valide.')) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/ecole-profil/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ecoleId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Régénération impossible.');
      } else {
        onRegenerated(data.qrPayload);
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR-${codeEcole}.png`;
    link.click();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">QR Code de l’école</h3>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon name="qr" className="h-4 w-4" />
        </span>
      </div>

      <div className="mt-4 flex justify-center">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={`QR Code ${codeEcole}`} className="h-44 w-44 rounded-xl border border-slate-100 bg-white p-2" />
        ) : (
          <div className="h-44 w-44 animate-pulse rounded-xl bg-slate-100" />
        )}
      </div>

      <p className="mt-3 font-mono text-sm font-semibold text-slate-700">{codeEcole}</p>
      <p className="mt-1 text-xs text-slate-500">Identifie cet établissement dans tous les modules.</p>

      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={download}
          disabled={!dataUrl}
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Télécharger
        </button>
        {canEdit && (
          <button
            type="button"
            onClick={regenerate}
            disabled={busy}
            className="flex-1 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? 'Régénération…' : 'Régénérer'}
          </button>
        )}
      </div>
    </div>
  );
}
