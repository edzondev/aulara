import { z } from "zod";

export const emailSchema = z
	.string()
	.trim()
	.min(1, "El correo es obligatorio.")
	.pipe(z.email("El correo no es válido."));
