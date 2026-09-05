import { z } from "zod";
import { emailSchema } from "./email-schema.ts";

export const createSchoolSchema = z.object({
	organizationName: z.string().trim().min(3, "Usa al menos 3 caracteres."),
	organizationSlug: z
		.string()
		.trim()
		.min(2, "Usa al menos 2 caracteres.")
		.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones."),
	ownerName: z.string().trim().min(3, "Usa al menos 3 caracteres."),
	ownerEmail: emailSchema,
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
