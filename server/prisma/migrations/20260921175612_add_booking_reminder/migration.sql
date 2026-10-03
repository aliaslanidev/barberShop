/*
  Warnings:

  - You are about to drop the column `customPrice` on the `barber_services` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'BOOKING_REMINDER';

-- AlterTable
ALTER TABLE "barber_services" DROP COLUMN "customPrice",
ADD COLUMN     "price" INTEGER,
ADD COLUMN     "reminderSentAt" TIMESTAMP(3);
