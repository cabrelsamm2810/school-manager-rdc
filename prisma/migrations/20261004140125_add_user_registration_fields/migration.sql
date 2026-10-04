-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bureauAffectation" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "dinacope" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "fonction" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "grade" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "institutionName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "provinceAdministrative" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "provinceEducationnelle" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sexe" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "typeInstitution" TEXT NOT NULL DEFAULT '';
