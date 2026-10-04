'use client';

import { ModulePage } from '@/components/ModulePage';

export default function SchoolChatPage() {
  return (
    <ModulePage icon="chat" eyebrow="Communication" title="SchoolChat" description="Messagerie et communication entre membres de la communauté éducative.">
      <div className="flex h-[70vh] gap-4 overflow-hidden">
        {/* Liste conversations */}
        <div className="flex w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-soft md:w-80">
          <div className="border-b border-slate-100 p-3">
            <input type="text" placeholder="Rechercher…" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">💬</div>
              <p className="text-sm font-medium text-slate-600">Aucune conversation</p>
              <p className="mt-1 text-xs text-slate-400">La messagerie sera disponible prochainement.</p>
            </div>
          </div>
        </div>

        {/* Zone messages */}
        <div className="hidden flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-soft md:flex">
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">💬</div>
            <p className="text-sm font-medium text-slate-600">SchoolChat</p>
            <p className="mt-1 text-xs text-slate-400">Sélectionnez une conversation pour commencer à discuter.</p>
          </div>
        </div>
      </div>
    </ModulePage>
  );
}
