import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'Le code doit contenir 6 chiffres.'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides.' }, { status: 400 });
    }

    const { email, code } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'Aucun compte trouvé avec cet email.' }, { status: 404 });
    }

    if (user.isActive) {
      return NextResponse.json({ error: 'Ce compte est déjà validé.' }, { status: 400 });
    }

    if (!user.validationCode || user.validationCode !== code) {
      return NextResponse.json({ error: 'Code de validation incorrect.' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true, validationCode: null },
    });

    return NextResponse.json({ ok: true, message: 'Compte validé avec succès.' });
  } catch (error) {
    return NextResponse.json({ error: 'Une erreur est survenue lors de la validation.' }, { status: 500 });
  }
}
