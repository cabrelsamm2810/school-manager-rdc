/**
 * Crée (ou remet à jour) le compte enseignant de démonstration rattaché à
 * l'établissement de démonstration, et génère les présences des 30 derniers
 * jours si la base n'en contient aucune.
 *
 * À exécuter avec : npx tsx scripts/seed-demo-enseignant.ts
 * (ou `npm run seed:demo-enseignant`).
 */
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'enseignant.demo@schoolmanager-rdc.cd';
const DEMO_PASSWORD = 'Enseignant2026';

async function main() {
  const etablissement = await prisma.etablissement.findFirst({
    where: {
      OR: [{ identifiantSM: 'DEMO-KIN-001' }, { nom: 'École de démonstration' }],
    },
  });
  if (!etablissement) {
    throw new Error("Établissement de démonstration introuvable — exécutez d'abord les seeds de données.");
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Compte actif sans passer par la validation email, rattaché à l'école de
  // démonstration : le périmètre ENSEIGNANT de buildEleveScopeWhere() le limite
  // aux élèves de cet établissement.
  const enseignant = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {
      role: Role.ENSEIGNANT,
      isActive: true,
      validationCode: null,
      etablissementId: etablissement.id,
      institutionName: etablissement.nom,
      provinceAdministrative: etablissement.province,
      provinceEducationnelle: etablissement.provinceEducationnelle,
      typeInstitution: etablissement.institution,
      passwordHash,
    },
    create: {
      nom: 'Mukendi',
      postNom: 'Kalonji',
      prenom: 'Joseph',
      sexe: 'M',
      email: DEMO_EMAIL,
      telephone: '+243 000 000 001',
      passwordHash,
      role: Role.ENSEIGNANT,
      isActive: true,
      fonction: 'Enseignant',
      grade: 'Professeur',
      etablissementId: etablissement.id,
      institutionName: etablissement.nom,
      provinceAdministrative: etablissement.province,
      provinceEducationnelle: etablissement.provinceEducationnelle,
      typeInstitution: etablissement.institution,
    },
  });

  console.log(`Compte enseignant de démonstration prêt : ${enseignant.email} (${etablissement.nom}).`);

  // ── Présences des 30 derniers jours (jours ouvrables uniquement) ──
  const dejaPresentes = await prisma.presence.count();
  if (dejaPresentes > 0) {
    console.log(`${dejaPresentes} présences déjà enregistrées — aucune génération.`);
  } else {
    const eleves = await prisma.eleve.findMany({
      where: { etablissementId: etablissement.id },
      select: { id: true, classe: true },
    });

    if (eleves.length === 0) {
      console.log('Aucun élève dans cet établissement — aucune présence générée.');
    } else {
      const aujourdHui = new Date();
      let total = 0;
      for (let jour = 0; jour < 30; jour++) {
        const date = new Date(aujourdHui);
        date.setDate(date.getDate() - jour);
        date.setHours(8, 0, 0, 0);
        const jourSemaine = date.getDay();
        if (jourSemaine === 0 || jourSemaine === 6) continue; // week-end

        await prisma.presence.createMany({
          data: eleves.map((e) => ({
            eleveId: e.id,
            classe: e.classe,
            date,
            present: Math.random() > 0.1,
          })),
        });
        total += eleves.length;
      }
      console.log(`${total} présences générées sur les 30 derniers jours (${eleves.length} élèves).`);
    }
  }

  console.log(`Identifiants de démonstration : ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
