-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'ADMIN_SCHOOL_MANAGER_RDC';
ALTER TYPE "Role" ADD VALUE 'PROMOTEUR';
ALTER TYPE "Role" ADD VALUE 'SECRETAIRE';
ALTER TYPE "Role" ADD VALUE 'COMPTABLE';
ALTER TYPE "Role" ADD VALUE 'VISITEUR';

-- DropForeignKey
ALTER TABLE "eleves" DROP CONSTRAINT "eleves_etablissementId_fkey";

-- DropIndex
DROP INDEX "eleves_etablissementId_idx";

-- DropIndex
DROP INDEX "enseignants_etablissement_idx";

-- DropIndex
DROP INDEX "visites_etablissement_idx";

-- AlterTable
ALTER TABLE "coord_nationale" ADD COLUMN     "institution" TEXT NOT NULL DEFAULT 'EC_ERC';

-- AlterTable
ALTER TABLE "coord_provinciale" ADD COLUMN     "institution" TEXT NOT NULL DEFAULT 'EC_ERC';

-- AlterTable
ALTER TABLE "coord_sous_provinciale" ADD COLUMN     "coordProvincialeId" TEXT,
ADD COLUMN     "institution" TEXT NOT NULL DEFAULT 'EC_ERC';

-- AlterTable
ALTER TABLE "ec_erc" DROP COLUMN "ecoles",
ADD COLUMN     "institution" TEXT NOT NULL DEFAULT 'EC_ERC',
ADD COLUMN     "nbEcoles" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "eleves" DROP COLUMN "etablissementId",
ADD COLUMN     "ecoleId" TEXT,
ADD COLUMN     "emailTuteur" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "enseignants" DROP COLUMN "etablissement",
ADD COLUMN     "ecole" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ecoleId" TEXT;

-- AlterTable
ALTER TABLE "presences" ADD COLUMN     "anneeScolaire" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ecoleId" TEXT,
ADD COLUMN     "enseignantId" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "heureArrivee" TIMESTAMP(3),
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "matiere" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "seanceId" TEXT,
ADD COLUMN     "statut" TEXT NOT NULL DEFAULT 'PRESENT';

-- AlterTable
ALTER TABLE "provinces" DROP COLUMN "etablissements",
ADD COLUMN     "ecoles" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "classe" TEXT,
ADD COLUMN     "coordSousProvincialeId" TEXT,
ADD COLUMN     "ecoleId" TEXT,
ADD COLUMN     "userStatus" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "visites" DROP COLUMN "etablissement",
ADD COLUMN     "ecole" TEXT NOT NULL;

-- DropTable
DROP TABLE "etablissements";

