'use client';

import { useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { Card } from '@/components/ui/Card';

export default function ParametresPage() {
  const [section, setSection] = useState('compte');

  const sections = [
    { id: 'compte', label: 'Compte', icon: '👤' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'langue', label: 'Langue & région', icon: '🌍' },
    { id: 'securite', label: 'Sécurité', icon: '🔒' },
    { id: 'apparence', label: 'Apparence', icon: '🎨' },
  ];

  return (
    <ModulePage icon="settings" eyebrow="Services" title="Paramètres" description="Préférences du compte, langue, notifications et options de l'application.">
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Menu sections */}
        <div className="flex gap-2 overflow-x-auto md:w-56 md:flex-col md:overflow-visible">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex flex-shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${section === s.id ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="flex-1">
          {section === 'compte' && (
            <Card>
              <h3 className="mb-4 font-bold text-slate-900">Informations du compte</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Nom complet</label>
                  <input type="text" defaultValue="Test User" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
                  <input type="email" defaultValue="test@school.cd" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Téléphone</label>
                  <input type="tel" defaultValue="+243 000 000 000" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <button className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">Enregistrer</button>
              </div>
            </Card>
          )}

          {section === 'notifications' && (
            <Card>
              <h3 className="mb-4 font-bold text-slate-900">Préférences de notification</h3>
              <div className="space-y-3">
                {['Notifications par email', 'Alertes de nouvelles inscriptions', 'Rappels de visites', 'Notifications de notes publiées', 'Alertes de dossiers'].map((label) => (
                  <label key={label} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <span className="text-sm text-slate-700">{label}</span>
                    <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </label>
                ))}
              </div>
            </Card>
          )}

          {section === 'langue' && (
            <Card>
              <h3 className="mb-4 font-bold text-slate-900">Langue & région</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Langue</label>
                  <select className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                    <option>Français</option>
                    <option>English</option>
                    <option>Lingala</option>
                    <option>Swahili</option>
                    <option>Tshiluba</option>
                    <option>Kikongo</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Fuseau horaire</label>
                  <select className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                    <option>Africa/Kinshasa (UTC+1)</option>
                    <option>Africa/Lubumbashi (UTC+2)</option>
                  </select>
                </div>
              </div>
            </Card>
          )}

          {section === 'securite' && (
            <Card>
              <h3 className="mb-4 font-bold text-slate-900">Sécurité</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Mot de passe actuel</label>
                  <input type="password" placeholder="••••••••" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
                  <input type="password" placeholder="••••••••" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>
                <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                  <span className="text-sm text-slate-700">Authentification à deux facteurs</span>
                  <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                </label>
                <button className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">Mettre à jour</button>
              </div>
            </Card>
          )}

          {section === 'apparence' && (
            <Card>
              <h3 className="mb-4 font-bold text-slate-900">Apparence</h3>
              <div className="space-y-3">
                {['Clair', 'Sombre', 'Système'].map((mode) => (
                  <label key={mode} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                    <span className="text-sm text-slate-700">{mode}</span>
                    <input type="radio" name="theme" defaultChecked={mode === 'Clair'} className="h-5 w-5 border-slate-300 text-blue-600 focus:ring-blue-500" />
                  </label>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </ModulePage>
  );
}
