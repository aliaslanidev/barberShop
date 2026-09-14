import { getMockSession } from "./mock-session";

export type CustomerInfo = {
  id: string;
  name: string;
  role: "customer";
};

export function getCurrentCustomer(): CustomerInfo | null {
  const session = getMockSession();
  if (!session || session.role !== "customer") return null;
  return { id: session.id, name: session.name, role: "customer" };
}