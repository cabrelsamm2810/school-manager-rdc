'use client';

/**
 * Indicateur "en train d'écrire…" avec points animés — design moderne.
 */
export function TypingIndicator({ isMe }: { isMe: boolean }) {
  return (
    <div
      className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-[4px] bg-[#132f4c] px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.2)] ring-1 ring-[#1e3a8a]/60"
      style={{ animation: 'chatBubbleIn 0.25s ease-out' }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-[#93c5fd]"
          style={{
            animation: `typingDot 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
