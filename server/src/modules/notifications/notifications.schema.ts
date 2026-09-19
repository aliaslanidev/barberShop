import { z } from "zod";

export const subscribePushSchema = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
export type SubscribePushInput = z.infer<typeof subscribePushSchema>;

export const unsubscribePushSchema = z.object({
  endpoint: z.string().min(1),
});
export type UnsubscribePushInput = z.infer<typeof unsubscribePushSchema>;