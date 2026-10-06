import { redirect } from "next/navigation";

export default function BlockSlotsPage() {
  redirect("/barber/schedule#blocked-slots");
}