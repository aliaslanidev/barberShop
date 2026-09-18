-- AlterTable
ALTER TABLE "barber_profiles" ADD COLUMN     "workingDays" "Weekday"[] DEFAULT ARRAY[]::"Weekday"[];
