import { z } from "zod";

// همون قوانین serviceSchema تو admin/services/page.tsx
export const createServiceSchema = z.object({
  title: z.string().min(2, "عنوان باید حداقل ۲ حرف باشد"),
  desc: z.string().min(5, "توضیحات باید حداقل ۵ حرف باشد"),
  priceValue: z.coerce.number().min(1000, "قیمت باید حداقل ۱٬۰۰۰ تومان باشد"),
  icon: z.enum(["scissors", "sparkles", "droplet", "palette"]),
  featured: z.boolean().optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
