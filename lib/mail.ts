import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT || 587) === 465,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function sendValidationCode(email: string, code: string, nom: string): Promise<void> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@school-manager-rdc.org';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1e3a5f; font-size: 22px; margin: 0;">School Manager RDC</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Validation de votre compte</p>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center;">
        <p style="color: #334155; font-size: 15px; margin: 0 0 16px;">Bonjour ${nom},</p>
        <p style="color: #334155; font-size: 15px; margin: 0 0 20px;">Voici votre code de validation :</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2563eb; background: white; border: 2px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 0 auto 20px; display: inline-block;">${code}</div>
        <p style="color: #64748b; font-size: 13px; margin: 0;">Ce code expire à la fin de votre session. Ne le partagez avec personne.</p>
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: 'School Manager RDC — Code de validation',
      html,
    });
  } catch (error) {
    console.error('Erreur envoi email:', error);
    throw new Error("Impossible d'envoyer l'email de validation.");
  }
}

/**
 * Envoie un email de notification d'absence aux parents/tuteurs d'un élève.
 */
export async function sendAbsenceNotification(opts: {
  parentEmail: string;
  parentNom: string;
  eleveNom: string;
  classe: string;
  etablissementNom: string;
  dateAbsence: string;
}): Promise<void> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@school-manager-rdc.org';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1e3a5f; font-size: 22px; margin: 0;">School Manager RDC</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Notification d'absence</p>
      </div>
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 12px; padding: 24px;">
        <p style="color: #334155; font-size: 15px; margin: 0 0 12px;">
          Bonjour ${opts.parentNom || 'Parent/Tuteur'},
        </p>
        <p style="color: #334155; font-size: 15px; margin: 0 0 16px;">
          Nous vous informons que votre enfant <strong>${opts.eleveNom}</strong>,
          élève en classe de <strong>${opts.classe}</strong> à
          <strong>${opts.etablissementNom}</strong>, a été marqué
          <span style="color: #dc2626; font-weight: bold;">absent(e)</span> le
          <strong>${opts.dateAbsence}</strong>.
        </p>
        <div style="background: white; border-radius: 8px; padding: 14px; margin: 16px 0;">
          <p style="color: #64748b; font-size: 13px; margin: 0;">
            Si cette absence est justifiée, merci d'en informer l'établissement.
            Pour toute question, contactez l'administration scolaire.
          </p>
        </div>
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
        Cet email a été envoyé automatiquement par School Manager RDC.
        Si vous recevez ce message par erreur, contactez l'établissement.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to: opts.parentEmail,
      subject: `School Manager RDC — Absence de ${opts.eleveNom} le ${opts.dateAbsence}`,
      html,
    });
  } catch (error) {
    console.error('Erreur envoi notification d\'absence:', error);
    throw error;
  }
}

/**
 * Envoie un email de rappel de saisie des cotes à un enseignant.
 */
export async function sendRappelCote(
  email: string,
  nom: string,
  periode: string,
  anneeScolaire: string,
): Promise<void> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@school-manager-rdc.org';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1e3a5f; font-size: 22px; margin: 0;">School Manager RDC</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Rappel de saisie des cotes</p>
      </div>
      <div style="background: #f8fafc; border-radius: 12px; padding: 24px;">
        <p style="color: #334155; font-size: 15px; margin: 0 0 16px;">Bonjour ${nom},</p>
        <p style="color: #334155; font-size: 15px; margin: 0 0 16px;">
          Nous vous rappelons que la saisie des cotes pour la période
          <strong>${periode}</strong> de l'année scolaire
          <strong>${anneeScolaire}</strong> n'a pas encore été effectuée.
        </p>
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="color: #92400e; font-size: 14px; margin: 0;">
            ⚠ Merci de vous connecter à votre espace School Manager RDC et de procéder à la saisie
            des cotes de vos élèves dans les meilleurs délais.
          </p>
        </div>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/cahier-de-cote"
           style="display: inline-block; background: #2563eb; color: white; text-decoration: none;
                  padding: 12px 28px; border-radius: 9999px; font-size: 14px; font-weight: 600; margin-top: 8px;">
          Accéder au Cahier de cote
        </a>
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
        Cet email est un rappel automatique. Si vous avez déjà saisi vos cotes, ignorez ce message.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject: `School Manager RDC — Rappel : saisie des cotes ${periode}`,
      html,
    });
  } catch (error) {
    console.error('Erreur envoi rappel:', error);
    throw error;
  }
}
