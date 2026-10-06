-- AlterTable
ALTER TABLE "users" ADD COLUMN     "validationCode" TEXT,
ALTER COLUMN "isActive" SET DEFAULT false;

-- CreateTable
CREATE TABLE "presences" (
    "id" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "present" BOOLEAN NOT NULL DEFAULT true,
    "classe" TEXT NOT NULL,

    CONSTRAINT "presences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enseignants" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "grade" TEXT NOT NULL DEFAULT '',
    "etablissement" TEXT NOT NULL DEFAULT '',
    "specialite" TEXT NOT NULL DEFAULT '',
    "telephone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enseignants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "chefLieu" TEXT NOT NULL DEFAULT '',
    "etablissements" INTEGER NOT NULL DEFAULT 0,
    "eleves" INTEGER NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ec_erc" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT '',
    "province" TEXT NOT NULL DEFAULT '',
    "ecoles" INTEGER NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ec_erc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coord_nationale" (
    "id" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "coordonnateur" TEXT NOT NULL DEFAULT '',
    "ecoles" INTEGER NOT NULL DEFAULT 0,
    "eleves" INTEGER NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coord_nationale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coord_provinciale" (
    "id" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "bureaux" INTEGER NOT NULL DEFAULT 0,
    "agents" INTEGER NOT NULL DEFAULT 0,
    "dossiers" INTEGER NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coord_provinciale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coord_sous_provinciale" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT '',
    "bureaux" INTEGER NOT NULL DEFAULT 0,
    "agents" INTEGER NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coord_sous_provinciale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bureaux" (
    "id" TEXT NOT NULL,
    "bureau" TEXT NOT NULL,
    "fonction" TEXT NOT NULL DEFAULT '',
    "titulaire" TEXT NOT NULL DEFAULT '',
    "localisation" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bureaux_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "categorie" TEXT NOT NULL DEFAULT '',
    "effectif" INTEGER NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossiers" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "objet" TEXT NOT NULL,
    "demandeur" TEXT NOT NULL DEFAULT '',
    "statut" TEXT NOT NULL DEFAULT 'En attente',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visites" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etablissement" TEXT NOT NULL,
    "visiteur" TEXT NOT NULL DEFAULT '',
    "objet" TEXT NOT NULL DEFAULT '',
    "statut" TEXT NOT NULL DEFAULT 'Planifiée',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services_admin" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "procedures" INTEGER NOT NULL DEFAULT 0,
    "dossiers" INTEGER NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT '',
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiements" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "montant" TEXT NOT NULL DEFAULT '',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" TEXT NOT NULL DEFAULT 'En attente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "paiements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "eleve" TEXT NOT NULL,
    "classe" TEXT NOT NULL DEFAULT '',
    "devoir1" TEXT NOT NULL DEFAULT '',
    "devoir2" TEXT NOT NULL DEFAULT '',
    "examen" TEXT NOT NULL DEFAULT '',
    "moyenne" TEXT NOT NULL DEFAULT '',
    "mention" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "presences_eleveId_idx" ON "presences"("eleveId");

-- CreateIndex
CREATE INDEX "presences_date_idx" ON "presences"("date");

-- CreateIndex
CREATE INDEX "presences_classe_idx" ON "presences"("classe");

-- CreateIndex
CREATE UNIQUE INDEX "enseignants_matricule_key" ON "enseignants"("matricule");

-- CreateIndex
CREATE INDEX "enseignants_nom_idx" ON "enseignants"("nom");

-- CreateIndex
CREATE INDEX "enseignants_etablissement_idx" ON "enseignants"("etablissement");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_nom_key" ON "provinces"("nom");

-- CreateIndex
CREATE INDEX "provinces_nom_idx" ON "provinces"("nom");

-- CreateIndex
CREATE INDEX "ec_erc_province_idx" ON "ec_erc"("province");

-- CreateIndex
CREATE INDEX "coord_nationale_province_idx" ON "coord_nationale"("province");

-- CreateIndex
CREATE INDEX "coord_provinciale_province_idx" ON "coord_provinciale"("province");

-- CreateIndex
CREATE INDEX "coord_sous_provinciale_province_idx" ON "coord_sous_provinciale"("province");

-- CreateIndex
CREATE INDEX "bureaux_bureau_idx" ON "bureaux"("bureau");

-- CreateIndex
CREATE INDEX "grades_grade_idx" ON "grades"("grade");

-- CreateIndex
CREATE UNIQUE INDEX "dossiers_reference_key" ON "dossiers"("reference");

-- CreateIndex
CREATE INDEX "dossiers_reference_idx" ON "dossiers"("reference");

-- CreateIndex
CREATE INDEX "dossiers_statut_idx" ON "dossiers"("statut");

-- CreateIndex
CREATE INDEX "visites_etablissement_idx" ON "visites"("etablissement");

-- CreateIndex
CREATE INDEX "visites_date_idx" ON "visites"("date");

-- CreateIndex
CREATE INDEX "services_admin_service_idx" ON "services_admin"("service");

-- CreateIndex
CREATE INDEX "notifications_lu_idx" ON "notifications"("lu");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "paiements_reference_key" ON "paiements"("reference");

-- CreateIndex
CREATE INDEX "paiements_reference_idx" ON "paiements"("reference");

-- CreateIndex
CREATE INDEX "paiements_statut_idx" ON "paiements"("statut");

-- CreateIndex
CREATE INDEX "notes_eleve_idx" ON "notes"("eleve");

-- CreateIndex
CREATE INDEX "notes_classe_idx" ON "notes"("classe");

-- AddForeignKey
ALTER TABLE "presences" ADD CONSTRAINT "presences_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

