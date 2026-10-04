import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

export type CrudFieldDef = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required?: boolean;
  unique?: boolean;
  min?: number;
};

export type CrudModelConfig = {
  delegate: any; // prisma[model]
  entityName: string;       // singular, e.g. 'enseignant'
  entityNamePlural: string; // plural, e.g. 'enseignants'
  minRole: string;
  searchFields: string[];
  fields: CrudFieldDef[];
  defaultSort?: { field: string; order: 'asc' | 'desc' };
};

function buildSchema(fields: CrudFieldDef[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    let s: z.ZodTypeAny;
    if (f.type === 'number') {
      s = z.number().int().min(f.min ?? 0).optional();
    } else if (f.type === 'boolean') {
      s = z.boolean().optional();
    } else if (f.type === 'date') {
      s = z.string().optional().or(z.literal(''));
    } else {
      const str = z.string().trim();
      s = f.required ? str.min(1, 'Ce champ est obligatoire.') : str.optional().or(z.literal(''));
    }
    shape[f.name] = s;
  }
  return z.object(shape);
}

function toPayload(body: Record<string, any>, fields: CrudFieldDef[]) {
  const payload: Record<string, any> = {};
  for (const f of fields) {
    let val = body[f.name];
    if (f.type === 'number') {
      payload[f.name] = val !== undefined && val !== '' ? Number(val) : 0;
    } else if (f.type === 'boolean') {
      payload[f.name] = Boolean(val);
    } else if (f.type === 'date') {
      payload[f.name] = val ? new Date(val) : null;
    } else {
      payload[f.name] = val ?? '';
    }
  }
  return payload;
}

export function createCrudHandlers(config: CrudModelConfig) {
  const schema = buildSchema(config.fields);

  async function GET(request: NextRequest) {
    const auth = await requireRole(request, config.minRole);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;

    const where: Record<string, unknown> = {};
    if (search && config.searchFields.length > 0) {
      where.OR = config.searchFields.map((field) => ({
        [field]: { contains: search, mode: 'insensitive' as const },
      }));
    }

    const orderBy = config.defaultSort
      ? { [config.defaultSort.field]: config.defaultSort.order }
      : { createdAt: 'desc' as const };

    const items = await config.delegate.findMany({ where, orderBy });
    return NextResponse.json({ [config.entityNamePlural]: items });
  }

  async function POST(request: NextRequest) {
    const auth = await requireRole(request, config.minRole);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
        { status: 400 },
      );
    }

    const payload = toPayload(parsed.data, config.fields);

    try {
      const item = await config.delegate.create({ data: payload });
      return NextResponse.json({ [config.entityName]: item }, { status: 201 });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return NextResponse.json(
          { error: 'Un enregistrement avec cette valeur unique existe déjà.' },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: 'Erreur lors de la création.' }, { status: 500 });
    }
  }

  async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireRole(request, config.minRole);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Données invalides.' },
        { status: 400 },
      );
    }

    const existing = await config.delegate.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Enregistrement introuvable.' }, { status: 404 });
    }

    const payload = toPayload(parsed.data, config.fields);

    try {
      const item = await config.delegate.update({
        where: { id: params.id },
        data: payload,
      });
      return NextResponse.json({ [config.entityName]: item });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return NextResponse.json(
          { error: 'Un enregistrement avec cette valeur unique existe déjà.' },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: 'Erreur lors de la mise à jour.' }, { status: 500 });
    }
  }

  async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const auth = await requireRole(request, config.minRole);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const existing = await config.delegate.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: 'Enregistrement introuvable.' }, { status: 404 });
    }

    await config.delegate.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  }

  return { GET, POST, PUT, DELETE };
}
