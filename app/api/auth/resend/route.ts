import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { sendValidationCode } from '@/lib/mail';

const resendSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Email invalide.' }, { status: 400 });
    }

    const { email } = parsed.data;
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

    // Réutiliser le code en attente : un email retardé ou un échec d'envoi
    // ne doit pas invalider le code que l'utilisateur a déjà reçu.
    let validationCode = user.validationCode;
    if (!validationCode || !/^\d{6}$/.test(validationCode)) {
      validationCode = randomInt(100000, 1000000).toString();
      await prisma.user.update({ where: { id: user.id }, data: { validationCode } });
    }

    try {
      await sendValidationCode(user.email, validationCode, user.prenom);
    } catch {
      return NextResponse.json({ error: "Impossible d'envoyer l'email. Votre code précédent reste valable. Réessayez plus tard." }, { status: 503 });
    }

    return NextResponse.json({ ok: true, message: 'Le code de validation a été renvoyé.' });
  } catch {
    return NextResponse.json({ error: 'Une erreur est survenue.' }, { status: 500 });
  }
}
