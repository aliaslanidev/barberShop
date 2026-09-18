/*
  Warnings:

  - A unique constraint covering the columns `[barberId,date]` on the table `time_offs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "time_offs_barberId_date_key" ON "time_offs"("barberId", "date");
