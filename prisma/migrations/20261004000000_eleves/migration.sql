-- CreateTable
CREATE TABLE "eleves" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "postNom" TEXT NOT NULL DEFAULT '',
    "prenom" TEXT NOT NULL,
    "sexe" TEXT NOT NULL DEFAULT '',
    "dateNaissance" TIMESTAMP(3),
    "lieuNaissance" TEXT NOT NULL DEFAULT '',
    "classe" TEXT NOT NULL,
    "telephone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "adresse" TEXT NOT NULL DEFAULT '',
    "nomTuteur" TEXT NOT NULL DEFAULT '',
    "telephoneTuteur" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eleves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "eleves_matricule_key" ON "eleves"("matricule");

-- CreateIndex
CREATE INDEX "eleves_classe_idx" ON "eleves"("classe");

-- CreateIndex
CREATE INDEX "eleves_nom_idx" ON "eleves"("nom");
