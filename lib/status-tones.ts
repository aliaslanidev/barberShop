import type { RatingStatus, BookingStatus } from "@/lib/api";
import type { StatusTone } from "@/components/ui/status-card";

export function bookingStatusTone(status: BookingStatus): StatusTone {
  switch (status) {
    case "CONFIRMED":
      return "info";
    case "IN_PROGRESS":
      return "warning";
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "danger";
  }
}

export function leaveRequestStatusTone(
  status: "PENDING" | "APPROVED" | "REJECTED",
): StatusTone {
  switch (status) {
    case "PENDING":
      return "warning";
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "danger";
  }
}

export function ratingStatusTone(status: RatingStatus): StatusTone {
  switch (status) {
    case "PENDING":
      return "warning";
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "danger";
  }
}

export function accountStatusTone(isActive: boolean): StatusTone {
  return isActive ? "success" : "danger";
}

export function barberStatusTone(
  accountIsActive: boolean,
  acceptsBookings: boolean,
): StatusTone {
  if (!accountIsActive) return "danger";
  return acceptsBookings ? "success" : "warning";
}
