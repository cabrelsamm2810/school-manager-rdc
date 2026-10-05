'use client';

import { useEffect, useRef, useState } from 'react';

function formatDuration(seconds: number) {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Lecteur de message vocal élégant pour les bulles de chat.
 * Bouton play/pause circulaire + barre de progression façon waveform.
 */
export function VoiceMessagePlayer({ src, isMe }: { src: string; isMe: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);

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

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * duration;
    setCurrent(audio.currentTime);
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  // Pseudo-waveform : 28 barres aux hauteurs variées
  const bars = Array.from({ length: 28 }, (_, i) => {
    const seed = Math.sin(i * 2.4) * 0.5 + 0.5;
    return 30 + seed * 70; // 30% à 100%
  });

  const accent = isMe ? '#1e3a8a' : '#0369a1';
  const trackColor = isMe ? 'bg-blue-200/60' : 'bg-slate-200';

  return (
    <div className="mb-1 flex items-center gap-2.5 py-0.5">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />

      {/* Bouton play/pause circulaire */}
      <button
        onClick={togglePlay}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-md transition active:scale-95"
        style={{ backgroundColor: accent }}
        aria-label={playing ? 'Pause' : 'Lecture'}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-5 w-5">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Waveform + durée */}
      <div className="min-w-0 flex-1">
        <div
          onClick={seek}
          className="flex h-9 cursor-pointer items-center gap-[2px]"
        >
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
                  animation: playing
                    ? `voiceBarDance 0.8s ease-in-out ${i * 0.04}s infinite`
                    : undefined,
                }}
              />
            );
          })}
        </div>
        <div className="mt-0.5 flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-500">
            {formatDuration(playing || current > 0 ? current : duration)}
          </span>
          <span className="text-[11px] text-slate-400">{formatDuration(duration)}</span>
        </div>
      </div>
    </div>
  );
}
