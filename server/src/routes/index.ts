import { Router } from "express";
import { authRouter } from "@/modules/auth/auth.routes";
import { servicesRouter } from "@/modules/services/services.routes";
import { barbersRouter } from "@/modules/barbers/barbers.routes";
import { bookingsRouter } from "@/modules/bookings/bookings.routes";
import { blockedSlotsRouter } from "@/modules/blocked-slots/blocked-slots.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/services", servicesRouter);
apiRouter.use("/barbers", barbersRouter);
apiRouter.use("/bookings", bookingsRouter);
apiRouter.use("/blocked-slots", blockedSlotsRouter);

// TODO (فازهای بعدی، به همین الگو):
// apiRouter.use("/time-off", timeOffRouter);
// apiRouter.use("/holidays", holidaysRouter);
// apiRouter.use("/settings", settingsRouter);       -> SalonSettings + WorkingHours
// apiRouter.use("/reports", reportsRouter);         -> aggregate query روی Booking