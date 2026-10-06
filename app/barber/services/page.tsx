"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, X, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { StatusCard } from "@/components/ui/status-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  StandardTablePageHeading,
  StandardTablePanel,
  StandardTableSearch,
} from "@/components/ui/standard-table-layout";
import { useAuth } from "@/lib/auth-context";
import { getAuthToken } from "@/lib/data/mock-session";
import {
  listBarbers,
  updateMyServicePriceApi,
  updateMyServiceActiveApi,
  ApiError,
  type ApiBarber,
  type ApiBarberService,
} from "@/lib/api";
import { SERVICE_ICONS, type ServiceIconKey } from "@/lib/data/services";
import { formatToman } from "@/lib/utils";

function getServiceIcon(icon: string): LucideIcon {
  return SERVICE_ICONS[icon as ServiceIconKey] ?? SERVICE_ICONS.scissors;
}

export default function BarberServicesPage() {
  const { user } = useAuth();
  const [barber, setBarber] = useState<ApiBarber | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<ApiBarberService | null>(null);
  const [editPrice, setEditPrice] = useState("");

  async function refresh() {
    try {
      const all = await listBarbers();
      const mine = all.find((item) => item.user.id === user?.id) ?? null;
      setBarber(mine);
      if (mine) {
        setPrices(
          Object.fromEntries(
            mine.services.map((item) => [
              item.serviceId,
              String(item.customPrice ?? item.service.priceValue),
            ]),
          ),
        );
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در دریافت اطلاعات");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (user) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const visibleServices = useMemo(() => {
    const services = barber?.services ?? [];
    const query = searchQuery.trim();
    if (!query) return services;
    return services.filter(
      ({ service }) => service.title.includes(query) || service.desc.includes(query),
    );
  }, [barber?.services, searchQuery]);

  function startEditingPrice(item: ApiBarberService) {
    setEditPrice(prices[item.serviceId] ?? String(item.customPrice ?? item.service.priceValue));
    setEditingService(item);
  }

  async function handleSavePrice(serviceId: string, raw = prices[serviceId]) {
    const token = getAuthToken();
    if (!token || !barber?.managePricing) return;
    const value = Number(raw);
    if (!raw || Number.isNaN(value) || value <= 0) {
      toast.error("قیمت وارد شده معتبر نیست");
      return;
    }
    setSavingId(serviceId);
    try {
      const updated = await updateMyServicePriceApi(serviceId, value, token);
      setBarber(updated);
      setPrices((current) => ({ ...current, [serviceId]: String(value) }));
      setEditingService(null);
      toast.success("قیمت ذخیره شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در ذخیره‌ی قیمت");
    } finally {
      setSavingId(null);
    }
  }

  async function handleToggleActive(serviceId: string, isActive: boolean) {
    const token = getAuthToken();
    if (!token || !barber?.manageServices) return;
    setTogglingId(serviceId);
    try {
      const updated = await updateMyServiceActiveApi(serviceId, isActive, token);
      setBarber(updated);
      toast.success(isActive ? "سرویس فعال شد" : "سرویس غیرفعال شد");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "خطا در تغییر وضعیت سرویس");
    } finally {
      setTogglingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">
        در حال دریافت اطلاعات...
      </div>
    );
  }

  if (!barber || (!barber.managePricing && !barber.manageServices)) {
    return (
      <div className="space-y-6">
        <StandardTablePageHeading
          title="سرویس‌ها و قیمت‌گذاری"
          description="سرویس‌های اختصاص‌داده‌شده به شما"
        />
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            شما دسترسی مدیریت خدمات/قیمت را ندارید؛ این تنظیمات توسط سالن مدیریت می‌شود.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StandardTablePageHeading
        title="سرویس‌ها و قیمت‌گذاری"
        description="مدیریت سرویس‌ها و قیمت‌های اختصاصی شما"
      />

      <StandardTablePanel
        toolbar={
          <StandardTableSearch
            value={searchQuery}
            placeholder="جستجوی سرویس"
            onChange={(event) => setSearchQuery(event.target.value)}
            clearAction={
              searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="پاک کردن جستجو"
                  className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : undefined
            }
          />
        }
      >
        {visibleServices.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              {searchQuery
                ? "سرویسی با این عنوان یافت نشد"
                : "هنوز سرویسی به شما اختصاص داده نشده است."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleServices.map((item: ApiBarberService) => {
              const { serviceId, service, customPrice, isActive } = item;
              const Icon = getServiceIcon(service.icon);
              const isSalonActive = service.isActive;
              const canManageActive = barber.manageServices && isSalonActive;

              return (
                <StatusCard
                  key={serviceId}
                  tone={isActive && isSalonActive ? "success" : "neutral"}
                  showTint={false}
                  accentClassName={
                    isActive && isSalonActive
                      ? "bg-primary"
                      : "bg-muted-foreground/40"
                  }
                  className="bg-background/30"
                  contentClassName="flex flex-col gap-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{service.title}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {service.desc}
                        </p>
                      </div>
                    </div>
                    {barber.managePricing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 shrink-0 px-0"
                        onClick={() => startEditingPrice(item)}
                        aria-label={`ویرایش قیمت ${service.title}`}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {barber.managePricing && (
                    <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                      <div className="text-xs text-muted-foreground">
                        {customPrice != null
                          ? `قیمت اختصاصی: ${formatToman(customPrice)}`
                          : `قیمت پیش‌فرض: ${formatToman(service.priceValue)}`}
                      </div>
                    </div>
                  )}

                  {barber.manageServices && (
                    <div className="flex items-center justify-between gap-3 border-t border-border pt-2">
                      <div className="text-xs text-muted-foreground">
                        {!isSalonActive
                          ? "غیرفعال توسط سالن"
                          : isActive
                            ? "فعال برای شما"
                            : "غیرفعال برای شما"}
                      </div>
                      <Switch
                        checked={isActive}
                        disabled={!canManageActive || togglingId === serviceId}
                        onCheckedChange={(value) =>
                          void handleToggleActive(serviceId, value)
                        }
                        aria-label={`وضعیت ${service.title}`}
                      />
                    </div>
                  )}
                </StatusCard>
              );
            })}
          </div>
        )}
      </StandardTablePanel>

      <Dialog
        open={editingService !== null}
        onOpenChange={(open) => {
          if (!open && savingId === null) setEditingService(null);
        }}
      >
        <DialogContent className="bg-[#0e110f] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ویرایش قیمت سرویس</DialogTitle>
            <DialogDescription>
              قیمت اختصاصی شما برای «{editingService?.service.title}» را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="barber-service-price">قیمت (تومان)</Label>
            <Input
              id="barber-service-price"
              type="number"
              min={1}
              value={editPrice}
              disabled={savingId !== null}
              onChange={(event) => setEditPrice(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={savingId !== null}
              onClick={() => setEditingService(null)}
            >
              انصراف
            </Button>
            <Button
              type="button"
              disabled={!editingService || savingId === editingService.serviceId}
              onClick={() => {
                if (editingService) {
                  void handleSavePrice(editingService.serviceId, editPrice);
                }
              }}
            >
              {editingService && savingId === editingService.serviceId
                ? "در حال ذخیره..."
                : "ذخیره"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
