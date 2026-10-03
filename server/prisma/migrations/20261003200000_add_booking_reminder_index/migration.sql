CREATE INDEX "bookings_status_reminderSentAt_date_idx"
ON "bookings"("status", "reminderSentAt", "date");
