import { describe, expect, it } from 'vitest';
import {
  buildEcoleQrValue,
  generateCodeEcole,
  isCodeEcole,
  parseEcoleQrValue,
} from '@/lib/ecole-profil';
import { canAccessEcole, canEditEcoleProfil } from '@/lib/ecole-profil-access';

const ECOLE = { id: 'ecole-1', institution: 'EC_ERC', province: 'Kinshasa', coordSousProvincialeId: 'csp-1' };

describe('Profil École — code école', () => {
  it('génère un code conforme au format ECO-XXX-AA-NNNNNN', () => {
    const code = generateCodeEcole('EC_ERC');
    expect(code).toMatch(/^ECO-ERC-\d{2}-\d{6}$/);
    expect(isCodeEcole(code)).toBe(true);
  });

  it('utilise un préfixe lisible pour chaque institution', () => {
    expect(generateCodeEcole('PUBLIQUE')).toMatch(/^ECO-PUB-/);
    expect(generateCodeEcole('CATHOLIQUE')).toMatch(/^ECO-CAT-/);
  });
});

describe('Profil École — QR Code', () => {
  const token = 'a'.repeat(24);

  it('encode puis relit le QR signé', () => {
    const payload = buildEcoleQrValue('ECO-ERC-26-123456', token);
    expect(payload).toBe(`SMRDC:ECOLE:1:ECO-ERC-26-123456:${token}`);
    expect(parseEcoleQrValue(payload)).toEqual({
      ok: true,
      codeEcole: 'ECO-ERC-26-123456',
      qrToken: token,
    });
  });

  it('rejette un QR d’un autre type ou d’une autre version', () => {
    expect(parseEcoleQrValue(`SMRDC:ELEVE:1:ECO-ERC-26-123456:${token}`).ok).toBe(false);
    expect(parseEcoleQrValue(`SMRDC:ECOLE:2:ECO-ERC-26-123456:${token}`)).toEqual({ ok: false, reason: 'version' });
  });

  it('rejette un jeton mal formé ou une valeur vide', () => {
    expect(parseEcoleQrValue('SMRDC:ECOLE:1:ECO-ERC-26-123456:court').ok).toBe(false);
    expect(parseEcoleQrValue('').ok).toBe(false);
    expect(parseEcoleQrValue(null).ok).toBe(false);
  });
});

describe('Profil École — accès', () => {
  it('autorise le chef sur sa propre école et refuse celle d’une autre', () => {
    const chef = { id: 'u1', role: 'DIRECTION_ECOLE', ecoleId: 'ecole-1' };
    expect(canAccessEcole(chef, ECOLE)).toBe(true);
    expect(canEditEcoleProfil(chef, ECOLE)).toBe(true);
    expect(canAccessEcole({ ...chef, ecoleId: 'ecole-2' }, ECOLE)).toBe(false);
    expect(canEditEcoleProfil({ ...chef, ecoleId: 'ecole-2' }, ECOLE)).toBe(false);
  });

  it('refuse une école d’une autre institution', () => {
    const agent = { id: 'u2', role: 'AGENT_PROVINCIAL', provinceAdministrative: 'Kinshasa', typeInstitution: 'PUBLIQUE' };
    expect(canAccessEcole(agent, ECOLE)).toBe(false);
  });

  it('limite la coordination provinciale à sa province', () => {
    const coord = { id: 'u3', role: 'COORDINATION_PROVINCIALE', provinceAdministrative: 'Kongo Central' };
    expect(canAccessEcole(coord, ECOLE)).toBe(false);
    expect(canAccessEcole({ ...coord, provinceAdministrative: 'Kinshasa' }, ECOLE)).toBe(true);
  });

  it('laisse la secrétaire consulter mais pas modifier', () => {
    const secretaire = { id: 'u4', role: 'SECRETAIRE', ecoleId: 'ecole-1' };
    expect(canAccessEcole(secretaire, ECOLE)).toBe(true);
    expect(canEditEcoleProfil(secretaire, ECOLE)).toBe(false);
  });
});
