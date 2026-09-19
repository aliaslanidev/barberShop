const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4010/api";

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
  options: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
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
  data: {
    title: string;
    desc: string;
    priceValue: number;
    icon: string;
    featured?: boolean;
  },
  token: string,
) {
  return apiFetch<ApiService>("/services", {
    method: "POST",
    body: data,
    token,
  });
}

export function updateServiceApi(
  id: string,
  data: Partial<{
    title: string;
    desc: string;
    priceValue: number;
    icon: string;
    featured: boolean;
  }>,
  token: string,
) {
  return apiFetch<ApiService>(`/services/${id}`, {
    method: "PATCH",
    body: data,
    token,
  });
}

export function deleteServiceApi(id: string, token: string) {
  return apiFetch<void>(`/services/${id}`, { method: "DELETE", token });
}

// ==================== Barbers ====================

export type ApiWeekday =
  | "SATURDAY"
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY";

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

// ==================== Ratings (تعریف تایپ‌ها؛ توابع API پایین‌تر) ====================

export type RatingStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ApiRatingSummary {
  average: number | null; // یک رقم اعشار؛ null یعنی هنوز امتیازی نداره
  count: number;
}

export interface ApiRating {
  id: string;
  bookingId: string;
  barberId: string;
  score: number;
  comment: string | null;
  status: RatingStatus;
  createdAt: string;
}

export interface ApiBarber extends ApiBarberPermissions {
  id: string;
  userId: string;
  bio: string;
  initials: string;
  isActive: boolean;
  createdAt: string;
  workingDays: ApiWeekday[];
  user: { id: string; name: string; mobile: string };
  services: ApiBarberService[];
  rating: ApiRatingSummary;
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
  token: string,
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
  token: string,
) {
  return apiFetch<ApiBarber>(`/barbers/${id}`, {
    method: "PATCH",
    body: data,
    token,
  });
}

export function updateBarberPermissionsApi(
  id: string,
  data: Partial<ApiBarberPermissions>,
  token: string,
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
  token: string,
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
  token: string,
) {
  return apiFetch<ApiBarber>(`/barbers/me/services/${serviceId}/active`, {
    method: "PATCH",
    body: { isActive },
    token,
  });
}

export function updateMyWorkingDaysApi(
  workingDays: ApiWeekday[],
  token: string,
) {
  return apiFetch<ApiBarber>("/barbers/me/working-days", {
    method: "PATCH",
    body: { workingDays },
    token,
  });
}

// ==================== Time Off ====================

export interface ApiTimeOff {
  id: string;
  barberId: string;
  date: string;
}

