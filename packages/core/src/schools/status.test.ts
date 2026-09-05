import { describe, expect, it } from "vitest";
import { parseSchoolStatusFilter, schoolStatusLabel } from "./status.ts";

describe("schoolStatusLabel", () => {
	it("maps known statuses to Spanish labels", () => {
		expect(schoolStatusLabel("onboarding")).toBe("En prueba");
		expect(schoolStatusLabel("active")).toBe("Activo");
		expect(schoolStatusLabel("suspended")).toBe("Suspendido");
	});

	it("returns null for cancelled", () => {
		expect(schoolStatusLabel("cancelled")).toBeNull();
	});
});

describe("parseSchoolStatusFilter", () => {
	it("defaults undefined and unknown values to all", () => {
		expect(parseSchoolStatusFilter(undefined)).toBe("all");
		expect(parseSchoolStatusFilter("unknown")).toBe("all");
	});

	it("accepts allowlisted filter values", () => {
		expect(parseSchoolStatusFilter("all")).toBe("all");
		expect(parseSchoolStatusFilter("onboarding")).toBe("onboarding");
		expect(parseSchoolStatusFilter("active")).toBe("active");
		expect(parseSchoolStatusFilter("suspended")).toBe("suspended");
	});
});
