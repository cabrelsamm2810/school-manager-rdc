import 'server-only';

import nodemailer, { type SendMailOptions } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';
import { randomUUID } from 'crypto';
import { z } from 'zod';

type FailureCategory = 'configuration' | 'authentication' | 'dns' | 'tls' | 'timeout' | 'connection' | 'sender' | 'recipient' | 'protocol';

export class MailDeliveryError extends Error {
  readonly reference = randomUUID();
  constructor(readonly category: FailureCategory, readonly missingVariables: string[] = []) {
    super("Le service d’envoi d’emails est indisponible.");
    this.name = 'MailDeliveryError';
  }
}

export function missingSmtpVariables(env: NodeJS.ProcessEnv = process.env): string[] {
  return ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'].filter(key => !env[key]?.trim());
}

export function smtpConfiguration(env: NodeJS.ProcessEnv = process.env) {
  const missing = missingSmtpVariables(env);
  if (missing.length) throw new MailDeliveryError('configuration', missing);
  const host = env.SMTP_HOST!.trim();
  const user = env.SMTP_USER!.trim();
  const portValue = env.SMTP_PORT?.trim() || '587';
  const port = Number(portValue);
  const from = env.SMTP_FROM?.trim() || user;
  const address = from.match(/<([^<>]+)>$/)?.[1] || from;
  if (!/^\d+$/.test(portValue) || !Number.isInteger(port) || port < 1 || port > 65535 || /[\s/]/.test(host)) {
    throw new MailDeliveryError('configuration');
  }
  if (/[\r\n]/.test(from) || !z.string().email().safeParse(address).success) {
    throw new MailDeliveryError('configuration');
  }
  const options: SMTPTransport.Options = {
    host, port, secure: port === 465,
    // STARTTLS obligatoire hors TLS implicite ; jamais de connexion en clair.
    requireTLS: port !== 465,
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    // Un mot de passe est opaque : ne pas retirer ses caractères significatifs.
    auth: { user, pass: env.SMTP_PASS! },
    dnsTimeout: 5_000, connectionTimeout: 8_000, greetingTimeout: 8_000, socketTimeout: 15_000,
    logger: false, debug: false,
  };
  return { from, options };
}

function classifyFailure(error: unknown): MailDeliveryError {
  if (error instanceof MailDeliveryError) return error;
  const failure = error as { code?: string; responseCode?: number; command?: string } | null;
  const code = failure?.code;
  let category: FailureCategory = 'protocol';
  if (code === 'EAUTH' || failure?.responseCode === 535) category = 'authentication';
  else if (['EDNS', 'ENOTFOUND', 'EAI_AGAIN'].includes(code || '')) category = 'dns';
  else if (['ETLS', 'CERT_HAS_EXPIRED', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'ERR_TLS_CERT_ALTNAME_INVALID', 'CERT_SIGNATURE_FAILURE'].includes(code || '')) category = 'tls';
  else if (code === 'ETIMEDOUT') category = 'timeout';
  else if (failure?.command === 'MAIL FROM') category = 'sender';
  else if (failure?.command === 'RCPT TO' || code === 'EENVELOPE') category = 'recipient';
  else if (['ECONNECTION', 'ECONNREFUSED', 'ECONNRESET', 'ESOCKET'].includes(code || '')) category = 'connection';
  return new MailDeliveryError(category);
}

type SmtpMessage = Omit<SendMailOptions, 'from' | 'to'> & { to: string };

export async function sendSmtpMail(message: SmtpMessage): Promise<void> {
  let transport: ReturnType<typeof nodemailer.createTransport> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  try {
    const { from, options } = smtpConfiguration();
    transport = nodemailer.createTransport(options);
    // Un serveur qui répond au compte-gouttes peut réarmer le socketTimeout.
    // Borner aussi la durée totale, en restant sous maxDuration=60 sur Vercel.
    const info = await Promise.race([
      transport.sendMail({ ...message, from, replyTo: message.replyTo || from }),
      new Promise<never>((_, reject) => {
        deadline = setTimeout(() => reject(new MailDeliveryError('timeout')), 45_000);
      }),
    ]);
    const accepted = (info.accepted || []).some((recipient: string | { address: string }) =>
      (typeof recipient === 'string' ? recipient : recipient.address).toLowerCase() === message.to.toLowerCase());
    if (!accepted) throw new MailDeliveryError('recipient');
  } catch (error) {
    const failure = classifyFailure(error);
    const raw = error as { code?: unknown; responseCode?: unknown; command?: unknown } | null;
    // Liste blanche uniquement : ni message/réponse SMTP bruts, ni adresse,
    // mot de passe, corps d'email ou code de validation dans les journaux.
    const knownCodes = ['EAUTH', 'EDNS', 'ENOTFOUND', 'EAI_AGAIN', 'ETLS', 'ETIMEDOUT', 'ECONNECTION', 'ECONNREFUSED', 'ECONNRESET', 'ESOCKET', 'EENVELOPE'];
    const knownStages = ['CONN', 'EHLO', 'HELO', 'STARTTLS', 'AUTH PLAIN', 'AUTH LOGIN', 'MAIL FROM', 'RCPT TO', 'DATA'];
    console.error('[smtp] delivery_failed', {
      reference: failure.reference, category: failure.category,
      missingVariables: failure.missingVariables,
      smtpCode: knownCodes.includes(String(raw?.code)) ? raw?.code : undefined,
      responseCode: typeof raw?.responseCode === 'number' ? raw.responseCode : undefined,
      stage: knownStages.includes(String(raw?.command)) ? raw?.command : undefined,
    });
    throw failure;
  } finally {
    if (deadline) clearTimeout(deadline);
    transport?.close();
  }
}
