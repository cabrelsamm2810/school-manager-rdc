import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/** GET — vérification d'authenticité d'un bulletin via QR code (public). */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token de vérification requis.' }, { status: 400 });
  }

  const bulletin = await prisma.bulletin.findFirst({
    where: { qrToken: token },
  });

  if (!bulletin) {
    return NextResponse.json({ error: 'Bulletin introuvable ou token invalide.' }, { status: 404 });
  }

  // Retourner les données publiques pour vérification
  return NextResponse.json({
    authentique: true,
    bulletin: {
      eleveNom: bulletin.eleveNom,
      eleveMatricule: bulletin.eleveMatricule,
      classe: bulletin.classe,
      ecoleNom: bulletin.ecoleNom,
      periode: bulletin.periode,
      anneeScolaire: bulletin.anneeScolaire,
      moyenneGenerale: bulletin.moyenneGenerale,
      pourcentageGeneral: bulletin.pourcentageGeneral,
      mentionGenerale: bulletin.mentionGenerale,
      generePar: bulletin.generePar,
      createdAt: bulletin.createdAt,
    },
  });
}
