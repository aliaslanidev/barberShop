import { Card, CardContent } from "@/components/ui/card";
import { getBarberCustomers } from "@/lib/data/appointments";
import { CURRENT_BARBER_ID } from "@/lib/data/barber-session";

export default function BarberCustomersPage() {
  const customers = getBarberCustomers(CURRENT_BARBER_ID);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold md:text-2xl">مشتریان من</h1>
      <p className="text-sm text-muted-foreground">
        طبق قانون اسکوپ، آرایشگر فقط به مشتریانی دسترسی داره که باهاشون نوبت داشته — نه کل مشتریان سالن.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {customers.map((c) => (
          <Card key={c.phone}>
            <CardContent className="flex items-center justify-between p-4">
              <span className="text-sm font-medium">{c.name}</span>
              <span dir="ltr" className="text-xs text-muted-foreground">{c.phone}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}