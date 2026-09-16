import { Router } from "express";
import { authRouter } from "@/modules/auth/auth.routes";
import { servicesRouter } from "@/modules/services/services.routes";
import { barbersRouter } from "@/modules/barbers/barbers.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/services", servicesRouter);
apiRouter.use("/barbers", barbersRouter);

// TODO (فاز بعدی، به همین الگو):
// apiRouter.use("/bookings", bookingsRouter);      -> بوکینگ مشتری + appointments آرایشگر (یک مدل واحد)
// apiRouter.use("/time-off", timeOffRouter);
// apiRouter.use("/holidays", holidaysRouter);
// apiRouter.use("/settings", settingsRouter);       -> SalonSettings + WorkingHours
// apiRouter.use("/reports", reportsRouter);         -> aggregate query روی Booking
