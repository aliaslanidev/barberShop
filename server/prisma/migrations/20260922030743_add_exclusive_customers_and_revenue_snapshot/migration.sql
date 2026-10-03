-- AlterTable
ALTER TABLE "barber_profiles" ADD COLUMN     "exclusiveCustomers" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "isBarberOwnRevenue" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPrivateCustomer" BOOLEAN NOT NULL DEFAULT false;
