-- CreateEnum
CREATE TYPE "WaitlistStatus" AS ENUM ('WAITING', 'OFFERED', 'ACCEPTED', 'CANCELLED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'SLOT_WAITLIST_OFFER';

-- CreateTable
CREATE TABLE "slot_waitlists" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT NOT NULL,
    "status" "WaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "offerExpiresAt" TIMESTAMP(3),

    CONSTRAINT "slot_waitlists_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "slot_holds" ADD COLUMN "waitlistRequestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "slot_waitlists_customerId_barberId_date_time_key" ON "slot_waitlists"("customerId", "barberId", "date", "time");
CREATE INDEX "slot_waitlists_barberId_date_time_status_createdAt_idx" ON "slot_waitlists"("barberId", "date", "time", "status", "createdAt");
CREATE INDEX "slot_waitlists_customerId_status_idx" ON "slot_waitlists"("customerId", "status");
CREATE UNIQUE INDEX "slot_holds_waitlistRequestId_key" ON "slot_holds"("waitlistRequestId");

-- AddForeignKey
ALTER TABLE "slot_waitlists" ADD CONSTRAINT "slot_waitlists_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "slot_waitlists" ADD CONSTRAINT "slot_waitlists_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "slot_waitlists" ADD CONSTRAINT "slot_waitlists_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "slot_holds" ADD CONSTRAINT "slot_holds_waitlistRequestId_fkey" FOREIGN KEY ("waitlistRequestId") REFERENCES "slot_waitlists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