export type LeaveRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface ApiLeaveRequest {
  id: string;
  barberId: string;
  date: string;
  reason: string | null;
  status: LeaveRequestStatus;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiLeaveRequestWithBarber extends ApiLeaveRequest {
  barber: { id: string; user: { id: string; name: string; mobile: string } };
}

export function listMyTimeOffApi(token: string) {
  return apiFetch<{ timeOffs: ApiTimeOff[]; leaveRequests: ApiLeaveRequest[] }>(
    "/time-off/me",
    {
      token,
    },
  );
}

export function createMyTimeOffApi(
  data: { date: string; reason?: string },
  token: string,
) {
  return apiFetch<
    | { type: "TIME_OFF"; timeOff: ApiTimeOff }
    | { type: "LEAVE_REQUEST"; leaveRequest: ApiLeaveRequest }
  >("/time-off/me", { method: "POST", body: data, token });
}

export function deleteMyTimeOffApi(id: string, token: string) {
  return apiFetch<void>(`/time-off/me/${id}`, { method: "DELETE", token });
}

export function cancelMyLeaveRequestApi(id: string, token: string) {
  return apiFetch<void>(`/time-off/me/requests/${id}`, {
    method: "DELETE",
    token,
  });
}

export function listLeaveRequestsApi(
  token: string,
  status?: LeaveRequestStatus,
) {
  const qs = status ? `?status=${status}` : "";
  return apiFetch<ApiLeaveRequestWithBarber[]>(`/time-off/requests${qs}`, {
    token,
  });
}

export function approveLeaveRequestApi(id: string, token: string) {
  return apiFetch<ApiLeaveRequest>(`/time-off/requests/${id}/approve`, {
    method: "PATCH",
    token,
  });
}

export function rejectLeaveRequestApi(id: string, token: string) {
  return apiFetch<ApiLeaveRequest>(`/time-off/requests/${id}/reject`, {
    method: "PATCH",
    token,
  });
}

// ادمین/مدیر: مرخصی ثبت‌شده‌ی همه‌ی آرایشگرها (برای صفحه‌ی تعطیلات)
export interface ApiTimeOffWithBarber extends ApiTimeOff {
  barber: { id: string; user: { id: string; name: string; mobile: string } };
}

export function listAllTimeOffApi(token: string) {
  return apiFetch<ApiTimeOffWithBarber[]>("/time-off", { token });
}

// ==================== Salon Holidays ====================

export interface ApiSalonHoliday {
  id: string;
  date: string; // YYYY-MM-DD میلادی
  reason: string | null;
}

export function listSalonHolidaysApi(token: string) {
  return apiFetch<ApiSalonHoliday[]>("/holidays", { token });
}

export function createSalonHolidayApi(
  data: { date: string; reason?: string },
  token: string,
) {
  return apiFetch<ApiSalonHoliday>("/holidays", {
    method: "POST",
    body: data,
    token,
  });
}

export function deleteSalonHolidayApi(id: string, token: string) {
  return apiFetch<void>(`/holidays/${id}`, { method: "DELETE", token });
}

// ==================== Blocked Slots ====================

export interface ApiBlockedSlot {
  id: string;
  barberId: string;
  date: string;
  time: string;
  createdAt: string;
}

export function listMyBlockedSlotsApi(
  token: string,
  from?: string,
  to?: string,
) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  return apiFetch<ApiBlockedSlot[]>(`/blocked-slots/me${qs ? `?${qs}` : ""}`, {
    token,
  });
}

export function createMyBlockedSlotApi(
  data: { date: string; time: string },
  token: string,
) {
  return apiFetch<ApiBlockedSlot>("/blocked-slots/me", {
    method: "POST",
    body: data,
    token,
  });
}

export function deleteMyBlockedSlotApi(id: string, token: string) {
  return apiFetch<void>(`/blocked-slots/me/${id}`, { method: "DELETE", token });
}

// ==================== Bookings ====================

export type BookingStatus =
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

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
  // قیمت نهایی ثبت‌شده موقع رزرو؛ برای نوبت‌های قدیمی null (از service.priceValue استفاده کن)
  price: number | null;
  createdAt: string;
  updatedAt: string;
  rating: ApiRating | null;
  barber: ApiBookingBarber;
  service: ApiService;
  customer: { id: string; name: string; mobile: string };
}

export interface ApiSlotStatus {
  time: string;
  available: boolean;
}

export function getAvailability(barberId: string, date: string) {
  return apiFetch<ApiSlotStatus[]>(
    `/bookings/availability?barberId=${encodeURIComponent(barberId)}&date=${encodeURIComponent(date)}`,
  );
}

