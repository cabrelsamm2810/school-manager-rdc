import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { canFinance, FINANCE_PERM } from '@/lib/finance-permissions';
import { ensureFinanceDefaults } from '@/lib/frais-scolaires';

/**
 * Routes CRUD des réglages financiers d'un établissement :
 * catégories de frais et modes de paiement.
 *
 * Chaque établissement ne voit et ne modifie que ses propres réglages
 * (`ecoleId` de la session). Les comptes sans établissement (Super Admin)
 * manipulables les réglages globaux (`ecoleId = null`).
 */

export type FraisConfigTable = 'fraisCategorie' | 'modePaiementFrais';

const SPECS: Record<
  FraisConfigTable,
  { plural: string; numericFields: string[] }
> = {
  fraisCategorie: { plural: 'fraisCategories', numericFields: ['montant', 'ordre'] },
  modePaiementFrais: { plural: 'modesPaiementFrais', numericFields: ['ordre'] },
};

type Ctx = { params: { id: string } };

async function authorize(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return { ok: false as const, response: NextResponse.json({ error: 'Non authentifié.' }, { status: 401 }) };
  if (!canFinance(user, FINANCE_PERM.CONFIG)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Permission financière insuffisante.' }, { status: 403 }),
    };
  }
  return { ok: true as const, user };
}

function sanitize(table: FraisConfigTable, body: Record<string, any>) {
  const spec = SPECS[table];
  const data: Record<string, any> = {};
  if (typeof body?.nom === 'string') data.nom = body.nom.trim();
  if (typeof body?.actif === 'boolean') data.actif = body.actif;
  for (const field of spec.numericFields) {
    if (body?.[field] !== undefined && body?.[field] !== '') {
      const value = Number(body[field]);
      if (Number.isFinite(value)) data[field] = Math.max(0, Math.round(value));
    }
  }
  return data;
}

export function createFraisConfigHandlers(table: FraisConfigTable) {
  const spec = SPECS[table];
  const delegate = () => (prisma as any)[table];

  async function GET(request: NextRequest) {
    const auth = await authorize(request);
    if (!auth.ok) return auth.response;

    await ensureFinanceDefaults(auth.user.ecoleId);
    const search = new URL(request.url).searchParams.get('search');

    const items = await delegate().findMany({
      where: {
        ecoleId: auth.user.ecoleId ?? null,
        ...(search ? { nom: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: [{ ordre: 'asc' }, { nom: 'asc' }],
    });

    return NextResponse.json({ [spec.plural]: items });
  }

  async function POST(request: NextRequest) {
    const auth = await authorize(request);
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => null);
    const data = sanitize(table, body ?? {});
    if (!data.nom) {
      return NextResponse.json({ error: 'Le libellé est obligatoire.' }, { status: 400 });
    }

    const item = await delegate().create({
      data: { ...data, ecoleId: auth.user.ecoleId ?? null },
    });
    return NextResponse.json({ [table]: item }, { status: 201 });
  }

  async function PUT(request: NextRequest, ctx: Ctx) {
    const auth = await authorize(request);
    if (!auth.ok) return auth.response;

    const existing = await delegate().findFirst({
      where: { id: ctx.params.id, ecoleId: auth.user.ecoleId ?? null },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Réglage introuvable.' }, { status: 404 });
    }

    const body = await request.json().catch(() => null);
    const data = sanitize(table, body ?? {});
    if (data.nom === '') {
      return NextResponse.json({ error: 'Le libellé est obligatoire.' }, { status: 400 });
    }

    const item = await delegate().update({ where: { id: ctx.params.id }, data });
    return NextResponse.json({ [table]: item });
  }

  async function DELETE(request: NextRequest, ctx: Ctx) {
    const auth = await authorize(request);
    if (!auth.ok) return auth.response;

    const existing = await delegate().findFirst({
      where: { id: ctx.params.id, ecoleId: auth.user.ecoleId ?? null },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Réglage introuvable.' }, { status: 404 });
    }
    if (table === 'fraisCategorie' && existing.systeme) {
      return NextResponse.json(
        { error: 'Ce frais par défaut ne peut pas être supprimé — désactivez-le.' },
        { status: 409 },
      );
    }

    // Les paiements déjà enregistrés gardent le libellé figé (`categorieNom`).
    await delegate().delete({ where: { id: ctx.params.id } });
    return NextResponse.json({ ok: true });
  }

  return { GET, POST, PUT, DELETE };
}
