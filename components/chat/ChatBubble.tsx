'use client';

import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { FileBubble, type FileStatus } from './FileBubble';

export type ChatMessageData = {
  id: string;
  content: string;
  senderId: string;
  senderName?: string;
  createdAt: string;
  read: boolean;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number;
  status?: FileStatus;
  replyToId?: string | null;
  replyTo?: { senderName: string; content: string } | null;
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function isImageFile(fileType?: string | null, fileUrl?: string | null) {
  if (fileType?.startsWith('image/')) return true;
  if (fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl)) return true;
  return false;
}

function isAudioFile(fileType?: string | null, fileUrl?: string | null) {
  if (fileType?.startsWith('audio/')) return true;
  if (fileUrl && /\.(mp3|wav|ogg|webm|m4a|aac|opus)$/i.test(fileUrl)) return true;
  return false;
}

function getMessagePreview(msg: ChatMessageData): string {
  if (msg.content) return msg.content;
  if (isAudioFile(msg.fileType, msg.fileUrl)) return '🎤 Message vocal';
  if (isImageFile(msg.fileType, msg.fileUrl)) return '📷 Photo';
  if (msg.fileUrl) return `📎 ${msg.fileName || 'Fichier'}`;
  return '';
}

/**
 * Double coche pour le statut de lecture.
 */
