import { z } from "zod";

export const resolveTuitionRateSchema = z.object({
	academicYearId: z.uuid(),
	gradeId: z.uuid().nullable().optional(),
});
