import { describe, expect, it } from "vitest";
import { createSchoolSchema } from "./create-school-schema.ts";

const validInput = {
	organizationName: "Colegio Santa Elena",
	organizationSlug: "colegio-santa-elena",
	ownerName: "María Pérez",
	ownerEmail: "maria@gmail.com",
};

describe("createSchoolSchema", () => {
	it("accepts a complete school payload", () => {
		expect(createSchoolSchema.parse(validInput)).toEqual(validInput);
	});

	it("trims surrounding whitespace", () => {
		expect(
			createSchoolSchema.parse({
				organizationName: "  Colegio Santa Elena  ",
				organizationSlug: "  colegio-santa-elena  ",
				ownerName: "  María Pérez  ",
				ownerEmail: "  maria@gmail.com  ",
			}),
		).toEqual(validInput);
	});

	it("rejects a name shorter than 3 characters", () => {
		const result = createSchoolSchema.safeParse({
			...validInput,
			organizationName: "AB",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe(
				"Usa al menos 3 caracteres.",
			);
		}
	});

	it("rejects a slug shorter than 2 characters", () => {
		const result = createSchoolSchema.safeParse({
			...validInput,
			organizationSlug: "a",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe(
				"Usa al menos 2 caracteres.",
			);
		}
	});

	it("rejects a slug with uppercase or spaces", () => {
		const result = createSchoolSchema.safeParse({
			...validInput,
			organizationSlug: "Santa Elena",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe(
				"Solo minúsculas, números y guiones.",
			);
		}
	});

	it("rejects a second @ in the owner email", () => {
		const result = createSchoolSchema.safeParse({
			...validInput,
			ownerEmail: "maria@santatest@gmail.com",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe("El correo no es válido.");
		}
	});
});
