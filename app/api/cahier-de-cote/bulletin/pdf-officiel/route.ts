import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { buildScopeWhere } from '@/lib/territory-filter';
import { getCurrentAnneeScolaire } from '@/lib/cahier-de-cote';
import { generateOfficialBulletinPdf, OfficialBulletinBranch } from '@/lib/bulletin-officiel-pdf';

/** GET — télécharge le bulletin officiel RDC (format Ministère) pour un élève. */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const eleveId = searchParams.get('eleveId');
  const anneeScolaire = searchParams.get('anneeScolaire') || getCurrentAnneeScolaire();

  if (!eleveId) {
    return NextResponse.json({ error: 'eleveId requis.' }, { status: 400 });
  }

  // Récupérer l'élève
  const eleve = await prisma.eleve.findUnique({
    where: { id: eleveId },
    include: { ecole: true },
  });
  if (!eleve) {
    return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 });
  }

  // Récupérer les cotes des 3 trimestres
  const scopeWhere = buildScopeWhere(auth.user, {
    ecoleField: 'ecoleId',
    // CahierDeCote n'a pas de champ `institution`.
    provinceField: 'ecoleNom',
    institutionField: false,
  });

  const periodes = ['1er Trimestre', '2e Trimestre', '3e Trimestre'];

  const allCotes = await prisma.cahierDeCote.findMany({
    where: {
      eleveId,
      anneeScolaire,
      ...scopeWhere,
    },
  });

  // Grouper par cours
  const courseMap = new Map<string, { trim1: any; trim2: any; trim3: any }>();

  for (const cote of allCotes) {
    if (!courseMap.has(cote.cours)) {
      courseMap.set(cote.cours, { trim1: null, trim2: null, trim3: null });
    }
    const entry = courseMap.get(cote.cours)!;
    const trimData = {
      d1: cote.devoir1,
      d2: cote.devoir2,
      ex: cote.examen,
      total: cote.total,
    };
    if (cote.periode === periodes[0]) entry.trim1 = trimData;
    else if (cote.periode === periodes[1]) entry.trim2 = trimData;
    else if (cote.periode === periodes[2]) entry.trim3 = trimData;
  }

  // Construire les branches
  const branches: OfficialBulletinBranch[] = [];
  let totalObtenu = 0;

  for (const [cours, trims] of courseMap.entries()) {
    const totalGeneral =
      (trims.trim1?.total || 0) +
      (trims.trim2?.total || 0) +
      (trims.trim3?.total || 0);
    const pourcentage = totalGeneral > 0 ? (totalGeneral / (180)) * 100 : 0;
    totalObtenu += totalGeneral;
    branches.push({
      cours,
      trim1: trims.trim1,
      trim2: trims.trim2,
      trim3: trims.trim3,
      totalGeneral,
      pourcentage,
    });
  }

  const totalMax = branches.length * 180;
  const pourcentageGeneral = totalMax > 0 ? (totalObtenu / totalMax) * 100 : 0;

  // École
  const etab = eleve.ecole;

  // URL de vérification
  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const verifyUrl = `${baseUrl}/verifier-bulletin?eleve=${encodeURIComponent(eleveId)}`;

  const dateNaissance = eleve.dateNaissance
    ? eleve.dateNaissance.toLocaleDateString('fr-FR')
    : '';

  const pdfBuffer = await generateOfficialBulletinPdf({
    province: etab?.province || '',
    provinceEducationnelle: etab?.provinceEducationnelle || '',
    ville: etab?.ville || '',
    commune: etab?.commune || '',
    ecole: etab?.nom || '',
    code: etab?.dinacope || '',
    eleveNom: `${eleve.prenom} ${eleve.nom} ${eleve.postNom}`.trim(),
    eleveMatricule: eleve.matricule,
    sexe: eleve.sexe || '',
    lieuNaissance: eleve.lieuNaissance || '',
    dateNaissance,
    classe: eleve.classe,
    anneeScolaire,
    branches,
    totalMax,
    totalObtenu,
    pourcentageGeneral,
    place: '',
    nbreEleves: '',
    application: '',
    conduite: '',
    enseignantNom: allCotes[0]?.enseignantNom || '',
    chefEcole: etab?.chefEcole || '',
    verifyUrl,
  });

  const filename = `bulletin_officiel_${eleve.nom.replace(/\s+/g, '_')}_${anneeScolaire.replace('/', '-')}.pdf`;

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdfBuffer.length.toString(),
    },
  });
}
