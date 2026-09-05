import { describe, expect, it } from "vitest";
import { getDatabaseUrl } from "./database.ts";

describe("getDatabaseUrl", () => {
	it("throws without DATABASE_URL", () => {
		const environment: NodeJS.ProcessEnv = { NODE_ENV: "test" };

		expect(() => getDatabaseUrl(environment)).toThrow(
			"DATABASE_URL is required",
		);
	});

	it("returns the trimmed DATABASE_URL", () => {
		expect(
			getDatabaseUrl({ DATABASE_URL: "  postgres://localhost/aulara  " }),
		).toBe("postgres://localhost/aulara");
	});
});
