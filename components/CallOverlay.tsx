'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { clsx } from 'clsx';

type CallMode = 'audio' | 'video';
type CallPhase = 'outgoing' | 'incoming' | 'connecting' | 'connected' | 'ended';

type Props = {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto?: string | null;
  callType: CallMode;
  isCaller: boolean;
  incomingCallId?: string;
  incomingOffer?: string;
  onEnd: () => void;
};

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

function getInitials(name: string) {
  const parts = name.trim().split(' ');
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function CallOverlay({
  conversationId,
  otherUserId,
  otherUserName,
  otherUserPhoto,
  callType,
  isCaller,
  incomingCallId,
  incomingOffer,
  onEnd,
}: Props) {
  const [phase, setPhase] = useState<CallPhase>(isCaller ? 'outgoing' : 'incoming');
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(callType === 'video');
  const [speakerOn, setSpeakerOn] = useState(true);
  const [error, setError] = useState('');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callIdRef = useRef<string | undefined>(incomingCallId);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const icePollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const consumedIceRef = useRef<Set<number>>(new Set());
  const endedRef = useRef(false);

  // ── Nettoyage ──
  const cleanup = useCallback(() => {
    if (icePollRef.current) clearInterval(icePollRef.current);
    if (answerPollRef.current) clearInterval(answerPollRef.current);
    if (statusPollRef.current) clearInterval(statusPollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current?.getTracks().forEach((t) => t.stop());
    remoteStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
  }, []);

  // ── Enregistre un ICE candidate distant ──
  const addRemoteIce = useCallback(async (iceJson: string) => {
    const pc = pcRef.current;
    if (!pc || endedRef.current) return;
    const candidates = JSON.parse(iceJson || '[]') as string[];
    for (let i = 0; i < candidates.length; i++) {
      if (consumedIceRef.current.has(i)) continue;
      consumedIceRef.current.add(i);
      try {
        await pc.addIceCandidate(JSON.parse(candidates[i]));
      } catch {
        // ignore
      }
    }
  }, []);

  // ── Démarre le polling des ICE candidates distants ──
  const startIcePolling = useCallback(() => {
    if (icePollRef.current) clearInterval(icePollRef.current);
    icePollRef.current = setInterval(async () => {
      if (endedRef.current || !callIdRef.current) return;
      try {
        const res = await fetch(`/api/chat/calls/${callIdRef.current}`);
        const data = await res.json();
        if (data.ice) await addRemoteIce(data.ice);
        // Vérifie si l'appel a été terminé par l'autre côté
        if (data.status === 'ended' || data.status === 'rejected' || data.status === 'missed') {
          endCall();
        }
      } catch {
        // ignore
      }
    }, 1000);
  }, [addRemoteIce]);

  // ── Configure la connexion peer ──
  const setupPeerConnection = useCallback(async () => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    // Flux distant
    const remoteStream = new MediaStream();
    remoteStreamRef.current = remoteStream;
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }

    pc.ontrack = (e) => {
      if (pc !== pcRef.current) return;
      e.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && callIdRef.current && pc === pcRef.current) {
        fetch(`/api/chat/calls/${callIdRef.current}/ice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidate: JSON.stringify(e.candidate) }),
        }).catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc !== pcRef.current) return;
      if (pc.connectionState === 'connected') {
        setPhase('connected');
        startCallTimer();
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    // Obtient le flux local
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    } catch {
      setError('Micro/caméra inaccessible. Vérifiez les permissions.');
      return null;
    }

    return pc;
  }, [callType]);

  // ── Timer de durée d'appel ──
  const startCallTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
  }, []);

  // ── Terminer l'appel ──
  const endCall = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (callIdRef.current) {
      fetch(`/api/chat/calls/${callIdRef.current}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended' }),
      }).catch(() => {});
    }
    cleanup();
    setPhase('ended');
    setTimeout(() => onEnd(), 500);
  }, [cleanup, onEnd]);

  // ── Rejeter l'appel entrant ──
  const rejectCall = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (callIdRef.current) {
      fetch(`/api/chat/calls/${callIdRef.current}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      }).catch(() => {});
    }
    cleanup();
    onEnd();
  }, [cleanup, onEnd]);

  // ── Flux appelant ──
  useEffect(() => {
    if (!isCaller) return;

    let cancelled = false;

    (async () => {
      try {
        const pc = await setupPeerConnection();
        if (!pc) {
          if (!cancelled) endCall();
          return;
        }
        if (cancelled) return;

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Envoie l'offer
        const res = await fetch('/api/chat/calls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            type: callType,
            offer: JSON.stringify(offer),
          }),
        });
        const data = await res.json();
        if (data.error) {
          setError(data.error);
          endCall();
          return;
        }
        callIdRef.current = data.id;

        // Poll pour la réponse
        answerPollRef.current = setInterval(async () => {
          if (endedRef.current || !callIdRef.current) return;
          try {
            const r = await fetch(`/api/chat/calls/${callIdRef.current}`);
            const d = await r.json();
            if (d.status === 'rejected' || d.status === 'missed' || d.status === 'ended') {
              endCall();
              return;
            }
            if (d.answer) {
              if (answerPollRef.current) clearInterval(answerPollRef.current);
              answerPollRef.current = null;
              await pc.setRemoteDescription(JSON.parse(d.answer));
              setPhase('connecting');
              startIcePolling();
            }
          } catch {
            // ignore
          }
        }, 1000);
      } catch {
        if (!cancelled) {
          setError('Erreur lors de l\'appel.');
          endCall();
        }
      }
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Flux appelé ──
  const acceptCall = useCallback(async () => {
    if (!incomingOffer || !incomingCallId) return;
    callIdRef.current = incomingCallId;
    setPhase('connecting');

    try {
      const pc = await setupPeerConnection();
      if (!pc) {
        endCall();
        return;
      }

      await pc.setRemoteDescription(JSON.parse(incomingOffer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await fetch(`/api/chat/calls/${incomingCallId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: JSON.stringify(answer) }),
      });

      startIcePolling();
    } catch {
      setError('Erreur lors de la réponse.');
      endCall();
    }
  }, [incomingOffer, incomingCallId, setupPeerConnection, startIcePolling, endCall]);

  // ── Nettoyage au démontage ──
  useEffect(() => {
    return () => {
      endedRef.current = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Bascule muet ──
  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMuted(!audioTrack.enabled);
    }
  }, [muted]);

  // ── Bascule caméra ──
  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOn(videoTrack.enabled);
    }
  }, []);

  // ── Bascule haut-parleur ──
  const toggleSpeaker = useCallback(() => {
    const stream = remoteStreamRef.current;
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setSpeakerOn(audioTrack.enabled);
    }
  }, []);

  const isActive = phase === 'connected';
  const isRinging = phase === 'outgoing' || phase === 'incoming';
  const showRemoteVideo = callType === 'video' && (phase === 'connecting' || phase === 'connected');

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{
        background: showRemoteVideo
          ? '#000'
          : 'linear-gradient(160deg, #0a1729 0%, #0c1e3d 30%, #0f2855 60%, #0a1729 100%)',
        animation: 'callFadeIn 0.3s ease-out',
      }}
    >
      {/* Zone vidéo distante (plein écran pour vidéo) */}
      {showRemoteVideo && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Voile décoratif pour audio-only */}
      {!showRemoteVideo && (
        <>
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(circle at 50% 25%, rgba(59,130,246,0.25) 0%, transparent 60%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background:
                'radial-gradient(circle at 80% 80%, rgba(14,165,233,0.2) 0%, transparent 50%)',
            }}
          />
        </>
      )}

      {/* Vidéo locale (picture-in-picture) */}
      {callType === 'video' && cameraOn && (phase === 'connecting' || phase === 'connected') && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute right-3 top-20 z-10 h-28 w-20 rounded-2xl border-2 border-white/25 object-cover shadow-2xl sm:h-32 sm:w-24 md:h-40 md:w-28"
          style={{ animation: 'callSlideUp 0.3s ease-out' }}
        />
      )}

      {/* En-tête : infos contact */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-14 pb-4 sm:pt-20">
        {/* Avatar avec anneaux pulsants pendant la sonnerie */}
        <div className="relative flex items-center justify-center">
          {isRinging && (
            <>
              <span
                className="absolute h-24 w-24 rounded-full bg-blue-400/30 sm:h-28 sm:w-28"
                style={{ animation: 'callRingPulse 1.8s ease-out infinite' }}
              />
              <span
                className="absolute h-24 w-24 rounded-full bg-blue-400/20 sm:h-28 sm:w-28"
                style={{ animation: 'callRingPulse 1.8s ease-out 0.6s infinite' }}
              />
            </>
          )}
          {otherUserPhoto ? (
            <img
              src={otherUserPhoto}
              alt=""
              className="relative h-24 w-24 rounded-full object-cover ring-4 ring-white/15 sm:h-28 sm:w-28"
              style={{
                animation: isRinging ? 'callAvatarGlow 2s ease-in-out infinite' : undefined,
              }}
            />
          ) : (
            <div
              className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white ring-4 ring-white/15 sm:h-28 sm:w-28 sm:text-3xl"
              style={{
                animation: isRinging ? 'callAvatarGlow 2s ease-in-out infinite' : undefined,
              }}
            >
              {getInitials(otherUserName)}
            </div>
          )}
        </div>

        <h2 className="mt-5 text-xl font-bold tracking-tight text-white sm:text-2xl">
          {otherUserName}
        </h2>

        {/* Statut animé */}
        <div className="mt-2 flex items-center gap-2">
          {phase === 'outgoing' && (
            <>
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-blue-400"
                    style={{ animation: `callDotBounce 1s ease-in-out ${i * 0.15}s infinite` }}
                  />
                ))}
              </span>
              <p className="text-sm font-medium text-blue-300">
                {callType === 'video' ? 'Appel vidéo…' : 'Appel audio…'}
              </p>
            </>
          )}
          {phase === 'incoming' && (
            <p className="text-sm font-medium text-green-400" style={{ animation: 'callBtnPulse 1.5s ease-in-out infinite' }}>
              {callType === 'video' ? '📹 Appel vidéo entrant' : '📞 Appel audio entrant'}
            </p>
          )}
          {phase === 'connecting' && (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 animate-spin text-blue-300">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <p className="text-sm font-medium text-blue-300">Connexion…</p>
            </>
          )}
          {phase === 'connected' && (
            <>
              <span className="flex h-2 w-2 rounded-full bg-green-400" style={{ animation: 'callBtnPulse 2s ease-in-out infinite' }} />
              <p className="text-sm font-semibold tabular-nums text-green-300">{formatDuration(duration)}</p>
            </>
          )}
          {phase === 'ended' && (
            <p className="text-sm font-medium text-white/50">Appel terminé</p>
          )}
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-500/15 px-4 py-2 text-sm text-red-300">{error}</p>}
      </div>

      {/* Contrôles */}
      <div className="relative z-10 mt-auto px-4 pb-10 sm:pb-14" style={{ animation: 'callSlideUp 0.4s ease-out 0.1s both' }}>
        {phase === 'incoming' ? (
          <div className="flex items-center justify-center gap-12 sm:gap-16">
            <button
              onClick={rejectCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-2xl transition hover:bg-red-600 active:scale-90 sm:h-20 sm:w-20"
              style={{ animation: 'callBtnPulse 1.5s ease-in-out infinite' }}
              aria-label="Rejeter"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 sm:h-8 sm:w-8">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            </button>
            <button
              onClick={acceptCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-2xl transition hover:bg-green-600 active:scale-90 sm:h-20 sm:w-20"
              style={{ animation: 'callBtnPulse 1.5s ease-in-out 0.3s infinite' }}
              aria-label="Accepter"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 sm:h-8 sm:w-8">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            {/* Microphone */}
            <button
              onClick={toggleMute}
              disabled={!isActive}
              className={clsx(
                'flex h-13 w-13 items-center justify-center rounded-full shadow-xl transition active:scale-90 sm:h-16 sm:w-16 disabled:opacity-30',
                muted
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-white/10 text-white backdrop-blur-md hover:bg-white/20 ring-1 ring-white/15'
              )}
              style={{ height: '3.25rem', width: '3.25rem' }}
              aria-label="Microphone"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 sm:h-6 sm:w-6">
                {muted ? (
                  <>
                    <line x1="1" y1="1" x2="23" y2="23" />
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </>
                ) : (
                  <>
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                  </>
                )}
              </svg>
            </button>

            {/* Haut-parleur */}
            <button
              onClick={toggleSpeaker}
              disabled={!isActive}
              className={clsx(
                'flex items-center justify-center rounded-full shadow-xl transition active:scale-90 disabled:opacity-30',
                !speakerOn
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-white/10 text-white backdrop-blur-md hover:bg-white/20 ring-1 ring-white/15'
              )}
              style={{ height: '3.25rem', width: '3.25rem' }}
              aria-label="Haut-parleur"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 sm:h-6 sm:w-6">
                {!speakerOn ? (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </>
                )}
              </svg>
            </button>

            {/* Raccrocher */}
            <button
              onClick={endCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-2xl transition hover:bg-red-600 active:scale-90 sm:h-20 sm:w-20"
              aria-label="Raccrocher"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 sm:h-8 sm:w-8 rotate-[135deg]">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>

            {/* Caméra (vidéo only) */}
            {callType === 'video' && (
              <button
                onClick={toggleCamera}
                disabled={!isActive}
                className={clsx(
                  'flex items-center justify-center rounded-full shadow-xl transition active:scale-90 disabled:opacity-30',
                  !cameraOn
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white/10 text-white backdrop-blur-md hover:bg-white/20 ring-1 ring-white/15'
                )}
                style={{ height: '3.25rem', width: '3.25rem' }}
                aria-label="Caméra"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 sm:h-6 sm:w-6">
                  {cameraOn ? (
                    <>
                      <polygon points="23 7 16 12 23 17 23 7" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </>
                  ) : (
                    <>
                      <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  )}
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
