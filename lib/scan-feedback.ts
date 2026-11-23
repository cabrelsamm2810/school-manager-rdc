'use client';

/**
 * Retour sensoriel léger après une détection réussie : vibration courte
 * (Android) et bip discret (Web Audio). Aucun fichier audio à charger, et
 * l'échec est silencieux : un navigateur qui bloque l'audio ne doit jamais
 * empêcher l'affichage de la fiche élève.
 */
let audioContext: AudioContext | null = null;

export function signalScanSuccess(): void {
  try {
    navigator.vibrate?.(35);
  } catch {
    // Vibration non supportée
  }

  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;

    audioContext ??= new Ctor();
    const ctx = audioContext;
    if (ctx.state === 'suspended') void ctx.resume();

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.18);
  } catch {
    // Audio non disponible : le retour visuel suffit
  }
}
