import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { sendValidationCode } from '@/lib/mail';

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Email invalide.' }, { status: 400 });
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'Aucun compte trouvé avec cet email.' }, { status: 404 });
    }

    if (user.isActive) {
      return NextResponse.json({ error: 'Ce compte est déjà validé.' }, { status: 400 });
    }

    // Générer un nouveau code
    const validationCode = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.user.update({
      where: { id: user.id },
      data: { validationCode },
    });

    try {
      await sendValidationCode(email, validationCode, user.prenom);
    } catch {
      return NextResponse.json({ error: "Impossible d'envoyer l'email. Réessayez plus tard." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Un nouveau code a été envoyé.' });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue.' }, { status: 500 });
  }
}
