import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createTransport: vi.fn(), sendMail: vi.fn(), close: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('nodemailer', () => ({ default: { createTransport: mocks.createTransport } }));

import { sendSmtpMail, smtpConfiguration, MailDeliveryError } from '@/lib/smtp';
import { sendValidationCode } from '@/lib/mail';

beforeEach(() => {
  vi.resetAllMocks();
  for (const [key, value] of Object.entries({ SMTP_HOST: 'smtp.example.invalid', SMTP_PORT: '587', SMTP_USER: 'sender@example.invalid', SMTP_PASS: 'test-password', SMTP_FROM: 'School Manager <sender@example.invalid>' })) vi.stubEnv(key, value);
  mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail, close: mocks.close });
  mocks.sendMail.mockResolvedValue({ accepted: ['recipient@example.invalid'], rejected: [] });
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('configuration SMTP sécurisée', () => {
  it('exige STARTTLS, TLS 1.2 et un certificat valide sur 587', () => {
    expect(smtpConfiguration().options).toMatchObject({ secure: false, requireTLS: true, tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true }, logger: false, debug: false });
  });
  it('utilise TLS implicite sur 465', () => {
    vi.stubEnv('SMTP_PORT', '465');
    expect(smtpConfiguration().options).toMatchObject({ port: 465, secure: true });
  });
  it('préserve exactement le mot de passe', () => {
    vi.stubEnv('SMTP_PASS', ' significant password ');
    expect(smtpConfiguration().options.auth).toMatchObject({ pass: ' significant password ' });
  });
  it.each(['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'])('refuse la variable absente %s', (key) => {
    vi.stubEnv(key, ' ');
    expect(() => smtpConfiguration()).toThrow(MailDeliveryError);
  });
  it.each(['0', 'NaN', '70000', '587.5'])('refuse le port invalide %s', port => {
    vi.stubEnv('SMTP_PORT', port);
    expect(() => smtpConfiguration()).toThrow(MailDeliveryError);
  });
  it('utilise le compte SMTP comme expéditeur par défaut', () => {
    vi.stubEnv('SMTP_FROM', '');
    expect(smtpConfiguration().from).toBe('sender@example.invalid');
  });
  it('refuse une injection dans l’expéditeur', () => {
    vi.stubEnv('SMTP_FROM', 'sender@example.invalid\r\nBcc: attacker@example.invalid');
    expect(() => smtpConfiguration()).toThrow(MailDeliveryError);
  });
});

describe('envoi et diagnostic', () => {
  it('envoie une seule fois avec une version texte et ferme la connexion', async () => {
    await sendValidationCode('recipient@example.invalid', '123456', 'Test');
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    expect(mocks.sendMail.mock.calls[0][0]).toMatchObject({ from: 'School Manager <sender@example.invalid>', text: expect.stringContaining('123456') });
    expect(mocks.close).toHaveBeenCalledTimes(1);
  });
  it('ne confirme pas un email sans destinataire accepté', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.sendMail.mockResolvedValue({ accepted: [], rejected: ['recipient@example.invalid'] });
    await expect(sendSmtpMail({ to: 'recipient@example.invalid', text: 'test' })).rejects.toMatchObject({ category: 'recipient' });
  });
  it.each([
    [{ code: 'EAUTH', responseCode: 535, command: 'AUTH PLAIN' }, 'authentication'],
    [{ code: 'ETIMEDOUT' }, 'timeout'],
    [{ code: 'ENOTFOUND' }, 'dns'],
    [{ code: 'ETLS' }, 'tls'],
    [{ code: 'ECONNREFUSED' }, 'connection'],
    [{ responseCode: 550, command: 'MAIL FROM' }, 'sender'],
    [{ responseCode: 550, command: 'RCPT TO' }, 'recipient'],
  ])('classe les erreurs sans divulguer leur contenu : %j', async (details, category) => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.sendMail.mockRejectedValue(Object.assign(new Error('secret-password recipient@example.invalid 123456'), details, { response: 'secret-password', auth: { pass: 'secret-password' } }));
    await expect(sendSmtpMail({ to: 'recipient@example.invalid', text: '123456' })).rejects.toMatchObject({ category, reference: expect.any(String) });
    const output = JSON.stringify(log.mock.calls);
    for (const secret of ['secret-password', 'recipient@example.invalid', '123456']) expect(output).not.toContain(secret);
    expect(mocks.sendMail).toHaveBeenCalledTimes(1); // pas de retry aveugle après un échec ambigu
    expect(mocks.close).toHaveBeenCalledTimes(1);
  });
});
