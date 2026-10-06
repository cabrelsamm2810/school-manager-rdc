-- AlterTable
ALTER TABLE "eleves" ADD COLUMN     "etablissementId" TEXT;

-- CreateIndex
CREATE INDEX "eleves_etablissementId_idx" ON "eleves"("etablissementId");

-- AddForeignKey
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "etablissements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
