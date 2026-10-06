'use client';

/**
 * Menu de pièces jointes animé qui s'ouvre au-dessus de la barre de saisie.
 * Options : Appareil photo, Galerie, Document, Audio.
 */
export function AttachmentMenu({
  onCamera,
  onGallery,
  onDocument,
  onAudio,
}: {
  onCamera: () => void;
  onGallery: () => void;
  onDocument: () => void;
  onAudio: () => void;
}) {
  const items = [
    {
      label: 'Appareil photo',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      ),
      color: 'bg-rose-500',
      onClick: onCamera,
    },
    {
      label: 'Galerie',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
      color: 'bg-violet-500',
      onClick: onGallery,
    },
    {
      label: 'Document',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      color: 'bg-blue-500',
      onClick: onDocument,
    },
    {
      label: 'Audio',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      ),
      color: 'bg-amber-500',
      onClick: onAudio,
    },
  ];

  return (
    <div
      className="absolute bottom-full left-0 mb-2 flex gap-2 rounded-2xl bg-white dark:bg-slate-800 p-2 shadow-xl ring-1 ring-slate-200 dark:ring-slate-700"
      style={{ animation: 'attachmentMenuIn 0.2s ease-out' }}
    >
      {items.map((item, i) => (
        <button
          key={item.label}
          onClick={item.onClick}
          className="flex w-16 flex-col items-center gap-1.5 rounded-xl p-2 transition hover:bg-slate-100 dark:hover:bg-slate-700"
          style={{ animation: `attachmentMenuIn 0.25s ease-out ${i * 0.04}s both` }}
        >
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.color} text-white`}>
            {item.icon}
          </div>
          <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
