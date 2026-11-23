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

export default function CartesQrPage() {
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [loading, setLoading] = useState(true);
  const qrCacheRef = useRef<Record<string, string>>({});

  useEffect(() => {
    let active = true;

    fetch('/api/eleves')
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        const liste: Eleve[] = data?.eleves ?? [];
        if (!active) return;

        // Valeur signée par le serveur (matricule + signature SMRDC) : le QR ne
        // contient aucune donnée personnelle et reste vérifiable au scan.
        let payloads = new Map<string, string>();
        if (liste.length > 0) {
          const res = await fetch('/api/eleves/qr-payloads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: liste.map((e) => e.id) }),
          }).catch(() => null);
          const json = res?.ok ? await res.json().catch(() => null) : null;
          payloads = new Map<string, string>(
            (json?.payloads ?? []).map((p: { id: string; payload: string }) => [p.id, p.payload]),
          );
        }

        for (const e of liste) {
          if (qrCacheRef.current[e.id]) continue;
          try {
            qrCacheRef.current[e.id] = await QRCode.toDataURL(payloads.get(e.id) ?? e.matricule, {
              width: 200,
              margin: 1,
              color: { dark: '#1e3a5f', light: '#ffffff' },
            });
          } catch {
            // ignore
          }
        }
        if (active) setEleves(liste);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const cartesGenerees = eleves.length; // Toutes les cartes sont considérées comme générées
  const enAttente = 0;

  return (
    <ModulePage icon="qr" eyebrow="Gestion scolaire" title="QR code & cartes scolaires" description="Génération de cartes scolaires avec QR code d'identification.">
      <div className="mb-6 grid grid-cols-3 gap-3">
        <StatCard label="Cartes générées" value={loading ? '—' : String(cartesGenerees)} />
        <StatCard label="En attente" value={loading ? '—' : String(enAttente)} />
        <StatCard label="Total" value={loading ? '—' : String(eleves.length)} />
      </div>
      <div className="mb-4 flex justify-end gap-2">
        <button className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Exporter PDF</button>
        <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">+ Générer les cartes</button>
      </div>
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
          {eleves.map((e) => (
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
                  {qrCacheRef.current[e.id] ? (
                    <img src={qrCacheRef.current[e.id]} alt={`QR ${e.matricule}`} className="h-full w-full rounded" />
                  ) : (
                    <div className="h-full w-full animate-pulse rounded bg-slate-200" />
                  )}
                </div>
              </div>
              <div className="border-t border-slate-100 px-4 py-2.5">{<StatutBadge statut="Générée" />}</div>
            </div>
          ))}
        </div>
      )}
    </ModulePage>
  );
}
