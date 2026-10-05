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
      e.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && callIdRef.current) {
        fetch(`/api/chat/calls/${callIdRef.current}/ice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidate: JSON.stringify(e.candidate) }),
        }).catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
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
      endCall();
      return;
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
        if (!pc || cancelled) return;

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
      if (!pc) return;

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

  const isActive = phase === 'connected';
  const showRemoteVideo = callType === 'video' && (phase === 'connecting' || phase === 'connected');

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gray-900">
      {/* Zone vidéo distante (plein écran pour vidéo) */}
      {showRemoteVideo && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Voile sombre pour audio-only */}
      {!showRemoteVideo && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-gray-950" />
      )}

      {/* Vidéo locale (picture-in-picture) */}
      {callType === 'video' && cameraOn && (phase === 'connecting' || phase === 'connected') && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute right-3 top-16 z-10 h-32 w-24 rounded-xl border-2 border-white/20 object-cover shadow-lg md:h-40 md:w-28"
        />
      )}

      {/* En-tête : infos contact */}
      <div className="relative z-10 flex flex-col items-center pt-16 pb-4">
        {otherUserPhoto ? (
          <img
            src={otherUserPhoto}
            alt=""
            className="h-24 w-24 rounded-full object-cover ring-4 ring-white/10"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#075E54] text-3xl font-bold text-white ring-4 ring-white/10">
            {getInitials(otherUserName)}
          </div>
        )}
        <h2 className="mt-4 text-xl font-semibold text-white">{otherUserName}</h2>
        <p className="mt-1 text-sm text-white/60">
          {phase === 'outgoing' && 'Appel en cours…'}
          {phase === 'incoming' && 'Appel entrant'}
          {phase === 'connecting' && 'Connexion…'}
          {phase === 'connected' && formatDuration(duration)}
          {phase === 'ended' && 'Appel terminé'}
        </p>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        {phase === 'incoming' && (
          <p className="mt-1 text-xs text-white/40">
            {callType === 'video' ? '📹 Appel vidéo' : '🎤 Appel audio'}
          </p>
        )}
      </div>

      {/* Contrôles */}
      <div className="relative z-10 mt-auto flex items-center justify-center gap-6 pb-12">
        {phase === 'incoming' ? (
          <>
            <button
              onClick={rejectCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
              aria-label="Rejeter"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                <line x1="2" y1="2" x2="22" y2="22" />
              </svg>
            </button>
            <button
              onClick={acceptCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:bg-[#1faa52]"
              aria-label="Accepter"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>
          </>
        ) : (
          <>
            {/* Muet */}
            <button
              onClick={toggleMute}
              disabled={!isActive}
              className={clsx(
                'flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition disabled:opacity-40',
                muted ? 'bg-white text-red-500' : 'bg-white/10 text-white hover:bg-white/20'
              )}
              aria-label="Micro"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
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

            {/* Raccrocher */}
            <button
              onClick={endCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600"
              aria-label="Raccrocher"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7 rotate-[135deg]">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </button>

            {/* Caméra (vidéo only) */}
            {callType === 'video' && (
              <button
                onClick={toggleCamera}
                disabled={!isActive}
                className={clsx(
                  'flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition disabled:opacity-40',
                  !cameraOn ? 'bg-white text-red-500' : 'bg-white/10 text-white hover:bg-white/20'
                )}
                aria-label="Caméra"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
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
          </>
        )}
      </div>
    </div>
  );
}
