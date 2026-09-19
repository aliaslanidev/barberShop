-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ratings_bookingId_key" ON "ratings"("bookingId");

-- CreateIndex
CREATE INDEX "ratings_barberId_idx" ON "ratings"("barberId");

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "barber_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
