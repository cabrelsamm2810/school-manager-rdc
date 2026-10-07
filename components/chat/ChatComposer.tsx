'use client';

import { useRef, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { AttachmentMenu } from './AttachmentMenu';

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Barre de rédaction moderne de SchoolChat.
 * Champ de saisie, pièces jointes (appareil photo, galerie, document, audio),
 * message vocal, envoi — toutes les actions existantes sont conservées.
 * Les boutons font au moins 44 px pour rester confortables au doigt sur Android.
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
  uploadError,
  replyTo,
  onCancelReply
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
  uploadError: string;
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

  const iconBtn =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-90 disabled:opacity-40';

  if (isRecording) {
    return (
      <div className="shrink-0 border-t border-slate-200 bg-white px-2.5 py-2.5 md:px-4">
        <div className="flex items-center gap-2.5">
          {/* Bouton annuler */}
          <button onClick={onCancelRecording} className={clsx(iconBtn, 'bg-red-50 text-red-500 hover:bg-red-100')} aria-label="Annuler l'enregistrement">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-5 w-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Indicateur d'enregistrement animé */}
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full bg-red-50 px-4 py-2.5 ring-1 ring-red-100">
            <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
              <span className="absolute h-3 w-3 rounded-full bg-red-500/40" style={{ animation: 'recPulse 1.5s ease-in-out infinite' }} />
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="shrink-0 text-[14px] font-bold tabular-nums text-red-600">{formatDuration(recordingTime)}</span>
            <span className="hidden truncate text-[13px] font-medium text-red-400 sm:block">Enregistrement…</span>
            {/* Animation de barres vocales */}
            <div className="ml-auto flex h-5 items-center gap-[2px]">
              {Array.from({ length: 7 }, (_, i) => (
                <span
                  key={i}
                  className="w-[3px] rounded-full bg-red-400"
                  style={{ height: '100%', transformOrigin: 'center', animation: `voiceBarDance 0.6s ease-in-out ${i * 0.08}s infinite` }}
                />
              ))}
            </div>
          </div>

          {/* Bouton envoyer */}
          <button
            onClick={onStopRecording}
            className={clsx(iconBtn, 'bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-md hover:brightness-110')}
            aria-label="Envoyer le message vocal"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        {recordingError && <p className="mt-1.5 text-center text-xs text-red-500">{recordingError}</p>}
      </div>
    );
  }

  return (
    <div className="relative shrink-0 border-t border-slate-200 bg-white px-2 py-2 md:px-3 md:py-2.5">
      {/* Inputs cachés */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,video/mp4,audio/mpeg,audio/mp4,audio/webm,audio/ogg,.heic,.heif"
      />
      <input ref={cameraInputRef} type="file" onChange={handleFileSelect} className="hidden" accept="image/*" capture="environment" />
      <input ref={audioInputRef} type="file" onChange={handleFileSelect} className="hidden" accept="audio/*" />

      {/* Aperçu de réponse */}
      {replyTo && (
        <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200/70">
          <span className="h-8 w-[3px] shrink-0 rounded-full bg-[#2563eb]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-semibold text-[#1d4ed8]">Réponse à {replyTo.name}</p>
            <p className="truncate text-[12px] text-slate-500">{replyTo.preview}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200"
            aria-label="Annuler la réponse"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}

      {/* Menu de pièces jointes */}
      {showAttach && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowAttach(false)} />
          <AttachmentMenu
            onCamera={() => cameraInputRef.current?.click()}
            onGallery={() => fileInputRef.current?.click()}
            onDocument={() => fileInputRef.current?.click()}
            onAudio={() => audioInputRef.current?.click()}
          />
        </>
      )}

      {/* Barre de saisie */}
      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Bouton pièce jointe */}
        <button
          onClick={() => setShowAttach((s) => !s)}
          disabled={uploading || sending}
          className={clsx(iconBtn, 'text-slate-500 hover:bg-slate-100 hover:text-[#2563eb]')}
          aria-label="Pièces jointes"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px]">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </button>

        {/* Champ de saisie + bouton caméra intégré */}
        <div className="flex min-w-0 flex-1 items-center rounded-full bg-slate-100 ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-[#2563eb]/30">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Tapez un message…"
            aria-label="Votre message"
            className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-[14px] text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:text-[#2563eb] disabled:opacity-40"
            aria-label="Appareil photo"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>

        {/* Bouton envoyer ou micro */}
        {value.trim() ? (
          <button
            onClick={handleSend}
            disabled={uploading || sending}
            className={clsx(iconBtn, 'bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-md hover:brightness-110')}
            aria-label="Envoyer"
          >
            {sending ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 animate-spin">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            )}
          </button>
        ) : (
          <button
            onClick={onStartRecording}
            disabled={uploading}
            className={clsx(iconBtn, 'text-slate-500 hover:bg-slate-100 hover:text-[#2563eb]')}
            aria-label="Enregistrer un message vocal"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-[22px] w-[22px]">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </button>
        )}
      </div>

      {uploading && <p className="mt-1 text-center text-[11px] text-slate-400">Envoi du fichier…</p>}
      {uploadError && !uploading && (
        <div className="mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-medium text-red-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-3.5 w-3.5 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {uploadError}
        </div>
      )}
    </div>
  );
}
