import { processWaitlistOffers } from "@/modules/bookings/waitlist.service";

const CHECK_INTERVAL_MS = 15_000;
let running = false;

async function safeRun() {
  if (running) return;
  running = true;
  try {
    await processWaitlistOffers();
  } catch (error) {
    console.error("خطا در بررسی صف انتظار", error);
  } finally {
    running = false;
  }
}

export function startWaitlistJob() {
  void safeRun();
  return setInterval(() => void safeRun(), CHECK_INTERVAL_MS);
}
