"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTodayAppointments, type Appointment, type ServiceSessionStatus } from "@/lib/data/appointments";
import { getServiceById } from "@/lib/data/services";
import { CURRENT_BARBER_ID } from "@/lib/data/barber-session";

const statusLabel: Record<ServiceSessionStatus, string> = {
  upcoming: "در انتظار",
  in_progress: "در حال انجام",
  completed: "انجام‌شده",
};

export default function BarberBookingsPage() {
  const [items, setItems] = useState<Appointment[]>(getTodayAppointments(CURRENT_BARBER_ID));

  function updateStatus(id: string, status: ServiceSessionStatus) {
    // TODO: اتصال به API واقعی (Start/End Service) وقتی بک‌اند آماده شد
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    toast.success(status === "in_progress" ? "سرویس شروع شد" : "سرویس پایان یافت");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">نوبت‌های امروز</h1>

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            امروز نوبتی ندارید.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="text-sm font-medium">{a.customerName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {getServiceById(a.serviceId)?.title} — ساعت {a.time} · {statusLabel[a.status]}
                  </p>
                </div>
                <div className="flex gap-2">
                  {a.status === "upcoming" && (
                    <Button size="sm" onClick={() => updateStatus(a.id, "in_progress")}>
                      شروع سرویس
                    </Button>
                  )}
                  {a.status === "in_progress" && (
                    <Button size="sm" onClick={() => updateStatus(a.id, "completed")}>
                      پایان سرویس
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}