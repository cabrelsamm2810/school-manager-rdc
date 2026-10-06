import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/session-user';
import { ROLE_LABELS } from '@/lib/rbac';

const GROUP_CREATORS = ['ENSEIGNANT', 'DIRECTION_ECOLE', 'COORDINATION_SOUS_PROVINCIALE', 'COORDINATION_PROVINCIALE', 'COORDINATION_NATIONALE', 'SUPER_ADMIN'];

export async function GET(request: NextRequest) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  // Récupère les groupes dont l'utilisateur est membre
  const memberships = await prisma.chatGroupMember.findMany({
    where: { userId: currentUser.id },
    include: {
      group: {
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: { sender: { select: { id: true, prenom: true, nom: true } } },
          },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { group: { updatedAt: 'desc' } },
  });

  return NextResponse.json(
    memberships.map((m) => {
      const lastMsg = m.group.messages[0];
      return {
        id: m.group.id,
        name: m.group.name,
        classe: m.group.classe,
        memberCount: m.group._count.members,
        isAdmin: m.role === 'admin',
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              createdAt: lastMsg.createdAt,
              senderId: lastMsg.senderId,
              senderName: `${lastMsg.sender.prenom} ${lastMsg.sender.nom}`.trim(),
              fileUrl: lastMsg.fileUrl,
              fileName: lastMsg.fileName,
            }
          : null,
        updatedAt: m.group.updatedAt,
      };
    })
  );
}

export async function POST(request: NextRequest) {
  const currentUser = await getSessionUser(request);
  if (!currentUser) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  if (!GROUP_CREATORS.includes(currentUser.role)) {
    return NextResponse.json({ error: 'Seuls les enseignants et directeurs peuvent créer des groupes.' }, { status: 403 });
  }

  const body = await request.json();
  const { name, classe, etablissementId } = body as { name: string; classe: string; etablissementId?: string };

  if (!name?.trim() || !classe?.trim()) {
    return NextResponse.json({ error: 'Nom et classe requis.' }, { status: 400 });
  }

  const etabId = etablissementId || currentUser.etablissementId || undefined;

  // Crée le groupe
  const group = await prisma.chatGroup.create({
    data: {
      name: name.trim(),
      classe: classe.trim(),
      etablissementId: etabId,
      createdById: currentUser.id,
    },
  });

  // Ajoute le créateur comme admin
  await prisma.chatGroupMember.create({
    data: {
      groupId: group.id,
      userId: currentUser.id,
      role: 'admin',
    },
  });

  // Auto-ajoute tous les élèves (Users avec role ELEVE) de la même classe
  const students = await prisma.user.findMany({
    where: {
      role: 'ELEVE',
      classe: classe.trim(),
      ...(etabId ? { etablissementId: etabId } : {}),
      isActive: true,
    },
    select: { id: true },
  });

  if (students.length > 0) {
    await prisma.chatGroupMember.createMany({
      data: students.map((s) => ({
        groupId: group.id,
        userId: s.id,
        role: 'member',
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ id: group.id, memberCount: students.length + 1 });
}
