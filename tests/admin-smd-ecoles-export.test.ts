import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';

/**
 * Vérifie que l'export Excel de la console Admin SMD
 * (`GET /api/admin-smd/ecoles/export`) transmet bien les filtres de province
 * et de niveau à Prisma : le fichier doit contenir exactement les écoles
 * affichées dans la liste.
 */

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ default: { ecole: { findMany: mocks.findMany } } }));
vi.mock('@/lib/session-user', () => ({ getSessionUser: mocks.getSessionUser }));

import { GET } from '@/app/api/admin-smd/ecoles/export/route';

const admin = { id: 'admin-export', role: 'ADMIN_SCHOOL_MANAGER_RDC' };

const ecoles = [
  {
    nom: 'École de Matadi', type: 'Primaire', institution: 'EC_ERC', dinacope: 'DIN-1',
    province: 'Kongo Central', provinceEducationnelle: 'Kongo Central 1', commune: 'Matete',
    ville: 'Matadi', adresse: '', telephone: '', email: '', chefEcole: 'M. Kasa',
    identifiantSM: 'SM-1', effectif: 120, statut: 'Actif', statutValidation: 'Validée',
    coordSousProvinciale: null, ecErc: null,
  },
];

function call(params = '') {
  return GET(new NextRequest(`http://localhost/api/admin-smd/ecoles/export${params}`));
}

/** Where réellement envoyé à Prisma pour ce chargement. */
function whereSent(): Record<string, unknown> {
  return mocks.findMany.mock.calls[0][0].where;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSessionUser.mockResolvedValue(admin);
  mocks.findMany.mockResolvedValue(ecoles);
});

describe('GET /api/admin-smd/ecoles/export — filtres', () => {
  it('applique le filtre de province', async () => {
    const res = await call('?province=Kongo%20Central');

    expect(res.status).toBe(200);
    expect(whereSent()).toMatchObject({ province: 'Kongo Central' });
    expect(whereSent()).not.toHaveProperty('type');
    expect(res.headers.get('Content-Disposition')).toContain('ecoles_kongo_central_');
  });

  it('applique le filtre de niveau via la colonne type', async () => {
    const res = await call('?niveau=Primaire');

    expect(res.status).toBe(200);
    expect(whereSent()).toMatchObject({ type: 'Primaire' });
    expect(whereSent()).not.toHaveProperty('province');
  });

  it('combine province, niveau, statut et recherche', async () => {
    await call('?province=Kinshasa&niveau=Secondaire&statut=Actif&search=matadi');

    const where = whereSent();
    expect(where).toMatchObject({ province: 'Kinshasa', type: 'Secondaire', statut: 'Actif' });
    expect(where.OR).toEqual(
      expect.arrayContaining([{ nom: { contains: 'matadi', mode: 'insensitive' } }]),
    );
  });

  it('n’ajoute aucun filtre quand aucun paramètre n’est fourni', async () => {
    await call();

    expect(whereSent()).toEqual({});
  });

  it('renvoie un classeur Excel contenant les écoles filtrées', async () => {
    const res = await call('?province=Kongo%20Central');
    const buf = new Uint8Array(await res.arrayBuffer());
    const wb = XLSX.read(buf, { type: 'array' });
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]]);

    expect(res.headers.get('Content-Type')).toContain('spreadsheetml');
    expect(rows).toHaveLength(1);
    expect(rows[0]['Nom de l\u2019école']).toBe('École de Matadi');
    expect(rows[0].Province).toBe('Kongo Central');
  });

  it('refuse un visiteur sans session', async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    expect((await call('?province=Kinshasa')).status).toBe(401);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it('refuse un rôle sans permission ADMIN_ECOLES', async () => {
    mocks.getSessionUser.mockResolvedValue({ id: 'u-1', role: 'DIRECTION_ECOLE' });

    expect((await call('?province=Kinshasa')).status).toBe(403);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
