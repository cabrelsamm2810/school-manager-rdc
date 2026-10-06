'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { formatDuration } from '@/lib/chat-format';

const SPEEDS = [1, 1.5, 2] as const;

/**
 * Lecteur de message vocal compact et professionnel :
 * lecture/pause, progression sur la forme d'onde, durée restante, vitesse 1× / 1,5× / 2×.
 */
export const VoiceMessagePlayer = memo(function VoiceMessagePlayer({ src, isMe }: { src: string; isMe: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => setCurrent(audio.currentTime);
    const onEnd = () => {
      setPlaying(false);
      setCurrent(0);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, []);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }

  function cycleSpeed() {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = Math.max(0, Math.min(1, pct)) * duration;
    setCurrent(audio.currentTime);
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;
  const remaining = Math.max(0, duration - current);

  // Pseudo-forme d'onde : 24 barres stables, purement décoratives.
  const bars = Array.from({ length: 24 }, (_, i) => 28 + (Math.sin(i * 2.4) * 0.5 + 0.5) * 66);

  const playedColor = isMe ? '#ffffff' : '#2563eb';
  const trackColor = isMe ? 'bg-white/35' : 'bg-slate-200';

  return (
    <div className="flex items-center gap-2.5 py-0.5">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      <button
        onClick={togglePlay}
        className={clsx(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm transition active:scale-90',
          isMe ? 'bg-white text-[#1d4ed8]' : 'bg-[#2563eb] text-white'
        )}
        aria-label={playing ? 'Pause' : 'Lecture'}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-3.5 w-3.5">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div onClick={seek} className="flex h-7 cursor-pointer items-center gap-[2px]">
          {bars.map((h, i) => {
            const played = (i / bars.length) * 100 <= progress;
            return (
              <span
                key={i}
                className={clsx('flex-1 rounded-full transition-colors', played ? '' : trackColor)}
                style={{ height: `${h}%`, backgroundColor: played ? playedColor : undefined }}
              />
            );
          })}
        </div>
        <div className="mt-0.5 flex items-center justify-between">
          <span className={clsx('text-[11px] font-medium tabular-nums', isMe ? 'text-white/80' : 'text-slate-500')}>
            {playing || current > 0 ? formatDuration(remaining) : formatDuration(duration)}
          </span>
          <button
            onClick={cycleSpeed}
            className={clsx(
              'rounded-md px-1.5 py-0.5 text-[10px] font-bold transition',
              isMe ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {SPEEDS[speedIdx]}×
          </button>
        </div>
      </div>
    </div>
  );
});
