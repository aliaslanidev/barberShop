import { Router } from "express";
import { authRouter } from "@/modules/auth/auth.routes";
import { servicesRouter } from "@/modules/services/services.routes";
import { barbersRouter } from "@/modules/barbers/barbers.routes";
import { bookingsRouter } from "@/modules/bookings/bookings.routes";
import { blockedSlotsRouter } from "@/modules/blocked-slots/blocked-slots.routes";
import { timeOffRouter } from "@/modules/time-off/time-off.routes";
import { ratingsRouter } from "@/modules/ratings/ratings.routes";
import { notificationsRouter } from "@/modules/notifications/notifications.routes";
import { holidaysRouter } from "@/modules/holidays/holidays.routes";
import { settingsRouter } from "@/modules/settings/settings.routes";
import { reportsRouter } from "@/modules/reports/reports.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/services", servicesRouter);
apiRouter.use("/barbers", barbersRouter);
apiRouter.use("/bookings", bookingsRouter);
apiRouter.use("/blocked-slots", blockedSlotsRouter);
apiRouter.use("/time-off", timeOffRouter);
apiRouter.use("/ratings", ratingsRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/holidays", holidaysRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/reports", reportsRouter);