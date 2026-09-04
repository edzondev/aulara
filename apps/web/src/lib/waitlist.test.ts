import { describe, expect, it } from "vitest";
import { isUniqueViolation, parseWaitlistFields } from "./waitlist";

describe("parseWaitlistFields", () => {
	const valid = {
		institutionName: "Colegio San Marcello",
		email: "directora@sanmarcello.edu",
		role: "director",
		privacyAccepted: "on",
		honeypot: "",
	};

	it("accepts a complete waitlist submission", () => {
		expect(parseWaitlistFields(valid)).toEqual({
			ok: true,
			data: {
				institutionName: "Colegio San Marcello",
				email: "directora@sanmarcello.edu",
				role: "director",
			},
		});
	});

	it("trims the institution name and lowercases the email", () => {
		expect(
			parseWaitlistFields({
				...valid,
				institutionName: "  Colegio San Marcello  ",
				email: "  Directora@SanMarcello.EDU ",
			}),
		).toEqual({
			ok: true,
			data: {
				institutionName: "Colegio San Marcello",
				email: "directora@sanmarcello.edu",
				role: "director",
			},
		});
	});

	it("rejects a missing institution name", () => {
		const result = parseWaitlistFields({ ...valid, institutionName: " " });
		expect(result).toEqual({
			ok: false,
			fields: { institutionName: ["Escribe el nombre del colegio."] },
		});
	});

	it("rejects an invalid email", () => {
		const result = parseWaitlistFields({ ...valid, email: "no-es-correo" });
		expect(result).toEqual({
			ok: false,
			fields: { email: ["Escribe un correo válido."] },
		});
	});

	it("rejects an unknown role", () => {
		const result = parseWaitlistFields({ ...valid, role: "teacher" });
		expect(result).toEqual({
			ok: false,
			fields: { role: ["Elige un cargo."] },
		});
	});

	it("rejects a privacy checkbox that was not marked", () => {
		const result = parseWaitlistFields({ ...valid, privacyAccepted: "" });
		expect(result).toEqual({
			ok: false,
			fields: {
				privacyAccepted: ["Debes aceptar la política de privacidad."],
			},
		});
	});

	it("discards honeypot submissions without treating them as errors", () => {
		expect(
			parseWaitlistFields({ ...valid, honeypot: "http://spam.test" }),
		).toEqual({ ok: true, discarded: true });
	});
});

describe("isUniqueViolation", () => {
	it("detects a Postgres unique_violation nested in a Drizzle error", () => {
		const postgresError = Object.assign(new Error("duplicate key"), {
			code: "23505",
		});
		const drizzleError = new Error("Failed query");
		drizzleError.cause = postgresError;
		expect(isUniqueViolation(drizzleError)).toBe(true);
	});

	it("returns false for unrelated errors", () => {
		expect(isUniqueViolation(new Error("connection refused"))).toBe(false);
	});
});
