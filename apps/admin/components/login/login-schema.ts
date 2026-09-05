import { emailSchema } from "@aulara/core/schools/email-schema";
import { z } from "zod";

export const loginSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, "La contraseña es obligatoria."),
});

export type LoginValues = z.infer<typeof loginSchema>;