-- CreateTable
CREATE TABLE "cours" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'cours',
    "classe" TEXT NOT NULL,
    "eleveId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "heureDebut" TEXT NOT NULL DEFAULT '',
    "heureFin" TEXT NOT NULL DEFAULT '',
    "salle" TEXT NOT NULL DEFAULT '',
    "enseignant" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "couleur" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossier_eleve_documents" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT '',
    "titre" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL DEFAULT '',
    "fileType" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "uploadedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dossier_eleve_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossier_eleve_resultats" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "matiere" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "moyenne" TEXT NOT NULL DEFAULT '',
    "mention" TEXT NOT NULL DEFAULT '',
    "appreciation" TEXT NOT NULL DEFAULT '',
    "anneeScolaire" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dossier_eleve_resultats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossier_eleve_interactions" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intervenant" TEXT NOT NULL DEFAULT '',
    "statut" TEXT NOT NULL DEFAULT 'Enregistré',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dossier_eleve_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seances_presence" (
    "id" TEXT NOT NULL,
    "classe" TEXT NOT NULL,
    "matiere" TEXT NOT NULL DEFAULT '',
    "enseignantId" TEXT NOT NULL DEFAULT '',
    "enseignantNom" TEXT NOT NULL DEFAULT '',
    "ecoleId" TEXT,
    "anneeScolaire" TEXT NOT NULL DEFAULT '',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heureDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "heureFin" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'EN_COURS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seances_presence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecoles" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT '',
    "institution" TEXT NOT NULL DEFAULT 'EC_ERC',
    "dinacope" TEXT NOT NULL DEFAULT '',
    "province" TEXT NOT NULL DEFAULT '',
    "provinceEducationnelle" TEXT NOT NULL DEFAULT '',
    "ville" TEXT NOT NULL DEFAULT '',
    "commune" TEXT NOT NULL DEFAULT '',
    "adresse" TEXT NOT NULL DEFAULT '',
    "localisationGeo" TEXT NOT NULL DEFAULT '',
    "telephone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "chefEcole" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "identifiantSM" TEXT,
    "effectif" INTEGER NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "statutValidation" TEXT NOT NULL DEFAULT 'Brouillon',
    "structureRattachementId" TEXT,
    "structureRattachementType" TEXT NOT NULL DEFAULT '',
    "coordSousProvincialeId" TEXT,
    "ecErcId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ecoles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecole_documents" (
    "id" TEXT NOT NULL,
    "ecoleId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT '',
    "titre" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL DEFAULT '',
    "fileType" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ecole_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecole_document_audits" (
    "id" TEXT NOT NULL,
    "ecoleId" TEXT NOT NULL,
    "documentId" TEXT,
    "documentTitre" TEXT NOT NULL DEFAULT '',
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT '',
    "userName" TEXT NOT NULL DEFAULT '',
    "userRole" TEXT NOT NULL DEFAULT '',
    "commentaire" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ecole_document_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ecole_validation_logs" (
    "id" TEXT NOT NULL,
    "ecoleId" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "commentaire" TEXT NOT NULL DEFAULT '',
    "validateurId" TEXT,
    "validateurNom" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ecole_validation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enseignant_affectations" (
    "id" TEXT NOT NULL,
    "enseignantId" TEXT NOT NULL,
    "ecoleId" TEXT,
    "classe" TEXT NOT NULL,
    "matiere" TEXT NOT NULL DEFAULT '',
    "niveau" TEXT NOT NULL DEFAULT '',
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enseignant_affectations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces_educationnelles" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "provinceAdministrative" TEXT NOT NULL DEFAULT '',
    "chefLieu" TEXT NOT NULL DEFAULT '',
    "sousDivisions" INTEGER NOT NULL DEFAULT 0,
    "ecoles" INTEGER NOT NULL DEFAULT 0,
    "eleves" INTEGER NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provinces_educationnelles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sous_divisions_educationnelles" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "provinceEducationnelle" TEXT NOT NULL DEFAULT '',
    "provinceAdministrative" TEXT NOT NULL DEFAULT '',
    "lieuImplantation" TEXT NOT NULL DEFAULT '',
    "ecoles" INTEGER NOT NULL DEFAULT 0,
    "eleves" INTEGER NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sous_divisions_educationnelles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes_rdc" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "cycle" TEXT NOT NULL DEFAULT '',
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "diplome" TEXT NOT NULL DEFAULT '',
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_rdc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matieres_rdc" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "cycle" TEXT NOT NULL DEFAULT '',
    "domaine" TEXT NOT NULL DEFAULT '',
    "coefficient" INTEGER NOT NULL DEFAULT 1,
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matieres_rdc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "options_rdc" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "cycle" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'Section',
    "description" TEXT NOT NULL DEFAULT '',
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "options_rdc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_conversations" (
    "id" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "replyToId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_calls" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "callerId" TEXT NOT NULL,
    "calleeId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'audio',
    "status" TEXT NOT NULL DEFAULT 'ringing',
    "offer" TEXT NOT NULL DEFAULT '',
    "answer" TEXT NOT NULL DEFAULT '',
    "callerIce" TEXT NOT NULL DEFAULT '[]',
    "calleeIce" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "classe" TEXT NOT NULL,
    "ecoleId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_group_members" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_group_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_group_messages" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileType" TEXT,
    "replyToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_group_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cahier_de_cote" (
    "id" TEXT NOT NULL,
    "ecoleId" TEXT,
    "ecoleNom" TEXT NOT NULL DEFAULT '',
    "classe" TEXT NOT NULL,
    "cours" TEXT NOT NULL,
    "enseignantNom" TEXT NOT NULL DEFAULT '',
    "periode" TEXT NOT NULL,
    "anneeScolaire" TEXT NOT NULL DEFAULT '',
    "eleveId" TEXT NOT NULL,
    "eleveMatricule" TEXT NOT NULL DEFAULT '',
    "eleveNom" TEXT NOT NULL,
    "devoir1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "devoir2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "examen" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "moyenne" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pourcentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mention" TEXT NOT NULL DEFAULT '',
    "statut" TEXT NOT NULL DEFAULT 'Brouillon',
    "saisiePar" TEXT NOT NULL DEFAULT '',
    "saisieParId" TEXT NOT NULL DEFAULT '',
    "validePar" TEXT NOT NULL DEFAULT '',
    "valideParId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cahier_de_cote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cahier_de_cote_history" (
    "id" TEXT NOT NULL,
    "cahierDeCoteId" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT '',
    "champModifie" TEXT NOT NULL DEFAULT '',
    "ancienneValeur" TEXT NOT NULL DEFAULT '',
    "nouvelleValeur" TEXT NOT NULL DEFAULT '',
    "modifiePar" TEXT NOT NULL DEFAULT '',
    "modifieParId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cahier_de_cote_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rappels_cotes" (
    "id" TEXT NOT NULL,
    "enseignantNom" TEXT NOT NULL,
    "enseignantEmail" TEXT NOT NULL DEFAULT '',
    "ecole" TEXT NOT NULL DEFAULT '',
    "classe" TEXT NOT NULL DEFAULT '',
    "cours" TEXT NOT NULL DEFAULT '',
    "periode" TEXT NOT NULL,
    "anneeScolaire" TEXT NOT NULL DEFAULT '',
    "statut" TEXT NOT NULL DEFAULT 'envoyé',
    "messageErreur" TEXT NOT NULL DEFAULT '',
    "declenchePar" TEXT NOT NULL DEFAULT '',
    "declencheParId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rappels_cotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulletins" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "eleveMatricule" TEXT NOT NULL DEFAULT '',
    "eleveNom" TEXT NOT NULL,
    "classe" TEXT NOT NULL,
    "ecoleId" TEXT,
    "ecoleNom" TEXT NOT NULL DEFAULT '',
    "periode" TEXT NOT NULL,
    "anneeScolaire" TEXT NOT NULL DEFAULT '',
    "donnees" TEXT NOT NULL DEFAULT '[]',
    "moyenneGenerale" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pourcentageGeneral" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mentionGenerale" TEXT NOT NULL DEFAULT '',
    "qrToken" TEXT NOT NULL,
    "qrDataUrl" TEXT NOT NULL DEFAULT '',
    "generePar" TEXT NOT NULL DEFAULT '',
    "genereParId" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulletins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pointages_enseignant" (
    "id" TEXT NOT NULL,
    "enseignantId" TEXT NOT NULL,
    "ecoleId" TEXT,
    "jour" TEXT NOT NULL,
    "heureArrivee" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'PRESENT',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "scannedValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pointages_enseignant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT '',
    "userRole" TEXT NOT NULL DEFAULT '',
    "userName" TEXT NOT NULL DEFAULT '',
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL DEFAULT '',
    "resource" TEXT NOT NULL DEFAULT '',
    "resourceId" TEXT NOT NULL DEFAULT '',
    "result" TEXT NOT NULL DEFAULT 'success',
    "details" TEXT NOT NULL DEFAULT '',
    "ipAddress" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cours_date_idx" ON "cours"("date");

-- CreateIndex
CREATE INDEX "cours_classe_idx" ON "cours"("classe");

-- CreateIndex
CREATE INDEX "cours_eleveId_idx" ON "cours"("eleveId");

-- CreateIndex
CREATE INDEX "dossier_eleve_documents_eleveId_idx" ON "dossier_eleve_documents"("eleveId");

-- CreateIndex
CREATE INDEX "dossier_eleve_documents_type_idx" ON "dossier_eleve_documents"("type");

-- CreateIndex
CREATE INDEX "dossier_eleve_resultats_eleveId_idx" ON "dossier_eleve_resultats"("eleveId");

-- CreateIndex
CREATE INDEX "dossier_eleve_resultats_periode_idx" ON "dossier_eleve_resultats"("periode");

-- CreateIndex
CREATE INDEX "dossier_eleve_resultats_anneeScolaire_idx" ON "dossier_eleve_resultats"("anneeScolaire");

-- CreateIndex
CREATE INDEX "dossier_eleve_interactions_eleveId_idx" ON "dossier_eleve_interactions"("eleveId");

-- CreateIndex
CREATE INDEX "dossier_eleve_interactions_type_idx" ON "dossier_eleve_interactions"("type");

-- CreateIndex
CREATE INDEX "dossier_eleve_interactions_date_idx" ON "dossier_eleve_interactions"("date");

-- CreateIndex
CREATE INDEX "seances_presence_classe_idx" ON "seances_presence"("classe");

-- CreateIndex
CREATE INDEX "seances_presence_enseignantId_idx" ON "seances_presence"("enseignantId");

-- CreateIndex
CREATE INDEX "seances_presence_date_idx" ON "seances_presence"("date");

-- CreateIndex
CREATE INDEX "seances_presence_statut_idx" ON "seances_presence"("statut");

-- CreateIndex
CREATE INDEX "seances_presence_ecoleId_idx" ON "seances_presence"("ecoleId");

-- CreateIndex
CREATE UNIQUE INDEX "ecoles_identifiantSM_key" ON "ecoles"("identifiantSM");

-- CreateIndex
CREATE INDEX "ecoles_province_idx" ON "ecoles"("province");

-- CreateIndex
CREATE INDEX "ecoles_type_idx" ON "ecoles"("type");

-- CreateIndex
CREATE INDEX "ecoles_institution_idx" ON "ecoles"("institution");

-- CreateIndex
CREATE INDEX "ecoles_statutValidation_idx" ON "ecoles"("statutValidation");

-- CreateIndex
CREATE INDEX "ecoles_coordSousProvincialeId_idx" ON "ecoles"("coordSousProvincialeId");

-- CreateIndex
CREATE INDEX "ecoles_ecErcId_idx" ON "ecoles"("ecErcId");

-- CreateIndex
CREATE INDEX "ecole_documents_ecoleId_idx" ON "ecole_documents"("ecoleId");

-- CreateIndex
CREATE INDEX "ecole_documents_type_idx" ON "ecole_documents"("type");

-- CreateIndex
CREATE INDEX "ecole_document_audits_ecoleId_idx" ON "ecole_document_audits"("ecoleId");

-- CreateIndex
CREATE INDEX "ecole_document_audits_documentId_idx" ON "ecole_document_audits"("documentId");

-- CreateIndex
CREATE INDEX "ecole_document_audits_action_idx" ON "ecole_document_audits"("action");

-- CreateIndex
CREATE INDEX "ecole_document_audits_createdAt_idx" ON "ecole_document_audits"("createdAt");

-- CreateIndex
CREATE INDEX "ecole_validation_logs_ecoleId_idx" ON "ecole_validation_logs"("ecoleId");

-- CreateIndex
CREATE INDEX "ecole_validation_logs_statut_idx" ON "ecole_validation_logs"("statut");

-- CreateIndex
CREATE INDEX "enseignant_affectations_enseignantId_idx" ON "enseignant_affectations"("enseignantId");

-- CreateIndex
CREATE INDEX "enseignant_affectations_classe_idx" ON "enseignant_affectations"("classe");

-- CreateIndex
CREATE INDEX "enseignant_affectations_ecoleId_idx" ON "enseignant_affectations"("ecoleId");

-- CreateIndex
CREATE UNIQUE INDEX "enseignant_affectations_enseignantId_classe_matiere_key" ON "enseignant_affectations"("enseignantId", "classe", "matiere");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_educationnelles_nom_key" ON "provinces_educationnelles"("nom");

-- CreateIndex
CREATE INDEX "provinces_educationnelles_nom_idx" ON "provinces_educationnelles"("nom");

-- CreateIndex
CREATE INDEX "provinces_educationnelles_provinceAdministrative_idx" ON "provinces_educationnelles"("provinceAdministrative");

-- CreateIndex
CREATE INDEX "sous_divisions_educationnelles_provinceEducationnelle_idx" ON "sous_divisions_educationnelles"("provinceEducationnelle");

-- CreateIndex
CREATE INDEX "sous_divisions_educationnelles_provinceAdministrative_idx" ON "sous_divisions_educationnelles"("provinceAdministrative");

-- CreateIndex
CREATE UNIQUE INDEX "sous_divisions_educationnelles_nom_provinceEducationnelle_key" ON "sous_divisions_educationnelles"("nom", "provinceEducationnelle");

-- CreateIndex
CREATE UNIQUE INDEX "classes_rdc_nom_key" ON "classes_rdc"("nom");

-- CreateIndex
CREATE INDEX "classes_rdc_cycle_idx" ON "classes_rdc"("cycle");

-- CreateIndex
CREATE INDEX "classes_rdc_ordre_idx" ON "classes_rdc"("ordre");

-- CreateIndex
CREATE INDEX "matieres_rdc_cycle_idx" ON "matieres_rdc"("cycle");

-- CreateIndex
CREATE INDEX "matieres_rdc_domaine_idx" ON "matieres_rdc"("domaine");

-- CreateIndex
CREATE UNIQUE INDEX "matieres_rdc_nom_cycle_key" ON "matieres_rdc"("nom", "cycle");

-- CreateIndex
CREATE INDEX "options_rdc_cycle_idx" ON "options_rdc"("cycle");

-- CreateIndex
CREATE INDEX "options_rdc_type_idx" ON "options_rdc"("type");

-- CreateIndex
CREATE UNIQUE INDEX "options_rdc_nom_cycle_key" ON "options_rdc"("nom", "cycle");

-- CreateIndex
CREATE INDEX "chat_conversations_user1Id_idx" ON "chat_conversations"("user1Id");

-- CreateIndex
CREATE INDEX "chat_conversations_user2Id_idx" ON "chat_conversations"("user2Id");

-- CreateIndex
CREATE UNIQUE INDEX "chat_conversations_user1Id_user2Id_key" ON "chat_conversations"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "chat_messages_conversationId_idx" ON "chat_messages"("conversationId");

-- CreateIndex
CREATE INDEX "chat_messages_senderId_idx" ON "chat_messages"("senderId");

-- CreateIndex
CREATE INDEX "chat_messages_read_idx" ON "chat_messages"("read");

-- CreateIndex
CREATE INDEX "chat_calls_conversationId_idx" ON "chat_calls"("conversationId");

-- CreateIndex
CREATE INDEX "chat_calls_calleeId_idx" ON "chat_calls"("calleeId");

-- CreateIndex
CREATE INDEX "chat_calls_status_idx" ON "chat_calls"("status");

-- CreateIndex
CREATE INDEX "chat_groups_classe_idx" ON "chat_groups"("classe");

-- CreateIndex
CREATE INDEX "chat_groups_ecoleId_idx" ON "chat_groups"("ecoleId");

-- CreateIndex
CREATE INDEX "chat_groups_createdById_idx" ON "chat_groups"("createdById");

-- CreateIndex
CREATE INDEX "chat_group_members_groupId_idx" ON "chat_group_members"("groupId");

-- CreateIndex
CREATE INDEX "chat_group_members_userId_idx" ON "chat_group_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "chat_group_members_groupId_userId_key" ON "chat_group_members"("groupId", "userId");

-- CreateIndex
CREATE INDEX "chat_group_messages_groupId_idx" ON "chat_group_messages"("groupId");

-- CreateIndex
CREATE INDEX "chat_group_messages_senderId_idx" ON "chat_group_messages"("senderId");

-- CreateIndex
CREATE INDEX "cahier_de_cote_ecoleId_idx" ON "cahier_de_cote"("ecoleId");

-- CreateIndex
CREATE INDEX "cahier_de_cote_classe_idx" ON "cahier_de_cote"("classe");

-- CreateIndex
CREATE INDEX "cahier_de_cote_cours_idx" ON "cahier_de_cote"("cours");

-- CreateIndex
CREATE INDEX "cahier_de_cote_periode_idx" ON "cahier_de_cote"("periode");

-- CreateIndex
CREATE INDEX "cahier_de_cote_anneeScolaire_idx" ON "cahier_de_cote"("anneeScolaire");

-- CreateIndex
CREATE INDEX "cahier_de_cote_eleveId_idx" ON "cahier_de_cote"("eleveId");

-- CreateIndex
CREATE INDEX "cahier_de_cote_statut_idx" ON "cahier_de_cote"("statut");

-- CreateIndex
CREATE UNIQUE INDEX "cahier_de_cote_eleveId_cours_periode_anneeScolaire_key" ON "cahier_de_cote"("eleveId", "cours", "periode", "anneeScolaire");

-- CreateIndex
CREATE INDEX "cahier_de_cote_history_cahierDeCoteId_idx" ON "cahier_de_cote_history"("cahierDeCoteId");

-- CreateIndex
CREATE INDEX "cahier_de_cote_history_action_idx" ON "cahier_de_cote_history"("action");

-- CreateIndex
CREATE INDEX "rappels_cotes_enseignantNom_idx" ON "rappels_cotes"("enseignantNom");

-- CreateIndex
CREATE INDEX "rappels_cotes_periode_idx" ON "rappels_cotes"("periode");

-- CreateIndex
CREATE INDEX "rappels_cotes_anneeScolaire_idx" ON "rappels_cotes"("anneeScolaire");

-- CreateIndex
CREATE INDEX "rappels_cotes_statut_idx" ON "rappels_cotes"("statut");

-- CreateIndex
CREATE INDEX "rappels_cotes_createdAt_idx" ON "rappels_cotes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "bulletins_qrToken_key" ON "bulletins"("qrToken");

-- CreateIndex
CREATE INDEX "bulletins_eleveId_idx" ON "bulletins"("eleveId");

-- CreateIndex
CREATE INDEX "bulletins_periode_idx" ON "bulletins"("periode");

-- CreateIndex
CREATE INDEX "bulletins_anneeScolaire_idx" ON "bulletins"("anneeScolaire");

-- CreateIndex
CREATE INDEX "bulletins_ecoleId_idx" ON "bulletins"("ecoleId");

-- CreateIndex
CREATE INDEX "bulletins_qrToken_idx" ON "bulletins"("qrToken");

-- CreateIndex
CREATE INDEX "pointages_enseignant_enseignantId_idx" ON "pointages_enseignant"("enseignantId");

-- CreateIndex
CREATE INDEX "pointages_enseignant_jour_idx" ON "pointages_enseignant"("jour");

-- CreateIndex
CREATE INDEX "pointages_enseignant_ecoleId_idx" ON "pointages_enseignant"("ecoleId");

-- CreateIndex
CREATE UNIQUE INDEX "pointages_enseignant_enseignantId_jour_key" ON "pointages_enseignant"("enseignantId", "jour");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_module_idx" ON "audit_logs"("module");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "coord_nationale_institution_idx" ON "coord_nationale"("institution");

-- CreateIndex
CREATE INDEX "coord_provinciale_institution_idx" ON "coord_provinciale"("institution");

-- CreateIndex
CREATE INDEX "coord_sous_provinciale_institution_idx" ON "coord_sous_provinciale"("institution");

-- CreateIndex
CREATE INDEX "coord_sous_provinciale_coordProvincialeId_idx" ON "coord_sous_provinciale"("coordProvincialeId");

-- CreateIndex
CREATE INDEX "ec_erc_institution_idx" ON "ec_erc"("institution");

-- CreateIndex
CREATE INDEX "eleves_ecoleId_idx" ON "eleves"("ecoleId");

-- CreateIndex
CREATE INDEX "enseignants_ecole_idx" ON "enseignants"("ecole");

-- CreateIndex
CREATE INDEX "enseignants_ecoleId_idx" ON "enseignants"("ecoleId");

-- CreateIndex
CREATE INDEX "presences_statut_idx" ON "presences"("statut");

-- CreateIndex
CREATE INDEX "presences_seanceId_idx" ON "presences"("seanceId");

-- CreateIndex
CREATE INDEX "presences_enseignantId_idx" ON "presences"("enseignantId");

-- CreateIndex
CREATE INDEX "users_userStatus_idx" ON "users"("userStatus");

-- CreateIndex
CREATE INDEX "users_coordSousProvincialeId_idx" ON "users"("coordSousProvincialeId");

-- CreateIndex
CREATE INDEX "users_ecoleId_idx" ON "users"("ecoleId");

-- CreateIndex
CREATE INDEX "users_classe_idx" ON "users"("classe");

-- CreateIndex
CREATE INDEX "visites_ecole_idx" ON "visites"("ecole");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_coordSousProvincialeId_fkey" FOREIGN KEY ("coordSousProvincialeId") REFERENCES "coord_sous_provinciale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_ecoleId_fkey" FOREIGN KEY ("ecoleId") REFERENCES "ecoles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_ecoleId_fkey" FOREIGN KEY ("ecoleId") REFERENCES "ecoles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cours" ADD CONSTRAINT "cours_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_eleve_documents" ADD CONSTRAINT "dossier_eleve_documents_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_eleve_resultats" ADD CONSTRAINT "dossier_eleve_resultats_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_eleve_interactions" ADD CONSTRAINT "dossier_eleve_interactions_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presences" ADD CONSTRAINT "presences_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "seances_presence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecoles" ADD CONSTRAINT "ecoles_coordSousProvincialeId_fkey" FOREIGN KEY ("coordSousProvincialeId") REFERENCES "coord_sous_provinciale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecoles" ADD CONSTRAINT "ecoles_ecErcId_fkey" FOREIGN KEY ("ecErcId") REFERENCES "ec_erc"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecole_documents" ADD CONSTRAINT "ecole_documents_ecoleId_fkey" FOREIGN KEY ("ecoleId") REFERENCES "ecoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecole_document_audits" ADD CONSTRAINT "ecole_document_audits_ecoleId_fkey" FOREIGN KEY ("ecoleId") REFERENCES "ecoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ecole_validation_logs" ADD CONSTRAINT "ecole_validation_logs_ecoleId_fkey" FOREIGN KEY ("ecoleId") REFERENCES "ecoles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enseignants" ADD CONSTRAINT "enseignants_ecoleId_fkey" FOREIGN KEY ("ecoleId") REFERENCES "ecoles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enseignant_affectations" ADD CONSTRAINT "enseignant_affectations_enseignantId_fkey" FOREIGN KEY ("enseignantId") REFERENCES "enseignants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enseignant_affectations" ADD CONSTRAINT "enseignant_affectations_ecoleId_fkey" FOREIGN KEY ("ecoleId") REFERENCES "ecoles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coord_sous_provinciale" ADD CONSTRAINT "coord_sous_provinciale_coordProvincialeId_fkey" FOREIGN KEY ("coordProvincialeId") REFERENCES "coord_provinciale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_groups" ADD CONSTRAINT "chat_groups_ecoleId_fkey" FOREIGN KEY ("ecoleId") REFERENCES "ecoles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_groups" ADD CONSTRAINT "chat_groups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_group_members" ADD CONSTRAINT "chat_group_members_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "chat_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_group_members" ADD CONSTRAINT "chat_group_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_group_messages" ADD CONSTRAINT "chat_group_messages_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "chat_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_group_messages" ADD CONSTRAINT "chat_group_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cahier_de_cote" ADD CONSTRAINT "cahier_de_cote_ecoleId_fkey" FOREIGN KEY ("ecoleId") REFERENCES "ecoles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cahier_de_cote" ADD CONSTRAINT "cahier_de_cote_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cahier_de_cote_history" ADD CONSTRAINT "cahier_de_cote_history_cahierDeCoteId_fkey" FOREIGN KEY ("cahierDeCoteId") REFERENCES "cahier_de_cote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulletins" ADD CONSTRAINT "bulletins_ecoleId_fkey" FOREIGN KEY ("ecoleId") REFERENCES "ecoles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

