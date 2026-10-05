'use client';

import { useEffect, useRef, useState } from 'react';

function formatDuration(seconds: number) {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SPEEDS = [1, 1.5, 2] as const;

/**
 * Lecteur de message vocal premium avec :
 * - bouton play/pause circulaire avec pulsation
 * - waveform animée pendant la lecture
 * - durée restante pendant la lecture
 * - vitesse de lecture 1× / 1,5× / 2×
 * - reprise à la position d'arrêt
 * - barre de progression interactive (seek)
 */
export function VoiceMessagePlayer({ src, isMe }: { src: string; isMe: boolean }) {
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
    const onEnd = () => { setPlaying(false); setCurrent(0); };

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

  // Pseudo-waveform : 28 barres aux hauteurs variées
  const bars = Array.from({ length: 28 }, (_, i) => {
    const seed = Math.sin(i * 2.4) * 0.5 + 0.5;
    return 30 + seed * 70;
  });

  const accent = isMe ? '#1e3a8a' : '#0369a1';
  const trackColor = isMe ? 'bg-blue-200/60 dark:bg-blue-900/40' : 'bg-slate-200 dark:bg-slate-600';

  return (
    <div className="flex items-center gap-2.5 py-0.5">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      {/* Bouton play/pause circulaire avec pulsation */}
      <button
        onClick={togglePlay}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-md transition active:scale-95"
        style={{
          backgroundColor: accent,
          animation: playing ? 'voicePulse 1.4s ease-in-out infinite' : undefined,
        }}
        aria-label={playing ? 'Pause' : 'Lecture'}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-4 w-4">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Waveform + durées */}
      <div className="min-w-0 flex-1">
        <div onClick={seek} className="flex h-8 cursor-pointer items-center gap-[2px]">
          {bars.map((h, i) => {
            const barProgress = (i / bars.length) * 100;
            const played = barProgress <= progress;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors ${played ? '' : trackColor}`}
                style={{
                  height: `${h}%`,
                  backgroundColor: played ? accent : undefined,
                  transformOrigin: 'center',
                  animation: playing ? `voiceBarDance 0.8s ease-in-out ${i * 0.04}s infinite` : undefined,
                }}
              />
            );
          })}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {playing || current > 0 ? `-${formatDuration(remaining)}` : formatDuration(duration)}
          </span>
          <button
            onClick={cycleSpeed}
            className="rounded-md bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            {SPEEDS[speedIdx]}×
          </button>
        </div>
      </div>
    </div>
  );
}
