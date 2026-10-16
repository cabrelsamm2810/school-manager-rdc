import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const verifySchema = z.object({
  email: z.string().trim().toLowerCase().email('Email invalide.'),
  code: z.string().trim().regex(/^\d{6}$/, 'Le code doit contenir 6 chiffres.'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 });
    }

    const { email, code } = parsed.data;
    const user = await prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });

    if (!user) {
      return NextResponse.json({ error: 'Aucun compte trouvé avec cet email.' }, { status: 404 });
    }

    if (user.isActive) {
      return NextResponse.json({ error: 'Ce compte est déjà validé. Connectez-vous.' }, { status: 400 });
    }
    if (user.userStatus !== 'EN_ATTENTE') {
      return NextResponse.json({ error: "Ce compte ne peut pas être activé par email. Contactez l’administration." }, { status: 403 });
    }

    if (!user.validationCode || user.validationCode !== code) {
      return NextResponse.json({ error: 'Code de validation incorrect.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true, userStatus: 'ACTIF', validationCode: null },
    });

    return NextResponse.json({ ok: true, message: 'Compte validé avec succès.' });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue lors de la validation.' }, { status: 500 });
  }
}
