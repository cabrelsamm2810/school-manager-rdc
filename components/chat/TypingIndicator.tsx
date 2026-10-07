'use client';

/**
 * Indicateur "en train d'écrire…" avec points animés — design moderne.
 */
export function TypingIndicator({ isMe }: { isMe: boolean }) {
  return (
    <div
      className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-[4px] bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/60"
      style={{ animation: 'chatBubbleIn 0.25s ease-out' }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-slate-400"
          style={{
            animation: `typingDot 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
