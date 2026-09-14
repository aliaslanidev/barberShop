import { getMockSession } from "./mock-session";

export type AdminInfo = {
  id: string;
  name: string;
  role: "admin";
};

// حالا از localStorage (mock-session) می‌خونه، نه یه مقدار ثابت.
export function getCurrentAdmin(): AdminInfo | null {
  const session = getMockSession();
  if (!session || session.role !== "admin") return null;
  return { id: session.id, name: session.name, role: "admin" };
}