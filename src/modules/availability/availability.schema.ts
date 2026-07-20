import { z } from "zod";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export const slotSchema = z.object({
  day:        z.enum(DAYS),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time:   z.string().regex(/^\d{2}:\d{2}$/),
  enabled:    z.boolean(),
});

export const upsertAvailabilitySchema = z.array(slotSchema).length(7);

export type SlotInput = z.infer<typeof slotSchema>;
export { DAYS };
