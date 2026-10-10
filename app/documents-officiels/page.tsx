import { DocumentSubmissionForm } from '@/components/ecoles/DocumentSubmissionForm';

export const dynamic = 'force-dynamic';

export default function DocumentsOfficielsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-blue-600">Documents officiels</p>
        <h1 className="mt-1 text-xl font-bold text-slate-900 md:text-2xl">
          Téléverser & soumettre le dossier
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Téléversez vos documents officiels et soumettez-les à la coordination sous-provinciale et provinciale.
        </p>
      </div>
      <DocumentSubmissionForm />
    </div>
  );
}
