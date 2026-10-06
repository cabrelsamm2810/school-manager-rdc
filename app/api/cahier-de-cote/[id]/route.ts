import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { calculateGrades, isValidCote } from '@/lib/cahier-de-cote';

/** PUT — modification d'une cote individuelle (avec historique). */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

  const existing = await prisma.cahierDeCote.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Cote introuvable.' }, { status: 404 });
  }

  // Permission: enseignant = créateur seulement si Validé, sinon libre ; direction+ = tout
  const canEdit = auth.user.role === 'DIRECTION_ECOLE' ||
    auth.user.role === 'SUPER_ADMIN' ||
    existing.saisieParId === auth.user.id;

  if (!canEdit) {
    return NextResponse.json({ error: 'Vous n\'êtes pas autorisé à modifier cette cote.' }, { status: 403 });
  }

  if (existing.statut === 'Validé' && auth.user.role !== 'DIRECTION_ECOLE' && auth.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Cette cote est validée et ne peut plus être modifiée.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });

  const d1 = Number(body.devoir1 ?? existing.devoir1);
  const d2 = Number(body.devoir2 ?? existing.devoir2);
  const ex = Number(body.examen ?? existing.examen);

  if (!isValidCote(d1) || !isValidCote(d2) || !isValidCote(ex)) {
    return NextResponse.json({ error: 'Les cotes doivent être entre 0 et 20.' }, { status: 400 });
  }

  const { total, moyenne, pourcentage, mention } = calculateGrades(d1, d2, ex);
  const modifiePar = `${auth.user.prenom} ${auth.user.nom}`.trim();

  // Historique des changements
  const changedFields: { field: string; oldVal: string; newVal: string }[] = [];
  if (existing.devoir1 !== d1) changedFields.push({ field: 'devoir1', oldVal: String(existing.devoir1), newVal: String(d1) });
  if (existing.devoir2 !== d2) changedFields.push({ field: 'devoir2', oldVal: String(existing.devoir2), newVal: String(d2) });
  if (existing.examen !== ex) changedFields.push({ field: 'examen', oldVal: String(existing.examen), newVal: String(ex) });

  const updated = await prisma.cahierDeCote.update({
    where: { id: params.id },
    data: { devoir1: d1, devoir2: d2, examen: ex, total, moyenne, pourcentage, mention },
  });

  if (changedFields.length > 0) {
    await prisma.cahierDeCoteHistory.createMany({
      data: changedFields.map((cf) => ({
        cahierDeCoteId: params.id,
        action: 'modification',
        champModifie: cf.field,
        ancienneValeur: cf.oldVal,
        nouvelleValeur: cf.newVal,
        modifiePar,
        modifieParId: auth.user.id,
      })),
    });
  }

  return NextResponse.json({ cahierDeCote: updated });
}

/** PATCH — validation d'une cote (changement de statut). */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'DIRECTION_ECOLE');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body?.statut) return NextResponse.json({ error: 'Statut requis.' }, { status: 400 });

  const existing = await prisma.cahierDeCote.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Cote introuvable.' }, { status: 404 });

  const validePar = `${auth.user.prenom} ${auth.user.nom}`.trim();

  const updated = await prisma.cahierDeCote.update({
    where: { id: params.id },
    data: {
      statut: body.statut,
      validePar: body.statut === 'Validé' ? validePar : '',
      valideParId: body.statut === 'Validé' ? auth.user.id : '',
    },
  });

  await prisma.cahierDeCoteHistory.create({
    data: {
      cahierDeCoteId: params.id,
      action: 'validation',
      champModifie: 'statut',
      ancienneValeur: existing.statut,
      nouvelleValeur: body.statut,
      modifiePar: validePar,
      modifieParId: auth.user.id,
    },
  });

  return NextResponse.json({ cahierDeCote: updated });
}

/** DELETE — suppression d'une cote (enseignant créateur ou direction+). */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

  const existing = await prisma.cahierDeCote.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Cote introuvable.' }, { status: 404 });

  const canDelete = auth.user.role === 'DIRECTION_ECOLE' ||
    auth.user.role === 'SUPER_ADMIN' ||
    existing.saisieParId === auth.user.id;

  if (!canDelete) {
    return NextResponse.json({ error: 'Vous n\'êtes pas autorisé à supprimer cette cote.' }, { status: 403 });
  }

  if (existing.statut === 'Validé' && auth.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Cette cote est validée et ne peut être supprimée.' }, { status: 403 });
  }

  await prisma.cahierDeCote.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
