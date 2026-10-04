'use client';

import { useState } from 'react';
import { ModulePage } from '@/components/ModulePage';
import { demoConversations, demoMessages } from '@/lib/demo-data';

export default function SchoolChatPage() {
  const [selected, setSelected] = useState(0);

  return (
    <ModulePage icon="chat" eyebrow="Communication" title="SchoolChat" description="Messagerie et communication entre membres de la communauté éducative.">
      <div className="flex h-[70vh] gap-4 overflow-hidden">
        {/* Liste conversations */}
        <div className="flex w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-soft md:w-80">
          <div className="border-b border-slate-100 p-3">
            <input type="text" placeholder="Rechercher…" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {demoConversations.map((c, i) => (
              <button key={i} onClick={() => setSelected(i)} className={`flex w-full items-center gap-3 border-b border-slate-50 p-3 text-left transition ${selected === i ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                  {c.nom.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-semibold text-slate-900">{c.nom}</p>
                    <span className="text-xs text-slate-400">{c.date}</span>
                  </div>
                  <p className="truncate text-xs text-slate-500">{c.role}</p>
                  <p className="truncate text-xs text-slate-400">{c.dernier}</p>
                </div>
                {c.nonLus > 0 && <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{c.nonLus}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Zone messages */}
        <div className="hidden flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-soft md:flex">
          <div className="border-b border-slate-100 p-4">
            <p className="font-semibold text-slate-900">{demoConversations[selected].nom}</p>
            <p className="text-xs text-slate-500">{demoConversations[selected].role}</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {demoMessages.map((m, i) => (
              <div key={i} className={`flex ${m.moi ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.moi ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                  {!m.moi && <p className="mb-0.5 text-xs font-semibold text-blue-600">{m.auteur}</p>}
                  <p>{m.contenu}</p>
                  <p className={`mt-1 text-xs ${m.moi ? 'text-blue-100' : 'text-slate-400'}`}>{m.date}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 p-3">
            <div className="flex gap-2">
              <input type="text" placeholder="Écrire un message…" className="flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              <button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700">Envoyer</button>
            </div>
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
