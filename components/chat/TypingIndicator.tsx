'use client';

/**
 * Indicateur "en train d'écrire…" avec points animés.
 */
export function TypingIndicator({ isMe }: { isMe: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl rounded-bl-md bg-white dark:bg-slate-800 shadow-sm w-fit">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500"
          style={{
            animation: `typingDot 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
