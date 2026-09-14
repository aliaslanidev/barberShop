import { Card, CardContent } from "@/components/ui/card";
import { getTodayAppointments } from "@/lib/data/appointments";
import { getServiceById } from "@/lib/data/services";
import { getBarberById } from "@/lib/data/barbers";
import { CURRENT_BARBER_ID } from "@/lib/data/barber-session";

export default function BarberDashboardPage() {
  const barber = getBarberById(CURRENT_BARBER_ID);
  const todays = getTodayAppointments(CURRENT_BARBER_ID);
  const completed = todays.filter((a) => a.status === "completed").length;
  const remaining = todays.filter((a) => a.status !== "completed").length;
  const current = todays.find((a) => a.status === "in_progress");
  const next = todays.find((a) => a.status === "upcoming");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold md:text-2xl">سلام {barber?.name.split(" ")[0]} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {barber?.barberType === "professional" ? "آرایشگر حرفه‌ای" : "آرایشگر"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">نوبت‌های امروز</p>
            <p className="mt-1 text-2xl font-bold">{todays.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">انجام‌شده</p>
            <p className="mt-1 text-2xl font-bold text-primary">{completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground">باقی‌مانده</p>
            <p className="mt-1 text-2xl font-bold">{remaining}</p>
          </CardContent>
        </Card>
      </div>

      {current && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">در حال انجام</h2>
          <Card className="border-primary/50">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium">{current.customerName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {getServiceById(current.serviceId)?.title} — ساعت {current.time}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                در حال انجام
              </span>
            </CardContent>
          </Card>
        </div>
      )}

      {next && !current && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">نوبت بعدی</h2>
          <Card>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium">{next.customerName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {getServiceById(next.serviceId)?.title} — ساعت {next.time}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}