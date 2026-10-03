import { app } from "@/app";
import { env } from "@/config/env";
import { startReminderJob } from "@/modules/notifications/reminders.job";

app.listen(env.port, () => {
  console.log(`🚀 سرور روی http://localhost:${env.port} بالا اومد`);
  startReminderJob();
});