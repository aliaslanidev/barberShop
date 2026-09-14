import { getMockSession } from "./mock-session";

// جایگزین CURRENT_BARBER_ID ثابت قبلی — حالا سشن واقعاً چک می‌شه.
export function getCurrentBarberId(): string | null {
  const session = getMockSession();
  if (!session || session.role !== "barber") return null;
  return session.id;
}