import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // ── Établissement ──
  let etab = await prisma.etablissement.findFirst({ where: { nom: 'Institut Tuendelee' } });
  if (!etab) {
    etab = await prisma.etablissement.create({
      data: {
        nom: 'Institut Tuendelee',
        type: 'Secondaire',
        province: 'Kinshasa',
        ville: 'Kinshasa',
        adresse: 'Av. Tuendelee, Commune de Lemba',
        telephone: '+243 81 234 5678',
        email: 'contact@tuendelee.cd',
        effectif: 850,
        statut: 'Actif',
      },
    });
  }

  // ── Élèves fictifs ──
  const elevesData = [
    {
      matricule: 'ELV-2026-001',
      nom: 'Kabongo',
      postNom: 'Mukendi',
      prenom: 'Jean',
      sexe: 'M',
      dateNaissance: new Date('2010-03-15'),
      lieuNaissance: 'Kinshasa',
      classe: '6ème primaire',
      telephone: '+243 82 111 2222',
      email: 'jean.kabongo@tuendelee.cd',
      adresse: 'Av. de la Justice, Lemba',
      nomTuteur: 'Kabongo Mukendi Sr.',
      telephoneTuteur: '+243 81 555 0001',
    },
    {
      matricule: 'ELV-2026-002',
      nom: 'Mujinga',
      postNom: 'Ilunga',
      prenom: 'Grace',
      sexe: 'F',
      dateNaissance: new Date('2009-07-22'),
      lieuNaissance: 'Kinshasa',
      classe: '5ème primaire',
      telephone: '+243 82 333 4444',
      email: 'grace.mujinga@tuendelee.cd',
      adresse: 'Rue Kimpwanza, Lemba',
      nomTuteur: 'Ilunga Mujinga',
      telephoneTuteur: '+243 81 555 0002',
    },
    {
      matricule: 'ELV-2026-003',
      nom: 'Tshibangu',
      postNom: 'Kalonji',
      prenom: 'Paul',
      sexe: 'M',
      dateNaissance: new Date('2008-11-05'),
      lieuNaissance: 'Mbuji-Mayi',
      classe: '3ème secondaire',
      telephone: '+243 82 555 6666',
      email: 'paul.tshibangu@tuendelee.cd',
      adresse: 'Av. Independence, Ngaba',
      nomTuteur: 'Kalonji Tshibangu',
      telephoneTuteur: '+243 81 555 0003',
    },
    {
      matricule: 'ELV-2026-004',
      nom: 'Kasongo',
      postNom: 'Mbuyi',
      prenom: 'Sarah',
      sexe: 'F',
      dateNaissance: new Date('2007-01-30'),
      lieuNaissance: 'Kinshasa',
      classe: '4ème secondaire',
      telephone: '+243 82 777 8888',
      email: 'sarah.kasongo@tuendelee.cd',
      adresse: 'Av. Kasa-Vubu, Kasa-Vubu',
      nomTuteur: 'Mbuyi Kasongo',
      telephoneTuteur: '+243 81 555 0004',
    },
    {
      matricule: 'ELV-2026-005',
      nom: 'Mbuyi',
      postNom: 'Tshisekedi',
      prenom: 'Eric',
      sexe: 'M',
      dateNaissance: new Date('2006-09-12'),
      lieuNaissance: 'Lubumbashi',
      classe: '6ème secondaire',
      telephone: '+243 82 999 0000',
      email: 'eric.mbuyi@tuendelee.cd',
      adresse: 'Av. du Commerce, Gombe',
      nomTuteur: 'Tshisekedi Mbuyi',
      telephoneTuteur: '+243 81 555 0005',
    },
  ];

  for (const e of elevesData) {
    const eleve = await prisma.eleve.upsert({
      where: { matricule: e.matricule },
      create: { ...e, etablissementId: etab.id },
      update: {},
    });

    // ── Documents ──
    const docs = [
      {
        type: 'Acte de naissance',
        titre: `Acte de naissance — ${eleve.prenom} ${eleve.nom}`,
        fileUrl: '/uploads/documents/acte-naissance.pdf',
        fileName: 'acte-naissance.pdf',
        fileType: 'application/pdf',
        description: 'Copie certifiée conforme de l\'acte de naissance',
        uploadedBy: 'Secrétariat',
      },
      {
        type: 'Bulletin',
        titre: `Bulletin 1er trimestre 2025-2026 — ${eleve.prenom}`,
        fileUrl: '/uploads/documents/bulletin-t1.pdf',
        fileName: 'bulletin-t1-2025.pdf',
        fileType: 'application/pdf',
        description: 'Bulletin du premier trimestre',
        uploadedBy: 'Direction des études',
      },
      {
        type: 'Certificat',
        titre: `Certificat de scolarité — ${eleve.prenom}`,
        fileUrl: '/uploads/documents/certificat-scolarite.pdf',
        fileName: 'certificat-scolarite.pdf',
        fileType: 'application/pdf',
        description: 'Certificat de scolarité pour l\'année 2026-2027',
        uploadedBy: 'Secrétariat',
      },
    ];

    for (const d of docs) {
      const existing = await prisma.dossierEleveDocument.findFirst({
        where: { eleveId: eleve.id, titre: d.titre },
      });
      if (!existing) await prisma.dossierEleveDocument.create({ data: { ...d, eleveId: eleve.id } });
    }

    // ── Résultats scolaires ──
    const resultats = [
      { periode: '1er trimestre', matiere: 'Mathématiques', note: '15/20', moyenne: '14.5/20', mention: 'Distinction', appreciation: 'Bon travail, continuez ainsi', anneeScolaire: '2025-2026' },
      { periode: '1er trimestre', matiere: 'Français', note: '13/20', moyenne: '12.8/20', mention: 'Satisfaction', appreciation: 'Des progrès à faire en expression écrite', anneeScolaire: '2025-2026' },
      { periode: '1er trimestre', matiere: 'Histoire', note: '17/20', moyenne: '16/20', mention: 'Distinction', appreciation: 'Excellente maîtrise du programme', anneeScolaire: '2025-2026' },
      { periode: '2e trimestre', matiere: 'Mathématiques', note: '16/20', moyenne: '15/20', mention: 'Distinction', appreciation: 'Amélioration constante', anneeScolaire: '2025-2026' },
      { periode: '2e trimestre', matiere: 'Français', note: '14/20', moyenne: '13.5/20', mention: 'Satisfaction', appreciation: 'Progression notable', anneeScolaire: '2025-2026' },
    ];

    for (const r of resultats) {
      const existing = await prisma.dossierEleveResultat.findFirst({
        where: { eleveId: eleve.id, periode: r.periode, matiere: r.matiere },
      });
      if (!existing) await prisma.dossierEleveResultat.create({ data: { ...r, eleveId: eleve.id } });
    }

    // ── Historique d'interactions ──
    const interactions = [
      {
        type: 'Entretien parental',
        sujet: 'Réunion parents-professeurs',
        description: 'Le tuteur a assisté à la réunion trimestrielle. L\'élève progresse bien en classe.',
        date: new Date('2026-09-15'),
        intervenant: 'Direction des études',
        statut: 'Clôturé',
      },
      {
        type: 'Sanction disciplinaire',
        sujet: 'Retards répétés',
        description: 'Avertissement pour trois retards en une semaine. Entretien avec l\'élève effectué.',
        date: new Date('2026-09-22'),
        intervenant: 'Disciplinaire',
        statut: 'Enregistré',
      },
      {
        type: 'Orientation',
        sujet: 'Conseil d\'orientation',
        description: 'Entretien d\'orientation pour le choix des options en cycle supérieur.',
        date: new Date('2026-10-01'),
        intervenant: 'Conseiller d\'orientation',
        statut: 'En cours',
      },
    ];

    for (const i of interactions) {
      const existing = await prisma.dossierEleveInteraction.findFirst({
        where: { eleveId: eleve.id, sujet: i.sujet, date: i.date },
      });
      if (!existing) await prisma.dossierEleveInteraction.create({ data: { ...i, eleveId: eleve.id } });
    }

    console.log(`✓ Dossier créé pour ${eleve.prenom} ${eleve.nom} (${eleve.matricule})`);
  }

  console.log('\nSeed terminé : 5 élèves avec documents, résultats et interactions.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
