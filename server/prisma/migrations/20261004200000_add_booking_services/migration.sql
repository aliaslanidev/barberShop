-- CreateTable
CREATE TABLE "booking_service_items" (
    "bookingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "booking_service_items_pkey" PRIMARY KEY ("bookingId", "serviceId")
);

-- AlterTable
ALTER TABLE "slot_waitlists" ADD COLUMN "serviceIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
UPDATE "slot_waitlists" SET "serviceIds" = ARRAY["serviceId"];

-- CreateIndex
CREATE INDEX "booking_service_items_serviceId_idx" ON "booking_service_items"("serviceId");

-- AddForeignKey
ALTER TABLE "booking_service_items" ADD CONSTRAINT "booking_service_items_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "booking_service_items" ADD CONSTRAINT "booking_service_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill the item record for every existing appointment so reports can
-- attribute its recorded price to the selected service without guessing.
INSERT INTO "booking_service_items" ("bookingId", "serviceId", "price")
SELECT "bookings"."id", "bookings"."serviceId", COALESCE("bookings"."price", "services"."priceValue")
FROM "bookings"
JOIN "services" ON "services"."id" = "bookings"."serviceId";
