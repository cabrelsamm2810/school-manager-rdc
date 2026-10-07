'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/AppShell';
import QRCode from 'qrcode';

/**
 * Page affichant le QR code de pointage de l'école.
 * Accessible aux DIRECTION_ECOLE pour afficher sur un écran à l'entrée.
 * Le QR encode « POINTAGE:<ecoleId> ».
 */
export default function PointageQRPage() {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [ecole, setEcole] = useState<{ id: string; nom: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) throw new Error('Session');
        const data = await res.json();
        if (!data?.authenticated || !data?.user?.ecoleId) {
          setError('Aucune école rattachée à votre compte.');
          return;
        }
        const ecoleId = data.user.ecoleId;
        const ecoleNom = data.user.institutionName || data.user.ecoleNom || 'Mon école';
        setEcole({ id: ecoleId, nom: ecoleNom });

        const qrValue = `POINTAGE:${ecoleId}`;
        const url = await QRCode.toDataURL(qrValue, {
          width: 400,
          margin: 2,
          color: { dark: '#065f46', light: '#ffffff' },
        });
        setQrDataUrl(url);
      } catch {
        setError('Impossible de charger les informations.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AppShell>
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="btn-spinner h-8 w-8" />
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && ecole && (
            <div className="overflow-hidden rounded-3xl bg-white shadow-soft">
              {/* En-tête */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 text-center text-white">
                <h1 className="text-lg font-bold">QR Code de pointage</h1>
                <p className="text-sm text-emerald-100">{ecole.nom}</p>
              </div>

              {/* QR code */}
              <div className="flex flex-col items-center gap-4 p-6">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="QR code de pointage"
                    className="h-64 w-64 rounded-2xl border border-slate-100"
                  />
                )}
                <p className="text-center text-sm text-slate-600">
                  Affichez ce QR code à l'entrée de l'école. Les enseignants le scannent chaque matin pour pointer leur arrivée.
                </p>
              </div>

              {/* Pied */}
              <div className="border-t border-slate-100 px-5 py-3 text-center">
                <p className="text-xs text-slate-400">
                  QR valable tant que l'école n'est pas modifiée.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
