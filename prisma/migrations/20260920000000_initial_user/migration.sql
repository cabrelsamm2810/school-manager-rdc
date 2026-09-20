-- Create the initial User model only. This migration is additive and does not drop or alter existing tables.
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'COORDINATION_NATIONALE', 'COORDINATION_PROVINCIALE', 'AGENT_PROVINCIAL', 'COORDINATION_SOUS_PROVINCIALE', 'AGENT_SOUS_PROVINCIAL', 'DIRECTION_ECOLE', 'ENSEIGNANT', 'PARENT', 'ELEVE');

CREATE TABLE "users" (
  "id" TEXT NOT NULL,
  "nom" TEXT NOT NULL,
  "postNom" TEXT NOT NULL DEFAULT '',
  "prenom" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "telephone" TEXT NOT NULL DEFAULT '',
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'ELEVE',
  "profilePhotoUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_isActive_idx" ON "users"("isActive");
