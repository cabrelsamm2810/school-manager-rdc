import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  // Compter les élèves par classe
  const eleves = await prisma.eleve.findMany({
    select: { id: true, classe: true },
  });

  const parClasseMap = new Map<string, number>();
  for (const e of eleves) {
    parClasseMap.set(e.classe, (parClasseMap.get(e.classe) ?? 0) + 1);
  }

  const classes = Array.from(parClasseMap.entries())
    .map(([classe, effectif]) => ({ classe, effectif }))
    .sort((a, b) => a.classe.localeCompare(b.classe));

  // Calculer le taux de présence par classe (30 derniers jours)
  const trenteJours = new Date();
  trenteJours.setDate(trenteJours.getDate() - 30);

  const presences = await prisma.presence.findMany({
    where: { date: { gte: trenteJours } },
    select: { classe: true, present: true },
  });

  const presenceParClasse = new Map<string, { total: number; present: number }>();
  for (const p of presences) {
    const entry = presenceParClasse.get(p.classe) ?? { total: 0, present: 0 };
    entry.total++;
    if (p.present) entry.present++;
    presenceParClasse.set(p.classe, entry);
  }

  const tauxPresence = classes.map((c) => {
    const stats = presenceParClasse.get(c.classe);
    const taux = stats && stats.total > 0
      ? Math.round((stats.present / stats.total) * 100)
      : null;
    return { classe: c.classe, taux, totalRecords: stats?.total ?? 0 };
  });

  const tauxGlobal = presences.length > 0
    ? Math.round((presences.filter((p) => p.present).length / presences.length) * 100)
    : null;

  return NextResponse.json({
    totalEleves: eleves.length,
    totalClasses: classes.length,
    tauxGlobal,
    classes,
    tauxPresence,
  });
}
