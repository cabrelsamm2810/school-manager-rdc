import prisma from '@/lib/prisma';
import type { NextRequest } from 'next/server';

/**
 * Journal d'audit — School Manager RDC.
 *
 * Enregistre les actions sensibles effectuées par les utilisateurs.
 * Les journaux ne peuvent pas être supprimés par l'Admin School Manager RDC
 * (seul le Super Administrateur a la permission AUDIT_DELETE).
 */

export interface AuditEntry {
  userId: string;
  userRole: string;
  userName: string;
  action: string;
  module?: string;
  resource?: string;
  resourceId?: string;
  result?: 'success' | 'failure' | 'denied';
  details?: string;
  ipAddress?: string;
}

/**
 * Enregistre une entrée dans le journal d'audit.
 * Ne lève jamais d'erreur : l'audit ne doit pas bloquer l'action principale.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        userRole: entry.userRole,
        userName: entry.userName,
        action: entry.action,
        module: entry.module ?? '',
        resource: entry.resource ?? '',
        resourceId: entry.resourceId ?? '',
        result: entry.result ?? 'success',
        details: entry.details ?? '',
        ipAddress: entry.ipAddress ?? '',
      },
    });
  } catch {
    /* L'audit ne doit jamais bloquer l'action principale. */
  }
}

/**
 * Extrait l'adresse IP d'une requête (en tenant compte des proxies).
 */
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;
  return '';
}
