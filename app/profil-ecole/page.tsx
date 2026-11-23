'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { PageHeader } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { EcoleProfilEntete } from '@/components/ecoles/profil/EcoleProfilEntete';
import { EcoleProfilFiche } from '@/components/ecoles/profil/EcoleProfilFiche';
import { EcoleProfilQr } from '@/components/ecoles/profil/EcoleProfilQr';
import { EcoleSectionsManager } from '@/components/ecoles/profil/EcoleSectionsManager';
import { EcoleProfilHistorique } from '@/components/ecoles/profil/EcoleProfilHistorique';
import type { EcoleProfilData } from '@/components/ecoles/profil/types';

type Tab = 'fiche' | 'sections' | 'historique';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'fiche', label: 'Fiche administrative', icon: 'building' },
  { key: 'sections', label: 'Sections & options', icon: 'organization' },
  { key: 'historique', label: 'Historique', icon: 'clock' },
];

function ProfilEcoleContent() {
  const searchParams = useSearchParams();
  const ecoleId = searchParams.get('ecoleId') || '';
  const [data, setData] = useState<EcoleProfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('fiche');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = ecoleId ? `?ecoleId=${encodeURIComponent(ecoleId)}` : '';
      const res = await fetch(`/api/ecole-profil${query}`);
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setData(null);
        setError(json?.error ?? 'Chargement du profil impossible.');
      } else {
        setData(json as EcoleProfilData);
      }
    } catch {
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  }, [ecoleId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell>
      <div className="p-4 pb-24 md:p-6">
        <div className="mx-auto max-w-5xl">
          <PageHeader
            eyebrow="Gestion scolaire"
            title="Profil École"
            description="Fiche administrative unique de l’établissement : identification, code école, QR code, sections et historique."
            action={
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                <Icon name="school" className="h-5 w-5" />
              </div>
            }
          />

          {loading && (
            <div className="space-y-4">
              <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Icon name="school" className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">{error}</p>
              <p className="mt-1 text-xs text-slate-500">
                Le profil s’affiche automatiquement dès qu’un établissement est rattaché au compte.
              </p>
            </div>
          )}

          {!loading && data && (
            <>
              <EcoleProfilEntete ecole={data.ecole} profil={data.profil} />

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
                  {TABS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTab(t.key)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                        tab === t.key ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon name={t.icon} className="h-4 w-4" />
                      {t.label}
                      {t.key === 'sections' && (
                        <span className="rounded-md bg-slate-200/70 px-1.5 text-[11px] font-semibold text-slate-600">
                          {data.sections.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <a
                  href={`/api/ecole-profil/pdf${ecoleId ? `?ecoleId=${encodeURIComponent(ecoleId)}` : ''}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Icon name="download" className="h-4 w-4" />
                  Fiche PDF
                </a>
              </div>

              <div className="mt-4">
                {tab === 'fiche' && (
                  <div className="grid gap-5 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <EcoleProfilFiche data={data} onSaved={load} />
                    </div>
                    <div className="space-y-4">
                      <EcoleProfilQr
                        ecoleId={data.ecole.id}
                        qrPayload={data.qrPayload}
                        codeEcole={data.profil.codeEcole}
                        canEdit={data.permissions.canEdit}
                        onRegenerated={(payload) => setData((prev) => (prev ? { ...prev, qrPayload: payload } : prev))}
                      />
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
                        <h3 className="text-sm font-bold text-slate-900">Informations système</h3>
                        <dl className="mt-3 space-y-2.5 text-xs">
                          <Row label="Identifiant unique" value={data.profil.codeEcole} mono />
                          <Row label="Identifiant School Manager" value={data.ecole.identifiantSM || '—'} mono />
                          <Row label="Profil créé le" value={new Date(data.profil.createdAt).toLocaleDateString('fr-FR')} />
                          <Row label="Dernière mise à jour" value={new Date(data.profil.updatedAt).toLocaleDateString('fr-FR')} />
                          <Row label="Sections / options" value={String(data.sections.length)} />
                        </dl>
                      </div>
                    </div>
                  </div>
                )}

                {tab === 'sections' && (
                  <EcoleSectionsManager
                    ecoleId={data.ecole.id}
                    sections={data.sections}
                    canEdit={data.permissions.canEdit}
                    onChanged={load}
                  />
                )}

                {tab === 'historique' && <EcoleProfilHistorique ecoleId={data.ecole.id} />}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-right font-medium text-slate-900 ${mono ? 'font-mono text-[11px]' : ''}`}>{value}</dd>
    </div>
  );
}

export default function ProfilEcolePage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="p-6">
            <div className="mx-auto max-w-5xl">
              <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>
        </AppShell>
      }
    >
      <ProfilEcoleContent />
    </Suspense>
  );
}
