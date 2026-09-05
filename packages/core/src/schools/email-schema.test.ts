import { describe, expect, it } from "vitest";
import { emailSchema } from "./email-schema.ts";

describe("emailSchema", () => {
	it("accepts ordinary school and personal addresses", () => {
		expect(emailSchema.parse("maria@gmail.com")).toBe("maria@gmail.com");
		expect(emailSchema.parse("  Rosa@SantaElena.edu.pe  ")).toBe(
			"Rosa@SantaElena.edu.pe",
		);
	});

	it("rejects a second @ in the address", () => {
		const result = emailSchema.safeParse("maria@santatest@gmail.com");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe("El correo no es válido.");
		}
	});

	it("rejects empty values with a required message", () => {
		const result = emailSchema.safeParse("   ");

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe("El correo es obligatorio.");
		}
	});
});
