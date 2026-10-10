import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { getScopeLevel } from '@/lib/territory-filter';
import { generateRapportAbsencesPdf } from '@/lib/rapport-absences-pdf';
import type { RapportAbsencesData, ClasseStat, AbsenceEleve, AbsenceJour } from '@/lib/rapport-absences-pdf';

const moisFr = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const joursFr = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/** GET /api/presences/rapport-pdf?mois=YYYY-MM
 * Génère un rapport PDF mensuel des absences par classe.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const moisParam = searchParams.get('mois');

  if (!moisParam || !/^\d{4}-\d{2}$/.test(moisParam)) {
    return NextResponse.json({ error: 'Format de mois invalide. Utilisez YYYY-MM.' }, { status: 400 });
  }

  const [annee, moisNum] = moisParam.split('-').map(Number);
  const dateDebut = new Date(annee, moisNum - 1, 1, 0, 0, 0, 0);
  const dateFin = new Date(annee, moisNum, 0, 23, 59, 59, 999);

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

  // Récupérer le nom de l'école
  let ecoleNom = 'École';
  if (etabId) {
    const etab = await prisma.ecole.findUnique({ where: { id: etabId }, select: { nom: true } });
    if (etab) ecoleNom = etab.nom;
  }

  // Récupérer tous les élèves du scope
  const eleves = await prisma.eleve.findMany({
    where: eleveWhere,
    select: { id: true, matricule: true, nom: true, postNom: true, prenom: true, classe: true },
  });

  // Grouper par classe
  const parClasse = new Map<string, typeof eleves>();
  for (const e of eleves) {
    const list = parClasse.get(e.classe) ?? [];
    list.push(e);
    parClasse.set(e.classe, list);
  }

  // Récupérer toutes les présences du mois
  const presences = await prisma.presence.findMany({
    where: {
      date: { gte: dateDebut, lte: dateFin },
      eleve: eleveWhere,
    },
    select: { eleveId: true, present: true, date: true, classe: true },
  });

  // Grouper les présences par élève
  const presencesParEleve = new Map<string, { presences: number; absences: number; joursAbsence: AbsenceJour[] }>();
  for (const p of presences) {
    const entry = presencesParEleve.get(p.eleveId) ?? { presences: 0, absences: 0, joursAbsence: [] };
    if (p.present) {
      entry.presences++;
    } else {
      entry.absences++;
      const d = new Date(p.date);
      entry.joursAbsence.push({
        date: d.toISOString().split('T')[0],
        jour: joursFr[d.getDay()],
      });
    }
    presencesParEleve.set(p.eleveId, entry);
  }

  // Construire les stats par classe
  const classes: ClasseStat[] = [];
  let totalEffectif = 0;
  let totalAbsences = 0;
  let totalPresences = 0;

  for (const [classe, elevesClasse] of parClasse) {
    const elevesStats: AbsenceEleve[] = elevesClasse.map((e) => {
      const stats = presencesParEleve.get(e.id);
      return {
        nom: `${e.nom} ${e.postNom} ${e.prenom}`.trim(),
        matricule: e.matricule,
        nbAbsences: stats?.absences ?? 0,
        nbPresences: stats?.presences ?? 0,
        joursAbsence: stats?.joursAbsence ?? [],
      };
    });

    const classAbsences = elevesStats.reduce((sum, e) => sum + e.nbAbsences, 0);
    const classPresences = elevesStats.reduce((sum, e) => sum + e.nbPresences, 0);
    const classTotal = classAbsences + classPresences;
    const tauxAbsence = classTotal > 0 ? Math.round((classAbsences / classTotal) * 100) : 0;

    classes.push({
      classe,
      effectif: elevesClasse.length,
      totalAbsences: classAbsences,
      totalPresences: classPresences,
      tauxAbsence,
      eleves: elevesStats,
    });

    totalEffectif += elevesClasse.length;
    totalAbsences += classAbsences;
    totalPresences += classPresences;
  }

  classes.sort((a, b) => a.classe.localeCompare(b.classe));

  const totalGeneral = {
    effectif: totalEffectif,
    absences: totalAbsences,
    presences: totalPresences,
    tauxAbsence: totalAbsences + totalPresences > 0
      ? Math.round((totalAbsences / (totalAbsences + totalPresences)) * 100)
      : 0,
  };

  const data: RapportAbsencesData = {
    ecoleNom,
    mois: `${moisFr[moisNum - 1]} ${annee}`,
    anneeScolaire: `${annee}-${annee + 1}`,
    generePar: (user as any).name || (user as any).email || 'Enseignant',
    createdAt: new Date().toISOString(),
    classes,
    totalGeneral,
  };

  const pdfBuffer = await generateRapportAbsencesPdf(data);

  const filename = `rapport_absences_${moisParam}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    },
  });
}
