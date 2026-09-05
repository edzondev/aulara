import { z } from "zod";

export const monthlyTuitionChargeSchema = z.object({
	enrollmentId: z.uuid(),
	billingPeriod: z.string().regex(/^\d{4}-\d{2}-01$/),
});
