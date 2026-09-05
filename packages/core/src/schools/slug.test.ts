import { describe, expect, it } from "vitest";
import { slugifySchoolIdentifier } from "./slug.ts";

describe("slugifySchoolIdentifier", () => {
	it("lowercases, strips accents, and collapses non-alphanumerics", () => {
		expect(slugifySchoolIdentifier("Colegio Santa Elena")).toBe(
			"colegio-santa-elena",
		);
		expect(slugifySchoolIdentifier("I.E.P. Los Álamos")).toBe(
			"i-e-p-los-alamos",
		);
	});

	it("trims leading and trailing hyphens", () => {
		expect(slugifySchoolIdentifier("  --Santa--  ")).toBe("santa");
	});

	it("returns empty string when nothing usable remains", () => {
		expect(slugifySchoolIdentifier("***")).toBe("");
	});
});
