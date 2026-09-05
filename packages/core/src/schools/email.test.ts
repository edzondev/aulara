import { describe, expect, it } from "vitest";
import { isValidEmail } from "./email.ts";

describe("isValidEmail", () => {
	it("accepts ordinary school and personal addresses", () => {
		expect(isValidEmail("maria@gmail.com")).toBe(true);
		expect(isValidEmail("maria.s+tag@colegio.edu.pe")).toBe(true);
		expect(isValidEmail("  Rosa@SantaElena.edu.pe  ")).toBe(true);
	});

	it("rejects a second @ in the address", () => {
		expect(isValidEmail("maria@santatest@gmail.com")).toBe(false);
	});

	it("rejects empty, spaced, or domain-only values", () => {
		expect(isValidEmail("")).toBe(false);
		expect(isValidEmail("maria@gmail")).toBe(false);
		expect(isValidEmail("maria gmail.com")).toBe(false);
	});
});
