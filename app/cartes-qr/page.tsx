'use client';

import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { StatutBadge } from '@/components/ui/StatutBadge';

type Eleve = {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  classe: string;
  ecole?: { id: string; nom: string } | null;
};

type SignedQr = {
  id: string;
  matricule: string;
  qrValue: string;
};

const QR_OPTIONS = {
  width: 240,
  margin: 1,
  color: { dark: '#1e3a5f', light: '#ffffff' },
};

export default function CartesQrPage() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [signedQr, setSignedQr] = useState<Record<string, string>>({});
  const [signedCount, setSignedCount] = useState(0);
  const [signError, setSignError] = useState('');
  const qrCacheRef = useRef<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/eleves')
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        if (data?.eleves) {
          // Générer les QR codes pour chaque élève
          for (const e of data.eleves) {
            if (!qrCacheRef.current[e.matricule]) {
              try {
                const qrUrl = await QRCode.toDataURL(e.matricule, QR_OPTIONS);
                qrCacheRef.current[e.matricule] = qrUrl;
              } catch {
                // ignore
              }
            }
          }
          setEleves(data.eleves);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /** Demande au serveur les QR codes signés, puis les encode en images. */
  async function generateSignedQr() {
    setGenerating(true);
    setSignError('');
    try {
      const res = await fetch('/api/eleves/qr-signes');
      const data = res.ok ? await res.json() : null;
      if (!data?.qrCodes) {
        setSignError('Impossible de générer les QR codes signés. Veuillez réessayer.');
        return;
      }
      const images: Record<string, string> = {};
      for (const qr of data.qrCodes as SignedQr[]) {
        try {
          images[qr.id] = await QRCode.toDataURL(qr.qrValue, QR_OPTIONS);
        } catch {
          // Un QR illisible ne doit pas bloquer les autres.
        }
      }
      setSignedQr(images);
      setSignedCount(Object.keys(images).length);
    } catch {
      setSignError('Impossible de générer les QR codes signés. Veuillez réessayer.');
    } finally {
      setGenerating(false);
    }
  }

  const cartesGenerees = eleves.length; // Toutes les cartes sont considérées comme générées
  const enAttente = 0;
  const isEmpty = !loading && eleves.length === 0;

  return (
    <ModulePage icon="qr" eyebrow="Gestion scolaire" title="QR code & cartes scolaires" description="Génération de cartes scolaires avec QR code d'identification signé.">
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Cartes générées" value={loading ? '—' : String(cartesGenerees)} />
        <StatCard label="QR signés" value={loading ? '—' : String(signedCount)} />
        <StatCard label="Total" value={loading ? '—' : String(eleves.length)} />
      </div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="button" className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Exporter PDF</button>
        <button
          type="button"
          onClick={generateSignedQr}
          disabled={loading || generating || isEmpty}
          className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          🔐 {generating ? 'Génération…' : 'Générer les QR codes signés'}
        </button>
        <button type="button" className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Générer les cartes</button>
      </div>

      {signedCount > 0 && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {signedCount} QR code{signedCount > 1 ? 's' : ''} signé{signedCount > 1 ? 's' : ''} généré{signedCount > 1 ? 's' : ''} : chaque code est vérifiable par le scanner élève.
        </div>
      )}
      {signError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{signError}</div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">Chargement…</p>
        </div>
      ) : eleves.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">Aucun élève enregistré. Ajoutez des élèves via le module « Élèves ».</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eleves.map((e) => {
            const qrImage = signedQr[e.id] || qrCacheRef.current[e.matricule];
            return (
              <div key={e.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
                <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/20 text-3xl">👤</div>
                  <div>
                    <p className="font-bold">{e.nom} {e.prenom}</p>
                    <p className="text-sm text-blue-100">{e.classe}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-xs text-slate-500">Matricule</p>
                    <p className="font-medium text-slate-900">{e.matricule}</p>
                    {e.ecole && <p className="mt-1 text-xs text-slate-500">{e.ecole.nom}</p>}
                  </div>
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-white p-1">
                    {qrImage ? (
                      <img src={qrImage} alt={`QR ${e.matricule}`} className="h-full w-full rounded object-contain" />
                    ) : (
                      <div className="h-full w-full animate-pulse rounded bg-slate-200" />
                    )}
                  </div>
                </div>
                <div className="border-t border-slate-100 px-4 py-2.5">
                  <StatutBadge statut={signedQr[e.id] ? 'Signée' : 'Générée'} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ModulePage>
  );
}
