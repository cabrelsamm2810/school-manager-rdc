import { PrismaClient, Role } from '@prisma/client';
import { SOUS_DIVISIONS_RDC } from '@/lib/sous-divisions-rdc';
import { CLASSES_RDC, MATIERES_RDC, OPTIONS_RDC } from '@/lib/curriculum-rdc';

const prisma = new PrismaClient();

async function main() {
  // Les rôles sont un enum Prisma : aucun compte ni secret n'est créé par défaut.
  const roleCounts = await Promise.all(
    Object.values(Role).map((role) => prisma.user.count({ where: { role } }))
  );
  console.log(`Seed vérifié : ${roleCounts.length} rôles disponibles.`);

  // ── Enseignants ──
  const enseignants = [
    { nom: 'Mukendi Kalonji', matricule: 'ENS-001', grade: 'Chef de travaux', ecole: 'Institut Tuendelee', specialite: 'Mathématiques', telephone: '', email: '', statut: 'Actif' },
    { nom: 'Kabeya Tshibangu', matricule: 'ENS-002', grade: 'Professeur', ecole: 'Collège Boboto', specialite: 'Sciences', telephone: '', email: '', statut: 'Actif' },
    { nom: 'Mwamba Ilunga', matricule: 'ENS-003', grade: 'Instituteur', ecole: 'École Primaire Bambelo', specialite: 'Primaire', telephone: '', email: '', statut: 'Actif' },
    { nom: 'Tshisekedi Mujinga', matricule: 'ENS-004', grade: 'Professeur', ecole: 'Lycée Sainte-Germaine', specialite: 'Français', telephone: '', email: '', statut: 'Congé' },
    { nom: 'Kasongo Mbuyi', matricule: 'ENS-005', grade: 'Instituteur principal', ecole: 'École Maman Mobali', specialite: 'Primaire', telephone: '', email: '', statut: 'Actif' },
  ];
  for (const e of enseignants) {
    await prisma.enseignant.upsert({ where: { matricule: e.matricule }, create: e, update: {} });
  }

  // ── Provinces : les 26 provinces administratives et éducationnelles de la RDC ──
  const provinces = [
    { nom: 'Kinshasa', chefLieu: 'Kinshasa', ecoles: 320, eleves: 485000, statut: 'Actif' },
    { nom: 'Kongo Central', chefLieu: 'Matadi', ecoles: 180, eleves: 210000, statut: 'Actif' },
    { nom: 'Kwango', chefLieu: 'Kenge', ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kwilu', chefLieu: 'Bandundu', ecoles: 95, eleves: 120000, statut: 'Actif' },
    { nom: 'Mai-Ndombe', chefLieu: 'Inongo', ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kasaï', chefLieu: 'Tshikapa', ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kasaï Central', chefLieu: 'Kananga', ecoles: 85, eleves: 110000, statut: 'Actif' },
    { nom: 'Kasaï Oriental', chefLieu: 'Mbuji-Mayi', ecoles: 130, eleves: 170000, statut: 'Actif' },
    { nom: 'Lomami', chefLieu: 'Kabinda', ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Sankuru', chefLieu: 'Lusambo', ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Maniema', chefLieu: 'Kindu', ecoles: 60, eleves: 75000, statut: 'Actif' },
    { nom: 'Sud-Kivu', chefLieu: 'Bukavu', ecoles: 120, eleves: 160000, statut: 'Actif' },
    { nom: 'Nord-Kivu', chefLieu: 'Goma', ecoles: 150, eleves: 180000, statut: 'Actif' },
    { nom: 'Ituri', chefLieu: 'Bunia', ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Haut-Uele', chefLieu: 'Isiro', ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Bas-Uele', chefLieu: 'Buta', ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Tshopo', chefLieu: 'Kisangani', ecoles: 110, eleves: 140000, statut: 'Actif' },
    { nom: 'Mongala', chefLieu: 'Lisala', ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Nord-Ubangi', chefLieu: 'Gbadolite', ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Sud-Ubangi', chefLieu: 'Gemena', ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Équateur', chefLieu: 'Mbandaka', ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Tshuapa', chefLieu: 'Boende', ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Haut-Lomami', chefLieu: 'Kamina', ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Lualaba', chefLieu: 'Kolwezi', ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Haut-Katanga', chefLieu: 'Lubumbashi', ecoles: 240, eleves: 320000, statut: 'Actif' },
    { nom: 'Tanganyika', chefLieu: 'Kalemie', ecoles: 0, eleves: 0, statut: 'Actif' },
  ];
  for (const p of provinces) {
    await prisma.province.upsert({ where: { nom: p.nom }, create: p, update: {} });
  }

  // ── Provinces éducationnelles (EPST) : les 60 provinces éducationnelles de la RDC ──
  const provincesEduc = [
    { nom: 'Kinshasa Lukunga', provinceAdministrative: 'Kinshasa', chefLieu: 'Kinshasa', sousDivisions: 13, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kinshasa Funa', provinceAdministrative: 'Kinshasa', chefLieu: 'Kinshasa', sousDivisions: 12, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kinshasa Mont-Amba', provinceAdministrative: 'Kinshasa', chefLieu: 'Kinshasa', sousDivisions: 10, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kinshasa Tshangu', provinceAdministrative: 'Kinshasa', chefLieu: 'Kinshasa', sousDivisions: 10, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kinshasa Plateau', provinceAdministrative: 'Kinshasa', chefLieu: 'Kinshasa', sousDivisions: 8, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kongo Central 1', provinceAdministrative: 'Kongo Central', chefLieu: 'Matadi', sousDivisions: 8, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kongo Central 2', provinceAdministrative: 'Kongo Central', chefLieu: 'Boma', sousDivisions: 7, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kongo Central 3', provinceAdministrative: 'Kongo Central', chefLieu: 'Moanda', sousDivisions: 5, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Bas-Uélé', provinceAdministrative: 'Bas-Uele', chefLieu: 'Buta', sousDivisions: 6, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Équateur 1', provinceAdministrative: 'Équateur', chefLieu: 'Mbandaka', sousDivisions: 23, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Équateur 2', provinceAdministrative: 'Équateur', chefLieu: 'Basankusu', sousDivisions: 15, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Haut-Katanga 1', provinceAdministrative: 'Haut-Katanga', chefLieu: 'Lubumbashi', sousDivisions: 10, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Haut-Katanga 2', provinceAdministrative: 'Haut-Katanga', chefLieu: 'Pweto', sousDivisions: 4, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Haut-Lomami 1', provinceAdministrative: 'Haut-Lomami', chefLieu: 'Kamina', sousDivisions: 12, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Haut-Lomami 2', provinceAdministrative: 'Haut-Lomami', chefLieu: 'Bukama', sousDivisions: 8, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Haut-Uélé 1', provinceAdministrative: 'Haut-Uele', chefLieu: 'Isiro', sousDivisions: 5, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Haut-Uélé 2', provinceAdministrative: 'Haut-Uele', chefLieu: 'Watsa', sousDivisions: 4, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Ituri 1', provinceAdministrative: 'Ituri', chefLieu: 'Bunia', sousDivisions: 8, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Ituri 2', provinceAdministrative: 'Ituri', chefLieu: 'Irumu', sousDivisions: 6, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Ituri 3', provinceAdministrative: 'Ituri', chefLieu: 'Aru', sousDivisions: 5, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kasaï 1', provinceAdministrative: 'Kasaï', chefLieu: 'Tshikapa', sousDivisions: 6, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kasaï 2', provinceAdministrative: 'Kasaï', chefLieu: 'Luebo', sousDivisions: 4, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kasaï-Central 1', provinceAdministrative: 'Kasaï Central', chefLieu: 'Kananga', sousDivisions: 8, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kasaï-Central 2', provinceAdministrative: 'Kasaï Central', chefLieu: 'Tshikapa', sousDivisions: 6, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kasaï-Oriental 1', provinceAdministrative: 'Kasaï Oriental', chefLieu: 'Mbuji-Mayi', sousDivisions: 8, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kasaï-Oriental 2', provinceAdministrative: 'Kasaï Oriental', chefLieu: 'Mbuji-Mayi', sousDivisions: 6, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kwango 1', provinceAdministrative: 'Kwango', chefLieu: 'Kenge', sousDivisions: 5, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kwango 2', provinceAdministrative: 'Kwango', chefLieu: 'Popokabaka', sousDivisions: 4, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kwilu 1', provinceAdministrative: 'Kwilu', chefLieu: 'Bandundu', sousDivisions: 8, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kwilu 2', provinceAdministrative: 'Kwilu', chefLieu: 'Kikwit', sousDivisions: 10, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Kwilu 3', provinceAdministrative: 'Kwilu', chefLieu: 'Bulungu', sousDivisions: 6, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Lomami 1', provinceAdministrative: 'Lomami', chefLieu: 'Kabinda', sousDivisions: 5, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Lomami 2', provinceAdministrative: 'Lomami', chefLieu: 'Ngandajika', sousDivisions: 4, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Lualaba 1', provinceAdministrative: 'Lualaba', chefLieu: 'Kolwezi', sousDivisions: 6, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Lualaba 2', provinceAdministrative: 'Lualaba', chefLieu: 'Likasi', sousDivisions: 4, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Mai-Ndombe 1', provinceAdministrative: 'Mai-Ndombe', chefLieu: 'Inongo', sousDivisions: 6, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Mai-Ndombe 2', provinceAdministrative: 'Mai-Ndombe', chefLieu: 'Oshwe', sousDivisions: 5, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Mai-Ndombe 3', provinceAdministrative: 'Mai-Ndombe', chefLieu: 'Kwamouth', sousDivisions: 4, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Maniema 1', provinceAdministrative: 'Maniema', chefLieu: 'Kindu', sousDivisions: 6, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Maniema 2', provinceAdministrative: 'Maniema', chefLieu: 'Kasongo', sousDivisions: 5, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Mongala 1', provinceAdministrative: 'Mongala', chefLieu: 'Lisala', sousDivisions: 5, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Mongala 2', provinceAdministrative: 'Mongala', chefLieu: 'Bumba', sousDivisions: 4, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Nord-Kivu 1', provinceAdministrative: 'Nord-Kivu', chefLieu: 'Goma', sousDivisions: 8, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Nord-Kivu 2', provinceAdministrative: 'Nord-Kivu', chefLieu: 'Beni', sousDivisions: 6, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Nord-Kivu 3', provinceAdministrative: 'Nord-Kivu', chefLieu: 'Masisi', sousDivisions: 5, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Nord-Ubangi 1', provinceAdministrative: 'Nord-Ubangi', chefLieu: 'Gbadolite', sousDivisions: 5, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Nord-Ubangi 2', provinceAdministrative: 'Nord-Ubangi', chefLieu: 'Yakoma', sousDivisions: 4, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Sankuru 1', provinceAdministrative: 'Sankuru', chefLieu: 'Lusambo', sousDivisions: 6, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Sankuru 2', provinceAdministrative: 'Sankuru', chefLieu: 'Lodja', sousDivisions: 5, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Sud-Kivu 1', provinceAdministrative: 'Sud-Kivu', chefLieu: 'Bukavu', sousDivisions: 8, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Sud-Kivu 2', provinceAdministrative: 'Sud-Kivu', chefLieu: 'Uvira', sousDivisions: 6, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Sud-Kivu 3', provinceAdministrative: 'Sud-Kivu', chefLieu: 'Shabunda', sousDivisions: 5, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Sud-Ubangi 1', provinceAdministrative: 'Sud-Ubangi', chefLieu: 'Gemena', sousDivisions: 5, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Sud-Ubangi 2', provinceAdministrative: 'Sud-Ubangi', chefLieu: 'Libenge', sousDivisions: 4, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Tanganyika 1', provinceAdministrative: 'Tanganyika', chefLieu: 'Kalemie', sousDivisions: 6, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Tanganyika 2', provinceAdministrative: 'Tanganyika', chefLieu: 'Kabalo', sousDivisions: 4, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Tshopo 1', provinceAdministrative: 'Tshopo', chefLieu: 'Kisangani', sousDivisions: 8, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Tshopo 2', provinceAdministrative: 'Tshopo', chefLieu: 'Isangi', sousDivisions: 5, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Tshuapa 1', provinceAdministrative: 'Tshuapa', chefLieu: 'Boende', sousDivisions: 6, ecoles: 0, eleves: 0, statut: 'Actif' },
    { nom: 'Tshuapa 2', provinceAdministrative: 'Tshuapa', chefLieu: 'Bokungu', sousDivisions: 4, ecoles: 0, eleves: 0, statut: 'Actif' },
  ];
  for (const pe of provincesEduc) {
    await prisma.provinceEducationnelle.upsert({ where: { nom: pe.nom }, create: pe, update: {} });
  }

  // ── EC-ERC ──
  const ecErc = [
    { nom: 'EC Kinshasa-Est', type: 'Entité EC', province: 'Kinshasa', nbEcoles: 160, statut: 'Actif' },
    { nom: 'ERC Kinshasa-Ouest', type: 'Entité ERC', province: 'Kinshasa', nbEcoles: 160, statut: 'Actif' },
    { nom: 'EC Lubumbashi', type: 'Entité EC', province: 'Haut-Katanga', nbEcoles: 120, statut: 'Actif' },
    { nom: 'ERC Goma', type: 'Entité ERC', province: 'Nord-Kivu', nbEcoles: 75, statut: 'Actif' },
    { nom: 'EC Matadi', type: 'Entité EC', province: 'Kongo Central', nbEcoles: 90, statut: 'En setup' },
  ];
  for (const e of ecErc) {
    const existing = await prisma.ecErc.findFirst({ where: { nom: e.nom } });
    if (!existing) await prisma.ecErc.create({ data: e });
  }

  // ── Coordination nationale ──
  const coordNat = [
    { province: 'Kinshasa', coordonnateur: 'Dr. Mukendi Kalonji', ecoles: 320, eleves: 485000, statut: 'Actif' },
    { province: 'Haut-Katanga', coordonnateur: 'Prof. Kabeya Tshibangu', ecoles: 240, eleves: 320000, statut: 'Actif' },
    { province: 'Nord-Kivu', coordonnateur: 'M. Mwamba Ilunga', ecoles: 150, eleves: 180000, statut: 'Actif' },
    { province: 'Kongo Central', coordonnateur: 'Mme. Mujinga Tshisekedi', ecoles: 180, eleves: 210000, statut: 'Actif' },
    { province: 'Kwilu', coordonnateur: '', ecoles: 95, eleves: 120000, statut: 'Vacant' },
  ];
  for (const c of coordNat) {
    const existing = await prisma.coordNationale.findFirst({ where: { province: c.province } });
    if (!existing) await prisma.coordNationale.create({ data: c });
  }

  // ── Coordination provinciale ──
  const coordProv = [
    { province: 'Kinshasa', bureaux: 4, agents: 28, dossiers: 1450, statut: 'Actif' },
    { province: 'Haut-Katanga', bureaux: 3, agents: 18, dossiers: 820, statut: 'Actif' },
    { province: 'Nord-Kivu', bureaux: 2, agents: 12, dossiers: 540, statut: 'Actif' },
    { province: 'Kongo Central', bureaux: 2, agents: 10, dossiers: 430, statut: 'Actif' },
  ];
  for (const c of coordProv) {
    const existing = await prisma.coordProvinciale.findFirst({ where: { province: c.province } });
    if (!existing) await prisma.coordProvinciale.create({ data: c });
  }

  // ── Coordination sous-provinciale ──
  const coordSous = [
    { nom: 'Sous-division Lukunga', province: 'Kinshasa', bureaux: 2, agents: 8, statut: 'Actif' },
    { nom: 'Sous-division Tshangu', province: 'Kinshasa', bureaux: 2, agents: 7, statut: 'Actif' },
    { nom: 'Sous-division Likasi', province: 'Haut-Katanga', bureaux: 1, agents: 5, statut: 'Actif' },
    { nom: 'Sous-division Beni', province: 'Nord-Kivu', bureaux: 1, agents: 4, statut: 'En setup' },
  ];
  for (const c of coordSous) {
    const existing = await prisma.coordSousProvinciale.findFirst({ where: { nom: c.nom } });
    if (!existing) await prisma.coordSousProvinciale.create({ data: c });
  }

  // ── Bureaux ──
  const bureaux = [
    { bureau: 'Bureau provincial Kinshasa', fonction: 'Coordination provinciale', titulaire: 'Dr. Mukendi Kalonji', localisation: 'Kinshasa' },
    { bureau: 'Bureau sous-provincial Lukunga', fonction: 'Coordination sous-provinciale', titulaire: 'M. Kabeya', localisation: 'Kinshasa' },
    { bureau: 'Bureau provincial Haut-Katanga', fonction: 'Coordination provinciale', titulaire: 'Prof. Kabeya Tshibangu', localisation: 'Lubumbashi' },
    { bureau: 'Inspection Nord-Kivu', fonction: 'Inspection éducative', titulaire: 'M. Mwamba Ilunga', localisation: 'Goma' },
    { bureau: 'Secrétariat Kongo Central', fonction: 'Secrétariat', titulaire: 'Mme. Mujinga', localisation: 'Matadi' },
  ];
  for (const b of bureaux) {
    const existing = await prisma.bureau.findFirst({ where: { bureau: b.bureau } });
    if (!existing) await prisma.bureau.create({ data: b });
  }

  // ── Grades ──
  const grades = [
    { grade: 'Chef de travaux', categorie: 'Enseignement secondaire', effectif: 120, statut: 'Actif' },
    { grade: 'Professeur', categorie: 'Enseignement secondaire', effectif: 340, statut: 'Actif' },
    { grade: 'Instituteur principal', categorie: 'Enseignement primaire', effectif: 210, statut: 'Actif' },
    { grade: 'Instituteur', categorie: 'Enseignement primaire', effectif: 450, statut: 'Actif' },
    { grade: 'Directeur', categorie: 'Direction', effectif: 85, statut: 'Actif' },
    { grade: 'Inspecteur', categorie: 'Inspection', effectif: 32, statut: 'Actif' },
  ];
  for (const g of grades) {
    const existing = await prisma.grade.findFirst({ where: { grade: g.grade } });
    if (!existing) await prisma.grade.create({ data: g });
  }

  // ── Dossiers ──
  const dossiers = [
    { reference: 'DOS-2026-001', objet: 'Demande de transfert', demandeur: 'Kabongo Mukendi', statut: 'En cours', date: new Date('2026-09-28') },
    { reference: 'DOS-2026-002', objet: 'Certificat de scolarité', demandeur: 'Kasongo Mbuyi', statut: 'Traité', date: new Date('2026-09-25') },
    { reference: 'DOS-2026-003', objet: 'Réclamation de notes', demandeur: 'Tshibangu Kalonji', statut: 'En attente', date: new Date('2026-10-01') },
    { reference: 'DOS-2026-004', objet: 'Inscription tardive', demandeur: 'Mujinga Ilunga', statut: 'En cours', date: new Date('2026-10-02') },
    { reference: 'DOS-2026-005', objet: 'Demande de bourse', demandeur: 'Mbuyi Tshisekedi', statut: 'Rejeté', date: new Date('2026-09-20') },
  ];
  for (const d of dossiers) {
    await prisma.dossier.upsert({ where: { reference: d.reference }, create: d, update: {} });
  }

  // ── Visites ──
  const visites = [
    { date: new Date('2026-10-05'), ecole: 'Institut Tuendelee', visiteur: 'Dr. Mukendi', objet: 'Inspection pédagogique', statut: 'Planifiée' },
    { date: new Date('2026-10-07'), ecole: 'Collège Boboto', visiteur: 'M. Kabeya', objet: 'Suivi administratif', statut: 'Planifiée' },
    { date: new Date('2026-09-30'), ecole: 'École Primaire Bambelo', visiteur: 'Mme. Mujinga', objet: 'Évaluation continue', statut: 'Terminée' },
    { date: new Date('2026-10-10'), ecole: 'Lycée Sainte-Germaine', visiteur: 'M. Mwamba', objet: 'Audit financier', statut: 'Planifiée' },
  ];
  for (const v of visites) {
    const existing = await prisma.visite.findFirst({ where: { ecole: v.ecole, date: v.date } });
    if (!existing) await prisma.visite.create({ data: v });
  }

  // ── Services admin ──
  const services = [
    { service: 'Inscriptions', procedures: 12, dossiers: 340, statut: 'Actif' },
    { service: 'Examens & évaluations', procedures: 8, dossiers: 210, statut: 'Actif' },
    { service: 'Transferts', procedures: 5, dossiers: 85, statut: 'Actif' },
    { service: 'Certifications', procedures: 6, dossiers: 120, statut: 'Actif' },
    { service: 'Bourses & aides', procedures: 4, dossiers: 65, statut: 'En pause' },
  ];
  for (const s of services) {
    const existing = await prisma.serviceAdmin.findFirst({ where: { service: s.service } });
    if (!existing) await prisma.serviceAdmin.create({ data: s });
  }

  // ── Notifications ──
  const notifications = [
    { titre: 'Nouvel élève inscrit', message: 'Kabongo Mukendi Jean a été inscrit en 6ème primaire.', type: 'Inscription', lu: false },
    { titre: 'Visite planifiée', message: "Inspection pédagogique à l'Institut Tuendelee le 05/10.", type: 'Visite', lu: false },
    { titre: 'Notes publiées', message: 'Les notes du 1er trimestre de 4ème secondaire sont disponibles.', type: 'Évaluation', lu: true },
    { titre: 'Dossier traité', message: 'Le dossier DOS-2026-002 a été traité.', type: 'Dossier', lu: true },
    { titre: 'Nouvel enseignant', message: "Kasongo Mbuyi a rejoint l'École Maman Mobali.", type: 'Personnel', lu: true },
  ];
  for (const n of notifications) {
    const existing = await prisma.notification.findFirst({ where: { titre: n.titre } });
    if (!existing) await prisma.notification.create({ data: n });
  }

  // ── Paiements ──
  const paiements = [
    { reference: 'PAY-2026-001', description: 'Abonnement Premium — École', montant: '25 000 FC', date: new Date('2026-10-01'), statut: 'Payé' },
    { reference: 'PAY-2026-002', description: 'Frais de scolarité — 6ème primaire', montant: '45 000 FC', date: new Date('2026-09-28'), statut: 'Payé' },
    { reference: 'PAY-2026-003', description: 'Cartes scolaires (lot 50)', montant: '15 000 FC', date: new Date('2026-09-25'), statut: 'Payé' },
    { reference: 'PAY-2026-004', description: 'Abonnement Premium — École', montant: '25 000 FC', date: new Date('2026-09-01'), statut: 'En attente' },
    { reference: 'PAY-2026-005', description: "Frais d'examen — 3ème secondaire", montant: '30 000 FC', date: new Date('2026-08-28'), statut: 'Rejeté' },
  ];
  for (const p of paiements) {
    await prisma.paiement.upsert({ where: { reference: p.reference }, create: p, update: {} });
  }

  // ── Notes ──
  const notes = [
    { eleve: 'Kabongo Mukendi Jean', classe: '6ème primaire', devoir1: '14/20', devoir2: '16/20', examen: '15/20', moyenne: '15.0/20', mention: 'Distinction' },
    { eleve: 'Kasongo Mbuyi Sarah', classe: '4ème secondaire', devoir1: '12/20', devoir2: '10/20', examen: '13/20', moyenne: '11.7/20', mention: 'Satisfaction' },
    { eleve: 'Tshibangu Kalonji Paul', classe: '3ème secondaire', devoir1: '8/20', devoir2: '11/20', examen: '9/20', moyenne: '9.3/20', mention: 'Insuffisant' },
    { eleve: 'Mujinga Ilunga Grace', classe: '5ème primaire', devoir1: '18/20', devoir2: '17/20', examen: '19/20', moyenne: '18.0/20', mention: 'Grande distinction' },
    { eleve: 'Mbuyi Tshisekedi Eric', classe: '6ème secondaire', devoir1: '15/20', devoir2: '13/20', examen: '14/20', moyenne: '14.0/20', mention: 'Distinction' },
  ];
  for (const n of notes) {
    const existing = await prisma.note.findFirst({ where: { eleve: n.eleve } });
    if (!existing) await prisma.note.create({ data: n });
  }

  // ── Sous-divisions éducationnelles ──
  for (const sd of SOUS_DIVISIONS_RDC) {
    const existing = await prisma.sousDivisionEducationnelle.findFirst({
      where: { nom: sd.nom, provinceEducationnelle: sd.provinceEducationnelle },
    });
    if (!existing) {
      await prisma.sousDivisionEducationnelle.create({
        data: {
          nom: sd.nom,
          provinceEducationnelle: sd.provinceEducationnelle,
          provinceAdministrative: sd.provinceAdministrative,
          lieuImplantation: sd.lieuImplantation,
          ecoles: 0,
          eleves: 0,
          statut: 'Actif',
        },
      });
    }
  }
  console.log(`Seed terminé : ${SOUS_DIVISIONS_RDC.length} sous-divisions éducationnelles insérées.`);

  // ── Classes & Niveaux du curriculum national RDC ──
  for (const c of CLASSES_RDC) {
    const existing = await prisma.classeRdc.findUnique({ where: { nom: c.nom } });
    if (!existing) {
      await prisma.classeRdc.create({
        data: { nom: c.nom, cycle: c.cycle, ordre: c.ordre, diplome: c.diplome, statut: c.statut },
      });
    }
  }
  console.log(`Seed terminé : ${CLASSES_RDC.length} classes du curriculum national insérées.`);

  // ── Matières & Cours du programme national RDC ──
  for (const m of MATIERES_RDC) {
    const existing = await prisma.matiereRdc.findFirst({
      where: { nom: m.nom, cycle: m.cycle },
    });
    if (!existing) {
      await prisma.matiereRdc.create({
        data: { nom: m.nom, cycle: m.cycle, domaine: m.domaine, coefficient: m.coefficient, statut: m.statut },
      });
    }
  }
  console.log(`Seed terminé : ${MATIERES_RDC.length} matières du programme national insérées.`);

  // ── Options & Sections du secondaire congolais ──
  for (const o of OPTIONS_RDC) {
    const existing = await prisma.optionRdc.findFirst({
      where: { nom: o.nom, cycle: o.cycle },
    });
    if (!existing) {
      await prisma.optionRdc.create({
        data: { nom: o.nom, cycle: o.cycle, type: o.type, description: o.description, statut: o.statut },
      });
    }
  }
  console.log(`Seed terminé : ${OPTIONS_RDC.length} options et sections insérées.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
