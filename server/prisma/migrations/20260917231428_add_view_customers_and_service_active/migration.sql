-- AlterTable
ALTER TABLE "barber_profiles" ADD COLUMN     "viewCustomers" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "barber_services" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
