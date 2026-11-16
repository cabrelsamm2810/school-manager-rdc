import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import net from 'net';
import tls from 'tls';
import { execFileSync } from 'child_process';
import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import nodemailer from 'nodemailer';

vi.mock('server-only', () => ({}));
import { sendValidationCode } from '@/lib/mail';

let opensslAvailable = true;
try { execFileSync('openssl', ['version'], { stdio: 'ignore' }); } catch { opensslAvailable = false; }

describe.skipIf(!opensslAvailable)('récepteur SMTP local avec STARTTLS et certificat vérifié', () => {
  let server: net.Server;
  let directory: string;
  let rejectSender = false;
  let encrypted = false;
  const sockets = new Set<net.Socket>();
  const messages: string[] = [];

  beforeAll(async () => {
    directory = mkdtempSync(join(tmpdir(), 'school-smtp-test-'));
    const keyPath = join(directory, 'key.pem');
    const certPath = join(directory, 'cert.pem');
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost', '-keyout', keyPath, '-out', certPath], { stdio: 'ignore' });
    const cert = readFileSync(certPath);
    const context = tls.createSecureContext({ key: readFileSync(keyPath), cert });
    function handle(socket: net.Socket, greeting: boolean) {
      sockets.add(socket);
      socket.on('error', () => {});
      socket.on('close', () => sockets.delete(socket));
      if (greeting) socket.write('220 localhost SMTP audit\r\n');
      let buffer = '';
      let data: string[] | null = null;
      socket.on('data', chunk => {
        buffer += chunk.toString();
        while (buffer.includes('\r\n')) {
          const position = buffer.indexOf('\r\n');
          const line = buffer.slice(0, position);
          buffer = buffer.slice(position + 2);
          if (data) {
            if (line === '.') { messages.push(data.join('\r\n')); data = null; socket.write('250 2.0.0 accepted\r\n'); }
            else data.push(line);
          } else if (/^EHLO|^HELO/.test(line)) {
            socket.write(socket instanceof tls.TLSSocket ? '250-localhost\r\n250 AUTH PLAIN LOGIN\r\n' : '250-localhost\r\n250 STARTTLS\r\n');
          } else if (line === 'STARTTLS') {
            socket.write('220 Ready for TLS\r\n');
            socket.removeAllListeners('data');
            const secured = new tls.TLSSocket(socket, { isServer: true, secureContext: context });
            secured.on('secure', () => { encrypted = true; });
            handle(secured, false);
            return;
          } else if (line.startsWith('AUTH ')) socket.write('235 2.7.0 authenticated\r\n');
          else if (line.startsWith('MAIL FROM:')) socket.write(rejectSender ? '550 5.7.1 sender not allowed\r\n' : '250 OK\r\n');
          else if (line.startsWith('RCPT TO:')) socket.write('250 OK\r\n');
          else if (line === 'DATA') { data = []; socket.write('354 End with dot\r\n'); }
          else if (line === 'QUIT') { socket.end('221 Bye\r\n'); }
          else socket.write('250 OK\r\n');
        }
      });
    }
    server = net.createServer(socket => handle(socket, true));
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as net.AddressInfo).port;
    for (const [key, value] of Object.entries({ SMTP_HOST: 'localhost', SMTP_PORT: String(port), SMTP_USER: 'sender@example.invalid', SMTP_PASS: 'local-test-only', SMTP_FROM: 'sender@example.invalid' })) vi.stubEnv(key, value);
    const original = nodemailer.createTransport.bind(nodemailer);
    // Ajouter la CA de ce récepteur de test, sans jamais désactiver la
    // vérification du certificat ni changer la configuration de l'application.
    vi.spyOn(nodemailer, 'createTransport').mockImplementation(((options: Record<string, unknown>) => original({ ...options, tls: { ...(options.tls as object), ca: cert } })) as typeof nodemailer.createTransport);
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    for (const socket of sockets) socket.destroy();
    if (server) await new Promise<void>(resolve => server.close(() => resolve()));
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  it('reçoit réellement un email unique contenant le code et une version texte', async () => {
    await sendValidationCode('receiver@example.invalid', '123456', 'Audit');
    expect(encrypted).toBe(true);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('123456');
    expect(messages[0]).toContain('text/plain');
    expect(messages[0]).toContain('text/html');
  });

  it('identifie un expéditeur refusé sans annoncer de succès', async () => {
    rejectSender = true;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(sendValidationCode('receiver@example.invalid', '654321', 'Audit')).rejects.toMatchObject({ category: 'sender' });
    expect(messages).toHaveLength(1);
  });
});
