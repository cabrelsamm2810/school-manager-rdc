import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { buildScopeWhere } from '@/lib/territory-filter';
import { generateBulletinsPdf, type BulletinPdfData } from '@/lib/bulletin-pdf';
import { getCurrentAnneeScolaire, generateQrToken, getMention } from '@/lib/cahier-de-cote';

/** GET — génère un PDF unique contenant les bulletins de tous les élèves d'une classe. */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const classe = searchParams.get('classe');
  const periode = searchParams.get('periode');
  const anneeScolaire = searchParams.get('anneeScolaire') || getCurrentAnneeScolaire();
  const etablissementId = searchParams.get('etablissementId') || undefined;

  if (!classe || !periode) {
    return NextResponse.json({ error: 'Classe et période requises.' }, { status: 400 });
  }

  const scopeWhere = buildScopeWhere(auth.user, {
    etablissementField: 'etablissementId',
    provinceField: 'etablissementNom',
  });

  const eleves = await prisma.eleve.findMany({
    where: {
      classe,
      ...(etablissementId ? { etablissementId } : {}),
    },
    orderBy: { nom: 'asc' },
  });

  if (eleves.length === 0) {
    return NextResponse.json({ error: 'Aucun élève dans cette classe.' }, { status: 404 });
  }

  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const generePar = `${auth.user.prenom} ${auth.user.nom}`.trim();

  const bulletinDataList: BulletinPdfData[] = [];
  let generated = 0;
  const skipped: string[] = [];

  for (const eleve of eleves) {
    const cotes = await prisma.cahierDeCote.findMany({
      where: {
        eleveId: eleve.id,
        periode,
        anneeScolaire,
        ...scopeWhere,
      },
    });

    if (cotes.length === 0) {
      skipped.push(`${eleve.prenom} ${eleve.nom}`);
      continue;
    }

    const donnees = cotes.map((c) => ({
      cours: c.cours,
      devoir1: c.devoir1,
      devoir2: c.devoir2,
      examen: c.examen,
      total: c.total,
      moyenne: c.moyenne,
      pourcentage: c.pourcentage,
      mention: c.mention,
    }));

    const moyenneGenerale = Math.round((cotes.reduce((sum, c) => sum + c.moyenne, 0) / cotes.length) * 100) / 100;
    const pourcentageGeneral = Math.round((moyenneGenerale / 20) * 100 * 100) / 100;
    const mentionGenerale = getMention(pourcentageGeneral);

    const etablissement = cotes[0]?.etablissementId
      ? await prisma.etablissement.findUnique({ where: { id: cotes[0].etablissementId } })
      : null;

    const qrToken = generateQrToken();
    const verifyUrl = `${baseUrl}/api/cahier-de-cote/bulletin/verify?token=${qrToken}`;

    const existingBulletin = await prisma.bulletin.findFirst({
      where: { eleveId: eleve.id, periode, anneeScolaire },
    });

    const bulletinData = {
      donnees: JSON.stringify(donnees),
      moyenneGenerale,
      pourcentageGeneral,
      mentionGenerale,
      qrToken,
      qrDataUrl: '',
      generePar,
      genereParId: auth.user.id,
    };

    let bulletin;
    if (existingBulletin) {
      bulletin = await prisma.bulletin.update({
        where: { id: existingBulletin.id },
        data: bulletinData,
      });
    } else {
      bulletin = await prisma.bulletin.create({
        data: {
          eleveId: eleve.id,
          eleveMatricule: eleve.matricule,
          eleveNom: `${eleve.prenom} ${eleve.nom} ${eleve.postNom}`.trim(),
          classe: eleve.classe,
          etablissementId: etablissement?.id || null,
          etablissementNom: etablissement?.nom || cotes[0]?.etablissementNom || '',
          periode,
          anneeScolaire,
          ...bulletinData,
        },
      });
    }

    bulletinDataList.push({
      eleveNom: bulletin.eleveNom,
      eleveMatricule: bulletin.eleveMatricule,
      classe: bulletin.classe,
      etablissementNom: bulletin.etablissementNom,
      periode: bulletin.periode,
      anneeScolaire: bulletin.anneeScolaire,
      moyenneGenerale: bulletin.moyenneGenerale,
      pourcentageGeneral: bulletin.pourcentageGeneral,
      mentionGenerale: bulletin.mentionGenerale,
      generePar: bulletin.generePar,
      createdAt: bulletin.createdAt.toISOString(),
      donnees,
      verifyUrl,
    });
    generated++;
  }

  if (generated === 0) {
    return NextResponse.json({
      error: `Aucune cote trouvée pour cette classe en ${periode}.`,
    }, { status: 404 });
  }

  const combined = await generateBulletinsPdf(bulletinDataList);

  const filename = `bulletins_${classe.replace(/\s+/g, '_')}_${periode.replace(/\s+/g, '_')}.pdf`;

  return new NextResponse(combined, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': combined.length.toString(),
    },
  });
}
