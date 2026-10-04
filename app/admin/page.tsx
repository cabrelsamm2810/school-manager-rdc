'use client';

import { ModulePage } from '@/components/ModulePage';
import { StatCard } from '@/components/ui/Card';
import { demoUsers, demoEtablissements, demoProvinces, demoDossiers } from '@/lib/demo-data';

export default function AdminPage() {
  return (
    <ModulePage icon="shield" eyebrow="Administration" title="Administration générale" description="Configuration globale, paramètres système et supervision de School Manager RDC.">
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Utilisateurs" value={String(demoUsers.length)} hint="Total comptes" />
        <StatCard label="Établissements" value={String(demoEtablissements.length)} hint="Recensés" />
        <StatCard label="Provinces" value={String(demoProvinces.length)} hint="Couvertes" />
        <StatCard label="Dossiers" value={String(demoDossiers.length)} hint="Actifs" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="mb-4 font-bold text-slate-900">État du système</h3>
          <div className="space-y-3">
            {[
              { label: 'Base de données', value: 'PostgreSQL 16', status: 'Opérationnel' },
              { label: 'Serveur applicatif', value: 'Next.js 14', status: 'Opérationnel' },
              { label: 'Authentification', value: 'Session cookie', status: 'Opérationnel' },
              { label: 'Stockage fichiers', value: 'Non configuré', status: 'En attente' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.value}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${item.status === 'Opérationnel' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
          <h3 className="mb-4 font-bold text-slate-900">Actions rapides</h3>
          <div className="space-y-2">
            {[
              'Gérer les utilisateurs',
              'Configurer les rôles',
              'Voir les logs système',
              'Sauvegarde de la base',
              'Paramètres généraux',
            ].map((action) => (
              <button key={action} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                {action}
                <span className="text-slate-400">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