export function getAvailabilityRange(
  barberId: string,
  from: string,
  to: string,
) {
  return apiFetch<string[]>(
    `/bookings/availability-range?barberId=${encodeURIComponent(barberId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  );
}

// ==================== Slot Hold ====================

export interface ApiSlotHold {
  id: string;
  expiresAt: string;
}

export function createSlotHoldApi(data: {
  barberId: string;
  date: string;
  time: string;
}) {
  return apiFetch<ApiSlotHold>("/bookings/hold", {
    method: "POST",
    body: data,
  });
}

export function extendSlotHoldApi(holdId: string) {
  return apiFetch<ApiSlotHold>(`/bookings/hold/${holdId}/extend`, {
    method: "PATCH",
  });
}

export function releaseSlotHoldApi(holdId: string) {
  return apiFetch<void>(`/bookings/hold/${holdId}`, {
    method: "DELETE",
  });
}

export function createBookingApi(
  data: {
    barberId: string;
    serviceId: string;
    date: string;
    time: string;
    notes?: string;
    holdId?: string;
  },
  token: string,
) {
  return apiFetch<ApiBooking>("/bookings", {
    method: "POST",
    body: data,
    token,
  });
}

export interface ListBookingsFilter {
  barberId?: string;
  customerId?: string;
  status?: BookingStatus;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function listBookingsApi(
  token: string,
  filter: ListBookingsFilter = {},
) {
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

export function updateBookingStatusApi(
  id: string,
  status: BookingStatus,
  token: string,
) {
  return apiFetch<ApiBooking>(`/bookings/${id}/status`, {
    method: "PATCH",
    body: { status },
    token,
  });
}

export function getMyCustomersApi(token: string) {
  return apiFetch<{ name: string; phone: string }[]>("/bookings/my-customers", {
    token,
  });
}

// ==================== Ratings API ====================

export function createRatingApi(
  data: { bookingId: string; score: number; comment?: string },
  token: string,
) {
  return apiFetch<ApiRating>("/ratings", { method: "POST", body: data, token });
}

export interface ApiBarberReview {
  id: string;
  score: number;
  comment: string | null;
  status: RatingStatus;
  createdAt: string;
  date: string;
  time: string;
  serviceTitle: string;
  customerName: string;
}

export interface ApiBarberReviewsResponse {
  summary: ApiRatingSummary;
  ratings: ApiBarberReview[];
}

// نظرهای خودِ آرایشگر لاگین‌شده (همه‌ی وضعیت‌ها)
export function listMyRatingsApi(token: string) {
  return apiFetch<ApiBarberReviewsResponse>("/ratings/me", { token });
}

// ادمین/مدیر: لیست نظرها با فیلتر اختیاری آرایشگر/وضعیت — برای صفحه‌ی تایید نظرها
export interface ApiAdminRating {
  id: string;
  barberId: string;
  barberName: string;
  score: number;
  comment: string | null;
  status: RatingStatus;
  createdAt: string;
  date: string;
  time: string;
  serviceTitle: string;
  customerName: string;
}

export function listRatingsApi(
  token: string,
  filter: { barberId?: string; status?: RatingStatus } = {},
) {
  const params = new URLSearchParams();
  if (filter.barberId) params.set("barberId", filter.barberId);
  if (filter.status) params.set("status", filter.status);
  const qs = params.toString();
  return apiFetch<ApiAdminRating[]>(`/ratings${qs ? `?${qs}` : ""}`, { token });
}

// ادمین/مدیر: تایید یا رد نمایش عمومیِ متن یه نظر
export function updateRatingStatusApi(
  id: string,
  status: "APPROVED" | "REJECTED",
  token: string,
) {
  return apiFetch<ApiRating>(`/ratings/${id}/status`, {
    method: "PATCH",
    body: { status },
    token,
  });
}

// ==================== Public Barber Reviews (بدون نیاز به لاگین) ====================

export interface ApiPublicReview {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  customerName: string; // نام + حرف اول نام‌خانوادگی، برای حریم خصوصی
}

export interface ApiPublicBarberReviews {
  summary: ApiRatingSummary;
  reviews: ApiPublicReview[];
}

// برای مودال «مشاهده بیشتر» تو فلوی رزرو — معدل + فقط نظرهای تاییدشده
export function getPublicBarberReviews(barberId: string) {
  return apiFetch<ApiPublicBarberReviews>(
    `/ratings/public/${encodeURIComponent(barberId)}`,
  );
}

// ==================== Notifications ====================

export type NotificationType =
  | "BOOKING_CREATED"
  | "BOOKING_STATUS_CHANGED"
  | "LEAVE_REQUEST_STATUS"
  | "RATING_STATUS";

export interface ApiNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ApiNotificationsResponse {
  notifications: ApiNotification[];
  unreadCount: number;
}

export function listMyNotificationsApi(token: string) {
  return apiFetch<ApiNotificationsResponse>("/notifications/me", { token });
}

export function markNotificationReadApi(id: string, token: string) {
  return apiFetch<{ ok: true }>(`/notifications/${id}/read`, {
    method: "PATCH",
    token,
  });
}

export function markAllNotificationsReadApi(token: string) {
  return apiFetch<{ ok: true }>("/notifications/read-all", {
    method: "PATCH",
    token,
  });
}

export interface PushSubscriptionJSON {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export function subscribePushApi(
  subscription: PushSubscriptionJSON,
  token: string,
) {
  return apiFetch<{ ok: true }>("/notifications/subscribe", {
    method: "POST",
    body: subscription,
    token,
  });
}

export function unsubscribePushApi(endpoint: string, token: string) {
  return apiFetch<{ ok: true }>("/notifications/subscribe", {
    method: "DELETE",
    body: { endpoint },
    token,
  });
}

// ==================== Settings (اطلاعات سالن + ساعات کاری + رمز ادمین) ====================

export interface ApiSalonSettings {
  name: string;
  address: string;
  phone: string;
}

export interface ApiWorkingHours {
  day: ApiWeekday;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface ApiSettingsResponse {
  salon: ApiSalonSettings;
  workingHours: ApiWorkingHours[];
}

// عمومی (بدون نیاز به لاگین) — اطلاعات سالن و ساعات کاری
export function getSettingsApi() {
  return apiFetch<ApiSettingsResponse>("/settings");
}

// فقط ادمین
export function updateSalonInfoApi(
  data: Partial<ApiSalonSettings>,
  token: string,
) {
  return apiFetch<ApiSalonSettings>("/settings/salon", {
    method: "PATCH",
    body: data,
    token,
  });
}

// فقط ادمین — به‌ازای هر روز جدا
export function updateWorkingHoursApi(
  day: ApiWeekday,
  data: Partial<{ isOpen: boolean; openTime: string; closeTime: string }>,
  token: string,
) {
  return apiFetch<ApiWorkingHours>(`/settings/working-hours/${day}`, {
    method: "PATCH",
    body: data,
    token,
  });
}

// فقط ادمین — تغییر رمز خودِ حساب لاگین‌شده (بر اساس توکن، نه آی‌دی ورودی)
export function changePasswordApi(
  data: { currentPassword: string; newPassword: string },
  token: string,
) {
  return apiFetch<void>("/settings/password", {
    method: "PATCH",
    body: data,
    token,
  });
}

// ==================== Reports ====================

export interface ApiBookingsSummary {
  totalCount: number;
  byStatus: Record<BookingStatus, number>;
  byBarber: { barberId: string; barberName: string; count: number }[];
}

// فقط ادمین/مدیر
export function getBookingsSummaryApi(token: string) {
  return apiFetch<ApiBookingsSummary>("/reports/bookings-summary", { token });
}

// ==================== Managers (مدیر سالن) ====================
// مدیر سالن برخلاف آرایشگر، پروفایل جدا (BarberProfile) نداره؛ فقط یه
// User ساده با role=MANAGER هست. حساب مدیر سالن فقط توسط ادمین اصلی ساخته
// می‌شه (دقیقاً مثل آرایشگر) — همه‌ی endpointهای زیر فقط ADMIN.

export interface ApiManager {
  id: string;
  name: string;
  mobile: string;
  role: "MANAGER";
  createdAt: string;
}

export function listManagersApi(token: string) {
  return apiFetch<ApiManager[]>("/managers", { token });
}

export function createManagerApi(
  data: { name: string; mobile: string; password: string },
  token: string,
) {
  return apiFetch<ApiManager>("/managers", { method: "POST", body: data, token });
}

export function updateManagerApi(
  id: string,
  data: Partial<{ name: string; mobile: string; password: string }>,
  token: string,
) {
  return apiFetch<ApiManager>(`/managers/${id}`, { method: "PATCH", body: data, token });
}

export function deleteManagerApi(id: string, token: string) {
  return apiFetch<void>(`/managers/${id}`, { method: "DELETE", token });
}