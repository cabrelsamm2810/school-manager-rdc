import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { buildScopeWhere } from '@/lib/territory-filter';
import { calculateGrades, getCurrentAnneeScolaire, generateQrToken, getMention } from '@/lib/cahier-de-cote';
import QRCode from 'qrcode';

/** POST — génère le bulletin numérique d'un élève avec QR code d'authenticité. */
export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

  const body = await request.json().catch(() => null);
  if (!body?.eleveId || !body?.periode) {
    return NextResponse.json({ error: 'Élève et période requis.' }, { status: 400 });
  }

  const anneeScolaire = body.anneeScolaire || getCurrentAnneeScolaire();
  const eleveId = body.eleveId;
  const periode = body.periode;

  // Récupérer l'élève
  const eleve = await prisma.eleve.findUnique({ where: { id: eleveId } });
  if (!eleve) {
    return NextResponse.json({ error: 'Élève introuvable.' }, { status: 404 });
  }

  // Récupérer toutes les cotes de l'élève pour cette période
  const scopeWhere = buildScopeWhere(auth.user, {
    etablissementField: 'etablissementId',
    provinceField: 'etablissementNom',
  });

  const cotes = await prisma.cahierDeCote.findMany({
    where: {
      eleveId,
      periode,
      anneeScolaire,
      ...scopeWhere,
    },
  });

  if (cotes.length === 0) {
    return NextResponse.json({ error: 'Aucune cote enregistrée pour cette période.' }, { status: 400 });
  }

  // Construire les données du bulletin
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

  // Calculer la moyenne générale (moyenne des moyennes par cours)
  const moyenneGenerale = cotes.length > 0
    ? Math.round((cotes.reduce((sum, c) => sum + c.moyenne, 0) / cotes.length) * 100) / 100
    : 0;
  const pourcentageGeneral = Math.round((moyenneGenerale / 20) * 100 * 100) / 100;
  const mentionGenerale = getMention(pourcentageGeneral);

  // Récupérer l'établissement
  const etablissement = cotes[0]?.etablissementId
    ? await prisma.etablissement.findUnique({ where: { id: cotes[0].etablissementId } })
    : null;

  // Générer le token QR unique
  const qrToken = generateQrToken();

  // Construire l'URL de vérification
  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const verifyUrl = `${baseUrl}/api/cahier-de-cote/bulletin/verify?token=${qrToken}`;

  // Générer le QR code en data URL
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 200,
    margin: 2,
    color: { dark: '#1e3a5f', light: '#ffffff' },
  });

  // Vérifier si un bulletin existe déjà pour cette période
  const existingBulletin = await prisma.bulletin.findFirst({
    where: { eleveId, periode, anneeScolaire },
  });

  const generePar = `${auth.user.prenom} ${auth.user.nom}`.trim();

  if (existingBulletin) {
    // Mettre à jour le bulletin existant
    const updated = await prisma.bulletin.update({
      where: { id: existingBulletin.id },
      data: {
        donnees: JSON.stringify(donnees),
        moyenneGenerale,
        pourcentageGeneral,
        mentionGenerale,
        qrToken,
        qrDataUrl,
        generePar,
        genereParId: auth.user.id,
      },
    });
    return NextResponse.json({ bulletin: updated }, { status: 201 });
  }

  // Créer le bulletin
  const bulletin = await prisma.bulletin.create({
    data: {
      eleveId,
      eleveMatricule: eleve.matricule,
      eleveNom: `${eleve.prenom} ${eleve.nom} ${eleve.postNom}`.trim(),
      classe: eleve.classe,
      etablissementId: etablissement?.id || null,
      etablissementNom: etablissement?.nom || cotes[0]?.etablissementNom || '',
      periode,
      anneeScolaire,
      donnees: JSON.stringify(donnees),
      moyenneGenerale,
      pourcentageGeneral,
      mentionGenerale,
      qrToken,
      qrDataUrl,
      generePar,
      genereParId: auth.user.id,
    },
  });

  return NextResponse.json({ bulletin }, { status: 201 });
}

/** GET — liste des bulletins générés (filtré par périmètre). */
export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'ENSEIGNANT');
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const eleveId = searchParams.get('eleveId') || undefined;
  const periode = searchParams.get('periode') || undefined;
  const anneeScolaire = searchParams.get('anneeScolaire') || undefined;

  const where: Record<string, unknown> = {};
  if (eleveId) where.eleveId = eleveId;
  if (periode) where.periode = periode;
  if (anneeScolaire) where.anneeScolaire = anneeScolaire;

  const scopeWhere = buildScopeWhere(auth.user, {
    etablissementField: 'etablissementId',
    provinceField: 'etablissementNom',
  });
  if (Object.keys(scopeWhere).length > 0) {
    where.AND = [scopeWhere];
  }

  const bulletins = await prisma.bulletin.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ bulletins });
}
