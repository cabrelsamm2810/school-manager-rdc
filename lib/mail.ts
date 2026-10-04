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
