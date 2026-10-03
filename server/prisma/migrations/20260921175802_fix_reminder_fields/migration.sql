/*
  Warnings:

  - You are about to drop the column `price` on the `barber_services` table. All the data in the column will be lost.
  - You are about to drop the column `reminderSentAt` on the `barber_services` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "barber_services" DROP COLUMN "price",
DROP COLUMN "reminderSentAt",
ADD COLUMN     "customPrice" INTEGER;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "reminderSentAt" TIMESTAMP(3);
