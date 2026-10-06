/**
 * Script de démonstration : crée des élèves et des enregistrements
 * de présence pour alimenter le tableau de bord enseignant.
 * À exécuter avec : npx tsx scripts/seed-teacher-demo.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CLASSES = [
  { classe: '1ère maternelle', effectif: 18 },
  { classe: '2ème maternelle', effectif: 22 },
  { classe: '1ère primaire', effectif: 30 },
  { classe: '2ème primaire', effectif: 28 },
  { classe: '3ème primaire', effectif: 25 },
  { classe: '4ème primaire', effectif: 27 },
  { classe: '5ème primaire', effectif: 24 },
  { classe: '6ème primaire', effectif: 26 },
];

const NOMS = ['Mukendi', 'Tshisekedi', 'Kabila', 'Lumumba', 'Mobutu', 'Kasa-Vubu', 'Mulele', 'Gizenga', 'Tshombe', 'Bemba', 'Kengo', 'Thambwe', 'Mbenza', 'Lukusa', 'Mwamba'];
const PRENOMS = ['Jean', 'Marie', 'Paul', 'Grace', 'David', 'Esther', 'Joseph', 'Rachel', 'Samuel', 'Deborah', 'Daniel', 'Sarah', 'Moïse', 'Ruth', 'Aaron'];

function randomNom() { return NOMS[Math.floor(Math.random() * NOMS.length)]; }
function randomPrenom() { return PRENOMS[Math.floor(Math.random() * PRENOMS.length)]; }

async function main() {
  // Vérifier s'il y a déjà des élèves
  const existing = await prisma.eleve.count();
  if (existing > 0) {
    console.log(`${existing} élèves déjà présents — skipping seed.`);
    return;
  }

  let matriculeNum = 1;
  const eleveIdsParClasse: Record<string, string[]> = {};

  for (const { classe, effectif } of CLASSES) {
    eleveIdsParClasse[classe] = [];
    for (let i = 0; i < effectif; i++) {
      const matricule = `ELV${String(matriculeNum).padStart(5, '0')}`;
      matriculeNum++;
      const eleve = await prisma.eleve.create({
        data: {
          matricule,
          nom: randomNom(),
          postNom: randomNom(),
          prenom: randomPrenom(),
          sexe: Math.random() > 0.5 ? 'M' : 'F',
          classe,
        },
      });
      eleveIdsParClasse[classe].push(eleve.id);
    }
  }

  console.log(`${matriculeNum - 1} élèves créés.`);

  // Créer des enregistrements de présence pour les 30 derniers jours
  // (jours de semaine seulement, ~85-95% de présence)
  let presenceCount = 0;
  const aujourd = new Date();

  for (let jour = 0; jour < 30; jour++) {
    const date = new Date(aujourd);
    date.setDate(date.getDate() - jour);
    const jourSemaine = date.getDay();
    // Skip weekends (0=dimanche, 6=samedi)
    if (jourSemaine === 0 || jourSemaine === 6) continue;

    for (const { classe } of CLASSES) {
      const eleveIds = eleveIdsParClasse[classe];
      for (const eleveId of eleveIds) {
        // Taux de présence aléatoire entre 82% et 97%
        const present = Math.random() > 0.12;
        await prisma.presence.create({
          data: { eleveId, date, present, classe },
        });
        presenceCount++;
      }
    }
  }

  console.log(`${presenceCount} enregistrements de présence créés.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
