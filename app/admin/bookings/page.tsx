"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  getAllAppointments,
  cancelAppointment,
  type ServiceSessionStatus,
} from "@/lib/data/appointments";
import { getAllBarbers } from "@/lib/data/barbers";

const STATUS_LABELS: Record<ServiceSessionStatus, string> = {
  upcoming: "در انتظار",
  in_progress: "در حال انجام",
  completed: "انجام‌شده",
  cancelled: "لغو‌شده",
};

const STATUS_STYLES: Record<ServiceSessionStatus, string> = {
  upcoming: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

// اگه lib/data/services.ts داری، این رو با اسم واقعی سرویس‌ها جایگزین کن
const SERVICE_LABELS: Record<string, string> = {
  haircut: "اصلاح مو",
  beard: "اصلاح ریش",
  color: "رنگ مو",
  facial: "پاکسازی پوست",
};

export default function AdminBookingsPage() {
  const barbers = getAllBarbers();
  const [appointments, setAppointments] = useState(getAllAppointments());
  const [search, setSearch] = useState("");
  const [barberFilter, setBarberFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const barberNameById = useMemo(() => {
    const map = new Map<string, string>();
    barbers.forEach((b) => map.set(b.id, b.name));
    return map;
  }, [barbers]);

  const filtered = useMemo(() => {
    return appointments
      .filter((a) => barberFilter === "all" || a.barberId === barberFilter)
      .filter((a) => statusFilter === "all" || a.status === statusFilter)
      .filter(
        (a) =>
          !search.trim() ||
          a.customerName.includes(search.trim()) ||
          a.customerPhone.includes(search.trim())
      )
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [appointments, barberFilter, statusFilter, search]);

  function handleCancel(id: string) {
    cancelAppointment(id);
    setAppointments(getAllAppointments());
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">مدیریت نوبت‌ها</h1>
        <p className="text-sm text-muted-foreground">
          لیست همه‌ی نوبت‌های ثبت‌شده، فارغ از آرایشگر
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو با نام یا شماره مشتری..."
                className="pr-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={barberFilter} onValueChange={setBarberFilter}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="آرایشگر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه‌ی آرایشگرها</SelectItem>
                {barbers.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه‌ی وضعیت‌ها</SelectItem>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-right text-muted-foreground">
                  <th className="p-2 font-medium">ساعت</th>
                  <th className="p-2 font-medium">مشتری</th>
                  <th className="p-2 font-medium">شماره تماس</th>
                  <th className="p-2 font-medium">آرایشگر</th>
                  <th className="p-2 font-medium">خدمت</th>
                  <th className="p-2 font-medium">وضعیت</th>
                  <th className="p-2 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="p-2 font-mono">{a.time}</td>
                    <td className="p-2">{a.customerName}</td>
                    <td className="p-2 font-mono text-left" dir="ltr">
                      {a.customerPhone}
                    </td>
                    <td className="p-2">
                      {barberNameById.get(a.barberId) ?? a.barberId}
                    </td>
                    <td className="p-2">
                      {SERVICE_LABELS[a.serviceId] ?? a.serviceId}
                    </td>
                    <td className="p-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-medium",
                          STATUS_STYLES[a.status]
                        )}
                      >
                        {STATUS_LABELS[a.status]}
                      </span>
                    </td>
                    <td className="p-2">
                      {a.status !== "cancelled" &&
                        a.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancel(a.id)}
                          >
                            لغو نوبت
                          </Button>
                        )}
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-muted-foreground"
                    >
                      نوبتی با این فیلترها پیدا نشد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}