function ReadCheck({ read }: { read: boolean }) {
  if (read) {
    return (
      <svg viewBox="0 0 18 11" className="h-3 w-[18px]" fill="#60a5fa" stroke="#60a5fa" strokeWidth={1}>
        <path d="M11.071.653a.5.5 0 0 1 .024.707l-6 6.5a.5.5 0 0 1-.738.024L1.3 5.353a.5.5 0 1 1 .7-.714l2.69 2.69L10.4.677a.5.5 0 0 1 .671-.024z" />
        <path d="M15.071.653a.5.5 0 0 1 .024.707l-6 6.5a.5.5 0 0 1-.738.024l-.5-.5a.5.5 0 1 1 .707-.707l.146.146L14.4.677a.5.5 0 0 1 .671-.024z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 11" className="h-3 w-4" fill="none" stroke="#9ca3af" strokeWidth={1}>
      <path d="M11.071.653a.5.5 0 0 1 .024.707l-6 6.5a.5.5 0 0 1-.738.024L1.3 5.353a.5.5 0 1 1 .7-.714l2.69 2.69L10.4.677a.5.5 0 0 1 .671-.024z" />
    </svg>
  );
}

/**
 * Menu d'actions contextuel (répondre, supprimer, transférer).
 */
function MessageActions({
  onReply,
  onDelete,
  onForward,
  canDelete,
  onClose,
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
      className="absolute z-20 min-w-[140px] overflow-hidden rounded-xl bg-white dark:bg-slate-800 py-1 shadow-xl ring-1 ring-slate-200 dark:ring-slate-700"
      style={{ animation: 'msgActionIn 0.15s ease-out' }}
      onClick={(e) => e.stopPropagation()}
    >
      <button onClick={onReply} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <polyline points="9 17 4 12 9 7" /><path d="M20 18v-2a4 4 0 0 0-4-4H4" />
        </svg>
        Répondre
      </button>
      <button onClick={onForward} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-700">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
          <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
        Transférer
      </button>
      {canDelete && (
        <button onClick={onDelete} className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/30">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          Supprimer
        </button>
      )}
    </div>
  );
}

/**
 * Bulle de message moderne pour SchoolChat.
 * Gère texte, images, audio, fichiers, avec :
 * - alignement gauche/droite
 * - coins arrondis élégants avec queue
 * - heure discrète
 * - statut d'envoi/lecture (double coche)
 * - regroupement intelligent des messages consécutifs
 * - aperçu de réponse
 * - menu d'actions (répondre, supprimer, transférer)
 */
export function ChatBubble({
  msg,
  isMe,
  isGroup,
  showSenderName,
  isConsecutive,
  replyToMessage,
  onReply,
  onDelete,
  onForward,
  onRetry,
  canDelete,
}: {
  msg: ChatMessageData;
  isMe: boolean;
  isGroup: boolean;
  showSenderName: boolean;
  isConsecutive: boolean;
  replyToMessage?: ChatMessageData | null;
  onReply: (msg: ChatMessageData) => void;
  onDelete: (msg: ChatMessageData) => void;
  onForward: (msg: ChatMessageData) => void;
  onRetry?: (msg: ChatMessageData) => void;
  canDelete: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  const handleLongPress = () => setShowActions(true);
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowActions(true);
  };

  // Long press pour mobile
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPress = () => {
    pressTimer.current = setTimeout(() => handleLongPress(), 500);
  };
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const hasFile = msg.fileUrl && !isAudioFile(msg.fileType, msg.fileUrl);
  const hasImage = isImageFile(msg.fileType, msg.fileUrl);
  const hasAudio = isAudioFile(msg.fileType, msg.fileUrl) && msg.fileUrl;
  const hasText = msg.content && msg.content.trim();

  return (
    <div
      className={clsx('flex', isMe ? 'justify-end' : 'justify-start', isConsecutive ? 'mt-0.5' : 'mt-2')}
      style={{ animation: 'chatBubbleIn 0.25s ease-out' }}
    >
      <div className="relative max-w-[80%] md:max-w-[65%]">
        {/* Menu d'actions */}
        {showActions && (
          <div className={clsx('absolute bottom-full mb-1', isMe ? 'right-0' : 'left-0')}>
            <MessageActions
              onReply={() => { onReply(msg); setShowActions(false); }}
              onDelete={() => { onDelete(msg); setShowActions(false); }}
              onForward={() => { onForward(msg); setShowActions(false); }}
              canDelete={canDelete}
              onClose={() => setShowActions(false)}
            />
          </div>
        )}

        <div
          ref={bubbleRef}
          onContextMenu={handleContextMenu}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          onTouchMove={cancelPress}
          className={clsx(
            'relative px-3 py-2 shadow-sm transition',
            isMe
              ? 'bg-[#dbeafe] dark:bg-[#1e3a8a] text-slate-900 dark:text-blue-50'
              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100',
            // Coins arrondis avec queue
            isMe
              ? isConsecutive ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-tr-sm'
              : isConsecutive ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-tl-sm',
            // Largeur adaptée
            hasAudio ? 'w-[220px] md:w-[260px]' : '',
          )}
        >
          {/* Nom de l'expéditeur pour les groupes */}
          {isGroup && !isMe && showSenderName && msg.senderName && (
            <p className="mb-0.5 text-xs font-bold text-[#1e3a8a] dark:text-blue-400">{msg.senderName}</p>
          )}

          {/* Aperçu de réponse */}
          {replyToMessage && (
            <div className={clsx(
              'mb-1.5 rounded-lg px-2.5 py-1.5 border-l-2',
              isMe ? 'bg-blue-100/60 dark:bg-blue-900/40 border-[#1e3a8a]' : 'bg-slate-100 dark:bg-slate-700/60 border-slate-400'
            )}>
              <p className={clsx('text-[11px] font-semibold', isMe ? 'text-[#1e3a8a] dark:text-blue-300' : 'text-slate-600 dark:text-slate-300')}>
                {replyToMessage.senderName || (replyToMessage.senderId === msg.senderId ? 'Vous' : 'Utilisateur')}
              </p>
              <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                {getMessagePreview(replyToMessage)}
              </p>
            </div>
          )}

          {/* Image */}
          {hasImage && msg.fileUrl && (
            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="mb-1 block overflow-hidden rounded-lg">
              <img src={msg.fileUrl} alt={msg.fileName || 'Image'} className="max-h-60 w-full rounded-lg object-cover" />
            </a>
          )}

          {/* Audio */}
          {hasAudio && (
            <VoiceMessagePlayer src={msg.fileUrl!} isMe={isMe} />
          )}

          {/* Fichier (non-image, non-audio) */}
          {hasFile && msg.fileUrl && (
            <FileBubble
              fileName={msg.fileName || 'Fichier'}
              fileType={msg.fileType}
              fileUrl={msg.fileUrl}
              fileSize={msg.fileSize}
              status={msg.status}
              onRetry={onRetry ? () => onRetry(msg) : undefined}
              isMe={isMe}
            />
          )}

          {/* Texte */}
          {hasText && (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.content}</p>
          )}

          {/* Heure + statut de lecture */}
          <div className="mt-0.5 flex items-center justify-end gap-1">
            <span className={clsx('text-[10px]', isMe ? 'text-slate-400 dark:text-blue-200/60' : 'text-slate-400 dark:text-slate-500')}>
              {formatTime(msg.createdAt)}
            </span>
            {isMe && <ReadCheck read={msg.read} />}
          </div>
        </div>
      </div>
    </div>
  );
}
