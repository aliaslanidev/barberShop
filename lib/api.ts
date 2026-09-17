// لایه‌ی ارتباط با بک‌اند واقعی (Express روی http://localhost:4010/api).
// همه‌ی صفحاتی که قراره به API وصل بشن، فقط از همین فایل import می‌کنن.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4010/api";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // برای DELETE ممکنه بدنه‌ای برنگرده (204)
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) || `خطای ${res.status} از سرور`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}

// ==================== Auth ====================

export type BackendRole = "ADMIN" | "MANAGER" | "BARBER" | "CUSTOMER";

export interface AuthUser {
  id: string;
  name: string;
  mobile: string;
  role: BackendRole;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export function login(mobile: string, password: string) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: { mobile, password },
  });
}

export function register(name: string, mobile: string, password: string) {
  return apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: { name, mobile, password },
  });
}

export function fetchMe(token: string) {
  return apiFetch<AuthUser>("/auth/me", { token });
}

// ==================== Services ====================

export interface ApiService {
  id: string;
  title: string;
  desc: string;
  priceValue: number;
  icon: string;
  featured: boolean;
  createdAt: string;
}

export function listServices() {
  return apiFetch<ApiService[]>("/services");
}

export function createServiceApi(
  data: { title: string; desc: string; priceValue: number; icon: string; featured?: boolean },
  token: string
) {
  return apiFetch<ApiService>("/services", { method: "POST", body: data, token });
}

export function updateServiceApi(
  id: string,
  data: Partial<{ title: string; desc: string; priceValue: number; icon: string; featured: boolean }>,
  token: string
) {
  return apiFetch<ApiService>(`/services/${id}`, { method: "PATCH", body: data, token });
}

export function deleteServiceApi(id: string, token: string) {
  return apiFetch<void>(`/services/${id}`, { method: "DELETE", token });
}

// ==================== Barbers ====================

export interface ApiBarberPermissions {
  manageServices: boolean;
  managePricing: boolean;
  manageSchedule: boolean;
  manageTimeOff: boolean;
  blockSlots: boolean;
  cancelOwnBookings: boolean;
}

export interface ApiBarber extends ApiBarberPermissions {
  id: string;
  userId: string;
  bio: string;
  initials: string;
  isActive: boolean;
  createdAt: string;
  user: { id: string; name: string; mobile: string };
  services: { barberId: string; serviceId: string; service: ApiService }[];
}

export function listBarbers() {
  return apiFetch<ApiBarber[]>("/barbers");
}

export function getBarberApi(id: string) {
  return apiFetch<ApiBarber>(`/barbers/${id}`);
}

// ⚠️ فرض: بک‌اند اجازه‌ی ساخت هم‌زمان User+BarberProfile با این بادی رو می‌ده
// (طبق قانون پروژه: فقط ادمین می‌سازه و username/password اولیه رو خودش تعیین می‌کنه)
export function createBarberApi(
  data: {
    name: string;
    mobile: string;
    password: string;
    bio?: string;
    initials?: string;
    serviceIds?: string[];
  },
  token: string
) {
  return apiFetch<ApiBarber>("/barbers", { method: "POST", body: data, token });
}

// ⚠️ فرض: PATCH /barbers/:id هم فیلدهای User (name, mobile, password) و هم
// BarberProfile (bio, initials, isActive, serviceIds) رو قبول می‌کنه.
// اگه سرور فقط بخشی رو پشتیبانی کرد، همینجا باید تفکیک بشه.
export function updateBarberApi(
  id: string,
  data: Partial<{
    name: string;
    mobile: string;
    password: string;
    bio: string;
    initials: string;
    isActive: boolean;
    serviceIds: string[];
  }>,
  token: string
) {
  return apiFetch<ApiBarber>(`/barbers/${id}`, { method: "PATCH", body: data, token });
}

export function updateBarberPermissionsApi(
  id: string,
  data: Partial<ApiBarberPermissions>,
  token: string
) {
  return apiFetch<ApiBarber>(`/barbers/${id}/permissions`, {
    method: "PATCH",
    body: data,
    token,
  });
}

export function deleteBarberApi(id: string, token: string) {
  return apiFetch<void>(`/barbers/${id}`, { method: "DELETE", token });
}