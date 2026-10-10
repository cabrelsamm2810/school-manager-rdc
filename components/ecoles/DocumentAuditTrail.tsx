'use client';

import { StatutBadge } from '@/components/ui/StatutBadge';

export type DocumentAudit = {
  id: string;
  documentId: string | null;
  documentTitre: string;
  action: string;
  userId: string;
  userName: string;
  userRole: string;
  commentaire: string;
  createdAt: string;
};

const ACTION_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  UPLOAD:   { icon: '📎', color: 'text-blue-600 bg-blue-50',   label: 'Téléversement' },
  SUBMIT:   { icon: '📤', color: 'text-amber-600 bg-amber-50', label: 'Soumission' },
  VALIDATE: { icon: '✅', color: 'text-green-600 bg-green-50', label: 'Validation' },
  REJECT:   { icon: '❌', color: 'text-red-600 bg-red-50',     label: 'Rejet' },
  DELETE:   { icon: '🗑️', color: 'text-slate-600 bg-slate-50', label: 'Suppression' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DocumentAuditTrail({ audits }: { audits: DocumentAudit[] }) {
  if (audits.length === 0) {
    return <p className="text-sm text-slate-500">Aucun historique d'audit pour le moment.</p>;
  }

  return (
    <div className="space-y-2">
      {audits.map((audit) => {
        const cfg = ACTION_CONFIG[audit.action] || { icon: '•', color: 'text-slate-600 bg-slate-50', label: audit.action };
        return (
          <div key={audit.id} className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-2.5">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${cfg.color}`}>
              {cfg.icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${cfg.color}`}>
                  {cfg.label}
                </span>
                {audit.documentTitre && (
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {audit.documentTitre}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {audit.commentaire || '—'}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {audit.userName || 'Système'}
                {audit.userRole && ` · ${audit.userRole}`}
                {' · '}
                {formatDate(audit.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
