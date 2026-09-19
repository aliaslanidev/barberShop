-- CreateEnum
CREATE TYPE "RatingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "ratings" ADD COLUMN     "status" "RatingStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "ratings_status_idx" ON "ratings"("status");
