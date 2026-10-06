import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { getScopeLevel } from '@/lib/territory-filter';

/** GET /api/presences/stats — statistiques de présence par jour.
 *  Query params:
 *   - classe (optionnel) : filtrer par classe
 *   - jours (optionnel, défaut 7) : nombre de jours à afficher
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const classe = searchParams.get('classe') || undefined;
  const jours = Math.min(Math.max(parseInt(searchParams.get('jours') || '7', 10) || 7, 1), 90);

  // Filtre hiérarchique
  const scope = getScopeLevel(user.role);
  const etabId = (user as any).ecoleId || '';
  const sousProvId = (user as any).coordSousProvincialeId || '';
  const prov = (user as any).provinceAdministrative || '';

  let eleveWhere: Record<string, unknown> = {};
  if (scope === 'school' && etabId) {
    eleveWhere = { ecoleId: etabId };
  } else if (scope === 'sousProvincial' && sousProvId) {
    eleveWhere = { ecole: { coordSousProvincialeId: sousProvId } };
  } else if (scope !== 'national' && prov) {
    eleveWhere = { ecole: { province: prov } };
  }

  const dateDebut = new Date();
  dateDebut.setHours(0, 0, 0, 0);
  dateDebut.setDate(dateDebut.getDate() - (jours - 1));

  const dateFin = new Date();
  dateFin.setHours(23, 59, 59, 999);

  const where: Record<string, unknown> = {
    date: { gte: dateDebut, lte: dateFin },
    eleve: eleveWhere,
  };
  if (classe) where.classe = classe;

  const presences = await prisma.presence.findMany({
    where,
    select: { date: true, present: true },
  });

  // Grouper par jour
  const parJour = new Map<string, { total: number; present: number }>();
  for (const p of presences) {
    const jour = new Date(p.date);
    jour.setHours(0, 0, 0, 0);
    const key = jour.toISOString().split('T')[0];
    const entry = parJour.get(key) ?? { total: 0, present: 0 };
    entry.total++;
    if (p.present) entry.present++;
    parJour.set(key, entry);
  }

  // Construire la liste complète de jours (même ceux sans enregistrements)
  const stats: Array<{
    date: string;
    jour: string;
    total: number;
    presents: number;
    absents: number;
    taux: number | null;
  }> = [];

  const joursFr = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  for (let i = 0; i < jours; i++) {
    const d = new Date(dateDebut);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    const entry = parJour.get(key);
    const total = entry?.total ?? 0;
    const present = entry?.present ?? 0;
    const taux = total > 0 ? Math.round((present / total) * 100) : null;

    stats.push({
      date: key,
      jour: joursFr[d.getDay()],
      total,
      presents: present,
      absents: total - present,
      taux,
    });
  }

  return NextResponse.json({ stats });
}
