const conversations = [
  { name: 'Équipe de direction', unread: 3 },
  { name: 'Parents - CE1', unread: 1 },
  { name: 'Coordination provinciale', unread: 0 }
];

export default function SchoolChatPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-3xl bg-white p-5 shadow-soft">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-600">SchoolChat</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Conversations</h1>
          </div>

          <div className="space-y-3">
            {conversations.map((conversation) => (
              <button key={conversation.name} className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left">
                <span className="font-medium text-slate-800">{conversation.name}</span>
                {conversation.unread > 0 ? (
                  <span className="rounded-full bg-blue-600 px-2 py-1 text-xs font-semibold text-white">{conversation.unread}</span>
                ) : null}
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-3xl bg-white p-6 shadow-soft">
          <div className="mb-6 border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold text-slate-900">Équipe de direction</h2>
            <p className="mt-1 text-sm text-slate-500">Messages privés • accès limité au groupe concerné</p>
          </div>

          <div className="space-y-4">
            <div className="max-w-md rounded-2xl bg-slate-100 p-4 text-slate-700">
              Bonjour, voici les points à vérifier aujourd’hui.
            </div>
            <div className="ml-auto max-w-md rounded-2xl bg-blue-600 p-4 text-white">
              Merci, j’ai relu la liste et je valide les absences.
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <input className="flex-1 rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-blue-500" placeholder="Écrire un message..." />
            <button className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-500">Envoyer</button>
          </div>
        </section>
      </div>
    </main>
  );
}
