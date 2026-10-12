import { DocumentUploader } from '@/components/documents/DocumentUploader';

export const dynamic = 'force-dynamic';

export default function MesDocumentsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-blue-600">Mes fichiers</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">
          Documents & Photos
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Téléversez vos documents et photos. Les fichiers sont stockés sur Cloudflare R2 et les métadonnées enregistrées en base.
        </p>
      </div>
      <DocumentUploader />
    </div>
  );
}
