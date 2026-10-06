'use client';

import { useRef, useState, useCallback } from 'react';
import { AttachmentMenu } from './AttachmentMenu';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Barre de composition moderne pour SchoolChat.
 * - bouton "+" pour pièces jointes (menu animé)
 * - bouton appareil photo
 * - bouton micro (remplacé par envoi quand du texte est saisi)
 * - champ de texte contrôlé
 * - bouton envoyer
 * - mode enregistrement avec annulation
 */
export function ChatComposer({
  value,
  onChange,
  onSend,
  onSendFile,
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  isRecording,
  recordingTime,
  recordingError,
  uploading,
  sending,
  replyTo,
  onCancelReply,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onSendFile: (file: File) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  isRecording: boolean;
  recordingTime: number;
  recordingError: string;
  uploading: boolean;
  sending: boolean;
  replyTo: { name: string; preview: string } | null;
  onCancelReply: () => void;
}) {
  const [showAttach, setShowAttach] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(() => {
    if (!value.trim()) return;
    onSend();
  }, [value, onSend]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSendFile(file);
    if (e.target) e.target.value = '';
    setShowAttach(false);
  };

  if (isRecording) {
    return (
      <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onCancelRecording}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 transition hover:bg-red-100 dark:hover:bg-red-900/50"
            aria-label="Annuler l'enregistrement"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div className="flex flex-1 items-center gap-3 rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-2.5">
            <span
              className="h-3 w-3 shrink-0 rounded-full bg-red-500"
              style={{ animation: 'recPulse 1.5s ease-in-out infinite' }}
            />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              {formatDuration(recordingTime)}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">Enregistrement…</span>
            <div className="ml-auto flex items-center gap-[2px] h-5">
              {Array.from({ length: 12 }, (_, i) => (
                <span
                  key={i}
                  className="w-[2px] rounded-full bg-red-400"
                  style={{
                    height: '100%',
                    transformOrigin: 'center',
                    animation: `voiceBarDance 0.6s ease-in-out ${i * 0.05}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={onStopRecording}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1e3a8a] text-white shadow-md transition hover:bg-[#172554] active:scale-95"
            aria-label="Envoyer le message vocal"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        {recordingError && (
          <p className="mt-1.5 text-center text-xs text-red-500">{recordingError}</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 md:px-4">
      {/* Inputs cachés */}
      <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden"
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,video/mp4,audio/mpeg,audio/mp4,audio/webm,audio/ogg" />
      <input ref={cameraInputRef} type="file" onChange={handleFileSelect} className="hidden" accept="image/*" capture="environment" />
      <input ref={audioInputRef} type="file" onChange={handleFileSelect} className="hidden" accept="audio/*" />

      {/* Aperçu de réponse */}
      {replyTo && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-2">
          <div className="h-8 w-1 shrink-0 rounded-full bg-[#1e3a8a]" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#1e3a8a] dark:text-blue-400">Réponse à {replyTo.name}</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">{replyTo.preview}</p>
          </div>
          <button onClick={onCancelReply}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-700"
            aria-label="Annuler la réponse">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Menu pièces jointes */}
      {showAttach && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowAttach(false)} />
          <AttachmentMenu
            onCamera={() => { cameraInputRef.current?.click(); }}
            onGallery={() => { fileInputRef.current?.click(); }}
            onDocument={() => { fileInputRef.current?.click(); }}
            onAudio={() => { audioInputRef.current?.click(); }}
          />
        </>
      )}

      {/* Barre principale */}
      <div className="flex items-center gap-1.5 md:gap-2">
        <button onClick={() => setShowAttach((s) => !s)} disabled={uploading || sending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#1e3a8a] dark:text-blue-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 disabled:opacity-40"
          aria-label="Pièces jointes">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </button>

        <div className="flex flex-1 items-center rounded-full bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 focus-within:ring-2 focus-within:ring-[#1e3a8a]/30">
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Tapez un message…"
            className="flex-1 bg-transparent px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500" />
          <button onClick={() => cameraInputRef.current?.click()} disabled={uploading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 dark:text-slate-500 transition hover:text-[#1e3a8a] dark:hover:text-blue-400 disabled:opacity-40"
            aria-label="Appareil photo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>

        {value.trim() ? (
          <button onClick={handleSend} disabled={uploading || sending}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] text-white shadow-lg transition hover:shadow-xl hover:from-[#172554] hover:to-[#1d4ed8] active:scale-90 disabled:opacity-40"
            aria-label="Envoyer">
            {sending ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
            )}
          </button>
        ) : (
          <button onClick={onStartRecording} disabled={uploading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#1e3a8a] dark:text-blue-400 transition hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90 disabled:opacity-40"
            aria-label="Enregistrer un message vocal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </button>
        )}
      </div>

      {uploading && <p className="mt-1 text-center text-xs text-slate-400">Envoi du fichier…</p>}
    </div>
  );
}
