import { describe, it, expect } from 'vitest';
import {
  createEleveQrValue,
  isSignedEleveQr,
  parseEleveQrValue,
} from '@/lib/eleve-qr';

describe('QR code élève signé', () => {
  it('accepte un code généré par le serveur et restitue l’identifiant', () => {
    const value = createEleveQrValue('eleve_123');
    expect(isSignedEleveQr(value)).toBe(true);
    expect(parseEleveQrValue(value)).toEqual({ ok: true, eleveId: 'eleve_123' });
  });

  it('ne contient aucune donnée personnelle', () => {
    const value = createEleveQrValue('eleve_123');
    expect(value.startsWith('SMRDC-ELEVE:eleve_123:')).toBe(true);
    expect(value.split(':')).toHaveLength(4);
  });

  it('rejette un identifiant modifié (signature invalide)', () => {
    const value = createEleveQrValue('eleve_123');
    const forged = value.replace('eleve_123', 'eleve_999');
    expect(parseEleveQrValue(forged)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejette une signature modifiée', () => {
    const value = createEleveQrValue('eleve_123');
    expect(parseEleveQrValue(`${value}0`.replace(/:([0-9a-f]{32})0$/, ':$10000'))).toEqual({
      ok: false,
      reason: 'invalid',
    });
  });

  it('rejette un code expiré', () => {
    const expired = createEleveQrValue('eleve_123', { ttlDays: -1 });
    expect(parseEleveQrValue(expired)).toEqual({ ok: false, reason: 'expired' });
  });

  it('rejette un format inconnu', () => {
    expect(parseEleveQrValue('SMRDC-ELEVE:abc')).toEqual({ ok: false, reason: 'invalid' });
    expect(parseEleveQrValue('SMRDC-ELEVE:a:b:c')).toEqual({ ok: false, reason: 'invalid' });
  });

  it('ne considère pas un matricule en clair comme un code signé', () => {
    expect(isSignedEleveQr('ELV-2026-001')).toBe(false);
  });
});
