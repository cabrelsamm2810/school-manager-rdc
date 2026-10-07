'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { Avatar } from '@/components/ui/Avatar';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { FileBubble, type FileStatus } from './FileBubble';
import { formatMessageTime, getMessagePreview, isAudioFile, isImageFile } from '@/lib/chat-format';

export type ChatMessageData = {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  senderPrenom?: string | null;
  senderNom?: string | null;
  senderPhotoUrl?: string | null;
  createdAt: string;
  read: boolean;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  status?: FileStatus;
  replyToId?: string | null;
  replyTo?: { senderName: string; content: string } | null;
};

/** Statut d'acheminement / de lecture d'un message envoyé. */
function MessageStatus({ msg }: { msg: ChatMessageData }) {
  if (msg.status === 'failed') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-3.5 w-3.5 text-red-200" aria-label="Envoi échoué">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }

  if (msg.status === 'sending') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 text-white/70" aria-label="Envoi en cours">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 14" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 18 11"
      className={clsx('h-3 w-[16px]', msg.read ? 'text-[#bfdbfe]' : 'text-white/70')}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label={msg.read ? 'Lu' : 'Envoyé'}
    >
      <path d="M1.4 5.7l2.9 2.9L10.2 2.6" />
      {msg.read && <path d="M7.6 6.7l2.5 2.5L16.6 2.6" />}
    </svg>
  );
}

