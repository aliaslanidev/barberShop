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
  viewCustomers: boolean;
}

export interface ApiBarberService {
  barberId: string;
  serviceId: string;
  customPrice: number | null;
  isActive: boolean;
  service: ApiService;
}

export interface ApiBarber extends ApiBarberPermissions {
  id: string;
  userId: string;
  bio: string;
  initials: string;
  isActive: boolean;
  createdAt: string;
  user: { id: string; name: string; mobile: string };
  services: ApiBarberService[];
}

export function listBarbers() {
  return apiFetch<ApiBarber[]>("/barbers");
}

export function getBarberApi(id: string) {
  return apiFetch<ApiBarber>(`/barbers/${id}`);
}

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

export function updateMyServicePriceApi(
  serviceId: string,
  customPrice: number | null,
  token: string
) {
  return apiFetch<ApiBarber>(`/barbers/me/services/${serviceId}/price`, {
    method: "PATCH",
    body: { customPrice },
    token,
  });
}

export function updateMyServiceActiveApi(
  serviceId: string,
  isActive: boolean,
  token: string
) {
  return apiFetch<ApiBarber>(`/barbers/me/services/${serviceId}/active`, {
    method: "PATCH",
    body: { isActive },
    token,
  });
}

// ==================== Blocked Slots ====================

export interface ApiBlockedSlot {
  id: string;
  barberId: string;
  date: string;
  time: string;
  createdAt: string;
}

export function listMyBlockedSlotsApi(token: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return apiFetch<ApiBlockedSlot[]>(`/blocked-slots/me${qs ? `?${qs}` : ""}`, { token });
}

export function createMyBlockedSlotApi(data: { date: string; time: string }, token: string) {
  return apiFetch<ApiBlockedSlot>("/blocked-slots/me", { method: "POST", body: data, token });
}

export function deleteMyBlockedSlotApi(id: string, token: string) {
  return apiFetch<void>(`/blocked-slots/me/${id}`, { method: "DELETE", token });
}

// ==================== Bookings ====================

export type BookingStatus = "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface ApiBookingBarber extends ApiBarberPermissions {
  id: string;
  userId: string;
  bio: string;
  initials: string;
  isActive: boolean;
  createdAt: string;
  user: { id: string; name: string; mobile: string };
}

export interface ApiBooking {
  id: string;
  customerId: string;
  barberId: string;
  serviceId: string;
  date: string;
  time: string;
  status: BookingStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  barber: ApiBookingBarber;
  service: ApiService;
  customer: { id: string; name: string; mobile: string };
}

export function getAvailability(barberId: string, date: string) {
  return apiFetch<string[]>(
    `/bookings/availability?barberId=${encodeURIComponent(barberId)}&date=${encodeURIComponent(date)}`
  );
}

export function getAvailabilityRange(barberId: string, from: string, to: string) {
  return apiFetch<string[]>(
    `/bookings/availability-range?barberId=${encodeURIComponent(barberId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
}

export function createBookingApi(
  data: { barberId: string; serviceId: string; date: string; time: string; notes?: string },
  token: string
) {
  return apiFetch<ApiBooking>("/bookings", { method: "POST", body: data, token });
}

export interface ListBookingsFilter {
  barberId?: string;
  customerId?: string;
  status?: BookingStatus;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function listBookingsApi(token: string, filter: ListBookingsFilter = {}) {
  const params = new URLSearchParams();
  Object.entries(filter).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const qs = params.toString();
  return apiFetch<ApiBooking[]>(`/bookings${qs ? `?${qs}` : ""}`, { token });
}

export function getBookingApi(id: string, token: string) {
  return apiFetch<ApiBooking>(`/bookings/${id}`, { token });
}

export function updateBookingStatusApi(id: string, status: BookingStatus, token: string) {
  return apiFetch<ApiBooking>(`/bookings/${id}/status`, {
    method: "PATCH",
    body: { status },
    token,
  });
}

export function getMyCustomersApi(token: string) {
  return apiFetch<{ name: string; phone: string }[]>("/bookings/my-customers", { token });
}