-- AlterTable
ALTER TABLE "users" ADD COLUMN     "blockedAt" TIMESTAMP(3),
ADD COLUMN     "blockedReason" TEXT,
ADD COLUMN     "cancelCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "cancellations" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "cancelledById" TEXT,
    "cancelledByRole" "Role" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cancellations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cancellations_bookingId_key" ON "cancellations"("bookingId");

-- CreateIndex
CREATE INDEX "cancellations_cancelledById_idx" ON "cancellations"("cancelledById");

-- AddForeignKey
ALTER TABLE "cancellations" ADD CONSTRAINT "cancellations_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cancellations" ADD CONSTRAINT "cancellations_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
