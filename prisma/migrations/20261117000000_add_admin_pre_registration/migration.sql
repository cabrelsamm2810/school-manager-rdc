-- CreateEnum
CREATE TYPE "AdminAuthorizationStatus" AS ENUM ('EN_ATTENTE', 'COMPTE_CREE', 'REVOQUE');

-- CreateTable
CREATE TABLE "admin_pre_registrations" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "postNom" TEXT NOT NULL DEFAULT '',
    "prenom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL DEFAULT '',
    "role" "Role" NOT NULL DEFAULT 'ADMIN_SCHOOL_MANAGER_RDC',
    "statutPrevu" TEXT NOT NULL DEFAULT 'ACTIF',
    "statut" "AdminAuthorizationStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdById" TEXT,
    "userId" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_pre_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_pre_registrations_email_key" ON "admin_pre_registrations"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_pre_registrations_userId_key" ON "admin_pre_registrations"("userId");

-- CreateIndex
CREATE INDEX "admin_pre_registrations_statut_idx" ON "admin_pre_registrations"("statut");

-- CreateIndex
CREATE INDEX "admin_pre_registrations_createdById_idx" ON "admin_pre_registrations"("createdById");

-- AddForeignKey
ALTER TABLE "admin_pre_registrations" ADD CONSTRAINT "admin_pre_registrations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_pre_registrations" ADD CONSTRAINT "admin_pre_registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

