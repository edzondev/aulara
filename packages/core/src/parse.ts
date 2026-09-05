import type { z } from "zod";
import { DomainError } from "./errors.ts";

export function parseDomainInput<T>(
	schema: z.ZodType<T>,
	data: unknown,
	message: string,
): T {
	const parsed = schema.safeParse(data);
	if (!parsed.success) {
		throw new DomainError("INVALID_INPUT", message, 400);
	}

	return parsed.data;
}