/** Menu d'actions contextuel (répondre, transférer, supprimer). */
function MessageActions({
  onReply,
  onDelete,
  onForward,
  canDelete,
  onClose
}: {
  onReply: () => void;
  onDelete: () => void;
  onForward: () => void;
  canDelete: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [onClose]);

  return (
    <div
      className="absolute z-20 min-w-[150px] overflow-hidden rounded-xl bg-white py-1.5 shadow-xl ring-1 ring-slate-200"
      style={{ animation: 'msgActionIn 0.15s ease-out' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={onReply} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-[#2563eb]">
          <polyline points="9 17 4 12 9 7" />
          <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
        </svg>
        Répondre
      </button>
      <button onClick={onForward} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-brand-500">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
        Transférer
      </button>
      {canDelete && (
        <button onClick={onDelete} className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium text-red-500 transition hover:bg-red-50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Supprimer
        </button>
      )}
    </div>
  );
}

/**
 * Bulle de message SchoolChat.
 * - messages reçus alignés à gauche avec une photo de profil discrète (alignée en bas du groupe),
 * - messages envoyés alignés à droite, accent bleu de l'école, heure + statut,
 * - texte, image, message vocal et pièce jointe dans une même enveloppe compacte.
 */
export const ChatBubble = memo(function ChatBubble({
  msg,
  isMe,
  isGroup,
  showSenderName,
  isConsecutive,
  isLastInGroup,
  replyToMessage,
  senderPhotoUrl,
  senderPrenom,
  senderNom,
  onReply,
  onDelete,
  onForward,
  onRetry,
  canDelete
}: {
  msg: ChatMessageData;
  isMe: boolean;
  isGroup: boolean;
  showSenderName: boolean;
  isConsecutive: boolean;
  isLastInGroup: boolean;
  replyToMessage?: ChatMessageData | null;
  senderPhotoUrl?: string | null;
  senderPrenom?: string | null;
  senderNom?: string | null;
  onReply: (msg: ChatMessageData) => void;
  onDelete: (msg: ChatMessageData) => void;
  onForward: (msg: ChatMessageData) => void;
  onRetry?: (msg: ChatMessageData) => void;
  canDelete: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowActions(true);
  };
  const startPress = () => {
    pressTimer.current = setTimeout(() => setShowActions(true), 500);
  };
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const hasImage = isImageFile(msg.fileType, msg.fileUrl);
  const hasAudio = isAudioFile(msg.fileType, msg.fileUrl) && Boolean(msg.fileUrl);
  const hasFile = Boolean(msg.fileUrl) && !hasImage && !hasAudio;
  const hasText = Boolean(msg.content && msg.content.trim());
  const isWide = hasAudio || hasFile;

  return (
    <div
      className={clsx(
        'flex w-full items-end gap-2',
        isMe ? 'justify-end' : 'justify-start',
        isConsecutive ? 'mt-[3px]' : 'mt-2'
      )}
      style={{ animation: 'chatBubbleIn 0.22s ease-out' }}
    >
      {/* Photo de profil discrète, alignée sur la dernière bulle d'un groupe */}
      {!isMe && (
        <span className="w-7 shrink-0 self-end">
          {isLastInGroup && (
            <Avatar
              photoUrl={senderPhotoUrl}
              prenom={senderPrenom ?? msg.senderName}
              nom={senderNom}
              size="2xs"
              className="ring-1 ring-black/5"
            />
          )}
        </span>
      )}

      <div className="relative max-w-[80%] md:max-w-[62%]">
        {showActions && (
          <div className={clsx('absolute bottom-full z-20 mb-1', isMe ? 'right-0' : 'left-0')}>
            <MessageActions
              onReply={() => {
                onReply(msg);
                setShowActions(false);
              }}
              onDelete={() => {
                onDelete(msg);
                setShowActions(false);
              }}
              onForward={() => {
                onForward(msg);
                setShowActions(false);
              }}
              canDelete={canDelete}
              onClose={() => setShowActions(false)}
            />
          </div>
        )}

        <div
          onContextMenu={handleContextMenu}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          onTouchMove={cancelPress}
          className={clsx(
            'relative px-3 py-1.5 text-[13.5px] shadow-sm transition',
            isMe
              ? 'bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-blue-900/10'
              : 'bg-white text-slate-800 ring-1 ring-slate-200/80',
            isMe
              ? isConsecutive && !isLastInGroup
                ? 'rounded-2xl rounded-br-md'
                : 'rounded-2xl rounded-br-sm'
              : isConsecutive && !isLastInGroup
                ? 'rounded-2xl rounded-bl-md'
                : 'rounded-2xl rounded-bl-sm',
            isWide && 'w-[228px] md:w-[264px]'
          )}
        >
          {isGroup && !isMe && showSenderName && msg.senderName && (
            <p className="mb-0.5 text-[11.5px] font-bold tracking-wide text-[#2563eb]">{msg.senderName}</p>
          )}

          {replyToMessage && (
            <div
              className={clsx(
                'mb-1.5 rounded-lg border-l-[3px] px-2 py-1',
                isMe ? 'bg-white/15 border-white/50' : 'bg-slate-50 border-[#2563eb]/60'
              )}
            >
              <p className={clsx('truncate text-[11px] font-semibold', isMe ? 'text-white' : 'text-[#1d4ed8]')}>
                {replyToMessage.senderName || (replyToMessage.senderId === msg.senderId ? 'Vous' : 'Utilisateur')}
              </p>
              <p className={clsx('truncate text-[11px]', isMe ? 'text-white/75' : 'text-slate-500')}>
                {getMessagePreview(replyToMessage)}
              </p>
            </div>
          )}

          {hasImage && msg.fileUrl && (
            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="mb-1 block overflow-hidden rounded-xl">
              <img
                src={msg.fileUrl}
                alt={msg.fileName || 'Image'}
                loading="lazy"
                decoding="async"
                className="max-h-56 w-full rounded-xl object-cover transition hover:opacity-95 md:max-h-64"
              />
            </a>
          )}

          {hasAudio && <VoiceMessagePlayer src={msg.fileUrl!} isMe={isMe} />}

          {hasFile && msg.fileUrl && (
            <FileBubble
              fileName={msg.fileName || 'Fichier'}
              fileType={msg.fileType}
              fileUrl={msg.fileUrl}
              fileSize={msg.fileSize ?? undefined}
              status={msg.status}
              onRetry={onRetry ? () => onRetry(msg) : undefined}
              isMe={isMe}
            />
          )}

          {hasText && <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>}

          <div className={clsx('mt-0.5 flex items-center justify-end gap-1', (hasAudio || hasFile) && 'pt-0.5')}>
            <span className={clsx('text-[10px] tabular-nums', isMe ? 'text-white/70' : 'text-slate-400')}>
              {formatMessageTime(msg.createdAt)}
            </span>
            {isMe && <MessageStatus msg={msg} />}
          </div>
        </div>
      </div>
    </div>
  );
});
